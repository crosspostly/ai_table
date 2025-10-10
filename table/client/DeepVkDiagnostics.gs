/**
 * 🔬 ГЛУБОКАЯ ДИАГНОСТИКА VK ИМПОРТА
 * 
 * Цель: НАЙТИ где именно ломается VK импорт
 * Логирует КАЖДЫЙ шаг с промежуточными данными
 * Показывает точные URL, параметры, ответы API
 */

/**
 * 🚀 ГЛАВНАЯ ФУНКЦИЯ ДИАГНОСТИКИ VK
 * Запускается из меню: DEV → Глубокая диагностика VK
 */
function deepVkDiagnostics() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // === ПОДГОТОВКА ЛИСТА ДИАГНОСТИКИ ===
  var diagnosticSheet = ss.getSheetByName('vk_диагностика');
  if (!diagnosticSheet) {
    diagnosticSheet = ss.insertSheet('vk_диагностика');
  }
  diagnosticSheet.clear();
  
  // Заголовок
  diagnosticSheet.getRange(1, 1, 1, 6).setValues([[
    'Время', 'Шаг', 'Статус', 'Данные', 'Детали', 'Ошибка'
  ]]);
  diagnosticSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  
  var logRow = 2;
  
  function logDiagnostic(step, status, data, details, error) {
    var timestamp = new Date().toLocaleString('ru-RU');
    diagnosticSheet.getRange(logRow, 1, 1, 6).setValues([[
      timestamp, step, status, 
      JSON.stringify(data || {}), 
      details || '', 
      error || ''
    ]]);
    
    // Цветовое кодирование
    var statusCell = diagnosticSheet.getRange(logRow, 3);
    if (status === 'OK') {
      statusCell.setBackground('#d4edda').setFontColor('#155724');
    } else if (status === 'FAIL') {
      statusCell.setBackground('#f8d7da').setFontColor('#721c24').setFontWeight('bold');
    } else if (status === 'INFO') {
      statusCell.setBackground('#d1ecf1').setFontColor('#0c5460');
    }
    
    logRow++;
  }
  
  try {
    logDiagnostic('START', 'INFO', {}, 'Начало глубокой диагностики VK импорта', '');
    
    // === ШАГ 1: ПРОВЕРКА CREDENTIALS ===
    logDiagnostic('STEP 1/10', 'INFO', {}, 'Проверка CLIENT credentials', '');
    var creds;
    try {
      creds = getClientCredentials();
      if (!creds || !creds.ok) {
        logDiagnostic('CREDENTIALS', 'FAIL', creds, 'Credentials не OK', creds ? creds.error : 'null response');
        throw new Error('CLIENT credentials провалены');
      }
      logDiagnostic('CREDENTIALS', 'OK', { email: creds.email, hasToken: !!creds.token }, 'Email: ' + creds.email, '');
    } catch (e) {
      logDiagnostic('CREDENTIALS', 'FAIL', {}, '', e.message + '\n' + e.stack);
      throw e;
    }
    
    // === ШАГ 2: ПРОВЕРКА ЛИСТА ПАРАМЕТРЫ ===
    logDiagnostic('STEP 2/10', 'INFO', {}, 'Проверка листа Параметры', '');
    var paramsSheet = ss.getSheetByName('Параметры');
    if (!paramsSheet) {
      logDiagnostic('PARAMS_SHEET', 'FAIL', {}, 'Лист Параметры не найден', '');
      throw new Error('Лист Параметры отсутствует');
    }
    
    var b1 = paramsSheet.getRange('B1').getValue();
    var b2 = paramsSheet.getRange('B2').getValue();
    var c1 = paramsSheet.getRange('C1').getValue();
    
    logDiagnostic('PARAMS_SHEET', 'OK', { B1: b1, B2: b2, C1: c1 }, 'B1=' + b1 + ', B2=' + b2 + ', C1=' + c1, '');
    
    if (!b1) {
      logDiagnostic('PARAMS_B1', 'FAIL', {}, 'B1 (source) пустой', '');
      throw new Error('B1 не заполнен - укажите VK username/ID');
    }
    
    // === ШАГ 3: СОЕДИНЕНИЕ С СЕРВЕРОМ ===
    logDiagnostic('STEP 3/10', 'INFO', {}, 'Проверка соединения с сервером', '');
    try {
      var healthRequest = {
        action: 'health',
        email: creds.email,
        token: creds.token
      };
      
      logDiagnostic('SERVER_REQUEST', 'INFO', healthRequest, 'Отправка health check', '');
      var healthResult = callServer(healthRequest);
      
      if (!healthResult || !healthResult.ok) {
        logDiagnostic('SERVER_HEALTH', 'FAIL', healthResult, '', healthResult ? healthResult.error : 'null response');
        throw new Error('Сервер недоступен');
      }
      
      logDiagnostic('SERVER_HEALTH', 'OK', healthResult, 'Service: ' + (healthResult.service || 'unknown'), '');
    } catch (e) {
      logDiagnostic('SERVER_HEALTH', 'FAIL', {}, '', e.message + '\n' + e.stack);
      throw e;
    }
    
    // === ШАГ 4: ПРОВЕРКА VK_TOKEN НА СЕРВЕРЕ ===
    logDiagnostic('STEP 4/10', 'INFO', {}, 'Проверка VK_TOKEN на сервере', '');
    try {
      var vkTokenRequest = {
        action: 'vk_token_validate',
        email: creds.email,
        token: creds.token
      };
      
      logDiagnostic('VK_TOKEN_REQUEST', 'INFO', vkTokenRequest, 'Запрос валидации VK_TOKEN', '');
      var vkTokenResult = callServer(vkTokenRequest);
      
      logDiagnostic('VK_TOKEN_RESPONSE', vkTokenResult && vkTokenResult.ok ? 'OK' : 'FAIL', 
        vkTokenResult, 
        vkTokenResult && vkTokenResult.data ? JSON.stringify(vkTokenResult.data) : '', 
        vkTokenResult ? vkTokenResult.error : 'null response');
      
      if (!vkTokenResult || !vkTokenResult.ok) {
        throw new Error('VK_TOKEN невалиден: ' + (vkTokenResult ? vkTokenResult.error : 'null'));
      }
    } catch (e) {
      logDiagnostic('VK_TOKEN_CHECK', 'FAIL', {}, '', e.message);
      // Не бросаем ошибку - продолжаем дальше
    }
    
    // === ШАГ 5: ПАРСИНГ ИСТОЧНИКА ===
    logDiagnostic('STEP 5/10', 'INFO', {}, 'Парсинг источника (B1)', '');
    try {
      var vkImportRequest = {
        action: 'vk_import_diagnostic',  // Специальный action для диагностики
        email: creds.email,
        token: creds.token,
        owner: b1,
        count: b2 || 3  // Минимальное количество для теста
      };
      
      logDiagnostic('VK_IMPORT_REQUEST', 'INFO', vkImportRequest, 
        'Запрос к серверу: action=vk_import_diagnostic, owner=' + b1 + ', count=' + (b2 || 3), '');
      
      // === ШАГ 6: ВЫЗОВ СЕРВЕРА ДЛЯ VK ИМПОРТА ===
      logDiagnostic('STEP 6/10', 'INFO', {}, 'Вызов сервера для VK импорта', '');
      
      var vkImportResult = callServer(vkImportRequest);
      
      logDiagnostic('VK_IMPORT_RESPONSE', 'INFO', vkImportResult, 
        'Ответ сервера получен. ok=' + (vkImportResult ? vkImportResult.ok : 'null'), '');
      
      if (!vkImportResult) {
        logDiagnostic('VK_IMPORT', 'FAIL', {}, 'Сервер вернул null', 'Проверьте что сервер обрабатывает action=vk_import_diagnostic');
        throw new Error('Сервер вернул null при VK импорте');
      }
      
      if (!vkImportResult.ok) {
        logDiagnostic('VK_IMPORT', 'FAIL', vkImportResult, 
          'Ошибка от сервера', 
          vkImportResult.error || 'Unknown error');
        throw new Error('VK импорт провален: ' + (vkImportResult.error || 'Unknown error'));
      }
      
      if (!vkImportResult.data || !Array.isArray(vkImportResult.data)) {
        logDiagnostic('VK_IMPORT', 'FAIL', vkImportResult, 
          'Данные не являются массивом', 
          'Ожидался массив, получен: ' + typeof vkImportResult.data);
        throw new Error('VK импорт вернул некорректные данные');
      }
      
      logDiagnostic('VK_IMPORT', 'OK', { 
        postsCount: vkImportResult.data.length,
        firstPost: vkImportResult.data[0] || null
      }, 'Получено постов: ' + vkImportResult.data.length, '');
      
      // === ШАГ 7: ДЕТАЛЬНАЯ ПРОВЕРКА ПОСТОВ ===
      logDiagnostic('STEP 7/10', 'INFO', {}, 'Детальная проверка полученных постов', '');
      
      if (vkImportResult.data.length === 0) {
        logDiagnostic('POSTS_CHECK', 'FAIL', {}, 'Массив постов пустой', 'Проверьте что у owner=' + b1 + ' есть публичные посты');
        throw new Error('Получен пустой массив постов');
      }
      
      var firstPost = vkImportResult.data[0];
      var requiredFields = ['date', 'link', 'text'];
      var missingFields = [];
      
      requiredFields.forEach(function(field) {
        if (!firstPost[field] && firstPost[field] !== '') {
          missingFields.push(field);
        }
      });
      
      if (missingFields.length > 0) {
        logDiagnostic('POSTS_CHECK', 'FAIL', firstPost, 
          'Отсутствуют поля: ' + missingFields.join(', '), '');
        throw new Error('Посты имеют некорректную структуру');
      }
      
      logDiagnostic('POSTS_CHECK', 'OK', firstPost, 
        'Первый пост корректен. Дата: ' + firstPost.date + ', Текст: ' + (firstPost.text || '').substring(0, 50), '');
      
      // === ШАГ 8: ТЕСТ ЗАПИСИ В ЛИСТ ===
      logDiagnostic('STEP 8/10', 'INFO', {}, 'Тест записи постов в лист', '');
      
      var testSheet = ss.getSheetByName('vk_тест_импорта');
      if (!testSheet) {
        testSheet = ss.insertSheet('vk_тест_импорта');
      }
      testSheet.clear();
      
      try {
        var headers = ['Дата', 'Ссылка', 'Текст', 'Номер'];
        var rows = [headers];
        
        vkImportResult.data.forEach(function(post, i) {
          rows.push([post.date, post.link, post.text || '', i + 1]);
        });
        
        testSheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
        testSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#d4edda');
        
        logDiagnostic('WRITE_SHEET', 'OK', { rowsWritten: rows.length - 1 }, 
          'Записано ' + (rows.length - 1) + ' постов в лист vk_тест_импорта', '');
      } catch (e) {
        logDiagnostic('WRITE_SHEET', 'FAIL', {}, '', e.message + '\n' + e.stack);
        throw e;
      }
      
      // === ШАГ 9: ФИНАЛЬНАЯ ПРОВЕРКА ===
      logDiagnostic('STEP 9/10', 'INFO', {}, 'Финальная проверка', '');
      logDiagnostic('FINAL_CHECK', 'OK', {
        totalPosts: vkImportResult.data.length,
        source: b1,
        testSheetCreated: true
      }, 'Все проверки пройдены успешно', '');
      
      // === ШАГ 10: РЕЗУЛЬТАТ ===
      logDiagnostic('STEP 10/10', 'INFO', {}, 'Диагностика завершена', '');
      logDiagnostic('COMPLETE', 'OK', {}, 
        'VK ИМПОРТ РАБОТАЕТ КОРРЕКТНО! Получено ' + vkImportResult.data.length + ' постов', '');
      
      // Показываем результат
      ui.alert('✅ Диагностика завершена', 
        'VK импорт работает корректно!\\n\\n' +
        'Получено постов: ' + vkImportResult.data.length + '\\n' +
        'Источник: ' + b1 + '\\n\\n' +
        'Детальные логи в листе "vk_диагностика"\\n' +
        'Тестовые данные в листе "vk_тест_импорта"',
        ui.ButtonSet.OK);
      
    } catch (e) {
      logDiagnostic('DIAGNOSTIC_ERROR', 'FAIL', {}, '', e.message + '\n' + (e.stack || ''));
      
      ui.alert('❌ Диагностика выявила проблему', 
        'Ошибка: ' + e.message + '\\n\\n' +
        'Детальные логи в листе "vk_диагностика"\\n' +
        'Найдите строку с FAIL для определения проблемы',
        ui.ButtonSet.OK);
    }
    
  } catch (error) {
    logDiagnostic('CRITICAL_ERROR', 'FAIL', {}, '', error.message + '\n' + (error.stack || ''));
    
    ui.alert('❌ Критическая ошибка диагностики', 
      'Ошибка: ' + error.message + '\\n\\n' +
      'Детальные логи в листе "vk_диагностика"',
      ui.ButtonSet.OK);
  } finally {
    // Автоширина колонок для удобства
    diagnosticSheet.autoResizeColumns(1, 6);
  }
}

/**
 * 🔬 УПРОЩЁННАЯ ДИАГНОСТИКА - работает только через сервер
 * НЕ требует обновления серверного кода
 */
function testSimplifiedVkDiagnostic() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var diagnosticSheet = ss.getSheetByName('vk_упрощённая_диагностика');
  if (!diagnosticSheet) {
    diagnosticSheet = ss.insertSheet('vk_упрощённая_диагностика');
  }
  diagnosticSheet.clear();
  
  diagnosticSheet.getRange(1, 1, 1, 5).setValues([[
    'Время', 'Шаг', 'Статус', 'Данные', 'Ошибка'
  ]]);
  diagnosticSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  
  var logRow = 2;
  
  function log(step, status, data, error) {
    diagnosticSheet.getRange(logRow, 1, 1, 5).setValues([[
      new Date().toLocaleString('ru-RU'),
      step,
      status,
      JSON.stringify(data || {}).substring(0, 500),
      error || ''
    ]]);
    
    var statusCell = diagnosticSheet.getRange(logRow, 3);
    if (status === 'OK') {
      statusCell.setBackground('#d4edda');
    } else if (status === 'FAIL') {
      statusCell.setBackground('#f8d7da').setFontWeight('bold');
    }
    
    logRow++;
  }
  
  try {
    log('START', 'INFO', {}, 'Упрощённая диагностика VK импорта');
    
    // Читаем параметры
    var paramsSheet = ss.getSheetByName('Параметры');
    if (!paramsSheet) {
      throw new Error('Лист Параметры не найден');
    }
    
    var owner = paramsSheet.getRange('B1').getValue();
    var count = paramsSheet.getRange('B2').getValue() || 3;
    
    log('PARAMS', 'OK', { owner: owner, count: count }, 'B1=' + owner + ', B2=' + count);
    
    // Credentials
    var creds = getClientCredentials();
    if (!creds || !creds.ok) {
      log('CREDENTIALS', 'FAIL', creds, 'Credentials не OK');
      throw new Error('Credentials провалены');
    }
    
    log('CREDENTIALS', 'OK', { email: creds.email }, 'Email: ' + creds.email);
    
    // Пробуем через обычный VK import
    log('VK_IMPORT', 'INFO', {}, 'Запрос через action=vk_import');
    
    var vkRequest = {
      action: 'vk_import',
      email: creds.email,
      token: creds.token,
      owner: owner,
      count: count
    };
    
    log('REQUEST', 'INFO', vkRequest, 'Отправка запроса на сервер');
    
    var result = callServer(vkRequest);
    
    log('RESPONSE', 'INFO', result, 'Ответ от сервера получен');
    
    if (!result) {
      log('VK_IMPORT', 'FAIL', {}, 'Сервер вернул null');
      throw new Error('Сервер вернул null');
    }
    
    if (!result.ok) {
      log('VK_IMPORT', 'FAIL', result, 'Ошибка: ' + (result.error || 'unknown'));
      throw new Error('VK импорт провален: ' + (result.error || 'unknown'));
    }
    
    if (!result.data || !Array.isArray(result.data.data)) {
      log('VK_IMPORT', 'FAIL', result, 'Данные не являются массивом');
      throw new Error('Некорректный формат данных');
    }
    
    var posts = result.data.data;
    log('VK_IMPORT', 'OK', { postsCount: posts.length }, 'Получено постов: ' + posts.length);
    
    // Проверяем первый пост
    if (posts.length > 0) {
      var firstPost = posts[0];
      log('FIRST_POST', 'OK', firstPost, 'Дата: ' + firstPost.date + ', Текст: ' + (firstPost.text || '').substring(0, 50));
    }
    
    log('COMPLETE', 'OK', {}, 'VK ИМПОРТ РАБОТАЕТ! Получено ' + posts.length + ' постов');
    
    ui.alert('✅ VK импорт работает!', 
      'Успешно получено ' + posts.length + ' постов\\n' +
      'Источник: ' + owner + '\\n\\n' +
      'Детали в листе "vk_упрощённая_диагностика"',
      ui.ButtonSet.OK);
    
  } catch (error) {
    log('ERROR', 'FAIL', {}, error.message + '\\n' + (error.stack || ''));
    
    ui.alert('❌ VK импорт провален', 
      'Ошибка: ' + error.message + '\\n\\n' +
      'Проверьте лист "vk_упрощённая_диагностика" для деталей',
      ui.ButtonSet.OK);
  } finally {
    diagnosticSheet.autoResizeColumns(1, 5);
  }
}

/**
 * 🔬 ДИАГНОСТИКА ПРЯМОГО VK API ВЫЗОВА
 * Тестирует прямое обращение к VK API БЕЗ сервера
 * ТРЕБУЕТ обновления серверного кода (action=get_vk_token)
 */
function testDirectVkApi() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var diagnosticSheet = ss.getSheetByName('vk_direct_api_test');
  if (!diagnosticSheet) {
    diagnosticSheet = ss.insertSheet('vk_direct_api_test');
  }
  diagnosticSheet.clear();
  
  diagnosticSheet.getRange(1, 1, 1, 5).setValues([[
    'Время', 'Шаг', 'Статус', 'URL/Данные', 'Ошибка'
  ]]);
  diagnosticSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  
  var logRow = 2;
  
  function log(step, status, data, error) {
    diagnosticSheet.getRange(logRow, 1, 1, 5).setValues([[
      new Date().toLocaleString('ru-RU'),
      step,
      status,
      JSON.stringify(data || {}).substring(0, 500),
      error || ''
    ]]);
    
    var statusCell = diagnosticSheet.getRange(logRow, 3);
    if (status === 'OK') {
      statusCell.setBackground('#d4edda');
    } else if (status === 'FAIL') {
      statusCell.setBackground('#f8d7da').setFontWeight('bold');
    }
    
    logRow++;
  }
  
  try {
    log('START', 'INFO', {}, 'Тест прямого VK API вызова (БЕЗ сервера)');
    
    // Читаем параметры
    var paramsSheet = ss.getSheetByName('Параметры');
    if (!paramsSheet) {
      throw new Error('Лист Параметры не найден');
    }
    
    var owner = paramsSheet.getRange('B1').getValue();
    var count = paramsSheet.getRange('B2').getValue() || 3;
    
    log('PARAMS', 'OK', { owner: owner, count: count }, '');
    
    // Пробуем получить VK_TOKEN через сервер
    log('TOKEN_REQUEST', 'INFO', {}, 'Запрос VK_TOKEN через сервер (ТРЕБУЕТ обновлённого серверного кода!)');
    
    var creds = getClientCredentials();
    if (!creds || !creds.ok) {
      throw new Error('Credentials не OK');
    }
    
    var tokenRequest = {
      action: 'get_vk_token',
      email: creds.email,
      token: creds.token
    };
    
    var tokenResult = callServer(tokenRequest);
    
    if (!tokenResult || !tokenResult.ok || !tokenResult.data) {
      log('TOKEN', 'FAIL', tokenResult, 'Не удалось получить VK_TOKEN от сервера. ВЕРОЯТНО СЕРВЕР НЕ ОБНОВЛЁН!');
      log('HINT', 'INFO', {}, 'Используйте "Упрощённая диагностика VK" вместо этого теста');
      throw new Error('VK_TOKEN недоступен - сервер не обновлён с новым кодом');
    }
    
    var vkToken = tokenResult.data.token;
    log('TOKEN', 'OK', { tokenLength: vkToken.length }, 'VK_TOKEN получен (' + vkToken.length + ' символов)');
    
    // Формируем URL для VK API
    var apiUrl = 'https://api.vk.com/method/wall.get';
    var params = {
      domain: String(owner),
      count: Math.min(parseInt(count), 100),
      access_token: vkToken,
      v: '5.131'
    };
    
    var fullUrl = apiUrl + '?' + Object.keys(params).map(function(key) {
      return key + '=' + encodeURIComponent(params[key]);
    }).join('&');
    
    log('API_URL', 'INFO', { url: fullUrl.replace(vkToken, 'TOKEN_HIDDEN') }, 'URL сформирован');
    
    // Выполняем запрос
    log('API_REQUEST', 'INFO', {}, 'Отправка запроса к VK API');
    
    var response = UrlFetchApp.fetch(fullUrl, {
      muteHttpExceptions: true
    });
    
    var statusCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    log('API_RESPONSE', statusCode === 200 ? 'OK' : 'FAIL', {
      statusCode: statusCode,
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 200)
    }, statusCode !== 200 ? 'HTTP ' + statusCode : '');
    
    if (statusCode !== 200) {
      throw new Error('HTTP ' + statusCode + ': ' + responseText);
    }
    
    // Парсим ответ
    var jsonResponse = JSON.parse(responseText);
    
    if (jsonResponse.error) {
      log('API_ERROR', 'FAIL', jsonResponse.error, JSON.stringify(jsonResponse.error));
      throw new Error('VK API Error: ' + JSON.stringify(jsonResponse.error));
    }
    
    if (!jsonResponse.response || !jsonResponse.response.items) {
      log('API_FORMAT', 'FAIL', jsonResponse, 'Неожиданный формат ответа');
      throw new Error('Неожиданный формат ответа VK API');
    }
    
    var posts = jsonResponse.response.items;
    log('API_PARSE', 'OK', {
      postsCount: posts.length,
      firstPost: posts[0] ? {
        id: posts[0].id,
        date: posts[0].date,
        textLength: (posts[0].text || '').length
      } : null
    }, 'Посты получены и распарсены');
    
    log('COMPLETE', 'OK', { totalPosts: posts.length }, 'ПРЯМОЙ VK API РАБОТАЕТ!');
    
    ui.alert('✅ Прямой VK API работает', 
      'Успешно получено ' + posts.length + ' постов\\n' +
      'Источник: ' + owner + '\\n\\n' +
      'Детали в листе "vk_direct_api_test"',
      ui.ButtonSet.OK);
    
  } catch (error) {
    log('ERROR', 'FAIL', {}, error.message + '\\n' + (error.stack || ''));
    
    ui.alert('❌ Прямой VK API провален', 
      'Ошибка: ' + error.message + '\\n\\n' +
      'Детали в листе "vk_direct_api_test"',
      ui.ButtonSet.OK);
  } finally {
    diagnosticSheet.autoResizeColumns(1, 5);
  }
}
