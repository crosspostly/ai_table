/**
 * Social Import Client v2.0
 * Клиентский интерфейс для универсального импорта социальных сетей
 * ВОССТАНОВЛЕНО ИЗ old/Main.txt - ЧТЕНИЕ ИЗ ЛИСТА "Параметры" B1, B2, C1
 */

/**
 * Универсальный импорт постов из социальных сетей (клиентский интерфейс)
 * ВОССТАНОВЛЕНО ИЗ old/Main.txt - РАБОЧАЯ ВЕРСИЯ С ЛИСТОМ "Параметры"
 */
function importSocialPostsClient() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  
  // Проверяем credentials
  var credentials = getClientCredentials();
  if (!credentials.ok) {
    ui.alert('Ошибка настроек', 
      'Настройте credentials: ' + credentials.error + '\n\n' +
      'Меню: 🤖 Table AI → 🌟 НАСТРОИТЬ ВСЕ КЛЮЧИ', 
      ui.ButtonSet.OK);
    return;
  }
  
  // ЧИТАЕМ ПАРАМЕТРЫ ИЗ ЛИСТА "Параметры" (как в old/Main.txt)
  var paramsSheet = ss.getSheetByName('Параметры');
  if (!paramsSheet) {
    ui.alert('❌ Лист "Параметры" не найден', 
      'Создайте лист "Параметры" с настройками:\n\n' +
      'B1 - Источник (URL или username)\n' +
      'B2 - Количество постов\n' +
      'C1 - Платформа (опционально)', 
      ui.ButtonSet.OK);
    addSystemLog('Social import failed: no Параметры sheet', 'ERROR', 'SOCIAL');
    return;
  }
  
  // Читаем параметры из листа (как в old/Main.txt)
  var source = paramsSheet.getRange('B1').getValue();
  var count = paramsSheet.getRange('B2').getValue();
  var platform = paramsSheet.getRange('C1').getValue();
  
  // Валидация
  if (!source || !count) {
    ui.alert('❌ Не указаны параметры импорта', 
      'Заполните на листе "Параметры":\n\n' +
      'B1 - Источник (например: https://vk.com/durov)\n' +
      'B2 - Количество постов (например: 20)', 
      ui.ButtonSet.OK);
    addSystemLog('Social import failed: missing source or count in Параметры', 'ERROR', 'SOCIAL');
    return;
  }
  
  // Преобразуем count в число
  count = parseInt(count) || 10;
  if (count < 1) count = 1;
  if (count > 100) count = 100;
  
  addSystemLog('Social import start from Параметры: source=' + source + ', count=' + count + ', platform=' + (platform || 'auto'), 'INFO', 'SOCIAL');
  
  try {
    // Показываем процесс
    ui.alert('🚀 Импорт запущен', 
      'Импорт ' + count + ' постов из:\n' + source + '\n\n' +
      'Это может занять до 2 минут...', 
      ui.ButtonSet.OK);
    
    // УНИВЕРСАЛЬНЫЙ ИМПОРТ через сервер (поддерживает VK, Instagram, Telegram)
    // Сервер автоматически определяет платформу по source или использует platform
    var serverRequest = {
      action: 'social_import',
      email: credentials.email,
      token: credentials.token,
      source: source,
      count: count,
      platform: platform || ''  // Передаём платформу если указана
    };
    
    addSystemLog('Universal social import request: source=' + source + ', count=' + count + ', platform=' + (platform || 'auto'), 'INFO', 'SOCIAL');
    
    var result = callServer(serverRequest);
    
    if (result && result.ok && result.data && result.data.length) {
      // Записываем результаты в лист
      var detectedPlatform = result.platform || 'social';
      writeSocialPostsToSheet(ss, result.data, detectedPlatform);
      
      var summary = '✅ Импорт завершён успешно!\n\n' +
                   'Платформа: ' + detectedPlatform.toUpperCase() + '\n' +
                   'Импортировано: ' + result.data.length + ' постов\n' +
                   'Источник: ' + source + '\n\n' +
                   'Данные записаны в лист "посты".';
      
      addSystemLog('Social import success: platform=' + detectedPlatform + ', posts=' + result.data.length, 'INFO', 'SOCIAL');
      ui.alert('✅ Успех!', summary, ui.ButtonSet.OK);
      
    } else {
      var errorMsg = result && result.error ? result.error : 'Неизвестная ошибка сервера';
      addSystemLog('Social import failed: ' + errorMsg, 'ERROR', 'SOCIAL');
      ui.alert('❌ Ошибка импорта', 
        'Не удалось импортировать посты:\n' + errorMsg + '\n\n💡 Проверьте:\n• Доступность источника\n• Правильность ссылки\n• Указание платформы в C1 (для @username и ID)', 
        ui.ButtonSet.OK);
    }
    
  } catch (e) {
    var error = 'Исключение при импорте: ' + e.message;
    addSystemLog(error, 'ERROR', 'SOCIAL');
    ui.alert('❌ Критическая ошибка', error, ui.ButtonSet.OK);
  }
}

/**
 * Запись социальных постов в лист
 * ВОССТАНОВЛЕНО ИЗ old/Main.txt
 */
function writeSocialPostsToSheet(ss, posts, platform) {
  if (!posts || !posts.length) {
    return;
  }
  
  try {
    var sheet = ss.getActiveSheet();
    var startRow = sheet.getLastRow() + 1;
    
    // Если первая строка пуста, начинаем с неё
    if (startRow === 1 && !sheet.getRange('A1').getValue()) {
      // Добавляем заголовки
      var headers = ['Платформа', 'Дата', 'Ссылка', 'Текст', 'ID', 'Лайки', 'Комментарии'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#4285f4')
        .setFontColor('white');
      startRow = 2;
    }
    
    // Записываем данные постов
    var data = [];
    for (var i = 0; i < posts.length; i++) {
      var post = posts[i];
      data.push([
        (platform || 'social').toUpperCase(),
        post.date || '',
        post.link || post.url || '',
        post.text || '',
        post.id || '',
        post.likes || 0,
        post.comments || 0
      ]);
    }
    
    sheet.getRange(startRow, 1, data.length, 7).setValues(data);
    
    // Авто-ширина колонок
    sheet.autoResizeColumns(1, 7);
    
    addSystemLog('Posts written to sheet: ' + data.length + ' rows', 'INFO', 'SOCIAL');
    
  } catch (e) {
    addSystemLog('Error writing posts to sheet: ' + e.message, 'ERROR', 'SOCIAL');
    throw new Error('Ошибка записи в лист: ' + e.message);
  }
}

/**
 * Импорт постов VK (алиас для универсального импорта)
 * ВОССТАНОВЛЕНО ИЗ old/Main.txt
 */
function importVkPostsClient() {
  importSocialPostsClient();
}
