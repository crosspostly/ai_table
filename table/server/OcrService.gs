// New/server/OcrService.gs
// KISS: простая архитектура без излишних абстракций
// DRY: единая логика обработки для всех типов источников

/**
 * Главная функция OCR обработки
 * @param {Object} request - {email, token, geminiApiKey, cellData, options}
 * @returns {Object} {ok, data: [], traceId, stats}
 */
function processOcrRequest(request) {
  var traceId = generateTraceId();
  var startTime = Date.now();
  
  try {
    // 1. Валидация входных данных
    validateOcrRequest(request);
    
    // 2. Проверка лицензии
    var licenseResult = checkLicense(request.email, request.token);
    if (!licenseResult.ok) {
      return {
        ok: false,
        error: 'LICENSE_' + (licenseResult.error || 'INVALID'),
        traceId: traceId
      };
    }
    
    // 3. Извлечение источников из ячейки
    var sources = extractSources(request.cellData, request.cellMeta || {});
    if (!sources.length) {
      return {
        ok: false,
        error: 'NO_SOURCES_FOUND',
        traceId: traceId
      };
    }
    
    logTrace(traceId, 'Sources extracted: ' + sources.length);
    
    // 4. Сбор данных из источников
    var collectionResult = collectDataFromSources(sources, request.options || {});
    
    logTrace(traceId, 'Data collected: images=' + collectionResult.images.length + 
             ', texts=' + collectionResult.texts.length);
    
    // 5. OCR обработка изображений
    var ocrResult = processImages(collectionResult.images, request.geminiApiKey, request.options || {});
    
    // 6. Объединение результатов
    var finalTexts = collectionResult.texts.concat(ocrResult.texts);
    
    // 7. Постобработка (Markdown removal, cleanup)
    finalTexts = finalTexts.map(function(text) {
      return processMarkdownResponse(text);
    });
    
    var processingTime = Date.now() - startTime;
    logTrace(traceId, 'Processing completed in ' + processingTime + 'ms');
    
    return {
      ok: true,
      data: finalTexts,
      traceId: traceId,
      stats: {
        sourceCount: sources.length,
        imageCount: collectionResult.images.length,
        textCount: collectionResult.texts.length,
        processingTimeMs: processingTime
      }
    };
    
  } catch (error) {
    logTrace(traceId, 'ERROR: ' + error.message);
    return {
      ok: false,
      error: error.message,
      traceId: traceId
    };
  }
}

/**
 * Валидация запроса
 */
function validateOcrRequest(request) {
  if (!request.email || !request.token) {
    throw new Error('EMAIL_OR_TOKEN_MISSING');
  }
  
  if (!request.geminiApiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  
  if (!request.cellData || typeof request.cellData !== 'string') {
    throw new Error('CELL_DATA_INVALID');
  }
}

/**
 * Сбор данных из всех источников
 */
function collectDataFromSources(sources, options) {
  var limit = Math.min(options.limit || 50, 100); // Защита от злоупотреблений
  var images = [];
  var texts = [];
  var remainingCapacity = limit;
  
  for (var i = 0; i < sources.length && remainingCapacity > 0; i++) {
    var source = sources[i];
    
    try {
      var collector = createCollector(source.type);
      var result = collector.collect(source, remainingCapacity);
      
      // Сначала добавляем тексты (они приоритетнее)
      if (result.texts && result.texts.length) {
        var textsToAdd = Math.min(result.texts.length, remainingCapacity);
        texts = texts.concat(result.texts.slice(0, textsToAdd));
        remainingCapacity -= textsToAdd;
      }
      
      // Затем изображения, если есть место
      if (result.images && result.images.length && remainingCapacity > 0) {
        var imagesToAdd = Math.min(result.images.length, remainingCapacity);
        images = images.concat(result.images.slice(0, imagesToAdd));
        remainingCapacity -= imagesToAdd;
      }
      
    } catch (e) {
      // Логируем ошибку но продолжаем с другими источниками
      console.log('Collection error for source ' + source.type + ': ' + e.message);
    }
  }
  
  return {images: images, texts: texts};
}

/**
 * OCR обработка изображений с батчированием
 */
function processImages(images, geminiApiKey, options) {
  if (!images.length) {
    return {texts: [], errors: []};
  }
  
  var chunkSize = 8; // Размер чанка для Gemini
  var language = options.language || 'ru';
  var texts = [];
  var errors = [];
  
  // Обрабатываем изображения чанками
  for (var i = 0; i < images.length; i += chunkSize) {
    var chunk = images.slice(i, Math.min(i + chunkSize, images.length));
    
    try {
      var chunkResult = processImageChunk(chunk, geminiApiKey, language);
      texts = texts.concat(chunkResult);
      
    } catch (e) {
      errors.push('Chunk ' + Math.floor(i/chunkSize) + ': ' + e.message);
      
      // Fallback: обрабатываем по одному изображению
      for (var j = 0; j < chunk.length; j++) {
        try {
          var singleResult = processSingleImage(chunk[j], geminiApiKey, language);
          if (singleResult && singleResult.trim()) {
            texts.push(singleResult.trim());
          }
        } catch (e2) {
          errors.push('Single image ' + (i + j) + ': ' + e2.message);
        }
      }
    }
  }
  
  return {texts: texts, errors: errors};
}

/**
 * Обработка чанка изображений через Gemini
 */
function processImageChunk(images, geminiApiKey, language) {
  var instruction = 'Транскрибируй текст на изображениях БЕЗ добавления от себя. ' +
                   'Верни только чистый текст. Если изображений несколько — ' +
                   'разделяй отзывы строкой из четырёх подчёркиваний: ____ ' +
                   (language ? ('Язык: ' + language + '.') : '');
  
  var parts = [{text: instruction}];
  
  // Добавляем изображения в запрос
  for (var i = 0; i < images.length; i++) {
    parts.push({
      inlineData: {
        mimeType: images[i].mimeType,
        data: images[i].data
      }
    });
  }
  
  var requestBody = {
    contents: [{parts: parts}],
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0
    }
  };
  
  var response = UrlFetchApp.fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + geminiApiKey,
    {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true
    }
  );
  
  var responseCode = response.getResponseCode();
  var responseData = JSON.parse(response.getContentText());
  
  if (responseCode !== 200) {
    var errorMsg = (responseData.error && responseData.error.message) || ('HTTP_' + responseCode);
    throw new Error('Gemini API error: ' + errorMsg);
  }
  
  var candidate = responseData.candidates && responseData.candidates[0];
  var content = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
  var text = content && content.text ? content.text : '';
  
  // Разделяем результат по разделителю
  return splitByDelimiter(text);
}

/**
 * Обработка одного изображения (fallback)
 */
function processSingleImage(image, geminiApiKey, language) {
  var instruction = 'Транскрибируй текст на изображении БЕЗ добавления от себя. ' +
                   'Верни только чистый текст.' +
                   (language ? (' Язык: ' + language + '.') : '');
  
  var requestBody = {
    contents: [{
      parts: [
        {text: instruction},
        {
          inlineData: {
            mimeType: image.mimeType,
            data: image.data
          }
        }
      ]
    }],
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0
    }
  };
  
  var response = UrlFetchApp.fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + geminiApiKey,
    {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true
    }
  );
  
  var responseCode = response.getResponseCode();
  var responseData = JSON.parse(response.getContentText());
  
  if (responseCode !== 200) {
    var errorMsg = (responseData.error && responseData.error.message) || ('HTTP_' + responseCode);
    throw new Error('Gemini API error: ' + errorMsg);
  }
  
  var candidate = responseData.candidates && responseData.candidates[0];
  var content = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
  
  return content && content.text ? content.text : '';
}

/**
 * Разделение текста по разделителю ____
 */
function splitByDelimiter(text) {
  var cleaned = String(text || '').trim();
  if (!cleaned) return [];
  
  // Основной способ: разделители ____
  var parts = cleaned.split(/\\n?_{4,}\\n?/g)
    .map(function(p) { return String(p || '').trim(); })
    .filter(function(p) { return p.length > 0; });
  
  if (parts.length > 1) return parts;
  
  // Запасной способ: параграфы
  var paragraphs = cleaned.split(/\
{2,}/g)
    .map(function(p) { return String(p || '').trim(); })
    .filter(function(p) { return p.length > 0; });
  
  return paragraphs.length > 1 ? paragraphs : [cleaned];
}

/**
 * Постобработка Markdown (из старого кода)
 */
function processMarkdownResponse(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Простая проверка на Markdown
  var hasMarkdown = /\\*\\*[^*]+\\*\\*|\\*[^*]+\\*|^#{1,6}\\s+/m.test(text) ||
                   /```[\\s\\S]*?```/.test(text) || /`[^`]+`/.test(text);
  
  if (!hasMarkdown) return text;
  
  // Конвертация Markdown в plain text
  var cleaned = text
    .replace(/```[\\w]*\
?([\\s\\S]*?)\
?```/g, function(_, code) {
      return '\
' + String(code || '').trim() + '\
';
    })
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\\*\\*([^*]+)\\*\\*/g, function(_, content) {
      return String(content || '').toUpperCase();
    })
    .replace(/\\*([^*]+)\\*/g, '$1')
    .replace(/^#{1,6}\\s+(.+)$/gm, function(_, header) {
      return '\
' + String(header || '').toUpperCase() + ':\
';
    })
    .replace(/\\[([^\\]]+)\\]\\([^\\)]+\\)/g, '$1')
    .replace(/\
{3,}/g, '\
\
')
    .trim();
  
  return cleaned;
}

/**
 * Генерация traceId для отладки
 */
function generateTraceId() {
  var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';
  for (var i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'ocr_' + result;
}

/**
 * Логирование с traceId
 */
function logTrace(traceId, message) {
  console.log('[' + traceId + '] ' + message);
  
  // Дополнительно сохраняем в кэш для серверных логов
  try {
    var cache = CacheService.getScriptCache();
    var logKey = 'trace_' + traceId;
    var existingLogs = cache.get(logKey);
    var logs = existingLogs ? JSON.parse(existingLogs) : [];
    
    logs.push({
      timestamp: new Date().toISOString(),
      message: message
    });
    
    cache.put(logKey, JSON.stringify(logs), 3600); // TTL 1 час
  } catch (e) {
    // Игнорируем ошибки кэширования
  }
}

/**
 * Проверка лицензии (заглушка - нужно импортировать из основного сервера)
 */
function checkLicense(email, token) {
  // TODO: Импортировать логику из server-app/Server.gs
  return {ok: true}; // Временная заглушка
}