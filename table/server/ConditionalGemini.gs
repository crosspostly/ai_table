// GM_IF() - реализация в GeminiClient.gs


// GM_IF_STATIC removed - functionality handled by client-side version in ThinClient.gs

/**
 * Convert номера колонки в букву (A, B, C, ...)
 */
function columnToLetter(column) {
  var temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

/**
 * Convert буквы колонки в номер (A→1, B→2, ...)
 */
function letterToColumn(letters) {
  var s = String(letters || '').toUpperCase().trim();
  var col = 0;
  for (var i = 0; i < s.length; i++) {
    col = col * 26 + (s.charCodeAt(i) - 64);
  }
  return col;
}

/**
 * Parse A1 нотации (например "Unpacking!B3" или "B3")
 */
function parseTargetA1(a1) {
  var raw = String(a1 || '').trim();
  if (!raw) throw new Error('Empty cell reference');
  
  var m = raw.match(/^([^!]+)!([A-Za-z]+)(\\d+)$/);
  var sheetName, colLetters, row;
  
  if (m) {
    sheetName = m[1];
    colLetters = m[2];
    row = parseInt(m[3], 10);
  } else {
    var m2 = raw.match(/^([A-Za-z]+)(\\d+)$/);
    if (!m2) throw new Error('Invalid cell format: ' + raw);
    sheetName = 'Unpacking'; // default sheet
    colLetters = m2[1];
    row = parseInt(m2[2], 10);
  }
  
  if (sheetName !== 'Unpacking') {
    throw new Error('Expected sheet "Unpacking", got: ' + sheetName);
  }
  
  var col = letterToColumn(colLetters);
  return { 
    sheetName: sheetName, 
    row: row, 
    col: col, 
    a1: (colLetters.toUpperCase() + row) 
  };
}

/**
 * Get value ячейки с автопреобразованием Markdown
 */
function getCellValue(sheetName, row, col) {
  try {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return null;
    
    var value = sheet.getRange(row, col).getValue();
    
    // Auto convert Markdown for text values (except column A)
    if (value && typeof value === 'string' && col > 1) {
      var processed = processGeminiResponse(value);
      if (processed !== value) {
        sheet.getRange(row, col).setValue(processed);
        logMessage('🔄 Markdown converted in ' + sheet.getRange(row, col).getA1Notation(), 'INFO');
        return processed;
      }
    }
    
    return value;
  } catch (e) {
    logMessage('❌ Error reading cell ' + sheetName + '(' + row + ',' + col + '): ' + e.message, 'ERROR');
    return null;
  }
}

/**
 * Set formula в ячейку
 */
function setFormulaToCell(row, col, formula) {
  try {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName('Unpacking');
    if (!sheet) {
      logMessage('❌ Sheet "Unpacking" not found', 'ERROR');
      return false;
    }
    
    var cell = sheet.getRange(row, col);
    cell.setFormula(formula);
    logMessage('✅ Formula set in ' + cell.getA1Notation() + ': ' + formula.slice(0, 80) + '...', 'INFO');
    return true;
  } catch (e) {
    logMessage('❌ Error setting formula in (' + row + ',' + col + '): ' + e.message, 'ERROR');
    return false;
  }
}

/**
 * Get formula из Prompt_box
 */
function getPromptFormula(rowIndex) {
  try {
    var ss = SpreadsheetApp.getActive();
    var promptSheet = ss.getSheetByName('Prompt_box');
    if (!promptSheet) {
      logMessage('❌ Sheet "Prompt_box" not found', 'ERROR');
      return null;
    }
    
    var rng = promptSheet.getRange(rowIndex, 6); // F
    var formula = rng.getFormula(); // IMPORTANT: formula not value
    if (!formula || !formula.trim()) {
      logMessage(`ℹ️ Formula in Prompt_box!F${rowIndex} is empty`, 'INFO');
      return null;
    }
    
    logMessage(`📥 Formula from Prompt_box!F${rowIndex}: ${formula.slice(0,80)}...`, 'DEBUG');
    return formula;
  } catch (e) {
    logMessage('❌ Error getting formula from F' + rowIndex + ': ' + e.message, 'ERROR');
    return null;
  }
}