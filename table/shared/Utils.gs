// New/shared/Utils.gs
// Утилиты общего назначения из old/Main.gs

/**
 * Markdown → читабельный текст
 * Перенесено из old/Main.gs - критически важная функция для OCR
 */
function convertMarkdownToReadableText(markdownText) {
  if (!markdownText || typeof markdownText !== 'string') return markdownText;
  
  var text = markdownText;
  
  try {
    // Блоки кода
    text = text.replace(/```[\w]*\n?([\s\S]*?)\n?```/g, function(match, code) {
      return '\n' + String(code || '').trim() + '\n';
    });
    
    // Инлайн код
    text = text.replace(/`([^`]+)`/g, '$1');
    
    // Жирный текст
    text = text.replace(/\*\*([^*]+)\*\*/g, function(match, content) {
      return String(content || '').toUpperCase();
    });
    
    // Курсив
    text = text.replace(/\*([^*]+)\*/g, '$1');
    
    // Заголовки
    text = text.replace(/^#{1,6}\s+(.+)$/gm, function(match, header) {
      return '\n' + String(header || '').toUpperCase() + ':\n';
    });
    
    // Списки
    text = text.replace(/^[\*\-\+]\s+(.+)$/gm, '• $1');
    text = text.replace(/^\d+\.\s+(.+)$/gm, '$1');
    
    // Ссылки
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    
    // Цитаты
    text = text.replace(/^>\s+(.+)$/gm, '» $1');
    
    // Горизонтальные линии
    text = text.replace(/^-{3,}$/gm, '---');
    
    // Множественные переносы строк
    text = text.replace(/\n{3,}/g, '\n\n');
    
    // Trim
    text = text.trim();
    
  } catch (e) {
    console.error('Markdown conversion error:', e.message);
    return markdownText; // Возвращаем оригинал в случае ошибки
  }
  
  return text;
}

/**
 * Расширенное логирование с кэшированием
 * Перенесено и адаптировано из old/Main.gs
 */
function addSystemLog(message, level, category) {
  level = level || 'INFO';
  category = category || 'SYSTEM';
  
  try {
    var cache = CacheService.getScriptCache();
    var cacheKey = SYSTEM_LOGS_NAME;
    var maxLogs = 300;
    var ttl = 86400; // 24 часа
    
    var logs = cache.get(cacheKey);
    logs = logs ? JSON.parse(logs) : [];
    
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    
    logs.push({
      timestamp: timestamp,
      level: level,
      category: category,
      message: message
    });
    
    // Ограничиваем количество логов
    if (logs.length > maxLogs) {
      logs = logs.slice(-maxLogs);
    }
    
    cache.put(cacheKey, JSON.stringify(logs), ttl);
    
    // Дублируем в консоль
    console.log('[' + timestamp + '] ' + level + ' [' + category + '] ' + message);
    
  } catch (e) {
    console.error('System log error:', e.message);
  }
}

/**
 * Получение системных логов
 */
function getSystemLogs(limit, level, category) {
  limit = limit || 100;
  
  try {
    var cache = CacheService.getScriptCache();
    var logs = cache.get(SYSTEM_LOGS_NAME);
    
    if (!logs) return 'Логи отсутствуют';
    
    var logEntries = JSON.parse(logs);
    
    // Фильтрация по уровню
    if (level) {
      logEntries = logEntries.filter(function(entry) {
        return entry.level === level;
      });
    }
    
    // Фильтрация по категории
    if (category) {
      logEntries = logEntries.filter(function(entry) {
        return entry.category === category;
      });
    }
    
    // Берем последние записи
    var recent = logEntries.slice(-limit);
    
    return recent.map(function(entry) {
      return '[' + entry.timestamp + '] ' + entry.level + ' [' + entry.category + '] ' + entry.message;
    }).join('\n');
    
  } catch (e) {
    return 'Ошибка чтения логов: ' + e.message;
  }
}

/**
 * Экспорт логов в лист
 */
function exportSystemLogsToSheet() {
  try {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName('Системные_Логи') || ss.insertSheet('Системные_Логи');
    
    var cache = CacheService.getScriptCache();
    var logs = cache.get(SYSTEM_LOGS_NAME);
    
    if (!logs) {
      SpreadsheetApp.getUi().alert('Системные логи отсутствуют');
      return;
    }
    
    var logEntries = JSON.parse(logs);
    var data = [['Время', 'Уровень', 'Категория', 'Сообщение']];
    
    logEntries.forEach(function(entry) {
      data.push([
        entry.timestamp,
        entry.level,
        entry.category,
        entry.message
      ]);
    });
    
    // Очищаем и записываем
    sheet.clear();
    sheet.getRange(1, 1, data.length, 4).setValues(data);
    
    // Форматирование заголовков
    sheet.getRange(1, 1, 1, 4)
         .setFontWeight('bold')
         .setBackground('#E8F0FE');
    
    // Автоширина колонок
    sheet.autoResizeColumns(1, 4);
    
    addSystemLog('Системные логи экспортированы в лист "Системные_Логи"', 'INFO', 'UTILS');
    SpreadsheetApp.getUi().alert('Системные логи экспортированы успешно!');
    
  } catch (e) {
    var error = 'Ошибка экспорта логов: ' + e.message;
    addSystemLog(error, 'ERROR', 'UTILS');
    SpreadsheetApp.getUi().alert(error);
  }
}

/**
 * Очистка системных логов
 */
function clearSystemLogs() {
  try {
    CacheService.getScriptCache().remove(SYSTEM_LOGS_NAME);
    addSystemLog('Системные логи очищены', 'INFO', 'UTILS');
    SpreadsheetApp.getUi().alert('Системные логи очищены');
  } catch (e) {
    SpreadsheetApp.getUi().alert('Ошибка очистки логов: ' + e.message);
  }
}

/**
 * Утилита для безопасного парсинга JSON
 */
function safeJsonParse(jsonString, defaultValue) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn('JSON parse error:', e.message);
    return defaultValue || {};
  }
}

/**
 * Утилита для безопасной сериализации JSON
 */
function safeJsonStringify(obj, defaultValue) {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    console.warn('JSON stringify error:', e.message);
    return defaultValue || '{}';
  }
}

/**
 * Проверка валидности email
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Генерация случайного ID
 */
function generateTraceId(prefix) {
  prefix = prefix || 'trace';
  var timestamp = Date.now().toString(36);
  var random = Math.random().toString(36).substr(2, 5);
  return prefix + '-' + timestamp + '-' + random;
}

/**
 * Fetch Gemini with retry logic (КРИТИЧНО!)
 * Последовательные запросы к Gemini API с retry
 * ИЗ СТАРОЙ РАБОЧЕЙ ВЕРСИИ!
 */
function fetchGeminiWithRetry(url, options, maxAttempts) {
  maxAttempts = maxAttempts || 3;
  var attempt = 0;
  var lastError = null;
  
  while (attempt < maxAttempts) {
    attempt++;
    
    try {
      addSystemLog('→ fetchGeminiWithRetry: попытка ' + attempt + '/' + maxAttempts, 'DEBUG', 'FETCH');
      
      var response = UrlFetchApp.fetch(url, Object.assign({}, options, {
        muteHttpExceptions: true
      }));
      
      var code = response.getResponseCode();
      
      // Success
      if (code === 200) {
        addSystemLog('✅ fetchGeminiWithRetry: успех на попытке ' + attempt, 'INFO', 'FETCH');
        return response;
      }
      
      // Rate limit - wait and retry
      if (code === 429) {
        var waitTime = Math.min(2000 * attempt, 10000); // 2s, 4s, 6s... max 10s
        addSystemLog('⏳ Rate limit (429), ждем ' + waitTime + 'ms', 'WARN', 'FETCH');
        Utilities.sleep(waitTime);
        continue;
      }
      
      // Server error - retry
      if (code >= 500) {
        var waitTime = 1000 * attempt;
        addSystemLog('⚠️ Ошибка сервера (' + code + '), retry через ' + waitTime + 'ms', 'WARN', 'FETCH');
        Utilities.sleep(waitTime);
        continue;
      }
      
      // Client error - don't retry
      addSystemLog('❌ Ошибка клиента (' + code + '), не retry', 'ERROR', 'FETCH');
      return response;
      
    } catch (e) {
      lastError = e;
      addSystemLog('❌ Exception на попытке ' + attempt + ': ' + e.message, 'ERROR', 'FETCH');
      
      if (attempt < maxAttempts) {
        Utilities.sleep(1000 * attempt);
      }
    }
  }
  
  // Все попытки исчерпаны
  throw new Error('fetchGeminiWithRetry failed after ' + maxAttempts + ' attempts: ' + (lastError ? lastError.message : 'unknown'));
}

/**
 * Задержка выполнения
 */
function sleep(milliseconds) {
  Utilities.sleep(milliseconds);
}

/**
 * Безопасное получение вложенного свойства объекта
 */
function getNestedProperty(obj, path, defaultValue) {
  if (!obj || !path) return defaultValue;
  
  var keys = path.split('.');
  var current = obj;
  
  for (var i = 0; i < keys.length; i++) {
    if (current === null || current === undefined || !current.hasOwnProperty(keys[i])) {
      return defaultValue;
    }
    current = current[keys[i]];
  }
  
  return current;
}

/**
 * Форматирование размера файла
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  
  var k = 1024;
  var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Детекция Markdown текста
 */
function isMarkdownText(text) {
  if (!text || typeof text !== 'string') return false;
  
  var patterns = [
    /\*\*[^*]+\*\*/, /\*[^*]+\*/, /^#{1,6}\s+/m,
    /^[-*+]\s+/m, /\[.+\]\(.+\)/, /```[\s\S]*?```/, /`[^`]+`/
  ];
  
  return patterns.some(function(p) { return p.test(text); });
}

/**
 * Обработка ответа от Gemini с автопреобразованием Markdown
 */
function processGeminiResponse(response) {
  if (!response) return response;
  
  if (isMarkdownText(response)) {
    logMessage('📝 Обнаружен Markdown → преобразуем', 'INFO');
    return convertMarkdownToReadableText(response);
  }
  
  return response;
}

/**
 * Обрезание строки с добавлением "..."
 */
function truncateString(str, maxLength) {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Экранирование HTML символов
 */
function escapeHtml(text) {
  if (!text || typeof text !== 'string') return '';
  
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return text.replace(/[&<>"']/g, function(m) {
    return map[m];
  });
}

/**
 * Алиас для совместимости с old/
 */
function logMessage(message, level, category) {
  return addSystemLog(message, level, category);
}

/**
 * Алиас для серверного логирования
 */
function logServer(message, traceId) {
  var msg = traceId ? '[' + traceId + '] ' + message : message;
  return addSystemLog(msg, 'INFO', 'SERVER');
}

/**
 * Алиас для клиентского логирования  
 */
function logClient(message) {
  return addSystemLog(message, 'INFO', 'CLIENT');
}

/**
 * Извлечение источников изображений из ячейки
 * Compatibility wrapper для old code
 */
function extractImageSources(cellData, cellFormula, richTextUrl) {
  var cellMeta = {
    formula: cellFormula || '',
    richTextUrl: richTextUrl || ''
  };
  
  return extractSources(cellData, cellMeta);
}

/**
 * Debounce функция для ограничения частоты вызовов
 */
function createDebounce(func, wait) {
  var timeoutId;
  
  return function() {
    var context = this;
    var args = arguments;
    
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(function() {
      func.apply(context, args);
    }, wait);
  };
}
