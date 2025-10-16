/**
 * Smart Chain Service - Refactored for stability
 * Умные цепочки обработки для автоматизации последовательных задач
 */

// --- Constants and Stubs for stability ---
var COMPLETION_PHRASE = 'Отчёт готов';
function getCompletionPhrase() { return COMPLETION_PHRASE; }
function parseTargetA1(a1) { return { row: parseInt(a1.substring(1)), col: a1.charCodeAt(0) - 64, a1: a1 }; }
function columnToLetter(col) { return String.fromCharCode(64 + col); }
function buildContextualPrompt(prompt, sessionId) { return prompt; } // Stub
function addToContextHistory(user, prompt, session) { } // Stub

/**
 * Умная подготовка цепочки (проверяет Prompt_box или использует A3)
 */
function prepareChainSmart() {
  var ss = SpreadsheetApp.getActive();
  var prompt = ss.getSheetByName('Prompt_box');
  var hasTargets = false;
  if (prompt) {
    var vals = prompt.getRange(2, 2, prompt.getLastRow() - 1, 1).getDisplayValues();
    hasTargets = vals.some(function(row) { return row[0] && String(row[0]).trim(); });
  }
  if (hasTargets) {
    prepareChainFromPromptBox();
  } else {
    prepareChainForA3();
  }
}

/**
 * Подготовка цепочки из Prompt_box
 */
function prepareChainFromPromptBox() {
  var ss = SpreadsheetApp.getActive();
  var prompt = ss.getSheetByName('Prompt_box');
  var pack = ss.getSheetByName('Распаковка');
  if (!prompt || !pack) {
    SpreadsheetApp.getUi().alert('Листы "Prompt_box" или "Распаковка" не найдены.');
    return;
  }

  var targets = prompt.getRange(2, 2, prompt.getLastRow() - 1, 1).getDisplayValues();
  var mappings = [];
  targets.forEach(function(row, i) {
    var targetStr = String(row[0] || '').trim();
    if (targetStr) {
      try {
        mappings.push({ promptRow: i + 2, targetA1: parseTargetA1(targetStr).a1 });
      } catch (e) { /* ignore malformed A1 */ }
    }
  });

  if (mappings.length === 0) {
    SpreadsheetApp.getUi().alert('Нет целевых ячеек в Prompt_box!B');
    return;
  }

  var phraseEscaped = (getCompletionPhrase() || 'Отчёт готов').replace(/"/g, '""');
  mappings.forEach(function(m, i) {
    var cond = (i === 0) ? '$A3<>""' : 'LEFT(' + mappings[i-1].targetA1 + ',LEN(\"' + phraseEscaped + '\"))=\"' + phraseEscaped + '\"';
    var formula = '=GM_IF(' + cond + ', Prompt_box!$F$' + m.promptRow + ', 25000, 0.7)';
    pack.getRange(m.targetA1).setFormula(formula);
  });

  SpreadsheetApp.getUi().alert('✅ Цепочка из Prompt_box настроена.');
}

/**
 * Подготовка стандартной цепочки для A3 (B3..G3)
 */
function prepareChainForA3() {
  var sheet = SpreadsheetApp.getActive().getSheetByName('Распаковка');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Лист "Распаковка" не найден.');
    return;
  }
  var phraseEscaped = (getCompletionPhrase() || 'Отчёт готов').replace(/"/g, '""');
  for (var col = 2; col <= 7; col++) { // B to G
    var promptRef = 'Prompt_box!$F$' + (col -1);
    var cond = (col === 2) ? '$A3<>""' : 'LEFT(' + columnToLetter(col - 1) + '3,LEN(\"' + phraseEscaped + '\"))=\"' + phraseEscaped + '\"';
    var formula = '=GM_IF(' + cond + ', ' + promptRef + ', 25000, 0.7)';
    sheet.getRange(3, col).setFormula(formula);
  }
  SpreadsheetApp.getUi().alert('✅ Стандартная цепочка B3..G3 настроена.');
}

/**
 * Обновление текущей ячейки с GM функцией
 */
function refreshCurrentGMCell() {
  try {
    var cell = SpreadsheetApp.getActive().getActiveCell();
    var formula = cell.getFormula();
    if (formula && /GM_?/i.test(formula)) {
      cell.clearContent();
      SpreadsheetApp.flush();
      cell.setFormula(formula);
      SpreadsheetApp.getUi().alert('✅ Ячейка ' + cell.getA1Notation() + ' обновлена');
    } else {
      SpreadsheetApp.getUi().alert('В ячейке нет GM функции.');
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert('Ошибка обновления: ' + e.message);
  }
}
