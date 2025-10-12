/**
 * Context Manager v2.0
 * Управление контекстом переписки с Gemini для сохранения истории общения
 * 
 * Функционал:
 * - Сохранение истории запросов и ответов
 * - Автоматическая очистка старых записей
 * - Контроль объема контекста для оптимального понимания
 * - Настройки включения/выключения контекста
 */

/**
 * Настройки контекста
 */
var CONTEXT_SETTINGS = {
  MAX_HISTORY_ITEMS: 100,         // Максимум элементов в истории (увеличено в 10 раз)
  MAX_CONTEXT_LENGTH: 150000,     // Максимум символов в контексте (увеличено в 10 раз)
  CONTEXT_TTL_HOURS: 24,          // Время жизни контекста в часах
  AUTO_CLEANUP_ENABLED: true,     // Автоматическая очистка
  CONTEXT_ENABLED_CELL: 'Параметры!C1' // Ячейка с настройкой включения контекста
};

/**
 * Проверяет, включен ли контекст
 * @return {boolean}
 */
function isContextEnabled() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName('Параметры');
    
    if (!sheet) {
      addSystemLog('⚠️ Лист \"Параметры\" не найден, контекст выключен', 'WARN', 'CONTEXT');
      return false;
    }
    
    var cellValue = sheet.getRange('D1').getValue();  // ИСПРАВЛЕНО: было C1
    
    // Проверяем различные варианты \"включено\"
    if (typeof cellValue === 'boolean') {
      return cellValue;
    }
    
    if (typeof cellValue === 'string') {
      var lowerValue = cellValue.toLowerCase().trim();
      return lowerValue === 'true' || lowerValue === 'да' || lowerValue === 'включен' || lowerValue === '1' || lowerValue === '✓';
    }
    
    return false;
    
  } catch (error) {
    addSystemLog('Ошибка проверки настройки контекста: ' + error.message, 'ERROR', 'CONTEXT');
    return false;
  }
}

/**
 * Получает ключ для кэша контекста
 * @param {string} sessionId - идентификатор сессии (по умолчанию 'default')
 * @return {string}
 */
function getContextCacheKey(sessionId) {
  sessionId = sessionId || 'default';
  return 'context_history_' + sessionId;
}

/**
 * Получает историю контекста
 * @param {string} sessionId - идентификатор сессии
 * @return {Array<Object>} массив объектов {role: 'user'|'assistant', content: string, timestamp: number}
 */
function getContextHistory(sessionId) {
  try {
    if (!isContextEnabled()) {
      return [];
    }
    
    var cache = CacheService.getScriptCache();
    var cacheKey = getContextCacheKey(sessionId);
    var historyJson = cache.get(cacheKey);
    
    if (!historyJson) {
      return [];
    }
    
    var history = JSON.parse(historyJson);
    
    // Фильтруем по времени жизни
    var cutoffTime = Date.now() - (CONTEXT_SETTINGS.CONTEXT_TTL_HOURS * 60 * 60 * 1000);
    history = history.filter(function(item) {
      return item.timestamp > cutoffTime;
    });
    
    // Ограничиваем количество элементов
    if (history.length > CONTEXT_SETTINGS.MAX_HISTORY_ITEMS) {
      history = history.slice(-CONTEXT_SETTINGS.MAX_HISTORY_ITEMS);
    }
    
    addSystemLog('📖 Загружена история контекста: ' + history.length + ' элементов', 'INFO', 'CONTEXT');
    return history;
    
  } catch (error) {
    addSystemLog('Ошибка получения истории контекста: ' + error.message, 'ERROR', 'CONTEXT');
    return [];
  }
}

/**
 * Добавляет элемент в историю контекста
 * @param {string} role - роль ('user' или 'assistant')
 * @param {string} content - содержимое сообщения
 * @param {string} sessionId - идентификатор сессии
 */
function addToContextHistory(role, content, sessionId) {
  try {
    if (!isContextEnabled()) {
      return;
    }
    
    if (!role || !content) {
      return;
    }
    
    var history = getContextHistory(sessionId);
    
    // Добавляем новый элемент
    var newItem = {
      role: role,
      content: String(content),
      timestamp: Date.now()
    };
    
    history.push(newItem);
    
    // Ограничиваем размер
    history = limitContextSize(history);
    
    // Сохраняем в кэш
    var cache = CacheService.getScriptCache();
    var cacheKey = getContextCacheKey(sessionId);
    var ttl = CONTEXT_SETTINGS.CONTEXT_TTL_HOURS * 60 * 60; // В секундах
    
    cache.put(cacheKey, JSON.stringify(history), ttl);
    
    addSystemLog('💬 Добавлено в контекст: ' + role + ' (' + content.length + ' симв.)', 'INFO', 'CONTEXT');
    
  } catch (error) {
    addSystemLog('Ошибка добавления в контекст: ' + error.message, 'ERROR', 'CONTEXT');
  }
}

/**
 * Ограничивает размер контекста
 * @param {Array<Object>} history - история сообщений
 * @return {Array<Object>} - ограниченная история
 */
function limitContextSize(history) {
  if (!history || !Array.isArray(history)) {
    return [];
  }
  
  // Сначала ограничиваем по количеству
  if (history.length > CONTEXT_SETTINGS.MAX_HISTORY_ITEMS) {
    history = history.slice(-CONTEXT_SETTINGS.MAX_HISTORY_ITEMS);
  }
  
  // Потом по общему размеру
  var totalLength = 0;
  var limitedHistory = [];
  
  // Идем с конца, чтобы сохранить самые новые сообщения
  for (var i = history.length - 1; i >= 0; i--) {
    var item = history[i];
    var itemLength = item.content ? item.content.length : 0;
    
    if (totalLength + itemLength <= CONTEXT_SETTINGS.MAX_CONTEXT_LENGTH) {
      limitedHistory.unshift(item);
      totalLength += itemLength;
    } else {
      break;
    }
  }
  
  return limitedHistory;
}

/**
 * Формирует контекст для отправки в Gemini
 * @param {string} currentPrompt - текущий промпт
 * @param {string} sessionId - идентификатор сессии
 * @return {string} - промпт с контекстом
 */
function buildContextualPrompt(currentPrompt, sessionId) {
  try {
    if (!isContextEnabled()) {
      return currentPrompt;
    }
    
    var history = getContextHistory(sessionId);
    
    if (history.length === 0) {
      return currentPrompt;
    }
    
    // Формируем контекстный промпт
    var contextLines = ['=== КОНТЕКСТ ПРЕДЫДУЩЕГО ОБЩЕНИЯ ==='];
    
    for (var i = 0; i < history.length; i++) {
      var item = history[i];
      var roleLabel = item.role === 'user' ? 'ПОЛЬЗОВАТЕЛЬ' : 'АССИСТЕНТ';
      contextLines.push(roleLabel + ': ' + item.content);
    }
    
    contextLines.push('=== ТЕКУЩИЙ ЗАПРОС ===');
    contextLines.push(currentPrompt);
    
    var fullPrompt = contextLines.join('\
\
');
    
    addSystemLog('🧠 Создан контекстный промпт: ' + history.length + ' элементов истории, ' + fullPrompt.length + ' символов', 'INFO', 'CONTEXT');
    
    return fullPrompt;
    
  } catch (error) {
    addSystemLog('Ошибка создания контекстного промпта: ' + error.message, 'ERROR', 'CONTEXT');
    return currentPrompt;
  }
}

/**
 * Очищает историю контекста
 * @param {string} sessionId - идентификатор сессии (если не указан, очищаются все)
 */
function clearContextHistory(sessionId) {
  try {
    var cache = CacheService.getScriptCache();
    
    if (sessionId) {
      // Очищаем конкретную сессию
      var cacheKey = getContextCacheKey(sessionId);
      cache.remove(cacheKey);
      addSystemLog('🧹 Очищен контекст сессии: ' + sessionId, 'INFO', 'CONTEXT');
    } else {
      // Очищаем все контексты (это сложнее, но можно использовать общую очистку)
      // В Google Apps Script нет прямого способа получить все ключи,
      // поэтому очищаем только известные
      var commonSessionIds = ['default', 'chat', 'chain'];
      var cleared = 0;
      
      for (var i = 0; i < commonSessionIds.length; i++) {
        var key = getContextCacheKey(commonSessionIds[i]);
        if (cache.get(key)) {
          cache.remove(key);
          cleared++;
        }
      }
      
      addSystemLog('🧹 Очищено контекстов: ' + cleared, 'INFO', 'CONTEXT');
    }
    
  } catch (error) {
    addSystemLog('Ошибка очистки контекста: ' + error.message, 'ERROR', 'CONTEXT');
  }
}

/**
 * Автоматическая очистка старых контекстов
 */
function autoCleanupContexts() {
  try {
    if (!CONTEXT_SETTINGS.AUTO_CLEANUP_ENABLED) {
      return;
    }
    
    addSystemLog('🔄 Запуск автоочистки контекстов', 'INFO', 'CONTEXT');
    
    // Принудительно обновляем все известные контексты
    // (фильтрация по времени происходит автоматически при получении)
    var commonSessionIds = ['default', 'chat', 'chain'];
    
    for (var i = 0; i < commonSessionIds.length; i++) {
      var sessionId = commonSessionIds[i];
      var history = getContextHistory(sessionId);
      
      if (history.length > 0) {
        // Пересохраняем очищенную историю
        var cache = CacheService.getScriptCache();
        var cacheKey = getContextCacheKey(sessionId);
        var ttl = CONTEXT_SETTINGS.CONTEXT_TTL_HOURS * 60 * 60;
        
        cache.put(cacheKey, JSON.stringify(history), ttl);
      }
    }
    
    addSystemLog('✅ Автоочистка контекстов завершена', 'INFO', 'CONTEXT');
    
  } catch (error) {
    addSystemLog('Ошибка автоочистки контекстов: ' + error.message, 'ERROR', 'CONTEXT');
  }
}

/**
 * Получает статистику по контекстам
 * @return {Object} - объект со статистикой
 */
function getContextStatistics() {
  try {
    var stats = {
      enabled: isContextEnabled(),
      sessions: {},
      totalItems: 0,
      totalSize: 0
    };
    
    if (!stats.enabled) {
      return stats;
    }
    
    var commonSessionIds = ['default', 'chat', 'chain'];
    
    for (var i = 0; i < commonSessionIds.length; i++) {
      var sessionId = commonSessionIds[i];
      var history = getContextHistory(sessionId);
      
      if (history.length > 0) {
        var sessionSize = 0;
        for (var j = 0; j < history.length; j++) {
          sessionSize += history[j].content ? history[j].content.length : 0;
        }
        
        stats.sessions[sessionId] = {
          items: history.length,
          size: sessionSize
        };
        
        stats.totalItems += history.length;
        stats.totalSize += sessionSize;
      }
    }
    
    return stats;
    
  } catch (error) {
    addSystemLog('Ошибка получения статистики контекста: ' + error.message, 'ERROR', 'CONTEXT');
    return {
      enabled: false,
      sessions: {},
      totalItems: 0,
      totalSize: 0,
      error: error.message
    };
  }
}

/**
 * Экспортирует контекст в читаемом формате
 * @param {string} sessionId - идентификатор сессии
 * @return {string} - форматированная история
 */
function exportContextHistory(sessionId) {
  try {
    var history = getContextHistory(sessionId || 'default');
    
    if (history.length === 0) {
      return 'История контекста пуста.';
    }
    
    var lines = ['=== ИСТОРИЯ КОНТЕКСТА ===', ''];
    
    for (var i = 0; i < history.length; i++) {
      var item = history[i];
      var date = new Date(item.timestamp);
      var timeStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm:ss');
      var roleLabel = item.role === 'user' ? 'ПОЛЬЗОВАТЕЛЬ' : 'АССИСТЕНТ';
      
      lines.push('[' + timeStr + '] ' + roleLabel + ':');
      lines.push(item.content);
      lines.push('');
    }
    
    return lines.join('\
');
    
  } catch (error) {
    addSystemLog('Ошибка экспорта контекста: ' + error.message, 'ERROR', 'CONTEXT');
    return 'Ошибка экспорта: ' + error.message;
  }
}