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

/**
 * НОВАЯ ФУНКЦИЯ v3.0: Оптимизированная цепочка без дублирования контекста
 * Передает только необходимый контекст: B3→C3 (получает A3+B3), C3→D3 (получает B3+C3)
 */
function smartChainContinueOptimized(row) {
  try {
    addSystemLog('🔗 Запуск оптимизированной SmartChain для строки ' + row, 'INFO', 'SMART_CHAIN');
    
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var currentSheet = spreadsheet.getActiveSheet();
    
    if (!currentSheet) {
      throw new Error('Активный лист не найден');
    }
    
    // Получаем значения из текущей строки
    var rowData = currentSheet.getRange(row, 1, 1, 20).getValues()[0];
    
    // Находим заполненные ячейки
    var filledCells = [];
    for (var col = 0; col < rowData.length; col++) {
      var cellValue = String(rowData[col] || '').trim();
      if (cellValue && cellValue !== '') {
        filledCells.push({
          column: String.fromCharCode(65 + col), // A, B, C, ...
          value: cellValue,
          index: col
        });
      }
    }
    
    if (filledCells.length === 0) {
      addSystemLog('⚠️ SmartChain: нет данных в строке ' + row, 'WARN', 'SMART_CHAIN');
      return;
    }
    
    // Определяем следующую пустую колонку
    var nextCol = -1;
    for (var col = 0; col < rowData.length; col++) {
      if (!rowData[col] || String(rowData[col]).trim() === '') {
        nextCol = col + 1;
        break;
      }
    }
    
    if (nextCol === -1) {
      addSystemLog('⚠️ SmartChain: нет пустых колонок в строке ' + row, 'WARN', 'SMART_CHAIN');
      return;
    }
    
    // КЛЮЧЕВАЯ ОПТИМИЗАЦИЯ: Минимальный контекст
    var contextPrompt = buildMinimalChainContext(filledCells, nextCol, row);
    
    // Создаем сессию для цепочки этой строки  
    var sessionId = 'chain_' + currentSheet.getName() + '_row' + row;
    
    // Получаем контекстуальный промпт (он уже включает историю)
    var fullPrompt = buildContextualPrompt(contextPrompt, sessionId);
    
    // Вызываем Gemini
    var result = callGeminiForOptimizedChain(fullPrompt, row);
    
    if (result && !result.startsWith('Error:')) {
      // Записываем результат
      currentSheet.getRange(row, nextCol).setValue(result);
      
      // Добавляем в контекст ТОЛЬКО текущий шаг (без дублирования)
      var stepDescription = 'Шаг ' + String.fromCharCode(64 + nextCol) + ': ' + contextPrompt;
      addToContextHistory('user', stepDescription, sessionId);
      addToContextHistory('assistant', result, sessionId);
      
      var targetCol = String.fromCharCode(64 + nextCol);
      addSystemLog('✅ Оптимизированная SmartChain: ' + targetCol + row + ' готов', 'INFO', 'SMART_CHAIN');
    } else {
      addSystemLog('❌ SmartChain: ошибка Gemini - ' + result, 'ERROR', 'SMART_CHAIN');
    }
    
  } catch (error) {
    addSystemLog('❌ Оптимизированная SmartChain ошибка: ' + error.message, 'ERROR', 'SMART_CHAIN');
  }
}

/**
 * Создает минимальный контекст для цепочки без избыточности
 */
function buildMinimalChainContext(filledCells, nextColIndex, row) {
  try {
    var nextCol = String.fromCharCode(64 + nextColIndex);
    
    // Для первого шага (A→B)
    if (filledCells.length === 1 && filledCells[0].column === 'A') {
      return 'Исходная задача: ' + filledCells[0].value + 
             '\n\nСоздай первый шаг анализа для колонки ' + nextCol + '.';
    }
    
    // Для последующих шагов (B→C, C→D и т.д.) - берем только последние 2 ячейки
    if (filledCells.length >= 2) {
      var lastCell = filledCells[filledCells.length - 1];
      var prevCell = filledCells[filledCells.length - 2];
      
      return 'Предыдущий результат (' + prevCell.column + '): ' + prevCell.value +
             '\n\nТекущий результат (' + lastCell.column + '): ' + lastCell.value +
             '\n\nПродолжи логическую цепочку для колонки ' + nextCol + '.';
    }
    
    return 'Продолжи анализ для колонки ' + nextCol + '.';
    
  } catch (error) {
    addSystemLog('Ошибка минимального контекста: ' + error.message, 'ERROR', 'SMART_CHAIN');
    return 'Продолжи анализ.';
  }
}

/**
 * Optimized Gemini call for chain processing
 */
function callGeminiForOptimizedChain(prompt, row) {
  try {
    // Используем увеличенные лимиты для цепочек
    return GM(prompt, 100000, 0.7);  // Увеличенный лимит токенов
  } catch (error) {
    addSystemLog('Ошибка вызова Gemini для цепочки: ' + error.message, 'ERROR', 'SMART_CHAIN');
    return 'Error: ' + error.message;
  }
}