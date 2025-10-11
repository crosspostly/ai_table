/**
 * Credentials Manager
 * КРИТИЧЕСКИ ВАЖНО: Восстановлена система лицензий из старой версии
 * Без этого GM функции не должны работать!
 */

/**
 * Получение email лицензии
 */
function getLicenseEmail() {
  return PropertiesService.getScriptProperties().getProperty('LICENSE_EMAIL') || '';
}

/**
 * Получение токена лицензии
 */
function getLicenseToken() {
  return PropertiesService.getScriptProperties().getProperty('LICENSE_TOKEN') || '';
}

/**
 * Полная проверка лицензии (credentials)
 * ВОЗВРАЩЕНО ИЗ СТАРОЙ ВЕРСИИ!
 * УНИФИЦИРОВАННАЯ ВЕРСИЯ: Единственная реализация в проекте
 * 
 * ВАЖНО: Импорт постов НЕ требует GEMINI_API_KEY (только email и token)
 * GEMINI_API_KEY требуется только для AI-функций (GM, GM_STATIC и т.д.)
 */
function getClientCredentials() {
  var email = getLicenseEmail();
  var token = getLicenseToken();
  var apiKey = '';
  
  try {
    apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '';
  } catch (e) {
    // Ignore
  }
  
  // Проверяем ТОЛЬКО email и token (лицензионные credentials)
  // GEMINI_API_KEY опционален - требуется только для AI-функций
  if (!email || !token) {
    return {
      ok: false,
      valid: false,  // Alias для совместимости с ThinClient
      error: 'License credentials not set (email or token missing)',
      email: email,
      token: token ? '***' + token.slice(-4) : '',
      apiKey: apiKey ? '***' + apiKey.slice(-4) : '',
      geminiApiKey: apiKey ? '***' + apiKey.slice(-4) : ''  // Alias для ThinClient
    };
  }
  
  // Успешная проверка - возвращаем оба варианта полей для совместимости
  return {
    ok: true,
    valid: true,  // Alias для совместимости с ThinClient и тестами
    email: email,
    token: token,
    apiKey: apiKey,
    geminiApiKey: apiKey  // Alias для ThinClient
  };
}

/**
 * UI для настройки лицензии
 */
function setLicenseCredentialsUI() {
  var ui = SpreadsheetApp.getUi();
  var curEmail = getLicenseEmail();
  var curToken = getLicenseToken();
  
  var emailRes = ui.prompt('🔐 Лицензия — Email', 
                          'Введите Email (для проверки лицензии). Текущий: ' + (curEmail || '—'), 
                          ui.ButtonSet.OK_CANCEL);
  
  if (emailRes.getSelectedButton() !== ui.Button.OK) return;
  
  var email = (emailRes.getResponseText() || '').trim();
  
  var tokenRes = ui.prompt('🔐 Лицензия — Токен', 
                          'Введите Токен (из таблицы лицензий). Текущий: ' + (curToken ? (curToken.substring(0,4)+'****') : '—'), 
                          ui.ButtonSet.OK_CANCEL);
  
  if (tokenRes.getSelectedButton() !== ui.Button.OK) return;
  
  var token = (tokenRes.getResponseText() || '').trim();
  
  if (!email || !token) {
    ui.alert('Email и Токен обязательны.');
    return;
  }
  
  PropertiesService.getScriptProperties().setProperty('LICENSE_EMAIL', email);
  PropertiesService.getScriptProperties().setProperty('LICENSE_TOKEN', token);
  
  ui.alert('✅ Лицензия сохранена.');
  addSystemLog('License credentials updated: email=' + email, 'INFO', 'LICENSE');
}

/**
 * Проверка статуса лицензии на сервере
 */
function serverStatus_() {
  var email = getLicenseEmail();
  var token = getLicenseToken();
  
  var payload = { 
    action: 'status', 
    email: email, 
    token: token 
  };
  
  var options = { 
    method: 'post', 
    contentType: 'application/json', 
    payload: JSON.stringify(payload), 
    muteHttpExceptions: true 
  };
  
  try {
    var resp = UrlFetchApp.fetch(SERVER_API_URL, options);
    var code = resp.getResponseCode();
    var data = JSON.parse(resp.getContentText());
    
    if (code !== 200) {
      return { 
        ok: false, 
        error: (data && data.error) || ('HTTP_' + code) 
      };
    }
    
    return data;
    
  } catch (e) {
    return { 
      ok: false, 
      error: 'Server connection failed: ' + e.message 
    };
  }
}

/**
 * UI для проверки статуса лицензии
 */
function checkLicenseStatusUI() {
  try {
    var st = serverStatus_();
    if (st.ok) {
      SpreadsheetApp.getUi().alert('Лицензия', 
                                   '✅ Активна' + (st.until ? (' до ' + st.until) : ''), 
                                   SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      SpreadsheetApp.getUi().alert('Лицензия', 
                                   '❌ ' + (st.error || 'Неизвестная ошибка'), 
                                   SpreadsheetApp.getUi().ButtonSet.OK);
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert('Лицензия', 
                                 'Ошибка: ' + e.message, 
                                 SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * КРИТИЧНАЯ ФУНКЦИЯ: Проверка лицензии перед GM запросами
 * ВОССТАНОВЛЕНА ИЗ СТАРОЙ ВЕРСИИ!
 */
function validateLicenseForGM() {
  try {
    var email = getLicenseEmail();
    var token = getLicenseToken();
    
    if (!email || !token) {
      addSystemLog('🚫 GM отказ: лицензия не задана (email/token пустые)', 'WARN', 'LICENSE');
      return {
        ok: false,
        error: 'LICENSE_REQUIRED: Настройте лицензию через меню 🤖 Table AI → ⚙️ Настройки → 🔐 Лицензия'
      };
    }
    
    // Проверяем статус на сервере
    var st = serverStatus_();
    if (!st || !st.ok) {
      addSystemLog('🚫 GM отказ: лицензия неактивна или сервер недоступен', 'WARN', 'LICENSE');
      return {
        ok: false,
        error: 'LICENSE_OR_SERVER: ' + (st ? st.error : 'Server unreachable')
      };
    }
    
    return { ok: true };
    
  } catch (e) {
    addSystemLog('🚫 GM отказ: ошибка проверки лицензии: ' + e.message, 'WARN', 'LICENSE');
    return {
      ok: false,
      error: 'LICENSE_CHECK_FAILED: ' + e.message
    };
  }
}

/**
 * Серверный прокси для GM запросов
 * ВОССТАНОВЛЕН ИЗ СТАРОЙ ВЕРСИИ!
 */
function serverGM_(prompt, maxTokens, temperature) {
  var email = getLicenseEmail();
  var token = getLicenseToken();
  var apiKey = '';
  
  try {
    apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '';
  } catch (e) {
    throw new Error('Gemini API key not set');
  }
  
  if (!apiKey) {
    throw new Error('NO_CLIENT_KEY');
  }
  
  var payload = { 
    action: 'gm', 
    email: email, 
    token: token, 
    apiKey: apiKey, 
    prompt: prompt, 
    maxTokens: maxTokens, 
    temperature: temperature 
  };
  
  var options = { 
    method: 'post', 
    contentType: 'application/json', 
    payload: JSON.stringify(payload), 
    muteHttpExceptions: true 
  };
  
  try {
    var resp = UrlFetchApp.fetch(SERVER_API_URL, options);
    var code = resp.getResponseCode();
    var data = JSON.parse(resp.getContentText());
    
    if (code !== 200) {
      return { 
        ok: false, 
        error: (data && data.error) || ('HTTP_' + code) 
      };
    }
    
    return data;
    
  } catch (e) {
    return { 
      ok: false, 
      error: 'Server request failed: ' + e.message 
    };
  }
}