/**
 * Conditional Gemini Service
 * GM_IF функции и утилиты для работы с условной обработкой
 */

/**
 * Условная функция Gemini - выполняет запрос только если условие истинно
 */
function GM_IF(condition, prompt, maxTokens, temperature, _tick) {
  try {
    var condVal = false;
    
    // Нормализуем вход в одно скалярное значение
    var raw = condition;
    if (Array.isArray(raw)) {
      raw = (raw[0] && raw[0].length ? raw[0][0] : raw[0] || '');
    }
    
    var t = typeof raw;
    if (t === 'boolean') {
      condVal = raw === true;
    } else if (t === 'number') {
      condVal = raw !== 0;
    } else if (t === 'string') {
      var s = raw.trim().toLowerCase();
      // TRUE/FALSE в любой локали: ИСТИНА/ЛОЖЬ; также 1/0; пустая строка → false
      condVal = (s === 'true' || s === 'истина' || s === '1' || s === 'да');
    } else {
      condVal = !!raw;
    }
    
    // Если условие ложно - возвращаем пустую строку
    if (!condVal) return "";
    
    // Нормализуем prompt
    if (Array.isArray(prompt)) prompt = prompt[0][0];
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) return "";
    
    // Устанавливаем дефолтные значения
    if (maxTokens == null) maxTokens = 25000;
    if (temperature == null) temperature = 0.7;
    
    // Вызываем основную функцию GM
    return GM(prompt, maxTokens, temperature);
  } catch (e) {
    logMessage('❌ GM_IF ошибка: ' + e.message, 'ERROR');
    return 'Error: ' + e.message;
  }
}

/**
 * Условная статическая функция Gemini
 */
function GM_IF_STATIC(condition, prompt, maxTokens, temperature, _tick) {
  try {
    // Проверяем условие так же как в GM_IF
    var condVal = false;
    var raw = condition;
    if (Array.isArray(raw)) {
      raw = (raw[0] && raw[0].length ? raw[0][0] : raw[0] || '');
    }
    
    var t = typeof raw;
    if (t === 'boolean') {
      condVal = raw === true;
    } else if (t === 'number') {
      condVal = raw !== 0;
    } else if (t === 'string') {
      var s = raw.trim().toLowerCase();
      condVal = (s === 'true' || s === 'истина' || s === '1' || s === 'да');
    } else {
      condVal = !!raw;
    }
    
    if (!condVal) return "";
    
    // Нормализуем prompt
    if (Array.isArray(prompt)) prompt = prompt[0][0];
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) return "";
    
    // Вызываем статическую версию
    return GM_STATIC(prompt, maxTokens, temperature);
  } catch (e) {
    logMessage('❌ GM_IF_STATIC ошибка: ' + e.message, 'ERROR');
    return 'Error: ' + e.message;
  }
}

/**
 * Преобразование номера колонки в букву (A, B, C, ...)
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
 * Преобразование буквы колонки в номер (A→1, B→2, ...)
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
 * Парсинг A1 нотации (например "Распаковка!B3" или "B3")
 */
function parseTargetA1(a1) {
  var raw = String(a1 || '').trim();
  if (!raw) throw new Error('Пустая ссылка на ячейку');
  
  var m = raw.match(/^([^!]+)!([A-Za-z]+)(\\d+)$/);
  var sheetName, colLetters, row;
  
  if (m) {
    sheetName = m[1];
    colLetters = m[2];
    row = parseInt(m[3], 10);
  } else {
    var m2 = raw.match(/^([A-Za-z]+)(\\d+)$/);
    if (!m2) throw new Error('Неверный формат ячейки: ' + raw);
    sheetName = 'Распаковка'; // дефолтный лист
    colLetters = m2[1];
    row = parseInt(m2[2], 10);
  }
  
  if (sheetName !== 'Распаковка') {
    throw new Error('Ожидался лист "Распаковка", получено: ' + sheetName);
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
 * Получить значение ячейки с автопреобразованием Markdown
 */
function getCellValue(sheetName, row, col) {
  try {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return null;
    
    var value = sheet.getRange(row, col).getValue();
    
    // Автопреобразование Markdown для текстовых значений (кроме колонки A)
    if (value && typeof value === 'string' && col > 1) {
      var processed = processGeminiResponse(value);
      if (processed !== value) {
        sheet.getRange(row, col).setValue(processed);
        logMessage('🔄 Markdown преобразован в ' + sheet.getRange(row, col).getA1Notation(), 'INFO');
        return processed;
      }
    }
    
    return value;
  } catch (e) {
    logMessage('❌ Ошибка чтения ячейки ' + sheetName + '(' + row + ',' + col + '): ' + e.message, 'ERROR');
    return null;
  }
}

/**
 * Установить формулу в ячейку
 */
function setFormulaToCell(row, col, formula) {
  try {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName('Распаковка');
    if (!sheet) {
      logMessage('❌ Лист "Распаковка" не найден', 'ERROR');
      return false;
    }
    
    var cell = sheet.getRange(row, col);
    cell.setFormula(formula);
    logMessage('✅ Формула установлена в ' + cell.getA1Notation() + ': ' + formula.slice(0, 80) + '...', 'INFO');
    return true;
  } catch (e) {
    logMessage('❌ Ошибка установки формулы в (' + row + ',' + col + '): ' + e.message, 'ERROR');
    return false;
  }
}

/**
 * Получить формулу из Prompt_box
 */
function getPromptFormula(rowIndex) {
  try {
    var ss = SpreadsheetApp.getActive();
    var promptSheet = ss.getSheetByName('Prompt_box');
    if (!promptSheet) {
      logMessage('❌ Лист "Prompt_box" не найден', 'ERROR');
      return null;
    }
    
    var rng = promptSheet.getRange(rowIndex, 6); // F
    var formula = rng.getFormula(); // ВАЖНО: формула, а не значение
    if (!formula || !formula.trim()) {
      logMessage(`ℹ️ Формула в Prompt_box!F${rowIndex} пуста`, 'INFO');
      return null;
    }
    
    logMessage(`📥 Формула из Prompt_box!F${rowIndex}: ${formula.slice(0,80)}...`, 'DEBUG');
    return formula;
  } catch (e) {
    logMessage('❌ Ошибка получения формулы из F' + rowIndex + ': ' + e.message, 'ERROR');
    return null;
  }
}