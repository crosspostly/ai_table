/**
 * Social Import Client v2.0
 * Клиентский интерфейс для универсального импорта социальных сетей
 * ИЗ СТАРОЙ РАБОЧЕЙ ВЕРСИИ old/Main.txt - ПРОСТЫЕ ДИАЛОГИ БЕЗ ЛИСТА "Параметры"
 */

/**
 * Универсальный импорт постов из социальных сетей (клиентский интерфейс)
 * ВОССТАНОВЛЕНО ИЗ old/Main.txt - РАБОЧАЯ ВЕРСИЯ
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
  
  // Запрашиваем источник через UI диалог
  var sourceResult = ui.prompt('📱 Импорт постов из социальных сетей', 
    'Введите источник (ссылка, @username или username):\n\n' +
    'Примеры:\n' +
    '✅ https://instagram.com/nasa\n' +
    '✅ https://vk.com/durov\n' +
    '✅ @durov\n' +
    '✅ nasa', 
    ui.ButtonSet.OK_CANCEL);
  
  if (sourceResult.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  
  var source = sourceResult.getResponseText().trim();
  if (!source) {
    ui.alert('Ошибка', 'Источник не может быть пустым', ui.ButtonSet.OK);
    return;
  }
  
  // Запрашиваем количество постов
  var countResult = ui.prompt('📱 Импорт постов', 
    'Количество постов для импорта (1-50):', 
    ui.ButtonSet.OK_CANCEL);
  
  if (countResult.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  
  var count = parseInt(countResult.getResponseText().trim()) || 10;
  if (count < 1) count = 1;
  if (count > 50) count = 50;
  
  addSystemLog('Social import start: source=' + source + ', count=' + count, 'INFO', 'SOCIAL');
  
  try {
    // Показываем процесс
    ui.alert('🚀 Импорт запущен', 
      'Импорт ' + count + ' постов из:\n' + source + '\n\n' +
      'Это может занять до 2 минут...', 
      ui.ButtonSet.OK);
    
    // Вызов серверного API (действие social_import на сервере)
    var serverRequest = {
      action: 'social_import',
      email: credentials.email,
      token: credentials.token,
      source: source,
      count: count
    };
    
    var result = callServer(serverRequest);
    
    if (result && result.ok && result.data && result.data.length) {
      // Записываем результаты в лист
      writeSocialPostsToSheet(ss, result.data, result.platform || 'social');
      
      var summary = '✅ Импорт завершён успешно!\n\n' +
                   'Платформа: ' + (result.platform || 'unknown').toUpperCase() + '\n' +
                   'Импортировано: ' + result.data.length + ' постов\n' +
                   'Источник: ' + source + '\n\n' +
                   'Данные записаны в активный лист.';
      
      addSystemLog('Social import success: platform=' + result.platform + ', posts=' + result.data.length, 'INFO', 'SOCIAL');
      ui.alert('✅ Успех!', summary, ui.ButtonSet.OK);
      
    } else {
      var errorMsg = result && result.error ? result.error : 'Неизвестная ошибка сервера';
      addSystemLog('Social import failed: ' + errorMsg, 'ERROR', 'SOCIAL');
      ui.alert('❌ Ошибка импорта', 
        'Не удалось импортировать посты:\n' + errorMsg, 
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
