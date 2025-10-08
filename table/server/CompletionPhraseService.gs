/**
 * Completion Phrase Service
 * Управление фразой готовности для автоматических цепочек
 */

/**
 * Получить фразу готовности (приоритет: Параметры!B10 → Script Properties → дефолт)
 */
function getCompletionPhrase() {
  try {
    // Проверяем лист Параметры!B10
    var ss = SpreadsheetApp.getActive();
    var params = ss.getSheetByName('Параметры');
    if (params) {
      try {
        var v = params.getRange('B10').getDisplayValue();
        if (v && String(v).trim()) {
          return String(v).trim();
        }
      } catch (e) {
        // Игнорируем ошибки чтения ячейки
      }
    }
    
    // Проверяем Script Properties
    var prop = PropertiesService.getScriptProperties().getProperty('COMPLETION_PHRASE');
    if (prop && String(prop).trim()) {
      return String(prop).trim();
    }
  } catch (e) {
    logMessage('⚠️ Ошибка чтения фразы готовности: ' + e.message, 'WARN');
  }
  
  // Возвращаем дефолтную фразу
  return COMPLETION_PHRASE;
}

/**
 * UI для изменения фразы готовности
 */
function setCompletionPhraseUI() {
  var ui = SpreadsheetApp.getUi();
  var current = getCompletionPhrase();
  
  var res = ui.prompt(
    '📝 Фраза готовности', 
    'Введите точную фразу, с которой ДОЛЖЕН начинаться готовый ответ (например: Отчёт готов). Текущая: ' + current, 
    ui.ButtonSet.OK_CANCEL
  );
  
  if (res.getSelectedButton() !== ui.Button.OK) return;
  
  var val = (res.getResponseText() || '').trim();
  if (!val) {
    ui.alert('Фраза не изменена.');
    return;
  }
  
  var ss = SpreadsheetApp.getActive();
  var params = ss.getSheetByName('Параметры');
  
  if (!params) {
    // Если нет листа Параметры — сохраним в Script Properties
    PropertiesService.getScriptProperties().setProperty('COMPLETION_PHRASE', val);
    ui.alert('✅ Фраза сохранена в настройках скрипта.');
  } else {
    params.getRange('B10').setValue(val);
    ui.alert('✅ Фраза сохранена в Параметры!B10.');
  }
  
  logMessage('🔧 Новая фраза готовности: ' + val, 'INFO');
}

/**
 * Проверить готовность результата по фразе
 */
function isCompletionReady(text) {
  if (!text || typeof text !== 'string') return false;
  
  var clean = text.trim();
  var phrase = getCompletionPhrase();
  var ready = phrase ? clean.startsWith(phrase) : false;
  
  logMessage(
    `🔍 Проверка готовности: "${clean.slice(0,30)}..." против "${phrase}" → ${ready ? 'ГОТОВО' : 'НЕ ГОТОВО'}`, 
    'DEBUG'
  );
  
  return ready;
}

/**
 * Получить экранированную фразу для формул
 */
function getEscapedCompletionPhrase() {
  var phrase = getCompletionPhrase() || COMPLETION_PHRASE;
  return phrase.replace(/"/g, '""');
}