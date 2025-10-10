/**
 * Network Retry System
 * ВОССТАНОВЛЕНО ИЗ СТАРОЙ ВЕРСИИ: система retry для надёжности
 */

/**
 * Fetch с повторными попытками
 * КРИТИЧНО для надёжности работы с внешними API
 */
function fetchGeminiWithRetry(url, options, maxRetries) {
  maxRetries = maxRetries || 3;
  var lastError = null;
  
  for (var attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      addSystemLog('→ Fetch attempt ' + attempt + '/' + maxRetries + ' to ' + url.substring(0, 50) + '...', 'DEBUG', 'NETWORK');
      
      // Прогрессивная задержка между попытками
      if (attempt > 1) {
        var delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 секунд
        addSystemLog('Задержка перед попыткой: ' + delay + 'ms', 'DEBUG', 'NETWORK');
        Utilities.sleep(delay);
      }
      
      // Устанавливаем таймаут для запроса
      var optionsWithTimeout = Object.assign({}, options);
      optionsWithTimeout.muteHttpExceptions = true;
      
      var response = UrlFetchApp.fetch(url, optionsWithTimeout);
      var responseCode = response.getResponseCode();
      
      addSystemLog('← Fetch response: HTTP ' + responseCode, 'DEBUG', 'NETWORK');
      
      // Проверяем успешность ответа
      if (responseCode >= 200 && responseCode < 300) {
        addSystemLog('✅ Fetch успешен на попытке ' + attempt, 'INFO', 'NETWORK');
        return response;
      }
      
      // Rate limiting - специальная обработка
      if (responseCode === 429) {
        var retryAfter = response.getHeaders()['Retry-After'] || '5';
        var waitTime = parseInt(retryAfter, 10) * 1000;
        addSystemLog('⏰ Rate limited, ждём ' + waitTime + 'ms', 'WARN', 'NETWORK');
        Utilities.sleep(waitTime);
        continue; // Не считаем как failed attempt
      }
      
      // Server errors (5xx) - можно повторить
      if (responseCode >= 500) {
        lastError = new Error('Server error: HTTP ' + responseCode);
        addSystemLog('🔄 Server error ' + responseCode + ', повторяем...', 'WARN', 'NETWORK');
        continue;
      }
      
      // Client errors (4xx) - обычно бесполезно повторять, но попробуем один раз
      if (responseCode >= 400) {
        var errorBody = '';
        try {
          errorBody = response.getContentText();
        } catch (e) {
          errorBody = 'Cannot read response body';
        }
        lastError = new Error('Client error: HTTP ' + responseCode + ' - ' + errorBody);
        if (attempt < maxRetries) {
          addSystemLog('🔄 Client error ' + responseCode + ', попытка повтора...', 'WARN', 'NETWORK');
          continue;
        }
        break;
      }
      
    } catch (e) {
      lastError = e;
      addSystemLog('❌ Fetch exception на попытке ' + attempt + ': ' + e.message, 'ERROR', 'NETWORK');
      
      // Проверяем тип ошибки
      var errorMsg = e.message.toLowerCase();
      
      // Timeout errors - можно повторить
      if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
        addSystemLog('⏰ Timeout detected, повторяем...', 'WARN', 'NETWORK');
        continue;
      }
      
      // DNS/Connection errors - можно повторить
      if (errorMsg.includes('dns') || errorMsg.includes('connection') || errorMsg.includes('network')) {
        addSystemLog('🌐 Network error detected, повторяем...', 'WARN', 'NETWORK');
        continue;
      }
      
      // Другие ошибки - скорее всего бесполезно повторять
      addSystemLog('💥 Critical error, stopping retries: ' + e.message, 'ERROR', 'NETWORK');
      break;
    }
  }
  
  // Все попытки провалились
  addSystemLog('🚫 All ' + maxRetries + ' attempts failed. Last error: ' + (lastError ? lastError.message : 'Unknown'), 'ERROR', 'NETWORK');
  throw new Error('Network request failed after ' + maxRetries + ' attempts: ' + (lastError ? lastError.message : 'Unknown error'));
}

/**
 * Умная задержка между запросами для rate limiting
 */
function smartDelay(requestType) {
  var delays = {
    'gemini': 1000,     // 1 секунда между Gemini запросами
    'server': 500,      // 0.5 секунды между серверными запросами
    'vk': 2000,         // 2 секунды между VK запросами
    'ocr': 1500         // 1.5 секунды между OCR запросами
  };
  
  var delay = delays[requestType] || 1000;
  
  addSystemLog('⏱️ Smart delay: ' + delay + 'ms for ' + requestType, 'DEBUG', 'NETWORK');
  Utilities.sleep(delay);
}

/**
 * Проверка доступности внешнего сервиса
 */
function checkServiceAvailability(serviceUrl, serviceName) {
  try {
    addSystemLog('🔍 Checking availability: ' + serviceName, 'INFO', 'NETWORK');
    
    var response = UrlFetchApp.fetch(serviceUrl, {
      method: 'HEAD',
      muteHttpExceptions: true,
      timeout: 10000 // 10 секунд максимум
    });
    
    var isAvailable = response.getResponseCode() < 400;
    
    addSystemLog('📡 ' + serviceName + ' availability: ' + (isAvailable ? 'OK' : 'FAIL') + ' (HTTP ' + response.getResponseCode() + ')', 
                 isAvailable ? 'INFO' : 'WARN', 'NETWORK');
    
    return {
      available: isAvailable,
      responseCode: response.getResponseCode(),
      serviceName: serviceName
    };
    
  } catch (e) {
    addSystemLog('❌ ' + serviceName + ' availability check failed: ' + e.message, 'ERROR', 'NETWORK');
    return {
      available: false,
      error: e.message,
      serviceName: serviceName
    };
  }
}

/**
 * Проверка всех критических сервисов
 */
function checkAllServicesAvailability() {
  var services = [
    { url: SERVER_API_URL, name: 'License Server' },
    { url: GEMINI_API_URL, name: 'Gemini API' },
    { url: VK_PARSER_URL, name: 'VK Parser' }
  ];
  
  var results = [];
  
  for (var i = 0; i < services.length; i++) {
    var service = services[i];
    var result = checkServiceAvailability(service.url, service.name);
    results.push(result);
  }
  
  var summary = results.map(function(r) {
    return r.serviceName + ': ' + (r.available ? '✅' : '❌');
  }).join(', ');
  
  addSystemLog('📊 Services status: ' + summary, 'INFO', 'NETWORK');
  
  return {
    all: results,
    summary: summary,
    allAvailable: results.every(function(r) { return r.available; })
  };
}

/**
 * Тест соединения для диагностики
 */
function testSocialImportConnection() {
  try {
    addSystemLog('🧪 Testing social import connection...', 'INFO', 'NETWORK');
    
    // Тестируем простой запрос к VK Parser
    var testUrl = SERVER_URL + '?test=1';
    var response = fetchGeminiWithRetry(testUrl, {
      method: 'GET',
      muteHttpExceptions: true
    }, 2); // Максимум 2 попытки для теста
    
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText().substring(0, 200); // Первые 200 символов
    
    addSystemLog('🔗 Connection test result: HTTP ' + responseCode + ', response: ' + responseText, 'INFO', 'NETWORK');
    
    return {
      success: responseCode < 400,
      responseCode: responseCode,
      responseText: responseText
    };
    
  } catch (e) {
    addSystemLog('❌ Connection test failed: ' + e.message, 'ERROR', 'NETWORK');
    return {
      success: false,
      error: e.message
    };
  }
}