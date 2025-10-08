/**
 * Trigger Management System
 * Управление триггерами Google Apps Script
 */

/**
 * Очистка старых триггеров (кроме onEdit/onOpen)
 */
function cleanupOldTriggers() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var deleted = 0, kept = 0;
    
    triggers.forEach(function(trigger) {
      var fn = trigger.getHandlerFunction();
      if (fn !== 'onEdit' && fn !== 'onOpen') {
        if (fn === 'checkStepCompletion') {
          ScriptApp.deleteTrigger(trigger);
          deleted++;
          logMessage('🗑️ Удален триггер: ' + fn, 'INFO');
        } else {
          kept++;
        }
      } else {
        kept++;
      }
    });
    
    var summary = '✅ Очистка: удалено ' + deleted + ', оставлено ' + kept;
    logMessage(summary, 'INFO');
    SpreadsheetApp.getUi().alert(summary);
    return summary;
  } catch (e) {
    var msg = '❌ Ошибка очистки триггеров: ' + e.message;
    logMessage(msg, 'ERROR');
    SpreadsheetApp.getUi().alert(msg);
    return msg;
  }
}

/**
 * Показать активные триггеры в диалоге
 */
function showActiveTriggersDialog() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    if (triggers.length === 0) {
      SpreadsheetApp.getUi().alert('Активные триггеры', 'Нет активных триггеров', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    var list = triggers.map((t,i) => (i+1)+'. '+t.getHandlerFunction()+' ('+t.getEventType()+')').join('\\n');
    SpreadsheetApp.getUi().alert('Активные триггеры', 'Всего: '+triggers.length+'

'+list, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    SpreadsheetApp.getUi().alert('Ошибка показа триггеров: ' + e.message);
  }
}

/**
 * Создать триггер для проверки завершения шага
 */
function createStepCompletionTrigger(delayMs) {
  try {
    ScriptApp.newTrigger('checkStepCompletion')
      .timeBased()
      .after(delayMs)
      .create();
    logMessage('⏰ Проверка через ' + (delayMs/1000) + ' сек', 'DEBUG');
    return true;
  } catch (e) {
    logMessage('❌ Ошибка создания триггера: ' + e.message, 'ERROR');
    return false;
  }
}

/**
 * Удалить все триггеры проверки завершения шагов
 */
function removeStepCompletionTriggers() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var deleted = 0;
    
    triggers.forEach(function(t) {
      if (t.getHandlerFunction() === 'checkStepCompletion') {
        ScriptApp.deleteTrigger(t);
        deleted++;
      }
    });
    
    logMessage('🗑️ Удалено триггеров checkStepCompletion: ' + deleted, 'DEBUG');
    return deleted;
  } catch (e) {
    logMessage('❌ Ошибка удаления триггеров: ' + e.message, 'ERROR');
    return 0;
  }
}

/**
 * Обновить GM триггеры для выбранной ячейки
 */
function refreshSelectedGMTriggers() {
  try {
    var ss = SpreadsheetApp.getActive();
    var paramsSheet = ss.getSheetByName('Параметры');
    if (!paramsSheet) return;
    
    var activeCell = ss.getActiveRange();
    var cell = activeCell.getCell(1, 1);
    var row = cell.getRow();
    var triggerCell = paramsSheet.getRange(row, 26); // Z
    var current = triggerCell.getValue();
    
    triggerCell.setValue(current ? "" : ".");
    logMessage('🔄 GM триггер обновлен для строки ' + row, 'DEBUG');
  } catch (e) {
    logMessage('❌ Ошибка обновления GM триггера: ' + e.message, 'ERROR');
  }
}