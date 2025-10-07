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
  };\n  \n  const config = platformConfigs[platform.toLowerCase()] || platformConfigs.vk;\n  const mergedOptions = {\n    ...options,\n    headers: config.headers\n  };\n  \n  return fetchWithRetry(url, mergedOptions, config);\n}\n\n/**\n * Retry для Gemini API запросов с учетом лимитов\n * ВАЖНО: Gemini запросы должны идти СТРОГО последовательно!\n * @param {string} url - Gemini API URL\n * @param {Object} options - опции запроса\n * @return {HTTPResponse} - ответ\n */\nfunction fetchGeminiWithRetry(url, options = {}) {\n  // Обеспечиваем последовательность запросов к Gemini\n  const lockKey = 'gemini_request_lock';\n  const cache = PropertiesService.getScriptProperties();\n  \n  // Ждем освобождения блокировки (максимум 30 секунд)\n  let waitTime = 0;\n  const maxWaitTime = 30000;\n  \n  while (cache.getProperty(lockKey) && waitTime < maxWaitTime) {\n    Utilities.sleep(500);\n    waitTime += 500;\n  }\n  \n  try {\n    // Устанавливаем блокировку\n    cache.setProperty(lockKey, String(Date.now()));\n    \n    const config = {\n      maxRetries: 2, // Gemini обычно стабилен\n      baseDelay: 2000,\n      maxDelay: 10000,\n      retryOnStatus: [429, 500, 502, 503],\n      logEnabled: true\n    };\n    \n    const mergedOptions = {\n      ...options,\n      headers: {\n        'Content-Type': 'application/json',\n        ...options.headers\n      }\n    };\n    \n    addSystemLog('🤖 Gemini запрос (последовательный)', 'INFO', 'RETRY_SERVICE');\n    \n    const response = fetchWithRetry(url, mergedOptions, config);\n    \n    // Дополнительная пауза после Gemini запроса\n    Utilities.sleep(1000);\n    \n    return response;\n    \n  } finally {\n    // Всегда освобождаем блокировку\n    cache.deleteProperty(lockKey);\n  }\n}\n\n/**\n * Batch запросы с контролем нагрузки\n * @param {Array} requests - массив объектов {url, options, platform}\n * @param {Object} batchConfig - конфигурация batch\n * @return {Array} - массив результатов\n */\nfunction fetchBatchWithRetry(requests, batchConfig = {}) {\n  const config = {\n    maxConcurrent: batchConfig.maxConcurrent || 3, // Максимум 3 одновременных запроса\n    delayBetweenBatches: batchConfig.delayBetweenBatches || 2000,\n    failFast: batchConfig.failFast || false,\n    ...batchConfig\n  };\n  \n  const results = [];\n  const errors = [];\n  \n  // Разбиваем на батчи\n  for (let i = 0; i < requests.length; i += config.maxConcurrent) {\n    const batch = requests.slice(i, i + config.maxConcurrent);\n    \n    addSystemLog(`📦 Batch ${Math.floor(i / config.maxConcurrent) + 1}: ${batch.length} запросов`, 'INFO', 'RETRY_SERVICE');\n    \n    // Выполняем батч\n    for (const request of batch) {\n      try {\n        let response;\n        \n        if (request.platform === 'gemini') {\n          response = fetchGeminiWithRetry(request.url, request.options || {});\n        } else if (request.platform) {\n          response = fetchSocialApiWithRetry(request.platform, request.url, request.options || {});\n        } else {\n          response = fetchWithRetry(request.url, request.options || {});\n        }\n        \n        results.push({\n          success: true,\n          response: response,\n          request: request\n        });\n        \n      } catch (error) {\n        errors.push({\n          error: error.message,\n          request: request\n        });\n        \n        results.push({\n          success: false,\n          error: error.message,\n          request: request\n        });\n        \n        // Fail fast если включено\n        if (config.failFast) {\n          throw new Error(`Batch failed fast: ${error.message}`);\n        }\n      }\n      \n      // Небольшая пауза между запросами в батче\n      if (batch.indexOf(request) < batch.length - 1) {\n        Utilities.sleep(1000);\n      }\n    }\n    \n    // Пауза между батчами\n    if (i + config.maxConcurrent < requests.length) {\n      addSystemLog(`⏳ Пауза ${config.delayBetweenBatches}мс перед следующим батчем`, 'DEBUG', 'RETRY_SERVICE');\n      Utilities.sleep(config.delayBetweenBatches);\n    }\n  }\n  \n  addSystemLog(`📊 Batch завершен: ${results.filter(r => r.success).length} успешных, ${errors.length} ошибок`, 'INFO', 'RETRY_SERVICE');\n  \n  return {\n    results: results,\n    errors: errors,\n    successCount: results.filter(r => r.success).length,\n    errorCount: errors.length\n  };\n}\n\n/**\n * Проверка доступности API endpoint\n * @param {string} url - URL для проверки\n * @param {Object} options - опции запроса\n * @return {Object} - результат проверки\n */\nfunction checkApiHealth(url, options = {}) {\n  const startTime = Date.now();\n  \n  try {\n    const response = UrlFetchApp.fetch(url, {\n      method: 'HEAD', // Только заголовки\n      muteHttpExceptions: true,\n      ...options\n    });\n    \n    const responseTime = Date.now() - startTime;\n    const statusCode = response.getResponseCode();\n    \n    return {\n      available: statusCode >= 200 && statusCode < 400,\n      statusCode: statusCode,\n      responseTime: responseTime,\n      healthy: statusCode === 200 && responseTime < 5000,\n      url: url\n    };\n    \n  } catch (error) {\n    return {\n      available: false,\n      error: error.message,\n      responseTime: Date.now() - startTime,\n      healthy: false,\n      url: url\n    };\n  }\n}\n\n/**\n * Мониторинг здоровья всех API\n * @return {Object} - статус всех сервисов\n */\nfunction checkAllApisHealth() {\n  const apis = [\n    { name: 'Instagram', url: 'https://www.instagram.com/', platform: 'instagram' },\n    { name: 'VK', url: 'https://vk.com/', platform: 'vk' },\n    { name: 'Telegram', url: 'https://t.me/', platform: 'telegram' },\n    { name: 'VK Parser', url: VK_PARSER_URL, platform: 'vk' },\n    { name: 'Gemini API', url: GEMINI_API_URL, platform: 'gemini' }\n  ];\n  \n  const results = {};\n  \n  for (const api of apis) {\n    try {\n      results[api.name] = checkApiHealth(api.url);\n      Utilities.sleep(500); // Пауза между проверками\n    } catch (error) {\n      results[api.name] = {\n        available: false,\n        error: error.message,\n        healthy: false,\n        url: api.url\n      };\n    }\n  }\n  \n  const healthyCount = Object.values(results).filter(r => r.healthy).length;\n  \n  addSystemLog(`🏥 API Health Check: ${healthyCount}/${apis.length} сервисов работают нормально`, 'INFO', 'RETRY_SERVICE');\n  \n  return {\n    overall: healthyCount === apis.length,\n    healthyCount: healthyCount,\n    totalCount: apis.length,\n    details: results,\n    timestamp: new Date()\n  };\n}"