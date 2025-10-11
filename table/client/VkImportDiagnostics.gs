/**
 * Диагностика VK импорта - КРИТИЧНАЯ ФУНКЦИЯ
 * Показывает ВСЕ проблемы которые могут мешать импорту
 */

/**
 * Главная функция диагностики VK импорта
 */
function diagnoseVkImport() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  
  addSystemLog('VK import diagnostics started', 'INFO', 'VK_DIAG');
  
  var report = [];
  report.push('🔬 ДИАГНОСТИКА VK ИМПОРТА');
  report.push('═══════════════════════════════');
  report.push('');
  
  var allOk = true;
  var criticalIssues = [];
  var warnings = [];
  
  // 1. ПРОВЕРКА CREDENTIALS
  report.push('1️⃣ CREDENTIALS:');
  var credsCheck = checkCredentialsForVk();
  report.push(credsCheck.message);
  if (!credsCheck.ok) {
    allOk = false;
    criticalIssues.push('Credentials не настроены');
  }
  report.push('');
  
  // 2. ПРОВЕРКА ЛИСТА ПАРАМЕТРЫ
  report.push('2️⃣ ЛИСТ "Параметры":');
  var paramsCheck = checkParametersSheet(ss);
  report.push(paramsCheck.message);
  if (!paramsCheck.ok) {
    allOk = false;
    criticalIssues.push('Параметры не настроены');
  }
  report.push('');
  
  // 3. ПРОВЕРКА ФУНКЦИЙ
  report.push('3️⃣ ФУНКЦИИ:');
  var functionsCheck = checkVkFunctions();
  report.push(functionsCheck.message);
  if (!functionsCheck.ok) {
    allOk = false;
    criticalIssues.push('Функции импорта отсутствуют');
  }
  report.push('');
  
  // 4. ПРОВЕРКА СЕРВЕРА
  report.push('4️⃣ СВЯЗЬ С СЕРВЕРОМ:');
  var serverCheck = checkServerConnection();
  report.push(serverCheck.message);
  if (!serverCheck.ok) {
    allOk = false;
    criticalIssues.push('Сервер недоступен');
  }
  report.push('');
  
  // 5. ПРОБНЫЙ ЗАПРОС
  if (allOk) {
    report.push('5️⃣ ТЕСТОВЫЙ ЗАПРОС:');
    var testCheck = testVkApiCall(ss);
    report.push(testCheck.message);
    if (!testCheck.ok) {
      allOk = false;
      criticalIssues.push('VK API вернул ошибку');
    }
    report.push('');
  }
  
  // ИТОГО
  report.push('═══════════════════════════════');
  if (allOk) {
    report.push('✅ ВСЁ В ПОРЯДКЕ!');
    report.push('');
    report.push('VK импорт должен работать.');
    report.push('Попробуйте: Меню → Импорт постов');
  } else {
    report.push('❌ НАЙДЕНЫ ПРОБЛЕМЫ:');
    report.push('');
    criticalIssues.forEach(function(issue) {
      report.push('• ' + issue);
    });
    report.push('');
    report.push('💡 РЕКОМЕНДАЦИИ:');
    report.push(getRecommendations(criticalIssues));
  }
  
  var fullReport = report.join('\\n');
  
  // Логируем отчёт
  addSystemLog('VK diagnostics: ' + (allOk ? 'ALL OK' : 'Issues: ' + criticalIssues.join(', ')), allOk ? 'INFO' : 'WARN', 'VK_DIAG');
  
  // Показываем пользователю
  ui.alert('Диагностика VK импорта', fullReport, ui.ButtonSet.OK);
}

/**
 * Проверка credentials для VK
 */
function checkCredentialsForVk() {
  try {
    var creds = getClientCredentials();
    
    if (!creds.ok) {
      return {
        ok: false,
        message: '❌ Credentials не настроены\\n   ' + (creds.error || 'Неизвестная ошибка') + '\\n   💡 Меню → Настройки → НАСТРОИТЬ ВСЕ КЛЮЧИ'
      };
    }
    
    if (!creds.email || !creds.token) {
      return {
        ok: false,
        message: '❌ Email или token пустые\\n   💡 Меню → Настройки → НАСТРОИТЬ ВСЕ КЛЮЧИ'
      };
    }
    
    return {
      ok: true,
      message: '✅ Email: ' + maskEmail(creds.email) + '\\n✅ Token: ' + maskToken(creds.token) + '\\n✅ Gemini: ' + (creds.apiKey ? 'установлен' : 'не нужен для VK')
    };
    
  } catch (e) {
    return {
      ok: false,
      message: '❌ Ошибка проверки: ' + e.message
    };
  }
}

/**
 * Проверка листа Параметры
 */
function checkParametersSheet(ss) {
  try {
    var paramsSheet = ss.getSheetByName('Параметры');
    if (!paramsSheet) {
      return {
        ok: false,
        message: '❌ Лист "Параметры" не найден\\n   💡 Меню → Социальные сети → Настройки соцсетей'
      };
    }
    
    var source = paramsSheet.getRange('B1').getValue();
    var count = paramsSheet.getRange('B2').getValue();
    var platform = paramsSheet.getRange('C1').getValue();
    
    if (!source) {
      return {
        ok: false,
        message: '❌ Источник (B1) не указан\\n   💡 Меню → Социальные сети → Настройки соцсетей'
      };
    }
    
    if (!count || count < 1) {
      return {
        ok: false,
        message: '❌ Количество постов (B2) не указано или < 1\\n   Текущее: ' + count + '\\n   💡 Меню → Социальные сети → Настройки соцсетей'
      };
    }
    
    // Определяем платформу
    var detectedPlatform = detectPlatform(source, platform);
    
    return {
      ok: true,
      message: '✅ Лист найден\\n✅ Источник: ' + source + '\\n✅ Количество: ' + count + '\\n✅ Платформа: ' + (detectedPlatform || 'автоопределение')
    };
    
  } catch (e) {
    return {
      ok: false,
      message: '❌ Ошибка чтения параметров: ' + e.message
    };
  }
}

/**
 * Проверка наличия функций VK импорта
 */
function checkVkFunctions() {
  var functions = {
    importSocialPostsClient: typeof importSocialPostsClient === 'function',
    importVkPosts: typeof importVkPosts === 'function',
    importVkPostsClient: typeof importVkPostsClient === 'function',
    callServer: typeof callServer === 'function',
    getClientCredentials: typeof getClientCredentials === 'function'
  };
  
  var missing = [];
  for (var fname in functions) {
    if (!functions[fname]) {
      missing.push(fname);
    }
  }
  
  if (missing.length > 0) {
    return {
      ok: false,
      message: '❌ Отсутствуют функции:\\n   ' + missing.join(', ') + '\\n   💡 Возможно деплой не завершён'
    };
  }
  
  return {
    ok: true,
    message: '✅ importSocialPostsClient\\n✅ importVkPosts\\n✅ callServer\\n✅ getClientCredentials'
  };
}

/**
 * Проверка связи с сервером
 */
function checkServerConnection() {
  try {
    if (typeof SERVER_API_URL === 'undefined' || !SERVER_API_URL) {
      return {
        ok: false,
        message: '❌ SERVER_API_URL не настроен\\n   💡 Проверьте Constants.gs'
      };
    }
    
    // Пробуем ping сервера
    try {
      var response = UrlFetchApp.fetch(SERVER_API_URL + '?ping=1', {
        method: 'get',
        muteHttpExceptions: true,
        timeout: 10
      });
      
      var code = response.getResponseCode();
      if (code === 200 || code === 404 || code === 405) {
        // 200 = OK, 404/405 = сервер жив но нет ping endpoint (это нормально)
        return {
          ok: true,
          message: '✅ Сервер доступен\\n✅ URL: ' + SERVER_API_URL.substring(0, 50) + '...\\n✅ Код ответа: ' + code
        };
      } else {
        return {
          ok: false,
          message: '⚠️ Сервер ответил с кодом ' + code + '\\n   URL: ' + SERVER_API_URL + '\\n   Может работать, но требует проверки'
        };
      }
    } catch (fetchError) {
      return {
        ok: false,
        message: '❌ Не удалось подключиться к серверу\\n   URL: ' + SERVER_API_URL + '\\n   Ошибка: ' + fetchError.message
      };
    }
    
  } catch (e) {
    return {
      ok: false,
      message: '❌ Ошибка проверки сервера: ' + e.message
    };
  }
}

/**
 * Тестовый запрос к VK API через сервер
 */
function testVkApiCall(ss) {
  try {
    var paramsSheet = ss.getSheetByName('Параметры');
    if (!paramsSheet) {
      return {
        ok: false,
        message: '⏭️ Пропущено (нет листа Параметры)'
      };
    }
    
    var source = paramsSheet.getRange('B1').getValue();
    if (!source) {
      return {
        ok: false,
        message: '⏭️ Пропущено (не указан источник)'
      };
    }
    
    var creds = getClientCredentials();
    if (!creds.ok) {
      return {
        ok: false,
        message: '⏭️ Пропущено (нет credentials)'
      };
    }
    
    // Пробуем минимальный запрос (1 пост)
    var testRequest = {
      action: 'social_import',
      email: creds.email,
      token: creds.token,
      source: source,
      count: 1
    };
    
    try {
      var result = callServer(testRequest);
      
      if (result && result.ok && result.data) {
        return {
          ok: true,
          message: '✅ Тестовый запрос успешен!\\n✅ Получено постов: ' + result.data.length + '\\n✅ Платформа: ' + (result.platform || 'unknown')
        };
      } else {
        var errorMsg = result && result.error ? result.error : 'Неизвестная ошибка';
        return {
          ok: false,
          message: '❌ Сервер вернул ошибку:\\n   ' + errorMsg + '\\n\\n   💡 ЭТО КЛЮЧЕВАЯ ИНФОРМАЦИЯ!'
        };
      }
    } catch (callError) {
      return {
        ok: false,
        message: '❌ Ошибка при вызове сервера:\\n   ' + callError.message + '\\n\\n   💡 Проверьте логи сервера'
      };
    }
    
  } catch (e) {
    return {
      ok: false,
      message: '❌ Ошибка тестового запроса: ' + e.message
    };
  }
}

/**
 * Определение платформы по источнику
 */
function detectPlatform(source, platformHint) {
  if (!source) return null;
  
  var s = String(source).toLowerCase();
  
  // VK
  if (s.indexOf('vk.com') >= 0 || s.indexOf('вконтакте') >= 0) {
    return 'VK';
  }
  
  // Instagram
  if (s.indexOf('instagram.com') >= 0 || s.indexOf('инста') >= 0) {
    return 'Instagram';
  }
  
  // Telegram
  if (s.indexOf('t.me') >= 0 || s.indexOf('telegram') >= 0 || s.indexOf('тг') >= 0) {
    return 'Telegram';
  }
  
  // По подсказке
  if (platformHint) {
    var hint = String(platformHint).toLowerCase();
    if (hint.indexOf('vk') >= 0 || hint.indexOf('вк') >= 0) return 'VK';
    if (hint.indexOf('insta') >= 0 || hint.indexOf('инста') >= 0) return 'Instagram';
    if (hint.indexOf('tg') >= 0 || hint.indexOf('telegram') >= 0 || hint.indexOf('тг') >= 0) return 'Telegram';
  }
  
  return 'auto';
}

/**
 * Маскировка email для безопасности
 */
function maskEmail(email) {
  if (!email) return '(пусто)';
  var parts = String(email).split('@');
  if (parts.length !== 2) return email.substring(0, 5) + '***';
  return parts[0].substring(0, 3) + '***@' + parts[1];
}

/**
 * Маскировка токена для безопасности
 */
function maskToken(token) {
  if (!token) return '(пусто)';
  var t = String(token);
  if (t.length < 10) return '***';
  return t.substring(0, 8) + '...' + t.substring(t.length - 4);
}

/**
 * Генерация рекомендаций по исправлению
 */
function getRecommendations(issues) {
  var recs = [];
  
  issues.forEach(function(issue) {
    if (issue.indexOf('Credentials') >= 0) {
      recs.push('→ Меню → Настройки → НАСТРОИТЬ ВСЕ КЛЮЧИ');
    }
    if (issue.indexOf('Параметры') >= 0) {
      recs.push('→ Меню → Социальные сети → Настройки соцсетей');
    }
    if (issue.indexOf('Функции') >= 0) {
      recs.push('→ Проверьте деплой в GitHub Actions');
    }
    if (issue.indexOf('Сервер') >= 0) {
      recs.push('→ Проверьте SERVER_API_URL в Constants.gs');
      recs.push('→ Убедитесь что сервер задеплоен');
    }
    if (issue.indexOf('VK API') >= 0) {
      recs.push('→ Проверьте логи сервера (он получает запрос?)');
      recs.push('→ Возможно проблема в VK_TOKEN на сервере');
      recs.push('→ Или VK API временно недоступен');
    }
  });
  
  // Убираем дубликаты
  var unique = {};
  recs.forEach(function(r) {
    unique[r] = true;
  });
  
  return Object.keys(unique).join('\\n');
}
