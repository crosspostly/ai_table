/**
 * Gemini Client
 * Клиентские GM функции с кэшированием и автозаменой на статичные значения
 */

/**
 * Кэширование для GM функций
 */
function gmCacheKey_(prompt, maxTokens, temperature) {
  try {
    var s = 'p:' + String(prompt) + '|mx:' + String(maxTokens) + '|t:' + String(temperature);
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s);
    var hex = '';
    for (var i = 0; i < bytes.length; i++) {
      var v = (bytes[i] & 0xFF).toString(16);
      if (v.length === 1) v = '0' + v;
      hex += v;
    }
    return 'gm:' + hex.substring(0, 64);
  } catch (e) {
    return 'gm:fallback:' + (String(prompt).length) + ':' + String(maxTokens) + ':' + String(temperature);
  }
}

/**
 * 🔒 SAFE Cache с защитой от race conditions
 */
function gmCacheGet_(key) {
  try { 
    return CacheService.getScriptCache().get(key); 
  } catch (e) { 
    return null; 
  }
}

function gmCachePut_(key, value, ttlSec) {
  try {
    var ttl = Math.max(5, Math.min(21600, Math.floor(ttlSec || 300)));
    
    // 💾 MEMORY PROTECTION: Пропускаем очень большие значения 
    if (value && value.length > 100000) {
      addSystemLog('⚠️ GM Cache: Skipping large value (' + value.length + ' chars)', 'WARN', 'CACHE');
      return;
    }
    
    CacheService.getScriptCache().put(key, value, ttl);
  } catch (e) {
    addSystemLog('❌ GM Cache put failed: ' + e.message, 'ERROR', 'CACHE');
  }
}

/**
 * 🔒 Simple lock для предотвращения duplicate requests
 */
function gmCacheLock_(key) {
  var lockKey = 'lock:' + key;
  var cache = CacheService.getScriptCache();
  
  try {
    var existing = cache.get(lockKey);
    if (existing) {
      return false; // Уже заблокирован
    }
    
    // Блокируем на 30 секунд
    cache.put(lockKey, 'locked', 30);
    return true;
  } catch (e) {
    return true; // При ошибке разрешаем продолжить
  }
}

function gmCacheUnlock_(key) {
  var lockKey = 'lock:' + key;
  try {
    CacheService.getScriptCache().remove(lockKey);
  } catch (e) {}
}

/**
 * ⏱️ EXECUTION TIME TRACKING для защиты от timeout
 */
var EXECUTION_TIME_LIMIT = 5 * 60 * 1000; // 5 минут (безопасная граница)
var executionStartTime = null;

function checkTimeoutRisk() {
  if (!executionStartTime) return;
  
  var elapsed = Date.now() - executionStartTime;
  if (elapsed > EXECUTION_TIME_LIMIT * 0.8) {
    throw new Error('TIMEOUT_RISK: Operation too long (' + Math.round(elapsed/1000) + 's), aborting safely');
  }
}

/**
 * Основная функция GM для Gemini API
 * ✅ SECURE: Интегрирована система безопасности
 * ⏱️ TIMEOUT PROTECTED: Защита от 6-минутного лимита Apps Script
 */
function GM(prompt, maxTokens, temperature) {
  // ⏱️ TIMEOUT PROTECTION: Начинаем отсчёт времени
  if (!executionStartTime) {
    executionStartTime = Date.now();
  }
  
  try {
    // 🔒 SECURITY: Валидация всех входных параметров
    var promptValidation = SecurityValidator.validatePrompt(prompt);
    if (!promptValidation.isValid) {
      var error = createStandardError(ErrorTypes.VALIDATION_ERROR, 
        'Invalid prompt: ' + promptValidation.errors.join(', '), 
        { originalPrompt: typeof prompt });
      throw error;
    }

    var paramsValidation = SecurityValidator.validateGMParams(maxTokens, temperature);
    if (!paramsValidation.isValid) {
      var error = createStandardError(ErrorTypes.VALIDATION_ERROR,
        'Invalid parameters: ' + paramsValidation.errors.join(', '),
        { maxTokens: maxTokens, temperature: temperature });
      throw error;
    }

    // Используем валидированные значения
    var safePrompt = promptValidation.sanitized;
    var safeMaxTokens = paramsValidation.sanitized.maxTokens;
    var safeTemperature = paramsValidation.sanitized.temperature;

    // 🔒 SECURITY: Безопасное логирование (без утечки данных)
    var logData = 'prompt=' + safePrompt.slice(0,60) + '... (' + safePrompt.length + '), tokens=' + safeMaxTokens + ', temp=' + safeTemperature;
    addSystemLog('→ GM: ' + SecurityValidator.sanitizeForLogging(logData), 'INFO', 'GEMINI');

    // 🔒 CACHE RACE CONDITION PROTECTION
    var cacheKey = gmCacheKey_(safePrompt, safeMaxTokens, safeTemperature);
    var cached = gmCacheGet_(cacheKey);
    if (cached) {
      addSystemLog('✅ GM: из кэша, длина=' + cached.length, 'INFO', 'GEMINI');
      return cached;
    }

    // 🔒 Проверяем lock - если запрос уже выполняется, ждём
    if (!gmCacheLock_(cacheKey)) {
      addSystemLog('⏳ GM: Ожидание завершения параллельного запроса', 'INFO', 'GEMINI');
      
      // Ждём до 25 секунд, проверяем кэш каждые 2 секунды
      for (var i = 0; i < 12; i++) {
        // ⏱️ TIMEOUT CHECK: Проверяем время выполнения
        checkTimeoutRisk();
        
        Utilities.sleep(2000);
        var waitResult = gmCacheGet_(cacheKey);
        if (waitResult) {
          addSystemLog('✅ GM: Получен результат от параллельного запроса', 'INFO', 'GEMINI');
          return waitResult;
        }
      }
      
      // Если так и не дождались - разблокируем и продолжаем
      gmCacheUnlock_(cacheKey);
      addSystemLog('⚠️ GM: Timeout ожидания, продолжаем запрос', 'WARN', 'GEMINI');
    }

    var apiKey = getGeminiApiKey();
    var requestBody = {
      contents: [{ parts: [{ text: safePrompt }] }],
      generationConfig: { 
        maxOutputTokens: safeMaxTokens, 
        temperature: safeTemperature 
      }
    };
    
    // ⏱️ TIMEOUT CHECK: Проверяем время перед API запросом
    checkTimeoutRisk();
    
    // ВАЖНО: Используем fetchGeminiWithRetry для ПОСЛЕДОВАТЕЛЬНЫХ запросов
    var response = fetchGeminiWithRetry(GEMINI_API_URL + '?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(requestBody)
    });
    
    var responseData = JSON.parse(response.getContentText());
    
    addSystemLog('← GM: HTTP ' + response.getResponseCode(), 'DEBUG', 'GEMINI');
    
    if (response.getResponseCode() !== 200) {
      var message = responseData.error && responseData.error.message ? responseData.error.message : 'Unknown error';
      addSystemLog('❌ GM API ошибка: ' + message, 'ERROR', 'GEMINI');
      return 'Error: ' + message;
    }
    
    var candidate = responseData.candidates && responseData.candidates[0];
    var content = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
    var result = content && content.text ? content.text : 'Ошибка обработки данных';
    
    // Автообработка Markdown
    var processedResult = processGeminiResponse(result);
    
    // Кэшируем результат
    gmCachePut_(cacheKey, processedResult, 300); // 5 минут
    
    // 🔒 Снимаем lock
    gmCacheUnlock_(cacheKey);
    
    addSystemLog('✅ GM: результат, длина=' + result.length + (processedResult !== result ? ', преобразован из Markdown' : ''), 'INFO', 'GEMINI');
    return processedResult;
    
  } catch (error) {
    // 🔒 SECURITY: Безопасная обработка ошибок без утечки данных
    var userMessage = handleSecureError(error, { function: 'GM', promptLength: prompt ? prompt.length : 0 });
    return userMessage;
  }
}

/**
 * Получение API ключа Gemini
 */
function getGeminiApiKey() {
  var key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!key) {
    throw new Error('API-ключ Gemini не установлен. Меню: 🤖 Table AI → Установить API ключ Gemini');
  }
  return key;
}

/**
 * UI для установки API ключа Gemini
 */
function initGeminiKey() {
  var ui = SpreadsheetApp.getUi();
  var help = 'Где взять ключ (коротко):\
' +
             '1) Откройте: https://aistudio.google.com/app/apikey\
' +
             '2) Нажмите "Create API key"\
' +
             '3) Скопируйте ключ\
\
' +
             'Вставьте ключ в поле ниже и нажмите OK';
  
  var res = ui.prompt('🔑 Введите ваш Gemini API ключ', help, ui.ButtonSet.OK_CANCEL);
  
  if (res.getSelectedButton() !== ui.Button.OK) return;
  
  var key = (res.getResponseText() || '').trim();
  if (key) {
    PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', key);
    ui.alert('✅ Ключ установлен!');
    addSystemLog('✅ Новый API ключ Gemini установлен', 'INFO', 'GEMINI');
  } else {
    ui.alert('❌ Ключ не введён.');
    addSystemLog('❌ Gemini: ключ не введён', 'WARN', 'GEMINI');
  }
}

/**
 * Показать справку по API ключу Gemini
 */
function showGeminiKeyHelp() {
  var ui = SpreadsheetApp.getUi();
  var msg =
    'Как получить API ключ Gemini:\
\
' +
    '1) Откройте Google AI Studio: https://aistudio.google.com/app/apikey\
' +
    '2) Нажмите "Create API key" (создать ключ)\
' +
    '3) Скопируйте ключ\
' +
    '4) Меню: 🔑 Gemini → "Установить API ключ" → вставьте ключ\
\
' +
    'Документация: https://ai.google.dev/gemini-api/docs/api-key?hl=ru';
  ui.alert('❓ Как получить API ключ Gemini', msg, ui.ButtonSet.OK);
}

/**
 * Главная функция GM_STATIC для вызова из ячеек
 */
function GM_STATIC(prompt, maxTokens, temperature, _tick) {
  // Получаем текущую ячейку
  var activeRange = SpreadsheetApp.getActiveRange();
  if (!activeRange) {
    throw new Error('Функция должна вызываться из ячейки');
  }
  
  var cell = activeRange.getCell(1, 1);
  
  // Проверяем, не заменена ли уже формула на статичное значение
  var currentFormula = cell.getFormula();
  if (!currentFormula || !currentFormula.includes('GM_STATIC')) {
    // Формула уже заменена, возвращаем текущее значение
    return cell.getValue();
  }
  
  try {
    // Вызываем основную функцию GM
    var result = GM(prompt, maxTokens, temperature);
    
    // КЛЮЧЕВАЯ ФИЧА: заменяем формулу на статичное значение
    // Это предотвращает повторные вычисления
    setTimeout(function() {
      try {
        cell.setValue(result);
        logMessage('Static value set for cell ' + cell.getA1Notation(), 'INFO');
      } catch (e) {
        logMessage('Failed to set static value: ' + e.message, 'ERROR');
      }
    }, 100);
    
    return result;
    
  } catch (e) {
    var error = 'GM_STATIC Exception: ' + e.message;
    logMessage(error, 'ERROR');
    return error;
  }
}

/**
 * OCR функция с переносом в old/
 */
function ocrReviews() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('Отзывы');
  
  if (!sheet) {
    ui.alert('Лист "Отзывы" не найден');
    return;
  }
  
  var lastRow = Math.max(2, sheet.getLastRow());
  var processed = 0, errors = 0, skipped = 0;
  
  logMessage('Начат OCR процесс: rows=' + lastRow, 'INFO');
  
  for (var r = 2; r <= lastRow; r++) {
    try {
      var cellRange = sheet.getRange(r, 1);
      var cellData = String(cellRange.getDisplayValue() || '').trim();
      
      if (!cellData) continue; // Пустая ячейка
      
      // Проверяем, заполнен ли уже результат
      var bValue = String(sheet.getRange(r, 2).getDisplayValue() || '').trim();
      if (bValue) {
        skipped++;
        continue;
      }
      
      // Используем основную функцию GM
      var prompt = `Проанализируй этот отзыв и извлеки ключевую информацию:
${cellData}

Выдели:
1. Тип отзыва (положительный/отрицательный/нейтральный)
2. Основные моменты
3. Конкретные проблемы или достоинства
4. Рекомендации

Ответ должен быть структурированным и кратким.`;
      
      var result = GM(prompt, 15000, 0.3);
      
      if (result && !result.startsWith('Error:')) {
        sheet.getRange(r, 2).setValue(result);
        processed++;
        logMessage('OCR успешно: row=' + r, 'INFO');
      } else {
        errors++;
        logMessage('OCR ошибка: row=' + r + ', error=' + result, 'ERROR');
      }
      
    } catch (e) {
      errors++;
      logMessage('Исключение в row ' + r + ': ' + e.message, 'ERROR');
    }
    
    // Небольшая задержка для избежания rate limiting
    if (r % 5 === 0) {
      Utilities.sleep(1000);
    }
  }
  
  var summary = 'OCR завершён:\
' +
                'Обработано: ' + processed + '\
' +
                'Пропущено: ' + skipped + '\
' +
                'Ошибок: ' + errors;
  
  logMessage(summary.replace(/\\n/g, ', '), 'INFO');
  ui.alert(summary);
}