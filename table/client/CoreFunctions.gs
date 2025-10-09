/**
 * ОСНОВНЫЕ РАБОЧИЕ ФУНКЦИИ
 * Восстановлены из старых файлов и адаптированы для новой архитектуры
 */

// ============================================================================
// VK И СОЦИАЛЬНЫЕ СЕТИ
// ============================================================================

/**
 * Импорт постов VK
 */
function importVkPosts() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    addSystemLog('🔄 ЗАПУСК ИМПОРТА VK ПОСТОВ', 'INFO', 'VK_IMPORT');
    
    // Проверяем настройки VK
    var props = PropertiesService.getScriptProperties();
    var vkToken = props.getProperty('VK_TOKEN');
    
    if (!vkToken) {
      var result = ui.prompt(
        '🔑 VK Token не найден',
        'Для импорта VK постов требуется VK API токен.\n\nВведите VK_TOKEN:',
        ui.ButtonSet.OK_CANCEL
      );
      
      if (result.getSelectedButton() === ui.Button.OK) {
        vkToken = result.getResponseText().trim();
        if (vkToken) {
          props.setProperty('VK_TOKEN', vkToken);
          addSystemLog('VK Token сохранен', 'INFO', 'VK_SETUP');
        } else {
          ui.alert('❌ Отмена', 'VK Token не введен. Импорт отменен.', ui.ButtonSet.OK);
          return;
        }
      } else {
        return;
      }
    }
    
    // Запрашиваем параметры импорта
    var ownerResult = ui.prompt(
      '📱 Параметры импорта VK',
      'ID или домен группы/пользователя (например: "durov" или "-1"):\n\n💡 Для групп используйте отрицательный ID или домен',
      ui.ButtonSet.OK_CANCEL
    );
    
    if (ownerResult.getSelectedButton() !== ui.Button.OK) return;
    
    var owner = ownerResult.getResponseText().trim();
    if (!owner) {
      ui.alert('❌ Ошибка', 'ID/домен не указан', ui.ButtonSet.OK);
      return;
    }
    
    var countResult = ui.prompt(
      '📊 Количество постов',
      'Сколько постов импортировать? (по умолчанию: 10)',
      ui.ButtonSet.OK_CANCEL
    );
    
    var count = 10;
    if (countResult.getSelectedButton() === ui.Button.OK) {
      var countInput = parseInt(countResult.getResponseText().trim()) || 10;
      count = Math.min(Math.max(countInput, 1), 100); // 1-100 постов
    }
    
    // Выполняем импорт
    ui.alert('🔄 Импорт запущен', 'Импортируем ' + count + ' постов от ' + owner + '...\nЭто может занять несколько секунд.', ui.ButtonSet.OK);
    
    var result = importVkPostsToSheet(owner, count, vkToken);
    
    if (result.success) {
      ui.alert('✅ Импорт завершен', 
        'Успешно импортировано ' + result.imported + ' постов!\n\n' +
        '📊 Данные добавлены в текущий лист\n' +
        '📅 Период: ' + (result.dateRange || 'последние посты'),
        ui.ButtonSet.OK);
        
      addSystemLog('✅ VK импорт завершен: ' + result.imported + ' постов', 'INFO', 'VK_IMPORT');
    } else {
      ui.alert('❌ Ошибка импорта', result.error || 'Неизвестная ошибка', ui.ButtonSet.OK);
      addSystemLog('❌ VK импорт не удался: ' + (result.error || 'unknown'), 'ERROR', 'VK_IMPORT');
    }
    
  } catch (error) {
    addSystemLog('❌ КРИТИЧЕСКАЯ ОШИБКА VK ИМПОРТА: ' + error.message, 'ERROR', 'VK_IMPORT');
    ui.alert('Критическая ошибка', 'Ошибка при импорте VK: ' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Функция импорта VK постов в лист
 */
function importVkPostsToSheet(owner, count, token) {
  try {
    // Определяем тип параметра (ID или домен)
    var paramName = /^[-\d]+$/.test(owner) ? 'owner_id' : 'domain';
    
    // Строим URL запроса к VK API
    var url = 'https://api.vk.com/method/wall.get' +
      '?' + paramName + '=' + encodeURIComponent(owner) +
      '&count=' + encodeURIComponent(count) +
      '&access_token=' + encodeURIComponent(token) +
      '&v=5.131';
    
    // Выполняем запрос
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var code = response.getResponseCode();
    var data = JSON.parse(response.getContentText());
    
    if (code !== 200 || data.error) {
      var errorMsg = (data.error && data.error.error_msg) || ('HTTP_' + code);
      return { success: false, error: errorMsg };
    }
    
    if (!data.response || !Array.isArray(data.response.items)) {
      return { success: false, error: 'Неожиданный формат ответа VK API' };
    }
    
    // Получаем активный лист
    var sheet = SpreadsheetApp.getActiveSheet();
    var startRow = sheet.getLastRow() + 1;
    
    // Добавляем заголовки если лист пустой
    if (startRow === 1) {
      sheet.getRange(1, 1, 1, 6).setValues([
        ['Дата', 'Ссылка', 'Текст', 'Комментарии', 'Лайки', 'Источник']
      ]);
      startRow = 2;
    }
    
    // Обрабатываем посты
    var posts = data.response.items;
    var values = [];
    var dateRange = '';
    
    for (var i = 0; i < posts.length; i++) {
      var post = posts[i];
      var date = new Date(post.date * 1000);
      var dateStr = date.toLocaleString('ru-RU');
      
      if (i === 0) dateRange = dateStr; // Первый пост (самый новый)
      if (i === posts.length - 1) dateRange += ' - ' + dateStr; // Последний пост
      
      var link = 'https://vk.com/wall' + post.owner_id + '_' + post.id;
      var text = String(post.text || '').replace(/\n/g, ' ').substring(0, 1000); // Ограничиваем длину
      var comments = (post.comments && post.comments.count) || 0;
      var likes = (post.likes && post.likes.count) || 0;
      
      values.push([dateStr, link, text, comments, likes, 'VK:' + owner]);
    }
    
    // Записываем данные в лист
    if (values.length > 0) {
      sheet.getRange(startRow, 1, values.length, 6).setValues(values);
    }
    
    return {
      success: true,
      imported: values.length,
      dateRange: dateRange
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Импорт из Instagram (заглушка)
 */
function importInstagramPosts() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('🔗 Instagram Import', 
    'Импорт из Instagram находится в разработке.\n\n' +
    'В следующих версиях будет доступен импорт:\n' +
    '• Публичных постов\n' +
    '• Stories (через API)\n' +
    '• Комментариев\n' +
    '• Статистики',
    ui.ButtonSet.OK);
}

/**
 * Импорт из Telegram (заглушка)
 */
function importTelegramPosts() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('💬 Telegram Import', 
    'Импорт из Telegram находится в разработке.\n\n' +
    'Планируется поддержка:\n' +
    '• Публичных каналов\n' +
    '• Чатов (с разрешением)\n' +
    '• Медиафайлов\n' +
    '• Форвардов',
    ui.ButtonSet.OK);
}

/**
 * Настройки соцсетей
 */
function configureSocialImport() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();
  
  var config = [];
  config.push('⚙️ НАСТРОЙКИ СОЦСЕТЕЙ');
  config.push('='.repeat(30));
  config.push('');
  
  // VK настройки
  var vkToken = props.getProperty('VK_TOKEN');
  config.push('📱 VK:');
  config.push('• Token: ' + (vkToken ? '✅ Настроен (' + vkToken.substring(0, 10) + '...)' : '❌ Не настроен'));
  config.push('');
  
  // Instagram настройки (заглушка)
  config.push('🔗 Instagram:');
  config.push('• Status: 🚧 В разработке');
  config.push('');
  
  // Telegram настройки (заглушка)
  config.push('💬 Telegram:');
  config.push('• Status: 🚧 В разработке');
  config.push('');
  
  config.push('🔧 Для настройки VK токена:');
  config.push('📱 VK и Социальные сети → 📱 Импорт постов VK');
  
  ui.alert('Настройки соцсетей', config.join('\n'), ui.ButtonSet.OK);
}

// ============================================================================
// УМНЫЕ ЦЕПОЧКИ
// ============================================================================

/**
 * Запустить умную цепочку
 */
function runSmartChain() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    addSystemLog('🔗 ЗАПУСК УМНОЙ ЦЕПОЧКИ', 'INFO', 'SMART_CHAIN');
    
    var instruction = '🔗 УМНАЯ ЦЕПОЧКА\n\n' +
      'Автоматически заполняет данные по цепочке A3→B3→C3...\n\n' +
      '📋 КАК РАБОТАЕТ:\n' +
      '• Читает значение из A3\n' +
      '• Обрабатывает через GM() функцию\n' +
      '• Записывает результат в B3\n' +
      '• Использует B3 для заполнения C3\n' +
      '• И так далее по всей строке\n\n' +
      '⚙️ НАСТРОЙКИ:\n' +
      '• Промпты настраиваются в строке 2\n' +
      '• Каждая колонка = отдельный этап\n' +
      '• Поддерживает переменные {{prev}}\n\n' +
      'Запустить цепочку для строки 3?';
    
    var result = ui.alert('Умная цепочка', instruction, ui.ButtonSet.YES_NO);
    
    if (result === ui.Button.YES) {
      var chainResult = executeSmartChain(3);
      
      if (chainResult.success) {
        ui.alert('✅ Цепочка завершена', 
          'Обработано ' + chainResult.steps + ' этапов\n' +
          'Время выполнения: ' + (chainResult.duration / 1000).toFixed(1) + ' сек\n\n' +
          'Результаты записаны в строку 3',
          ui.ButtonSet.OK);
          
        addSystemLog('✅ Умная цепочка завершена: ' + chainResult.steps + ' этапов', 'INFO', 'SMART_CHAIN');
      } else {
        ui.alert('❌ Ошибка цепочки', chainResult.error || 'Неизвестная ошибка', ui.ButtonSet.OK);
        addSystemLog('❌ Умная цепочка не удалась: ' + (chainResult.error || 'unknown'), 'ERROR', 'SMART_CHAIN');
      }
    }
    
  } catch (error) {
    addSystemLog('❌ КРИТИЧЕСКАЯ ОШИБКА УМНОЙ ЦЕПОЧКИ: ' + error.message, 'ERROR', 'SMART_CHAIN');
    ui.alert('Критическая ошибка', 'Ошибка умной цепочки: ' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Быстрая цепочка для текущей строки
 */
function runChainCurrentRow() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var currentRow = sheet.getActiveCell().getRow();
    
    if (currentRow < 3) {
      ui.alert('⚠️ Неверная строка', 
        'Выберите строку данных (3 или больше).\nСтроки 1-2 используются для заголовков и промптов.',
        ui.ButtonSet.OK);
      return;
    }
    
    var result = ui.alert('⚡ Быстрая цепочка', 
      'Запустить умную цепочку для строки ' + currentRow + '?',
      ui.ButtonSet.YES_NO);
    
    if (result === ui.Button.YES) {
      var chainResult = executeSmartChain(currentRow);
      
      if (chainResult.success) {
        ui.alert('✅ Цепочка завершена', 
          'Строка ' + currentRow + ' обработана\n' +
          'Этапов: ' + chainResult.steps + '\n' +
          'Время: ' + (chainResult.duration / 1000).toFixed(1) + ' сек',
          ui.ButtonSet.OK);
      } else {
        ui.alert('❌ Ошибка', chainResult.error || 'Неизвестная ошибка', ui.ButtonSet.OK);
      }
    }
    
  } catch (error) {
    ui.alert('Ошибка', 'Ошибка быстрой цепочки: ' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Выполнение умной цепочки
 */
function executeSmartChain(row) {
  try {
    var startTime = Date.now();
    var sheet = SpreadsheetApp.getActiveSheet();
    var lastCol = sheet.getLastColumn();
    var steps = 0;
    
    // Получаем промпты из строки 2
    var prompts = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
    
    // Получаем текущие значения из указанной строки
    var values = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
    
    // Выполняем цепочку
    for (var col = 1; col < lastCol; col++) { // Начинаем с колонки B (индекс 1)
      var prompt = prompts[col];
      
      if (prompt && prompt.toString().trim()) {
        var prevValue = values[col - 1]; // Значение из предыдущей колонки
        
        if (prevValue && prevValue.toString().trim()) {
          // Заменяем переменные в промпте
          var finalPrompt = prompt.toString().replace(/{{prev}}/g, prevValue);
          
          // Выполняем GM функцию
          try {
            var result = GM(finalPrompt, 200, 0.7);
            values[col] = result || 'Ошибка GM';
            steps++;
            
            // Записываем результат в лист
            sheet.getRange(row, col + 1).setValue(values[col]);
            
            // Небольшая пауза между запросами
            Utilities.sleep(500);
            
          } catch (gmError) {
            values[col] = 'Ошибка: ' + gmError.message;
            sheet.getRange(row, col + 1).setValue(values[col]);
          }
        }
      }
    }
    
    var duration = Date.now() - startTime;
    
    return {
      success: true,
      steps: steps,
      duration: duration
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Настройка цепочки
 */
function configureSmartChain() {
  var ui = SpreadsheetApp.getUi();
  
  var instructions = [];
  instructions.push('🔧 НАСТРОЙКА УМНОЙ ЦЕПОЧКИ');
  instructions.push('='.repeat(35));
  instructions.push('');
  instructions.push('📋 ИНСТРУКЦИЯ ПО НАСТРОЙКЕ:');
  instructions.push('');
  instructions.push('1️⃣ СТРОКА 1 - Заголовки колонок:');
  instructions.push('   A1: Исходный текст');
  instructions.push('   B1: Обработанный');
  instructions.push('   C1: Итоговый');
  instructions.push('');
  instructions.push('2️⃣ СТРОКА 2 - Промпты для обработки:');
  instructions.push('   A2: (пусто - исходные данные)');
  instructions.push('   B2: Переведи на английский: {{prev}}');
  instructions.push('   C2: Сделай краткое резюме: {{prev}}');
  instructions.push('');
  instructions.push('3️⃣ СТРОКА 3+ - Данные для обработки:');
  instructions.push('   A3: Привет, как дела?');
  instructions.push('   B3: (заполнится автоматически)');
  instructions.push('   C3: (заполнится автоматически)');
  instructions.push('');
  instructions.push('🔗 ПЕРЕМЕННЫЕ:');
  instructions.push('• {{prev}} - значение из предыдущей колонки');
  instructions.push('• Можно использовать в любом промпте');
  instructions.push('');
  instructions.push('⚡ ЗАПУСК:');
  instructions.push('• 🔗 Умные цепочки → 🚀 Запустить цепочку');
  instructions.push('• Или выберите строку и нажмите ⚡ Быстрая цепочка');
  
  ui.alert('Настройка умной цепочки', instructions.join('\n'), ui.ButtonSet.OK);
}

/**
 * Статус цепочки
 */
function showChainStatus() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    
    var status = [];
    status.push('📋 СТАТУС УМНОЙ ЦЕПОЧКИ');
    status.push('='.repeat(30));
    status.push('');
    status.push('📊 СТРУКТУРА ЛИСТА:');
    status.push('• Строк данных: ' + Math.max(0, lastRow - 2));
    status.push('• Колонок: ' + lastCol);
    status.push('• Этапов цепочки: ' + Math.max(0, lastCol - 1));
    status.push('');
    
    // Проверяем настройку промптов
    if (lastRow >= 2) {
      var prompts = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
      var configuredPrompts = 0;
      
      for (var i = 1; i < prompts.length; i++) { // Пропускаем A2
        if (prompts[i] && prompts[i].toString().trim()) {
          configuredPrompts++;
        }
      }
      
      status.push('⚙️ НАСТРОЙКИ:');
      status.push('• Настроенных промптов: ' + configuredPrompts);
      status.push('• Готовность: ' + (configuredPrompts > 0 ? '✅' : '❌'));
      status.push('');
    }
    
    // Статус GM функции
    status.push('🤖 GM ФУНКЦИЯ:');
    try {
      if (typeof GM === 'function') {
        status.push('• Доступность: ✅ Доступна');
        // Тестовый вызов
        var testResult = GM('test', 10, 0.1);
        status.push('• Тест: ' + (testResult ? '✅ Работает' : '⚠️ Нет ответа'));
      } else {
        status.push('• Доступность: ❌ Не найдена');
      }
    } catch (e) {
      status.push('• Доступность: ❌ Ошибка: ' + e.message);
    }
    
    ui.alert('Статус умной цепочки', status.join('\n'), ui.ButtonSet.OK);
    
  } catch (error) {
    ui.alert('Ошибка', 'Не удалось получить статус: ' + error.message, ui.ButtonSet.OK);
  }
}

// ============================================================================
// ОТЗЫВЫ И OCR
// ============================================================================

/**
 * Распознавание изображений (OCR)
 */
function runOcrProcessing() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    addSystemLog('📷 ЗАПУСК OCR ОБРАБОТКИ', 'INFO', 'OCR');
    
    var instruction = '📷 OCR - РАСПОЗНАВАНИЕ ИЗОБРАЖЕНИЙ\n\n' +
      'Извлекает текст из изображений в Google Sheets\n\n' +
      '📋 ПОДДЕРЖИВАЕМЫЕ ФОРМАТЫ:\n' +
      '• Скриншоты отзывов\n' +
      '• Фотографии документов\n' +
      '• Изображения с текстом\n\n' +
      '⚙️ КАК ИСПОЛЬЗОВАТЬ:\n' +
      '1. Вставьте изображения в колонку A\n' +
      '2. Запустите OCR обработку\n' +
      '3. Текст появится в колонке B\n\n' +
      'Начать обработку изображений в текущем листе?';
    
    var result = ui.alert('OCR обработка', instruction, ui.ButtonSet.YES_NO);
    
    if (result === ui.Button.YES) {
      var ocrResult = processImagesWithOcr();
      
      if (ocrResult.success) {
        ui.alert('✅ OCR завершен', 
          'Обработано изображений: ' + ocrResult.processed + '\n' +
          'Извлечено текста: ' + ocrResult.textExtracted + ' символов\n\n' +
          'Результаты записаны в колонку B',
          ui.ButtonSet.OK);
          
        addSystemLog('✅ OCR завершен: ' + ocrResult.processed + ' изображений', 'INFO', 'OCR');
      } else {
        ui.alert('❌ Ошибка OCR', ocrResult.error || 'Неизвестная ошибка', ui.ButtonSet.OK);
        addSystemLog('❌ OCR не удался: ' + (ocrResult.error || 'unknown'), 'ERROR', 'OCR');
      }
    }
    
  } catch (error) {
    addSystemLog('❌ КРИТИЧЕСКАЯ ОШИБКА OCR: ' + error.message, 'ERROR', 'OCR');
    ui.alert('Критическая ошибка', 'Ошибка OCR: ' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Обработка изображений с OCR (заглушка - требует Google Cloud Vision API)
 */
function processImagesWithOcr() {
  // Пока что заглушка - реальный OCR требует настройки Google Cloud Vision API
  return {
    success: false,
    error: 'OCR функция находится в разработке.\n\nДля полной поддержки требуется:\n• Google Cloud Vision API\n• Настройка credentials\n• Обработка изображений'
  };
}

/**
 * Обработка отзывов
 */
function processReviews() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    addSystemLog('📝 ЗАПУСК ОБРАБОТКИ ОТЗЫВОВ', 'INFO', 'REVIEWS');
    
    var instruction = '📝 ОБРАБОТКА ОТЗЫВОВ\n\n' +
      'Автоматический анализ отзывов клиентов\n\n' +
      '🎯 ЧТО ДЕЛАЕТ:\n' +
      '• Анализирует тональность (позитив/негатив)\n' +
      '• Извлекает ключевые темы\n' +
      '• Классифицирует по категориям\n' +
      '• Генерирует краткие выводы\n\n' +
      '📊 ФОРМАТ ДАННЫХ:\n' +
      '• Колонка A: Текст отзыва\n' +
      '• Колонка B: Автоанализ (заполнится)\n' +
      '• Колонка C: Тональность\n' +
      '• Колонка D: Категория\n\n' +
      'Начать обработку отзывов в текущем листе?';
    
    var result = ui.alert('Обработка отзывов', instruction, ui.ButtonSet.YES_NO);
    
    if (result === ui.Button.YES) {
      var reviewResult = analyzeReviewsInSheet();
      
      if (reviewResult.success) {
        ui.alert('✅ Анализ завершен', 
          'Обработано отзывов: ' + reviewResult.processed + '\n' +
          'Позитивных: ' + reviewResult.positive + '\n' +
          'Негативных: ' + reviewResult.negative + '\n' +
          'Нейтральных: ' + reviewResult.neutral + '\n\n' +
          'Результаты записаны в листе',
          ui.ButtonSet.OK);
          
        addSystemLog('✅ Анализ отзывов завершен: ' + reviewResult.processed + ' отзывов', 'INFO', 'REVIEWS');
      } else {
        ui.alert('❌ Ошибка анализа', reviewResult.error || 'Неизвестная ошибка', ui.ButtonSet.OK);
        addSystemLog('❌ Анализ отзывов не удался: ' + (reviewResult.error || 'unknown'), 'ERROR', 'REVIEWS');
      }
    }
    
  } catch (error) {
    addSystemLog('❌ КРИТИЧЕСКАЯ ОШИБКА АНАЛИЗА ОТЗЫВОВ: ' + error.message, 'ERROR', 'REVIEWS');
    ui.alert('Критическая ошибка', 'Ошибка анализа отзывов: ' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Анализ отзывов в листе
 */
function analyzeReviewsInSheet() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      return { success: false, error: 'Нет данных для анализа. Добавьте отзывы в колонку A.' };
    }
    
    // Получаем отзывы из колонки A
    var reviews = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var processed = 0;
    var positive = 0;
    var negative = 0;
    var neutral = 0;
    
    // Добавляем заголовки если нужно
    sheet.getRange(1, 1, 1, 4).setValues([
      ['Отзыв', 'Анализ', 'Тональность', 'Категория']
    ]);
    
    // Обрабатываем каждый отзыв
    for (var i = 0; i < reviews.length; i++) {
      var review = reviews[i][0];
      
      if (review && review.toString().trim()) {
        try {
          // Анализируем отзыв через GM
          var analysisPrompt = 'Проанализируй отзыв клиента и дай краткий вывод: ' + review;
          var analysis = GM(analysisPrompt, 150, 0.7) || 'Анализ недоступен';
          
          // Определяем тональность
          var sentimentPrompt = 'Определи тональность отзыва одним словом (позитив/негатив/нейтрал): ' + review;
          var sentiment = GM(sentimentPrompt, 20, 0.3) || 'нейтрал';
          
          // Определяем категорию
          var categoryPrompt = 'Определи категорию отзыва одним словом (обслуживание/продукт/доставка/цена/другое): ' + review;
          var category = GM(categoryPrompt, 20, 0.3) || 'другое';
          
          // Записываем результаты
          sheet.getRange(i + 2, 2, 1, 3).setValues([
            [analysis, sentiment.toLowerCase(), category.toLowerCase()]
          ]);
          
          // Подсчитываем статистику
          var sentimentLower = sentiment.toLowerCase();
          if (sentimentLower.includes('позитив')) {
            positive++;
          } else if (sentimentLower.includes('негатив')) {
            negative++;
          } else {
            neutral++;
          }
          
          processed++;
          
          // Пауза между запросами
          Utilities.sleep(1000);
          
        } catch (gmError) {
          // Записываем ошибку
          sheet.getRange(i + 2, 2, 1, 3).setValues([
            ['Ошибка анализа: ' + gmError.message, 'ошибка', 'ошибка']
          ]);
        }
      }
    }
    
    return {
      success: true,
      processed: processed,
      positive: positive,
      negative: negative,
      neutral: neutral
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Автообработка новых отзывов
 */
function enableAutoReviewProcessing() {
  var ui = SpreadsheetApp.getUi();
  
  ui.alert('🔄 Автообработка отзывов', 
    'Автообработка новых отзывов находится в разработке.\n\n' +
    'Планируется:\n' +
    '• Триггеры на изменение данных\n' +
    '• Автоматический анализ новых строк\n' +
    '• Уведомления о негативных отзывах\n' +
    '• Еженедельные отчеты\n\n' +
    'Пока используйте ручную обработку:\n' +
    '📝 Отзывы и OCR → 📝 Обработать отзывы',
    ui.ButtonSet.OK);
}

/**
 * Настройки OCR
 */
function configureOcrSettings() {
  var ui = SpreadsheetApp.getUi();
  
  var settings = [];
  settings.push('⚙️ НАСТРОЙКИ OCR');
  settings.push('='.repeat(25));
  settings.push('');
  settings.push('📷 ТЕКУЩИЙ СТАТУС:');
  settings.push('• Google Cloud Vision API: 🚧 Не настроен');
  settings.push('• Поддерживаемые языки: ru, en');
  settings.push('• Формат вывода: Обычный текст');
  settings.push('');
  settings.push('🔧 ДЛЯ НАСТРОЙКИ ПОЛНОГО OCR:');
  settings.push('1. Создайте проект в Google Cloud');
  settings.push('2. Включите Vision API');
  settings.push('3. Получите API ключ');
  settings.push('4. Добавьте в Script Properties:');
  settings.push('   GOOGLE_CLOUD_API_KEY');
  settings.push('');
  settings.push('📋 АЛЬТЕРНАТИВЫ:');
  settings.push('• Ручное копирование текста');
  settings.push('• Использование Google Lens');
  settings.push('• Онлайн OCR сервисы');
  settings.push('');
  settings.push('💡 В базовой версии OCR ограничен');
  
  ui.alert('Настройки OCR', settings.join('\n'), ui.ButtonSet.OK);
}