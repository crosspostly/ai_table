/**
 * Smart Chain Service
 * Умные цепочки обработки для автоматизации последовательных задач
 */

/**
 * Умная подготовка цепочки (проверяет Prompt_box или использует A3)
 */
function prepareChainSmart() {
  var ss = SpreadsheetApp.getActive();
  var prompt = ss.getSheetByName('Prompt_box');
  var hasTargets = false;
  
  if (prompt) {
    var lastRow = Math.max(2, prompt.getLastRow());
    var vals = prompt.getRange(2, 2, lastRow - 1, 1).getDisplayValues(); // B2:B
    
    for (var i = 0; i < vals.length; i++) {
      if (String(vals[i][0] || '').trim()) {
        hasTargets = true;
        break;
      }
    }
  }
  
  if (hasTargets) {
    prepareChainFromPromptBox();
  } else {
    prepareChainForA3();
  }
}

/**
 * Подготовка цепочки из Prompt_box (берет цели из колонки B)
 */
function prepareChainFromPromptBox() {
  var ss = SpreadsheetApp.getActive();
  var prompt = ss.getSheetByName('Prompt_box');
  var pack = ss.getSheetByName('Распаковка');
  
  if (!prompt) {
    SpreadsheetApp.getUi().alert('Лист "Prompt_box" не найден');
    return;
  }
  
  if (!pack) {
    SpreadsheetApp.getUi().alert('Лист "Распаковка" не найден');
    return;
  }
  
  var lastRow = Math.max(2, prompt.getLastRow());
  var targets = prompt.getRange(2, 2, lastRow - 1, 1).getDisplayValues(); // B2:B — ячейка назначения
  var mappings = [];
  
  for (var r = 2; r <= lastRow; r++) {
    var targetStr = String(targets[r - 2][0] || '').trim();
    if (!targetStr) continue;
    
    try {
      var parsed = parseTargetA1(targetStr);
      mappings.push({ 
        promptRow: r, 
        targetRow: parsed.row, 
        targetCol: parsed.col, 
        targetA1: parsed.a1 
      });
    } catch (e) {
      logMessage('⚠️ Пропуск строки Prompt_box!B' + r + ': ' + e.message, 'WARN');
    }
  }
  
  if (!mappings.length) {
    SpreadsheetApp.getUi().alert('Нет целевых ячеек в Prompt_box!B, ничего не сделано.');
    return;
  }
  
  var phrase = getCompletionPhrase() || COMPLETION_PHRASE;
  var phraseEscaped = phrase.replace(/"/g, '""');
  
  for (var i = 0; i < mappings.length; i++) {
    var m = mappings[i];
    var cond;
    
    if (i === 0) {
      // Всегда якорь от A3
      cond = '$A3<>""';
    } else {
      var prev = mappings[i - 1];
      cond = 'LEFT(' + prev.targetA1 + ', LEN("' + phraseEscaped + '"))="' + phraseEscaped + '"';
    }
    
    var formula = '=GM_IF(' + cond + ', Prompt_box!$F$' + m.promptRow + ', 25000, 0.7)';
    pack.getRange(m.targetRow, m.targetCol).setFormula(formula);
    
    logMessage('📝 Формула установлена → Распаковка!' + m.targetA1 + ' из Prompt_box!F' + m.promptRow, 'INFO');
  }
  
  SpreadsheetApp.getUi().alert('✅ Готово: формулы расставлены по целям из Prompt_box!B.\\nПервая ячейка запустится при заполнении соответствующего A-столбца, далее — по фразе готовности.');
}

/**
 * Подготовка цепочки для A3 (стандартная цепочка B3..G3)
 */
function prepareChainForA3() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('Распаковка');
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Лист "Распаковка" не найден');
    return;
  }
  
  var row = 3;
  var startCol = 2; // B
  var steps = 6;    // B..G
  var endCol = startCol + steps - 1;
  var phrase = getCompletionPhrase() || COMPLETION_PHRASE;
  var phraseEscaped = phrase.replace(/"/g, '""');
  
  for (var col = startCol; col <= endCol; col++) {
    var stepIndex = col - 1;       // B=1 -> шаг 1
    var promptRow = stepIndex + 1; // шаг 1 -> F2 ... шаг 6 -> F7
    var target = sheet.getRange(row, col);
    var promptRef = 'Prompt_box!$F$' + promptRow;
    var formula;
    
    if (col === 2) {
      // Первая формула - запуск от A3
      formula = '=GM_IF($A3<>"", ' + promptRef + ', 25000, 0.7)';
    } else {
      // Последующие формулы - по фразе готовности
      var prevColLetter = columnToLetter(col - 1);
      formula = '=GM_IF(LEFT(' + prevColLetter + '3, LEN("' + phraseEscaped + '"))="' + phraseEscaped + '", ' + promptRef + ', 25000, 0.7)';
    }
    
    target.setFormula(formula);
    logMessage('📝 Формула ' + target.getA1Notation() + ' установлена', 'DEBUG');
  }
  
  SpreadsheetApp.getUi().alert('✅ Готово: формулы B3..G3 проставлены.\\nЗаполните A3 — шаги пойдут по очереди.');
}

/**
 * Очистка цепочки для A3
 */
function clearChainForA3() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('Распаковка');
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Лист "Распаковка" не найден');
    return;
  }
  
  sheet.getRange(3, 2, 1, 6).clearContent(); // B3..G3
  SpreadsheetApp.getUi().alert('🧹 Очищено: B3..G3');
}

/**
 * Обновление текущей ячейки с GM функцией
 */
function refreshCurrentGMCell() {
  try {
    var ss = SpreadsheetApp.getActive();
    var activeCell = ss.getActiveCell();
    
    if (!activeCell) {
      SpreadsheetApp.getUi().alert('Нет активной ячейки');
      return;
    }
    
    var formula = activeCell.getFormula();
    if (!formula) {
      SpreadsheetApp.getUi().alert('В активной ячейке нет формулы');
      return;
    }
    
    // Проверяем что это GM функция
    if (!formula.includes('GM(') && !formula.includes('GM_IF(') && !formula.includes('GM_STATIC(')) {
      SpreadsheetApp.getUi().alert('Активная ячейка не содержит GM функцию');
      return;
    }
    
    // Очищаем и перевставляем формулу для пересчета
    activeCell.clearContent();
    SpreadsheetApp.flush();
    activeCell.setFormula(formula);
    
    logMessage('🔄 GM ячейка обновлена: ' + activeCell.getA1Notation(), 'INFO');
    SpreadsheetApp.getUi().alert('✅ Ячейка ' + activeCell.getA1Notation() + ' обновлена');
    
  } catch (e) {
    var error = 'Ошибка обновления ячейки: ' + e.message;
    logMessage('❌ ' + error, 'ERROR');
    SpreadsheetApp.getUi().alert(error);
  }
}