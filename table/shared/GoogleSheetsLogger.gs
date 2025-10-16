/**
 * 📊 GOOGLE SHEETS LOGGING SYSTEM
 * Логирование прямо в лист "Логи" указанной таблицы
 * 
 * СПЕЦИФИКАЦИЯ:
 * - Все операции логируются в реальном времени
 * - Автоматическое исправление ошибок по логам
 * - Структурированные логи для анализа
 * - Monitoring и alerting
 */

/**
 * 🔧 КОНФИГУРАЦИЯ GOOGLE SHEETS LOGGER определена в Constants.gs
 * Проверяем доступность конфигурации
 */
if (typeof SHEETS_LOGGER_CONFIG === 'undefined') {
  throw new Error('SHEETS_LOGGER_CONFIG not defined! Check Constants.gs');
}

/**
 * 📝 Глобальная переменная для batch логов
 */
var SHEETS_LOGGER_BATCH = [];
var SHEETS_LOGGER_LAST_FLUSH = 0;

/**
 * 🚀 ГЛАВНАЯ ФУНКЦИЯ ЛОГИРОВАНИЯ В GOOGLE SHEETS
 */
function logToGoogleSheets(level, category, operation, status, message, details, traceId, executionTime) {
  try {
    // Создаем запись лога
    var logEntry = {
      timestamp: new Date(),
      level: level || 'INFO',
      category: category || 'SYSTEM',
      operation: operation || 'UNKNOWN',
      status: status || 'SUCCESS',
      message: message || '',
      details: details ? JSON.stringify(details) : '',
      traceId: traceId || generateTraceId('log'),
      userId: getUserEmail_() || 'unknown',
      executionTime: executionTime || 0
    };
    
    // Добавляем в batch
    SHEETS_LOGGER_BATCH.push(logEntry);
    
    // Также логируем локально для backup
    addSystemLog(
      '[' + operation + '] ' + message + ' (' + status + ')',
      level,
      category
    );
    
    // Проверяем необходимость flush
    var now = Date.now();
    var needFlush = (
      SHEETS_LOGGER_BATCH.length >= SHEETS_LOGGER_CONFIG.batchSize ||
      (now - SHEETS_LOGGER_LAST_FLUSH) > SHEETS_LOGGER_CONFIG.flushInterval ||
      level === 'ERROR' // Ошибки отправляем немедленно
    );
    
    if (needFlush) {
      flushLogsToSheets();
    }
    
    // Проверяем алерты
    checkLogAlerts(logEntry);
    
  } catch (error) {
    // Fallback на локальное логирование
    addSystemLog('❌ Failed to log to Google Sheets: ' + error.message, 'ERROR', 'LOGGER');
    addSystemLog(message, level, category); // Сохраняем оригинальный лог
  }
}

/**
 * 📤 FLUSH логов в Google Sheets
 */
function flushLogsToSheets() {
  if (SHEETS_LOGGER_BATCH.length === 0) return;
  
  try {
    var ss = SpreadsheetApp.openById(SHEETS_LOGGER_CONFIG.spreadsheetId);
    var sheet = ss.getSheetByName(SHEETS_LOGGER_CONFIG.sheetName);
    
    if (!sheet) {
      // Создаем лист если его нет
      sheet = createLogsSheet(ss);
    }
    
    // Готовим данные для записи
    var values = SHEETS_LOGGER_BATCH.map(function(entry) {
      return [
        Utilities.formatDate(entry.timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
        entry.level,
        entry.category,
        entry.operation,
        entry.status,
        entry.message,
        entry.details,
        entry.traceId,
        entry.userId,
        entry.executionTime
      ];
    });
    
    // Записываем в лист
    var lastRow = Math.max(1, sheet.getLastRow());
    var startRow = lastRow + 1;
    
    if (values.length > 0) {
      sheet.getRange(startRow, 1, values.length, 10).setValues(values);
      
      // Применяем форматирование
      formatLogRows(sheet, startRow, values.length);
    }
    
    // Очищаем batch
    SHEETS_LOGGER_BATCH = [];
    SHEETS_LOGGER_LAST_FLUSH = Date.now();
    
    // Проверяем лимит строк
    checkRowLimit(sheet);
    
    addSystemLog('✅ Flushed ' + values.length + ' logs to Google Sheets', 'INFO', 'LOGGER');
    
  } catch (error) {
    addSystemLog('❌ Failed to flush logs to Google Sheets: ' + error.message, 'ERROR', 'LOGGER');
    
    // Сохраняем логи локально как backup
    SHEETS_LOGGER_BATCH.forEach(function(entry) {
      addSystemLog(
        '[' + entry.operation + '] ' + entry.message + ' (' + entry.status + ')',
        entry.level,
        entry.category
      );
    });
    
    SHEETS_LOGGER_BATCH = []; // Очищаем чтобы не накапливать
  }
}

/**
 * 📋 Создание листа логов с правильной структурой
 */
function createLogsSheet(spreadsheet) {
  try {
    var sheet = spreadsheet.insertSheet(SHEETS_LOGGER_CONFIG.sheetName);
    
    // Заголовки
    var headers = [
      'Время', 'Уровень', 'Категория', 'Операция', 'Статус',
      'Сообщение', 'Детали', 'Trace ID', 'Пользователь', 'Время выполнения (ms)'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Форматирование заголовков
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1c4587')
               .setFontColor('#ffffff')
               .setFontWeight('bold')
               .setFontSize(10);
    
    // Устанавливаем ширину колонок
    sheet.setColumnWidth(1, 150); // Время
    sheet.setColumnWidth(2, 70);  // Уровень
    sheet.setColumnWidth(3, 100); // Категория
    sheet.setColumnWidth(4, 120); // Операция
    sheet.setColumnWidth(5, 80);  // Статус
    sheet.setColumnWidth(6, 300); // Сообщение
    sheet.setColumnWidth(7, 200); // Детали
    sheet.setColumnWidth(8, 120); // Trace ID
    sheet.setColumnWidth(9, 150); // Пользователь
    sheet.setColumnWidth(10, 80); // Время выполнения
    
    // Замораживаем заголовок
    sheet.setFrozenRows(1);
    
    addSystemLog('✅ Created logs sheet: ' + SHEETS_LOGGER_CONFIG.sheetName, 'INFO', 'LOGGER');
    
    return sheet;
    
  } catch (error) {
    addSystemLog('❌ Failed to create logs sheet: ' + error.message, 'ERROR', 'LOGGER');
    throw error;
  }
}

/**
 * 🎨 Форматирование строк логов
 */
function formatLogRows(sheet, startRow, numRows) {
  try {
    var range = sheet.getRange(startRow, 1, numRows, 10);
    
    // Базовое форматирование
    range.setFontSize(9);
    range.setVerticalAlignment('top');
    range.setWrap(true);
    
    // Условное форматирование по уровню
    for (var i = 0; i < numRows; i++) {
      var levelCell = sheet.getRange(startRow + i, 2);
      var level = levelCell.getValue();
      var rowRange = sheet.getRange(startRow + i, 1, 1, 10);
      
      switch (level) {
        case 'ERROR':
          rowRange.setBackground('#fce8e6');
          levelCell.setBackground('#cc0000').setFontColor('#ffffff');
          break;
        case 'WARN':
          rowRange.setBackground('#fef7e0');
          levelCell.setBackground('#ff9900').setFontColor('#ffffff');
          break;
        case 'INFO':
          rowRange.setBackground('#e8f5e8');
          levelCell.setBackground('#34a853').setFontColor('#ffffff');
          break;
        case 'DEBUG':
          rowRange.setBackground('#f3f3f3');
          levelCell.setBackground('#666666').setFontColor('#ffffff');
          break;
      }
      
      // Форматирование статуса
      var statusCell = sheet.getRange(startRow + i, 5);
      var status = statusCell.getValue();
      
      switch (status) {
        case 'SUCCESS':
          statusCell.setBackground('#34a853').setFontColor('#ffffff');
          break;
        case 'FAILED':
          statusCell.setBackground('#ea4335').setFontColor('#ffffff');
          break;
        case 'IN_PROGRESS':
          statusCell.setBackground('#fbbc04').setFontColor('#000000');
          break;
      }
    }
    
  } catch (error) {
    addSystemLog('⚠️ Failed to format log rows: ' + error.message, 'WARN', 'LOGGER');
  }
}

/**
 * 🧹 Проверка и очистка старых логов
 */
function checkRowLimit(sheet) {
  try {
    var lastRow = sheet.getLastRow();
    
    if (lastRow > SHEETS_LOGGER_CONFIG.maxRows) {
      // Удаляем старые строки (оставляем последние 80% записей)
      var rowsToDelete = lastRow - Math.floor(SHEETS_LOGGER_CONFIG.maxRows * 0.8);
      
      if (rowsToDelete > 0) {
        sheet.deleteRows(2, rowsToDelete); // Начинаем с 2 (после заголовка)
        addSystemLog('🧹 Deleted ' + rowsToDelete + ' old log rows', 'INFO', 'LOGGER');
      }
    }
    
  } catch (error) {
    addSystemLog('⚠️ Failed to cleanup old logs: ' + error.message, 'WARN', 'LOGGER');
  }
}

/**
 * 🚨 Проверка алертов на основе логов
 */
function checkLogAlerts(logEntry) {
  try {
    // Считаем ошибки за последний час
    var oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    if (logEntry.level === 'ERROR') {
      var recentErrors = SHEETS_LOGGER_BATCH.filter(function(entry) {
        return entry.level === 'ERROR' && entry.timestamp > oneHourAgo;
      }).length;
      
      if (recentErrors >= SHEETS_LOGGER_CONFIG.errorThreshold) {
        sendAlert('ERROR_THRESHOLD', 'Too many errors: ' + recentErrors + ' in last hour');
      }
    }
    
    // Проверяем производительность
    if (logEntry.executionTime > SHEETS_LOGGER_CONFIG.performanceThreshold) {
      sendAlert('PERFORMANCE', 'Slow operation: ' + logEntry.operation + ' took ' + logEntry.executionTime + 'ms');
    }
    
  } catch (error) {
    addSystemLog('⚠️ Failed to check alerts: ' + error.message, 'WARN', 'LOGGER');
  }
}

/**
 * 📧 Отправка алертов
 */
function sendAlert(type, message) {
  try {
    // Логируем алерт
    addSystemLog('🚨 ALERT [' + type + ']: ' + message, 'ERROR', 'ALERTS');
    
    // TODO: Можно добавить отправку email/Slack уведомлений
    
  } catch (error) {
    addSystemLog('❌ Failed to send alert: ' + error.message, 'ERROR', 'LOGGER');
  }
}

/**
 * 👤 Получение email пользователя
 */
function getUserEmail_() {
  try {
    return Session.getActiveUser().getEmail();
  } catch (e) {
    return 'unknown';
  }
}

/**
 * 🔄 ИНТЕГРАЦИЯ С СУЩЕСТВУЮЩИМИ ФУНКЦИЯМИ
 * Переопределяем addSystemLog для записи в Google Sheets
 */
function addSystemLogWithSheets(message, level, category, operation, status, details, traceId, executionTime) {
  // Локальное логирование (cache)
  addSystemLog(message, level, category);
  
  // Логирование в Google Sheets
  logToGoogleSheets(level, category, operation, status, message, details, traceId, executionTime);
}

/**
 * 📊 СПЕЦИАЛЬНЫЕ ФУНКЦИИ ЛОГИРОВАНИЯ ДЛЯ ОПЕРАЦИЙ
 */

// Collect Config операции
function logCollectConfigOperation(step, target, status, details, traceId, executionTime, error) {
  var level = error ? 'ERROR' : (step === 'START' || step === 'END') ? 'INFO' : 'DEBUG';
  var message;

  switch(step) {
    case 'START':
      message = '🚀 Начало выполнения для ячейки ' + target;
      break;
    case 'LOAD_CONFIG':
      message = '📥 Загружена конфигурация для ' + target;
      break;
    case 'COLLECT_SYSTEM_PROMPT':
      message = '📍 Собран системный промпт';
      break;
    case 'COLLECT_USER_DATA':
      message = '📦 Собраны данные пользователя';
      break;
    case 'API_CALL':
      message = '🤖 Отправка запроса в Gemini API';
      break;
    case 'API_RESPONSE':
      message = '✅ Получен ответ от Gemini API';
      break;
    case 'WRITE_RESULT':
      message = '✍️ Результат записан в ячейку ' + target;
      break;
    case 'END':
      message = '🏁 Успешное завершение для ячейки ' + target;
      break;
    case 'ERROR':
      message = '❌ Ошибка выполнения для ' + target + ': ' + error.message;
      break;
    default:
      message = 'Неизвестный шаг';
  }
  
  logToGoogleSheets(level, 'COLLECT_CONFIG', step, status, message, details, traceId, executionTime);
}


// GM функции
function logGMOperation(prompt, result, executionTime, traceId, error) {
  var status = error ? 'FAILED' : 'SUCCESS';
  var message = error ? 
    'GM failed: ' + error.message : 
    'GM success: ' + prompt.substring(0, 50) + '... → ' + result.length + ' chars';
  
  var details = {
    promptLength: prompt.length,
    resultLength: result ? result.length : 0,
    error: error ? error.message : null,
    cacheHit: result && result.includes('из кэша')
  };
  
  logToGoogleSheets(error ? 'ERROR' : 'INFO', 'GEMINI', 'GM', status, message, details, traceId, executionTime);
}

// VK Import
function logVKImport(url, count, result, executionTime, traceId, error) {
  var status = error ? 'FAILED' : 'SUCCESS';
  var message = error ?
    'VK Import failed: ' + error.message :
    'VK Import success: ' + count + ' posts from ' + url;
  
  var details = {
    url: url,
    requestedCount: count,
    actualCount: result ? result.length : 0,
    error: error ? error.message : null
  };
  
  logToGoogleSheets(error ? 'ERROR' : 'INFO', 'VK', 'IMPORT', status, message, details, traceId, executionTime);
}

// Security Tests
function logSecurityTest(testName, result, executionTime, traceId) {
  var status = result.passed ? 'SUCCESS' : 'FAILED';
  var message = 'Security test: ' + testName + ' → ' + status;
  
  var details = {
    testName: testName,
    passed: result.passed,
    details: result.details,
    recommendations: result.recommendations
  };
  
  logToGoogleSheets(result.passed ? 'INFO' : 'WARN', 'SECURITY', 'TEST', status, message, details, traceId, executionTime);
}

// Atomic Operations
function logAtomicOperation(operation, sheetName, result, executionTime, traceId, error) {
  var status = error ? 'FAILED' : 'SUCCESS';
  var message = 'Atomic ' + operation + ' on ' + sheetName + ': ' + status;
  
  var details = {
    operation: operation,
    sheetName: sheetName,
    backupCreated: result ? result.backupName : null,
    error: error ? error.message : null
  };
  
  logToGoogleSheets(error ? 'ERROR' : 'INFO', 'ATOMIC', operation.toUpperCase(), status, message, details, traceId, executionTime);
}

/**
 * 🚀 Принудительная отправка всех логов (для завершения сессии)
 */
function forceFlushAllLogs() {
  if (SHEETS_LOGGER_BATCH.length > 0) {
    addSystemLog('🚀 Force flushing ' + SHEETS_LOGGER_BATCH.length + ' logs to Google Sheets', 'INFO', 'LOGGER');
    flushLogsToSheets();
  }
}

/**
 * 📈 Анализ логов и автоматическое исправление ошибок
 */
function analyzeLogsAndFixErrors() {
  try {
    var ss = SpreadsheetApp.openById(SHEETS_LOGGER_CONFIG.spreadsheetId);
    var sheet = ss.getSheetByName(SHEETS_LOGGER_CONFIG.sheetName);
    
    if (!sheet) {
      addSystemLog('⚠️ Logs sheet not found for analysis', 'WARN', 'LOGGER');
      return;
    }
    
    // Анализируем последние 100 записей
    var lastRow = sheet.getLastRow();
    var startRow = Math.max(2, lastRow - 99);
    
    if (lastRow < 2) {
      addSystemLog('ℹ️ No logs to analyze', 'INFO', 'LOGGER');
      return;
    }
    
    var data = sheet.getRange(startRow, 1, lastRow - startRow + 1, 10).getValues();
    
    // Анализируем паттерны ошибок
    var errorPatterns = {};
    var performanceIssues = [];
    
    data.forEach(function(row) {
      var level = row[1];
      var category = row[2];
      var operation = row[3];
      var status = row[4];
      var message = row[5];
      var executionTime = row[9];
      
      // Собираем ошибки
      if (level === 'ERROR') {
        var pattern = category + ':' + operation;
        errorPatterns[pattern] = (errorPatterns[pattern] || 0) + 1;
      }
      
      // Собираем проблемы производительности
      if (executionTime > 10000) { // >10 секунд
        performanceIssues.push({
          operation: operation,
          time: executionTime,
          message: message
        });
      }
    });
    
    // Генерируем отчёт и рекомендации
    var report = generateErrorAnalysisReport(errorPatterns, performanceIssues);
    
    // Логируем результаты анализа
    logToGoogleSheets('INFO', 'ANALYTICS', 'ERROR_ANALYSIS', 'SUCCESS', 'Completed log analysis', {
      errorPatterns: errorPatterns,
      performanceIssues: performanceIssues.length,
      recommendations: report.recommendations
    }, generateTraceId('analysis'));
    
    return report;
    
  } catch (error) {
    addSystemLog('❌ Failed to analyze logs: ' + error.message, 'ERROR', 'LOGGER');
    return null;
  }
}

/**
 * 📋 Генерация отчёта об ошибках
 */
function generateErrorAnalysisReport(errorPatterns, performanceIssues) {
  var recommendations = [];
  
  // Анализируем ошибки
  Object.keys(errorPatterns).forEach(function(pattern) {
    var count = errorPatterns[pattern];
    if (count >= 5) {
      recommendations.push('🔥 CRITICAL: ' + pattern + ' failed ' + count + ' times - needs immediate attention');
    } else if (count >= 3) {
      recommendations.push('⚠️ WARNING: ' + pattern + ' failed ' + count + ' times - investigate');
    }
  });
  
  // Анализируем производительность
  if (performanceIssues.length > 0) {
    recommendations.push('🐌 PERFORMANCE: ' + performanceIssues.length + ' slow operations detected');
    
    // Группируем по операциям
    var slowOps = {};
    performanceIssues.forEach(function(issue) {
      slowOps[issue.operation] = (slowOps[issue.operation] || 0) + 1;
    });
    
    Object.keys(slowOps).forEach(function(op) {
      recommendations.push('  → ' + op + ': ' + slowOps[op] + ' slow executions');
    });
  }
  
  return {
    errorPatterns: errorPatterns,
    performanceIssues: performanceIssues,
    recommendations: recommendations
  };
}
