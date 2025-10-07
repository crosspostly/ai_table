/**
 * Social Import Client v1.0
 * Клиентский интерфейс для универсального импорта социальных сетей
 */

/**
 * Универсальный импорт постов из социальных сетей (клиентский интерфейс)
 */
function importSocialPostsClient() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  
  var credentials = getClientCredentials();
  if (!credentials.valid) {
    ui.alert('Ошибка credentials', 'Не настроены credentials: ' + credentials.error, ui.ButtonSet.OK);
    return;
  }
  
  // Получаем параметры из листа "Параметры"
  var params = getSocialImportParams();
  if (!params.valid) {
    ui.alert('Ошибка параметров', 'Не настроены параметры импорта: ' + params.error, ui.ButtonSet.OK);
    return;
  }
  
  logClient('Social import start: source=' + params.source + ', count=' + params.count + ', platform=' + (params.platform || 'auto'));
  
  try {
    // Показываем процесс
    ui.alert('Импорт запущен', 'Импорт постов из ' + params.source + '...\\nЭто может занять до 2 минут.', ui.ButtonSet.OK);
    
    // Вызов серверного API
    var serverRequest = {
      action: 'social_import',
      email: credentials.email,
      token: credentials.token,
      source: params.source,
      count: params.count,
      platform: params.platform || ''
    };
    
    var result = callServer(serverRequest);
    
    if (result.ok && result.data && result.data.length) {
      // Записываем результаты в лист
      writeSocialPostsToSheet(ss, result.data, result.platform);
      
      var summary = 'Импорт завершён успешно!\\n\\n' +
                   'Платформа: ' + (result.platform || 'unknown').toUpperCase() + '\\n' +
                   'Импортировано: ' + result.data.length + ' постов\\n' +
                   'Источник: ' + params.source;
      
      logClient('Social import success: platform=' + result.platform + ', posts=' + result.data.length);
      ui.alert('✅ Успех!', summary, ui.ButtonSet.OK);
      
    } else {
      var error = 'Импорт не удался: ' + (result.error || 'неизвестная ошибка');
      logClient('Social import failed: ' + error);
      ui.alert('❌ Ошибка импорта', error, ui.ButtonSet.OK);
    }
    
  } catch (e) {
    var error = 'Исключение при импорте: ' + e.message;
    logClient(error);
    ui.alert('❌ Критическая ошибка', error, ui.ButtonSet.OK);
  }
}

/**
 * Получение параметров социального импорта из листа
 */
function getSocialImportParams() {
  try {
    var ss = SpreadsheetApp.getActive();
    var paramsSheet = ss.getSheetByName('Параметры');
    
    if (!paramsSheet) {
      return {
        valid: false,
        error: 'Лист "Параметры" не найден. Создайте лист с параметрами импорта.'
      };
    }
    
    // Читаем параметры
    var source = paramsSheet.getRange('B1').getValue();
    var count = paramsSheet.getRange('B2').getValue(); 
    var platform = paramsSheet.getRange('C1').getValue();
    
    // Валидация
    if (!source) {
      return {
        valid: false,
        error: 'Не указан источник в ячейке B1 листа "Параметры"'
      };
    }
    
    var cleanCount = Math.min(Math.max(parseInt(count) || 20, 1), 100);
    var cleanPlatform = platform ? String(platform).trim() : '';
    
    return {
      valid: true,
      source: String(source).trim(),
      count: cleanCount,
      platform: cleanPlatform
    };
    
  } catch (e) {
    return {
      valid: false,
      error: 'Ошибка чтения параметров: ' + e.message
    };
  }
}

/**
 * Запись постов в лист с форматированием
 */
function writeSocialPostsToSheet(spreadsheet, posts, platform) {
  if (!posts || !posts.length) return;
  
  var sheetName = 'посты';
  var sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  // Очищаем лист
  sheet.clear();
  
  // Заголовки с учетом платформы
  var headers = [
    'Платформа',
    'Дата', 
    'Ссылка на пост',
    'Текст поста',
    'ID поста',
    'Лайки',
    'Комментарии',
    'Стоп-слова',
    'Отфильтрованные посты',
    'Новый номер',
    'Позитивные слова',
    'Посты с позитивными словами',
    'Новый номер (позитивные)',
    'Анализ постов'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Форматирование заголовков
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285f4')
             .setFontColor('white')
             .setFontWeight('bold');
  
  // Подготовка данных
  var data = posts.map(function(post, index) {
    return [
      (platform || post.platform || 'UNKNOWN').toUpperCase(),
      post.date || new Date(),
      post.link || '',
      post.text || '',
      post.id || '',
      post.likes || 0,
      post.comments || 0,
      '', // стоп-слова (для заполнения пользователем)
      '', // отфильтрованные
      index + 1, // новый номер
      '', // позитивные слова
      '', // посты с позитивными
      '', // новый номер (позитивные)
      ''  // анализ постов
    ];
  });
  
  // Записываем данные
  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
  
  // Автоширина колонок
  sheet.autoResizeColumns(1, headers.length);
  
  // Добавляем фильтры
  if (data.length > 0) {
    var fullRange = sheet.getRange(1, 1, data.length + 1, headers.length);
    fullRange.createFilter();
  }
  
  logClient('Posts written to sheet "' + sheetName + '": ' + data.length + ' posts');
}

/**
 * Быстрый импорт для меню
 */
function quickSocialImport() {
  try {
    importSocialPostsClient();
  } catch (error) {
    var ui = SpreadsheetApp.getUi();
    ui.alert('Ошибка быстрого импорта', 'Не удалось выполнить импорт: ' + error.message, ui.ButtonSet.OK);
    logClient('Quick import error: ' + error.message);
  }
}

/**
 * Показать справку по импорту
 */
function showSocialImportHelp() {
  var ui = SpreadsheetApp.getUi();
  
  var helpHtml = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial, sans-serif; padding: 10px;">
      <h2>🤖 AI Table Bot - Социальный импорт</h2>
      
      <h3>📋 Настройка листа "Параметры":</h3>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <tr>
          <th>Ячейка</th>
          <th>Описание</th>
          <th>Примеры</th>
        </tr>
        <tr>
          <td><strong>B1</strong></td>
          <td>Источник (URL или username)</td>
          <td>https://instagram.com/nasa<br>https://t.me/durov<br>https://vk.com/username</td>
        </tr>
        <tr>
          <td><strong>B2</strong></td>
          <td>Количество постов (1-100)</td>
          <td>20</td>
        </tr>
        <tr>
          <td><strong>C1</strong></td>
          <td>Платформа (опционально)</td>
          <td>instagram, telegram, vk</td>
        </tr>
      </table>
      
      <h3>✅ Поддерживаемые форматы:</h3>
      <ul>
        <li><strong>Instagram:</strong> https://instagram.com/username</li>
        <li><strong>Telegram:</strong> https://t.me/channel</li>
        <li><strong>VK:</strong> https://vk.com/username</li>
      </ul>
      
      <h3>⚙️ Настройка credentials:</h3>
      <p>В Apps Script перейдите в: <strong>Project Settings</strong> → <strong>Script Properties</strong></p>
      <ul>
        <li><strong>LICENSE_EMAIL</strong> = ваш email</li>
        <li><strong>LICENSE_TOKEN</strong> = токен лицензии</li>
        <li><strong>SERVER_URL</strong> = URL серверного приложения</li>
      </ul>
      
      <h3>🚨 Troubleshooting:</h3>
      <ul>
        <li><strong>"Credentials not configured"</strong> → настройте Script Properties</li>
        <li><strong>"Server error"</strong> → проверьте SERVER_URL</li>
        <li><strong>"License error"</strong> → проверьте EMAIL и TOKEN</li>
        <li><strong>"Platform not supported"</strong> → укажите платформу в C1</li>
      </ul>
    </div>
  `).setWidth(600).setHeight(500);
  
  ui.showModalDialog(helpHtml, '📚 Справка по социальному импорту');
}

/**
 * Диагностика клиент-серверного соединения
 */
function testSocialImportConnection() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    logClient('Testing social import connection...');
    
    // Проверка credentials
    var credentials = getClientCredentials();
    if (!credentials.valid) {
      ui.alert('❌ Ошибка credentials', credentials.error, ui.ButtonSet.OK);
      return;
    }
    
    // Проверка соединения с сервером
    var testRequest = {
      action: 'health',
      email: credentials.email,
      token: credentials.token
    };
    
    var result = callServer(testRequest);
    
    if (result.ok) {
      var info = 'Соединение успешно!\\n\\n' +
                'Сервер: ' + (result.data.service || 'Unknown') + '\\n' +
                'Версия: ' + (result.data.version || 'Unknown') + '\\n' +
                'Timestamp: ' + (result.data.timestamp || 'Unknown');
      
      logClient('Connection test successful');
      ui.alert('✅ Соединение OK', info, ui.ButtonSet.OK);
    } else {
      ui.alert('❌ Ошибка сервера', result.error || 'Неизвестная ошибка', ui.ButtonSet.OK);
      logClient('Connection test failed: ' + (result.error || 'unknown'));
    }
    
  } catch (error) {
    ui.alert('❌ Ошибка соединения', 'Не удалось подключиться к серверу: ' + error.message, ui.ButtonSet.OK);
    logClient('Connection test exception: ' + error.message);
  }
}