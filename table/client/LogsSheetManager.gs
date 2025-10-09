/**
 * МЕНЕДЖЕР ЛИСТА ЛОГОВ
 * Автоматическое создание и управление листом "Логи"
 */

/**
 * Проверить и создать лист "Логи" если его нет
 */
function ensureLogsSheet() {
  try {
    addSystemLog('🔍 Проверяем наличие листа "Логи"', 'INFO', 'LOGS_MANAGER');
    
    var ss = SpreadsheetApp.openById(SHEETS_LOGGER_CONFIG.spreadsheetId);
    var logsSheet = ss.getSheetByName(SHEETS_LOGGER_CONFIG.sheetName);
    
    if (!logsSheet) {
      addSystemLog('📋 Лист "Логи" не найден, создаем...', 'INFO', 'LOGS_MANAGER');
      
      // Создаем лист с помощью функции из GoogleSheetsLogger.gs
      createLogsSheet(ss);
      
      addSystemLog('✅ Лист "Логи" успешно создан!', 'INFO', 'LOGS_MANAGER');
      
      var ui = SpreadsheetApp.getUi();
      ui.alert('✅ Лист логов создан', 
        'Лист "Логи" был автоматически создан в таблице.\n\nТеперь все системные события будут записываться туда в реальном времени!', 
        ui.ButtonSet.OK);
      
      return true; // Лист был создан
    } else {
      addSystemLog('✅ Лист "Логи" уже существует', 'INFO', 'LOGS_MANAGER');
      return false; // Лист уже был
    }
    
  } catch (error) {
    addSystemLog('❌ Ошибка создания листа логов: ' + error.message, 'ERROR', 'LOGS_MANAGER');
    
    var ui = SpreadsheetApp.getUi();
    ui.alert('❌ Ошибка создания листа логов', 
      'Не удалось создать лист "Логи":\n\n' + error.message + '\n\nПроверьте права доступа к таблице.', 
      ui.ButtonSet.OK);
    
    return false;
  }
}

/**
 * Показать статистику логов с автоматическим созданием листа
 */
function showLogsSheetStatus() {
  try {
    // Сначала убеждаемся что лист существует
    var wasCreated = ensureLogsSheet();
    
    var ss = SpreadsheetApp.openById(SHEETS_LOGGER_CONFIG.spreadsheetId);
    var logsSheet = ss.getSheetByName(SHEETS_LOGGER_CONFIG.sheetName);
    
    if (!logsSheet) {
      SpreadsheetApp.getUi().alert('❌ Ошибка', 'Не удалось создать или найти лист "Логи"', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    var data = logsSheet.getDataRange().getValues();
    var totalLogs = Math.max(0, data.length - 1); // Исключаем заголовок
    
    var report = [];
    report.push('📊 СТАТУС ЛИСТА ЛОГОВ');
    report.push('='.repeat(30));
    report.push('');
    
    if (wasCreated) {
      report.push('🆕 Лист "Логи" был только что создан!');
      report.push('');
    }
    
    report.push('📋 Информация:');
    report.push('• Таблица ID: ' + SHEETS_LOGGER_CONFIG.spreadsheetId);
    report.push('• Лист: "' + SHEETS_LOGGER_CONFIG.sheetName + '"');
    report.push('• Всего записей: ' + totalLogs);
    report.push('• Ссылка: https://docs.google.com/spreadsheets/d/' + SHEETS_LOGGER_CONFIG.spreadsheetId + '/edit#gid=' + logsSheet.getSheetId());
    report.push('');
    
    if (totalLogs > 0) {
      // Анализируем последние записи
      var recentLogs = data.slice(-10); // Последние 10 записей
      var levels = { INFO: 0, WARN: 0, ERROR: 0, DEBUG: 0 };
      
      for (var i = 0; i < recentLogs.length; i++) {
        var level = recentLogs[i][1] || 'INFO';
        if (levels.hasOwnProperty(level)) {
          levels[level]++;
        }
      }
      
      report.push('🔍 Последние 10 записей:');
      report.push('• INFO: ' + levels.INFO);
      report.push('• WARN: ' + levels.WARN + (levels.WARN > 0 ? ' ⚠️' : ''));
      report.push('• ERROR: ' + levels.ERROR + (levels.ERROR > 0 ? ' ❌' : ''));
      report.push('• DEBUG: ' + levels.DEBUG);
    } else {
      report.push('📝 Лист пустой - логи начнут записываться при использовании системы');
    }
    
    report.push('');
    report.push('💡 Все действия автоматически логируются!');
    
    SpreadsheetApp.getUi().alert('📊 Статус листа логов', report.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);
    
    addSystemLog('📊 Показан статус листа логов: ' + totalLogs + ' записей', 'INFO', 'LOGS_MANAGER');
    
  } catch (error) {
    addSystemLog('❌ Ошибка получения статуса логов: ' + error.message, 'ERROR', 'LOGS_MANAGER');
    SpreadsheetApp.getUi().alert('Ошибка', 'Не удалось получить статус логов: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Принудительно записать тестовое сообщение в логи
 */
function writeTestLogMessage() {
  try {
    // Убеждаемся что лист существует
    ensureLogsSheet();
    
    // Записываем тестовое сообщение
    addSystemLog('🧪 Тестовое сообщение для проверки логирования', 'INFO', 'TEST');
    addSystemLog('⚠️ Тестовое предупреждение', 'WARN', 'TEST');
    addSystemLog('❌ Тестовая ошибка (не реальная)', 'ERROR', 'TEST');
    
    // Принудительно сбрасываем в Google Sheets
    if (typeof flushLogsToGoogleSheets === 'function') {
      flushLogsToGoogleSheets();
    }
    
    SpreadsheetApp.getUi().alert('✅ Тестовые логи записаны', 
      'Записаны 3 тестовых сообщения в лист "Логи".\n\nПроверьте лист чтобы убедиться что логирование работает!', 
      SpreadsheetApp.getUi().ButtonSet.OK);
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Ошибка записи тестовых логов', 
      'Ошибка: ' + error.message, 
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Открыть лист логов с автоматическим созданием
 */
function openLogsSheetWithCreation() {
  try {
    // Убеждаемся что лист существует
    var wasCreated = ensureLogsSheet();
    
    var ss = SpreadsheetApp.openById(SHEETS_LOGGER_CONFIG.spreadsheetId);
    var logsSheet = ss.getSheetByName(SHEETS_LOGGER_CONFIG.sheetName);
    
    if (!logsSheet) {
      SpreadsheetApp.getUi().alert('❌ Ошибка', 'Не удалось создать или найти лист "Логи"', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    var logsUrl = 'https://docs.google.com/spreadsheets/d/' + SHEETS_LOGGER_CONFIG.spreadsheetId + '/edit#gid=' + logsSheet.getSheetId();
    
    var ui = SpreadsheetApp.getUi();
    var message = '📊 ЛИСТ ЛОГОВ' + (wasCreated ? ' (СОЗДАН АВТОМАТИЧЕСКИ)' : '') + '\n\n';
    message += 'Ссылка на лист логов:\n';
    message += logsUrl + '\n\n';
    message += '🔗 Скопируйте ссылку и откройте в новой вкладке.\n\n';
    message += '📋 В листе "Логи" вы найдете:\n';
    message += '• Все системные события\n';
    message += '• Ошибки и предупреждения\n';
    message += '• Результаты тестов\n';
    message += '• Performance метрики\n';
    message += '• Trace ID для отслеживания операций\n\n';
    
    if (wasCreated) {
      message += '🆕 Лист был только что создан!\n';
      message += '💡 Теперь все действия будут автоматически логироваться.';
    }
    
    ui.alert('📊 Лист логов', message, ui.ButtonSet.OK);
    
    addSystemLog('📊 Пользователь открыл лист логов' + (wasCreated ? ' (создан автоматически)' : ''), 'INFO', 'LOGS_MANAGER');
    
  } catch (error) {
    addSystemLog('❌ Ошибка открытия листа логов: ' + error.message, 'ERROR', 'LOGS_MANAGER');
    SpreadsheetApp.getUi().alert('Ошибка', 'Не удалось открыть лист логов: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}