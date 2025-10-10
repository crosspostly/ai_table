// New/server/ServerEndpoints.gs
// Серверные API эндпоинты с полной интеграцией лицензионной системы

/**
 * GET обработчик для health check
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      service: 'Table AI v2.0',
      timestamp: new Date().toISOString(),
      version: API_VERSION
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST обработчик для всех API действий с лицензионным контролем
 */
function doPost(e) {
  var traceId = generateTraceId('api');
  
  try {
    var requestData = parseRequestBody(e);
    var action = requestData.action;
    var email = requestData.email;
    var token = requestData.token;
    
    logServer('API Request: ' + action + ', email: ' + maskEmail(email || 'none'), traceId);
    
    // Лицензионный контроль для всех действий кроме health
    if (action !== 'health') {
      var licenseCheck = checkUserLicense(email, token);
      logLicenseActivity(action, email, token, licenseCheck, traceId);
      
      if (!licenseCheck.ok) {
        return createErrorResponse('LICENSE_ERROR: ' + licenseCheck.error, 403, traceId);
      }
      
      logServer('License validated: ' + maskEmail(email) + ', row: ' + licenseCheck.row, traceId);
    }
    
    switch (action) {
      case 'ocr_process':
        return handleOcrProcess(requestData, traceId);
        
      case 'vk_import':
        return handleVkImport(requestData, traceId);
        
      case 'social_import':
        return handleSocialImport(requestData, traceId);
        
      case 'gm':
        return handleGeminiRequest(requestData, traceId);
        
      case 'gm_image':
        return handleGeminiImageRequest(requestData, traceId);
        
      case 'status':
        return handleStatusRequest(requestData, traceId);
        
      case 'health':
        return handleHealthCheck(traceId);
        
      default:
        return createErrorResponse('Unknown action: ' + action, 400, traceId);
    }
    
  } catch (error) {
    logServer('API Error: ' + error.message, traceId);
    return createErrorResponse(error.message, 500, traceId);
  }
}

/**
 * Обработчик OCR запросов
 */
function handleOcrProcess(data, traceId) {
  try {
    // Валидация входных данных
    if (!data.geminiApiKey) {
      return createErrorResponse('GEMINI_API_KEY_REQUIRED', 400, traceId);
    }
    
    if (!data.cellData && !data.cellMeta) {
      return createErrorResponse('CELL_DATA_OR_META_REQUIRED', 400, traceId);
    }
    
    // Подготовка запроса для OCR
    var ocrRequest = {
      cellData: data.cellData || '',
      cellMeta: data.cellMeta || {},
      geminiApiKey: data.geminiApiKey,
      options: data.options || {},
      traceId: traceId
    };
    
    // Вызов OCR сервиса
    var result = processOcrRequest(ocrRequest);
    
    // Логирование результата
    logServer('OCR completed: success=' + result.ok + ', items=' + (result.data ? result.data.length : 0), traceId);
    
    return createSuccessResponse(result, traceId);
    
  } catch (error) {
    logServer('OCR error: ' + error.message, traceId);
    return createErrorResponse('OCR_ERROR: ' + error.message, 500, traceId);
  }
}

/**
 * Обработчик VK импорта
 */
function handleVkImport(data, traceId) {
  try {
    if (!data.owner) {
      return createErrorResponse('VK_OWNER_REQUIRED', 400, traceId);
    }
    
    var count = Math.min(parseInt(data.count) || VK_LIMITS.DEFAULT_POSTS_COUNT, VK_LIMITS.MAX_POSTS_PER_REQUEST);
    
    // Вызов VK коллектора
    var vkCollector = createDataCollector(IMAGE_SOURCES.VK);
    var result = vkCollector.collectPosts(data.owner, count, traceId);
    
    logServer('VK import completed: success=' + result.ok + ', posts=' + (result.data ? result.data.length : 0), traceId);
    
    return createSuccessResponse(result, traceId);
    
  } catch (error) {
    logServer('VK import error: ' + error.message, traceId);
    return createErrorResponse('VK_IMPORT_ERROR: ' + error.message, 500, traceId);
  }
}

/**
 * Обработчик универсального социального импорта
 */
function handleSocialImport(data, traceId) {
  try {
    // Валидация входных данных  
    if (!data.source) {
      return createErrorResponse('SOURCE_REQUIRED', 400, traceId);
    }
    
    var count = Math.min(parseInt(data.count) || 50, 100);
    var platform = data.platform || '';
    
    logServer('Social import request: source=' + data.source + ', count=' + count + ', platform=' + platform, traceId);
    
    // Валидация и очистка входных данных
    var validatedInput = validateAndSanitizeInputs(data.source, count, platform);
    
    if (!validatedInput.isValid) {
      return createErrorResponse('VALIDATION_ERROR: ' + validatedInput.error, 400, traceId);
    }
    
    // Определение типа источника и платформы
    var sourceInfo = parseSource(validatedInput.sourceUrl, normalizePlatformName(validatedInput.platform));
    
    logServer('Parsed source: platform=' + sourceInfo.platform + ', value=' + sourceInfo.value, traceId);
    
    // Вызов соответствующего импорта через унифицированный интерфейс
    var posts = [];
    
    switch (sourceInfo.platform) {
      case 'vk':
        posts = importVkPostsAdvanced(sourceInfo.value, validatedInput.count);
        break;
      case 'instagram':  
        posts = importInstagramPosts(sourceInfo.value, validatedInput.count);
        break;
      case 'telegram':
        posts = importTelegramPosts(sourceInfo.value, validatedInput.count);
        break;
      default:
        throw new Error('Неподдерживаемая платформа: ' + sourceInfo.platform);
    }
    
    logServer('Social import completed: platform=' + sourceInfo.platform + ', posts=' + (posts ? posts.length : 0), traceId);
    
    if (posts && posts.length > 0) {
      return createSuccessResponse({
        data: posts,
        platform: sourceInfo.platform,
        source: sourceInfo.value,
        count: posts.length
      }, traceId);
    } else {
      return createErrorResponse('NO_POSTS_FOUND: Не удалось получить посты из ' + sourceInfo.platform, 404, traceId);
    }
    
  } catch (error) {
    logServer('Social import error: ' + error.message, traceId);
    
    // Создаем user-friendly ошибку
    var friendlyError = createUserFriendlyError(error, {
      operation: 'social_import',
      platform: data.platform || 'unknown',
      source: data.source
    });
    
    return createErrorResponse('SOCIAL_IMPORT_ERROR: ' + friendlyError.message, 500, traceId);
  }
}

/**
 * Обработчик Gemini запросов
 */
function handleGeminiRequest(data, traceId) {
  try {
    if (!data.geminiApiKey) {
      return createErrorResponse('GEMINI_API_KEY_REQUIRED', 400, traceId);
    }
    
    if (!data.prompt) {
      return createErrorResponse('PROMPT_REQUIRED', 400, traceId);
    }
    
    var maxTokens = Math.min(parseInt(data.maxTokens) || GEMINI_DEFAULTS.MAX_TOKENS, GEMINI_DEFAULTS.MAX_TOKENS);
    var temperature = Math.max(0, Math.min(parseFloat(data.temperature) || GEMINI_DEFAULTS.TEMPERATURE, 2));
    
    // Прямой вызов Gemini
    var geminiResult = callGeminiApi(data.prompt, maxTokens, temperature, data.geminiApiKey, traceId);
    
    logServer('Gemini completed: success=' + geminiResult.ok + ', length=' + (geminiResult.data ? geminiResult.data.length : 0), traceId);
    
    return createSuccessResponse(geminiResult, traceId);
    
  } catch (error) {
    logServer('Gemini error: ' + error.message, traceId);
    return createErrorResponse('GEMINI_ERROR: ' + error.message, 500, traceId);
  }
}

/**
 * Health check эндпоинт
 */
function handleHealthCheck(traceId) {
  try {
    var health = {
      ok: true,
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      services: {
        ocr: checkOcrServiceHealth(),
        vk: checkVkServiceHealth(),
        licensing: checkLicensingHealth(),
        gemini: checkGeminiHealth()
      },
      stats: getLicenseStats()
    };
    
    logServer('Health check completed', traceId);
    return createSuccessResponse(health, traceId);
    
  } catch (error) {
    logServer('Health check error: ' + error.message, traceId);
    return createErrorResponse('HEALTH_CHECK_ERROR: ' + error.message, 500, traceId);
  }
}

/**
 * Парсинг тела запроса
 */
function parseRequestBody(e) {
  try {
    var postData = e && e.postData && e.postData.contents;
    if (!postData) {
      throw new Error('Empty request body');
    }
    
    return JSON.parse(postData);
    
  } catch (error) {
    throw new Error('Invalid JSON in request body: ' + error.message);
  }
}

/**
 * Создание успешного ответа
 */
function createSuccessResponse(data, traceId) {
  var response = {
    ok: true,
    data: data.data || data,
    traceId: traceId,
    timestamp: new Date().toISOString()
  };
  
  // Добавляем дополнительную информацию если есть
  if (data.stats) response.stats = data.stats;
  if (data.traceId && data.traceId !== traceId) response.serverTraceId = data.traceId;
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Создание ответа с ошибкой
 */
function createErrorResponse(errorMessage, statusCode, traceId) {
  var response = {
    ok: false,
    error: errorMessage,
    traceId: traceId,
    timestamp: new Date().toISOString()
  };
  
  var output = ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
  
  // В Apps Script нет встроенного способа установки HTTP статус кодов
  // Добавляем код в ответ для клиентской обработки
  response.statusCode = statusCode || 500;
  output.setContent(JSON.stringify(response));
  
  return output;
}

/**
 * Health check для сервисов
 */
function checkOcrServiceHealth() {
  try {
    // Тест создания детектора источников
    var testSources = extractImageSources('test', '', '');
    return {
      status: 'healthy',
      lastCheck: new Date().toISOString()
    };
  } catch (e) {
    return {
      status: 'unhealthy',
      error: e.message
    };
  }
}

function checkVkServiceHealth() {
  try {
    // Проверяем наличие VK_PARSER_URL в константах или properties
    var vkUrl = getVkParserUrl();
    return {
      status: vkUrl ? 'healthy' : 'misconfigured',
      parserConfigured: !!vkUrl
    };
  } catch (e) {
    return {
      status: 'unhealthy',
      error: e.message
    };
  }
}

function checkLicensingHealth() {
  try {
    // Тест подключения к лицензионной таблице
    var testResult = checkUserLicense('health@check.test', 'test-token');
    return {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      sheetAccessible: true
    };
  } catch (e) {
    return {
      status: 'unhealthy',
      error: e.message,
      sheetAccessible: false
    };
  }
}

function checkGeminiHealth() {
  return {
    status: 'healthy',
    note: 'Gemini API uses client keys - no server-side check needed'
  };
}

/**
 * Получение VK Parser URL (для обратной совместимости)
 */
function getVkParserUrl() {
  // Можно добавить логику получения из Properties Service
  // или использовать константу из old/Main.gs
  try {
    var props = PropertiesService.getScriptProperties();
    // VK_PARSER_URL больше не используется - VK API встроен
    
    if (url) return url;
    
    // Fallback на константу из old версии
    return 'https://script.google.com/macros/s/AKfycbzttbqz16EmmcXbEYCuYhNlXkCxAnCG77phspFL1_rTCi4xVqoorByJAPa4dI4iwT8/exec';
    
  } catch (e) {
    return null;
  }
}

/**
 * Маскировка email для логов
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return 'unknown';
  var parts = email.split('@');
  if (parts.length !== 2) return email.substring(0, 3) + '***';
  return parts[0].substring(0, 2) + '***@' + parts[1];
}

/**
 * Вызов Gemini API (упрощенная версия для GM функций)
 */
function callGeminiApi(prompt, maxTokens, temperature, apiKey, traceId) {
  try {
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
    
    var payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature
      }
    };
    
    var response = UrlFetchApp.fetch(url, {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    if (responseCode >= 300) {
      throw new Error('Gemini API HTTP ' + responseCode + ': ' + responseText);
    }
    
    var responseData = JSON.parse(responseText);
    var text = getNestedProperty(responseData, 'candidates.0.content.parts.0.text', '');
    
    if (!text) {
      throw new Error('No text in Gemini response');
    }
    
    return {
      ok: true,
      data: String(text).trim(),
      traceId: traceId
    };
    
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      traceId: traceId
    };
  }
}