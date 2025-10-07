/**
 * Table-based License Service v2.0
 * Система лицензий с привязкой к ID таблицы
 * Поддерживает множественные копии и строгий контроль доступа
 */

// Константы для table-based лицензий
var LICENSE_SHEET_ID = '1u9rNx0Zwk4Y1cKHiquwu2jH3elpX7VUSJVgkq_Tb3-s';
var LICENSE_SHEET_NAME = 'Tokens';
var TABLE_BINDINGS_SHEET = 'TableBindings'; // Новый лист для привязок

/**
 * Расширенная проверка лицензии с table_id
 * @param {string} email - email лицензии
 * @param {string} token - токен лицензии  
 * @param {string} tableId - ID таблицы пользователя
 * @return {Object} - результат проверки с возможностями управления копиями
 */
function checkTableLicense(email, token, tableId) {
  var traceId = 'table-lic-' + Date.now();
  
  try {
    addSystemLog('→ Проверка table license: ' + maskEmail(email) + ', table: ' + (tableId ? tableId.slice(0, 8) + '...' : 'none'), 'INFO', 'TABLE_LICENSE');
    
    if (!email || !token) {
      return createLicenseError('EMAIL и TOKEN обязательны', traceId);
    }
    
    if (!tableId) {
      return createLicenseError('TABLE_ID обязателен для доступа', traceId);
    }
    
    // Открываем лицензионную таблицу
    var ss = SpreadsheetApp.openById(LICENSE_SHEET_ID);
    var licenseSheet = ss.getSheetByName(LICENSE_SHEET_NAME);
    var bindingsSheet = getOrCreateBindingsSheet(ss);
    
    if (!licenseSheet) {
      return createLicenseError('ЛИЦЕНЗИОННАЯ_СИСТЕМА_НЕДОСТУПНА', traceId);
    }
    
    // Проверяем основную лицензию
    var licenseCheck = checkBasicLicense(licenseSheet, email, token, traceId);
    if (!licenseCheck.ok) {
      return licenseCheck;
    }
    
    // Проверяем привязки к таблицам
    var bindingCheck = checkTableBinding(bindingsSheet, email, token, tableId, licenseCheck.licenseData, traceId);
    
    // Логируем активность
    logTableLicenseActivity('check', email, token, tableId, bindingCheck, traceId);
    
    return bindingCheck;
    
  } catch (e) {
    addSystemLog('❌ Ошибка проверки table license: ' + e.message, 'ERROR', 'TABLE_LICENSE');
    return createLicenseError('ОШИБКА_ПРОВЕРКИ_ЛИЦЕНЗИИ: ' + e.message, traceId);
  }
}

/**
 * Проверка базовой лицензии (без привязки к таблице)
 */
function checkBasicLicense(sheet, email, token, traceId) {
  try {
    var data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) {
      return createLicenseError('ЛИЦЕНЗИОННАЯ_ТАБЛИЦА_ПУСТА', traceId);
    }
    
    // Определяем структуру заголовков
    var header = data[0].map(function(x) { return String(x || '').toLowerCase().trim(); });
    var colEmail = findLicenseHeader(header, ['email', 'e-mail', 'почта']);
    var colToken = findLicenseHeader(header, ['token', 'токен']);  
    var colUntil = findLicenseHeader(header, ['until', 'до', 'expires']);
    var colActive = findLicenseHeader(header, ['active', 'активен']);
    var colMaxCopies = findLicenseHeader(header, ['max_copies', 'количество_лицензий', 'copies']);
    
    if (colEmail === -1 || colToken === -1) {
      return createLicenseError('НЕВЕРНАЯ_СТРУКТУРА_ЛИЦЕНЗИОННОЙ_ТАБЛИЦЫ', traceId);
    }
    
    // Ищем пользователя
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowEmail = String(row[colEmail] || '').trim().toLowerCase();
      var rowToken = String(row[colToken] || '').trim();
      
      if (rowEmail === email.toLowerCase() && rowToken === token) {
        
        // Проверяем активность
        if (colActive !== -1) {
          var isActive = row[colActive];
          if (!isActive || String(isActive).toLowerCase() === 'false' || String(isActive) === '0') {
            return createLicenseError('ЛИЦЕНЗИЯ_ДЕАКТИВИРОВАНА', traceId);
          }
        }
        
        // Проверяем срок действия
        if (colUntil !== -1 && row[colUntil] instanceof Date && row[colUntil] < new Date()) {
          return createLicenseError('ЛИЦЕНЗИЯ_ИСТЕКЛА', traceId);
        }
        
        // Rate limiting
        if (!checkRateLimit(token)) {
          return createLicenseError('ПРЕВЫШЕН_ЛИМИТ_ЗАПРОСОВ', traceId);
        }
        
        var maxCopies = colMaxCopies !== -1 ? parseInt(row[colMaxCopies] || 1) : 1;
        
        return {
          ok: true,
          licenseData: {
            email: email,
            token: token,
            row: i + 1,
            maxCopies: maxCopies,
            until: colUntil !== -1 && row[colUntil] instanceof Date ? row[colUntil] : null
          },
          traceId: traceId
        };
      }
    }
    
    return createLicenseError('НЕВЕРНЫЕ_УЧЕТНЫЕ_ДАННЫЕ', traceId);
    
  } catch (e) {
    return createLicenseError('ОШИБКА_БАЗОВОЙ_ПРОВЕРКИ: ' + e.message, traceId);
  }
}

/**
 * Проверка привязки к таблице
 */
function checkTableBinding(bindingsSheet, email, token, tableId, licenseData, traceId) {
  try {
    var data = bindingsSheet.getDataRange().getValues();
    var bindings = [];
    var currentBinding = null;
    
    // Парсим существующие привязки
    if (data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var rowEmail = String(row[0] || '').trim().toLowerCase();
        var rowToken = String(row[1] || '').trim();
        var rowTableId = String(row[2] || '').trim();
        
        if (rowEmail === email.toLowerCase() && rowToken === token) {
          var binding = {
            email: rowEmail,
            token: rowToken,
            tableId: rowTableId,
            createdAt: row[3] instanceof Date ? row[3] : new Date(),
            lastUsed: row[4] instanceof Date ? row[4] : new Date(),
            row: i
          };
          
          bindings.push(binding);
          
          if (rowTableId === tableId) {
            currentBinding = binding;
          }
        }
      }
    }
    
    addSystemLog('📊 Найдено привязок: ' + bindings.length + '/' + licenseData.maxCopies, 'DEBUG', 'TABLE_LICENSE');
    
    // Если текущая таблица уже привязана - обновляем время последнего использования
    if (currentBinding) {
      bindingsSheet.getRange(currentBinding.row + 1, 5).setValue(new Date()); // lastUsed
      
      return {
        ok: true,
        action: 'existing_binding',
        tableId: tableId,
        bindings: bindings.length,
        maxCopies: licenseData.maxCopies,
        licenseData: licenseData,
        traceId: traceId
      };
    }
    
    // Если достигнут лимит копий
    if (bindings.length >= licenseData.maxCopies) {
      return {
        ok: false,
        error: 'ПРЕВЫШЕН_ЛИМИТ_КОПИЙ',
        action: 'limit_exceeded',
        bindings: bindings.map(function(b) { 
          return {
            tableId: b.tableId,
            createdAt: b.createdAt,
            lastUsed: b.lastUsed
          }; 
        }),
        maxCopies: licenseData.maxCopies,
        suggested: 'unbind_old_and_bind_new',
        traceId: traceId
      };
    }
    
    // Создаем новую привязку
    var now = new Date();
    bindingsSheet.appendRow([
      email,
      token,
      tableId,
      now,  // createdAt
      now   // lastUsed
    ]);
    
    addSystemLog('✨ Создана новая привязка таблицы: ' + tableId.slice(0, 8) + '...', 'INFO', 'TABLE_LICENSE');
    
    return {
      ok: true,
      action: 'new_binding_created',
      tableId: tableId,
      bindings: bindings.length + 1,
      maxCopies: licenseData.maxCopies,
      licenseData: licenseData,
      traceId: traceId
    };
    
  } catch (e) {
    addSystemLog('❌ Ошибка проверки привязки: ' + e.message, 'ERROR', 'TABLE_LICENSE');
    return createLicenseError('ОШИБКА_ПРИВЯЗКИ: ' + e.message, traceId);
  }
}

/**
 * Отвязка старой таблицы и привязка новой
 */
function rebindTable(email, token, oldTableId, newTableId) {
  var traceId = 'rebind-' + Date.now();
  
  try {
    addSystemLog('→ Перепривязка: ' + oldTableId.slice(0, 8) + '... → ' + newTableId.slice(0, 8) + '...', 'INFO', 'TABLE_LICENSE');
    
    var ss = SpreadsheetApp.openById(LICENSE_SHEET_ID);
    var bindingsSheet = getOrCreateBindingsSheet(ss);
    
    var data = bindingsSheet.getDataRange().getValues();
    var updated = false;
    
    // Ищем старую привязку и заменяем на новую
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowEmail = String(row[0] || '').trim().toLowerCase();
      var rowToken = String(row[1] || '').trim();
      var rowTableId = String(row[2] || '').trim();
      
      if (rowEmail === email.toLowerCase() && rowToken === token && rowTableId === oldTableId) {
        bindingsSheet.getRange(i + 1, 3).setValue(newTableId); // tableId
        bindingsSheet.getRange(i + 1, 5).setValue(new Date());  // lastUsed
        updated = true;
        break;
      }
    }
    
    if (!updated) {
      return createLicenseError('СТАРАЯ_ПРИВЯЗКА_НЕ_НАЙДЕНА', traceId);
    }
    
    addSystemLog('✅ Таблица успешно перепривязана', 'INFO', 'TABLE_LICENSE');
    
    return {
      ok: true,
      action: 'rebound',
      oldTableId: oldTableId,
      newTableId: newTableId,
      traceId: traceId
    };
    
  } catch (e) {
    addSystemLog('❌ Ошибка перепривязки: ' + e.message, 'ERROR', 'TABLE_LICENSE');
    return createLicenseError('ОШИБКА_ПЕРЕПРИВЯЗКИ: ' + e.message, traceId);
  }
}

/**
 * Получение или создание листа привязок
 */
function getOrCreateBindingsSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(TABLE_BINDINGS_SHEET);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(TABLE_BINDINGS_SHEET);
    
    // Создаем заголовки
    sheet.getRange(1, 1, 1, 5).setValues([[
      'Email', 'Token', 'TableId', 'CreatedAt', 'LastUsed'
    ]]);
    
    // Форматируем заголовки
    var headerRange = sheet.getRange(1, 1, 1, 5);
    headerRange.setBackground('#4285f4').setFontColor('white').setFontWeight('bold');
    
    addSystemLog('✨ Создан лист привязок таблиц: ' + TABLE_BINDINGS_SHEET, 'INFO', 'TABLE_LICENSE');
  }
  
  return sheet;
}

/**
 * Логирование table license активности
 */
function logTableLicenseActivity(action, email, token, tableId, result, traceId) {
  try {
    var ss = SpreadsheetApp.openById(LICENSE_SHEET_ID);
    var logSheet = ss.getSheetByName('TableLicenseLogs') || ss.insertSheet('TableLicenseLogs');
    
    // Заголовки если лист пустой
    if (logSheet.getLastRow() === 0) {
      logSheet.getRange(1, 1, 1, 8).setValues([[
        'Timestamp', 'Action', 'Email', 'Token', 'TableId', 'Result', 'Details', 'TraceId'
      ]]);
      logSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#E8F0FE');
    }
    
    var timestamp = new Date();
    var maskedEmail = maskEmail(email);
    var maskedToken = token ? '***' + token.slice(-4) : 'none';
    var maskedTableId = tableId ? tableId.slice(0, 8) + '...' : 'none';
    var resultStr = result.ok ? 'SUCCESS' : 'FAIL: ' + (result.error || 'unknown');
    
    var details = {
      action: result.action || 'check',
      bindings: result.bindings || 0,
      maxCopies: result.maxCopies || 1
    };
    
    logSheet.appendRow([
      timestamp,
      action,
      maskedEmail,
      maskedToken,
      maskedTableId,
      resultStr,
      JSON.stringify(details),
      traceId || 'none'
    ]);
    
    // Ограничиваем количество логов
    var lastRow = logSheet.getLastRow();
    if (lastRow > 1001) {
      logSheet.deleteRows(2, lastRow - 1001);
    }
    
  } catch (e) {
    addSystemLog('⚠️ Ошибка логирования table license: ' + e.message, 'WARN', 'TABLE_LICENSE');
  }
}

/**
 * Получение статистики привязок таблиц
 */
function getTableBindingsStats() {
  try {
    var ss = SpreadsheetApp.openById(LICENSE_SHEET_ID);
    var bindingsSheet = ss.getSheetByName(TABLE_BINDINGS_SHEET);
    
    if (!bindingsSheet) {
      return { totalBindings: 0, uniqueUsers: 0, uniqueTables: 0 };
    }
    
    var data = bindingsSheet.getDataRange().getValues();
    if (data.length < 2) {
      return { totalBindings: 0, uniqueUsers: 0, uniqueTables: 0 };
    }
    
    var uniqueEmails = new Set();
    var uniqueTables = new Set();
    var activeBindings = 0;
    var oldBindings = 0;
    var cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 дней назад
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var email = String(row[0] || '').trim();
      var tableId = String(row[2] || '').trim();
      var lastUsed = row[4] instanceof Date ? row[4] : new Date(0);
      
      if (email && tableId) {
        uniqueEmails.add(email);
        uniqueTables.add(tableId);
        
        if (lastUsed > cutoffDate) {
          activeBindings++;
        } else {
          oldBindings++;
        }
      }
    }
    
    return {
      totalBindings: data.length - 1,
      uniqueUsers: uniqueEmails.size,
      uniqueTables: uniqueTables.size,
      activeBindings: activeBindings,
      oldBindings: oldBindings
    };
    
  } catch (e) {
    return { error: 'Ошибка получения статистики: ' + e.message };
  }
}

/**
 * Вспомогательная функция создания ошибки лицензии
 */
function createLicenseError(error, traceId) {
  return {
    ok: false,
    error: error,
    traceId: traceId
  };
}