/**
 * Retry Logic Service v1.0
 * Надежные HTTP запросы с экспоненциальным backoff и обработкой ошибок
 */

/**
 * HTTP запрос с retry логикой и экспоненциальным backoff
 * @param {string} url - URL для запроса
 * @param {Object} options - опции UrlFetchApp
 * @param {Object} retryConfig - конфигурация retry
 * @return {HTTPResponse} - ответ сервера
 */
function fetchWithRetry(url, options = {}, retryConfig = {}) {
  // Конфигурация по умолчанию
  const config = {
    maxRetries: retryConfig.maxRetries || 3,
    baseDelay: retryConfig.baseDelay || 1000, // 1 секунда
    maxDelay: retryConfig.maxDelay || 30000,  // 30 секунд
    retryOnStatus: retryConfig.retryOnStatus || [429, 500, 502, 503, 504],
    timeoutMs: retryConfig.timeoutMs || 30000,
    logEnabled: retryConfig.logEnabled !== false,
    ...retryConfig
  };
  
  // Устанавливаем обязательные опции
  const requestOptions = {
    muteHttpExceptions: true,
    ...options
  };
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    const isLastAttempt = attempt > config.maxRetries;
    
    try {
      if (config.logEnabled) {
        addSystemLog(`🔄 HTTP запрос (попытка ${attempt}): ${url}`, 'DEBUG', 'RETRY_SERVICE');
      }
      
      // Выполняем запрос
      const response = UrlFetchApp.fetch(url, requestOptions);
      const statusCode = response.getResponseCode();
      
      if (config.logEnabled) {
        addSystemLog(`← HTTP ответ: ${statusCode}`, 'DEBUG', 'RETRY_SERVICE');
      }
      
      // Успешный ответ
      if (statusCode >= 200 && statusCode < 300) {
        if (attempt > 1 && config.logEnabled) {
          addSystemLog(`✅ Успех после ${attempt} попыток`, 'INFO', 'RETRY_SERVICE');
        }
        return response;
      }
      
      // Проверяем стоит ли повторять запрос
      const shouldRetry = !isLastAttempt && config.retryOnStatus.includes(statusCode);
      
      if (!shouldRetry) {
        // Не повторяем - возвращаем последний ответ
        if (config.logEnabled) {
          addSystemLog(`❌ HTTP ${statusCode}: не подлежит повтору`, 'WARN', 'RETRY_SERVICE');
        }
        return response;
      }
      
      // Рассчитываем задержку
      const delay = calculateBackoffDelay(attempt, config.baseDelay, config.maxDelay);
      
      if (config.logEnabled) {
        addSystemLog(`⏳ HTTP ${statusCode}: повтор через ${delay}мс (попытка ${attempt}/${config.maxRetries + 1})`, 'WARN', 'RETRY_SERVICE');
      }
      
      // Ждем перед следующей попыткой
      Utilities.sleep(delay);
      
    } catch (error) {
      lastError = error;
      
      if (config.logEnabled) {
        addSystemLog(`💥 Ошибка запроса: ${error.message}`, 'ERROR', 'RETRY_SERVICE');
      }
      
      // Последняя попытка - выбрасываем ошибку
      if (isLastAttempt) {
        throw new Error(`Запрос неудачен после ${config.maxRetries + 1} попыток: ${error.message}`);
      }
      
      // Рассчитываем задержку для ошибки
      const delay = calculateBackoffDelay(attempt, config.baseDelay, config.maxDelay);
      
      if (config.logEnabled) {
        addSystemLog(`🔄 Ошибка: повтор через ${delay}мс`, 'WARN', 'RETRY_SERVICE');
      }
      
      Utilities.sleep(delay);
    }
  }
  
  // Не должно дойти до этой точки
  throw new Error('Неожиданная ошибка retry логики');
}

/**
 * Расчет задержки с экспоненциальным backoff
 * @param {number} attempt - номер попытки
 * @param {number} baseDelay - базовая задержка в мс
 * @param {number} maxDelay - максимальная задержка в мс
 * @return {number} - задержка в мс
 */
function calculateBackoffDelay(attempt, baseDelay, maxDelay) {
  // Экспоненциальный backoff: delay = baseDelay * (2 ^ (attempt - 1))
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  
  // Добавляем jitter (случайность) ±25%
  const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
  const delayWithJitter = exponentialDelay + jitter;
  
  // Ограничиваем максимальной задержкой
  return Math.min(Math.max(delayWithJitter, baseDelay), maxDelay);
}

/**
 * Специальный retry для социальных API с учетом их особенностей
 * @param {string} platform - платформа (instagram, vk, telegram)
 * @param {string} url - URL
 * @param {Object} options - опции запроса
 * @return {HTTPResponse} - ответ
 */
function fetchSocialApiWithRetry(platform, url, options = {}) {
  const platformConfigs = {
    instagram: {
      maxRetries: 2, // Instagram быстро блокирует
      baseDelay: 5000, // Больше времени между попытками
      maxDelay: 30000,
      retryOnStatus: [429, 500, 502, 503], // Не повторяем 403 для Instagram
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        ...options.headers
      }
    },
    
    vk: {
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 15000,
      retryOnStatus: [429, 500, 502, 503, 504],
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VKBot/1.0)',
        ...options.headers
      }
    },
    
    telegram: {
      maxRetries: 3,
      baseDelay: 3000,
      maxDelay: 20000,
      retryOnStatus: [429, 500, 502, 503, 504],
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TelegramBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...options.headers
      }
    }
  };
  
  const config = platformConfigs[platform.toLowerCase()] || platformConfigs.vk;
  const mergedOptions = {
    ...options,
    headers: config.headers
  };
  
  return fetchWithRetry(url, mergedOptions, config);
}

/**
 * Retry для Gemini API запросов с учетом лимитов
 * ВАЖНО: Gemini запросы должны идти СТРОГО последовательно!
 * @param {string} url - Gemini API URL
 * @param {Object} options - опции запроса
 * @return {HTTPResponse} - ответ
 */
function fetchGeminiWithRetry(url, options = {}) {
  // Обеспечиваем последовательность запросов к Gemini
  const lockKey = 'gemini_request_lock';
  const cache = PropertiesService.getScriptProperties();
  
  // Ждем освобождения блокировки (максимум 30 секунд)
  let waitTime = 0;
  const maxWaitTime = 30000;
  
  while (cache.getProperty(lockKey) && waitTime < maxWaitTime) {
    Utilities.sleep(500);
    waitTime += 500;
  }
  
  try {
    // Устанавливаем блокировку
    cache.setProperty(lockKey, String(Date.now()));
    
    const config = {
      maxRetries: 2, // Gemini обычно стабилен
      baseDelay: 2000,
      maxDelay: 10000,
      retryOnStatus: [429, 500, 502, 503],
      logEnabled: true
    };
    
    const mergedOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    addSystemLog('🤖 Gemini запрос (последовательный)', 'INFO', 'RETRY_SERVICE');
    
    const response = fetchWithRetry(url, mergedOptions, config);
    
    // Дополнительная пауза после Gemini запроса
    Utilities.sleep(1000);
    
    return response;
    
  } finally {
    // Всегда освобождаем блокировку
    cache.deleteProperty(lockKey);
  }
}

/**
 * Batch запросы с контролем нагрузки
 * @param {Array} requests - массив объектов {url, options, platform}
 * @param {Object} batchConfig - конфигурация batch
 * @return {Array} - массив результатов
 */
function fetchBatchWithRetry(requests, batchConfig = {}) {
  const config = {
    maxConcurrent: batchConfig.maxConcurrent || 3, // Максимум 3 одновременных запроса
    delayBetweenBatches: batchConfig.delayBetweenBatches || 2000,
    failFast: batchConfig.failFast || false,
    ...batchConfig
  };
  
  const results = [];
  const errors = [];
  
  // Разбиваем на батчи
  for (let i = 0; i < requests.length; i += config.maxConcurrent) {
    const batch = requests.slice(i, i + config.maxConcurrent);
    
    addSystemLog(`📦 Batch ${Math.floor(i / config.maxConcurrent) + 1}: ${batch.length} запросов`, 'INFO', 'RETRY_SERVICE');
    
    // Выполняем батч
    for (const request of batch) {
      try {
        let response;
        
        if (request.platform === 'gemini') {
          response = fetchGeminiWithRetry(request.url, request.options || {});
        } else if (request.platform) {
          response = fetchSocialApiWithRetry(request.platform, request.url, request.options || {});
        } else {
          response = fetchWithRetry(request.url, request.options || {});
        }
        
        results.push({
          success: true,
          response: response,
          request: request
        });
        
      } catch (error) {
        errors.push({
          error: error.message,
          request: request
        });
        
        results.push({
          success: false,
          error: error.message,
          request: request
        });
        
        // Fail fast если включено
        if (config.failFast) {
          throw new Error(`Batch failed fast: ${error.message}`);
        }
      }
      
      // Небольшая пауза между запросами в батче
      if (batch.indexOf(request) < batch.length - 1) {
        Utilities.sleep(1000);
      }
    }
    
    // Пауза между батчами
    if (i + config.maxConcurrent < requests.length) {
      addSystemLog(`⏳ Пауза ${config.delayBetweenBatches}мс перед следующим батчем`, 'DEBUG', 'RETRY_SERVICE');
      Utilities.sleep(config.delayBetweenBatches);
    }
  }
  
  addSystemLog(`📊 Batch завершен: ${results.filter(r => r.success).length} успешных, ${errors.length} ошибок`, 'INFO', 'RETRY_SERVICE');
  
  return {
    results: results,
    errors: errors,
    successCount: results.filter(r => r.success).length,
    errorCount: errors.length
  };
}

/**
 * Проверка доступности API endpoint
 * @param {string} url - URL для проверки
 * @param {Object} options - опции запроса
 * @return {Object} - результат проверки
 */
function checkApiHealth(url, options = {}) {
  const startTime = Date.now();
  
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'HEAD', // Только заголовки
      muteHttpExceptions: true,
      ...options
    });
    
    const responseTime = Date.now() - startTime;
    const statusCode = response.getResponseCode();
    
    return {
      available: statusCode >= 200 && statusCode < 400,
      statusCode: statusCode,
      responseTime: responseTime,
      healthy: statusCode === 200 && responseTime < 5000,
      url: url
    };
    
  } catch (error) {
    return {
      available: false,
      error: error.message,
      responseTime: Date.now() - startTime,
      healthy: false,
      url: url
    };
  }
}

/**
 * Мониторинг здоровья всех API
 * @return {Object} - статус всех сервисов
 */
function checkAllApisHealth() {
  const apis = [
    { name: 'Instagram', url: 'https://www.instagram.com/', platform: 'instagram' },
    { name: 'VK', url: 'https://vk.com/', platform: 'vk' },
    { name: 'Telegram', url: 'https://t.me/', platform: 'telegram' },
    { name: 'VK API', url: 'https://api.vk.com', platform: 'vk' },
    { name: 'Gemini API', url: GEMINI_API_URL, platform: 'gemini' }
  ];
  
  const results = {};
  
  for (const api of apis) {
    try {
      results[api.name] = checkApiHealth(api.url);
      Utilities.sleep(500); // Пауза между проверками
    } catch (error) {
      results[api.name] = {
        available: false,
        error: error.message,
        healthy: false,
        url: api.url
      };
    }
  }
  
  const healthyCount = Object.values(results).filter(r => r.healthy).length;
  
  addSystemLog(`🏥 API Health Check: ${healthyCount}/${apis.length} сервисов работают нормально`, 'INFO', 'RETRY_SERVICE');
  
  return {
    overall: healthyCount === apis.length,
    healthyCount: healthyCount,
    totalCount: apis.length,
    details: results,
    timestamp: new Date()
  };
}