/**\r
 * Conditional Gemini Service\r
 * GM_IF функции и утилиты для работы с условной обработкой\r
 */\r
\r
/**\r
 * Условная функция Gemini - выполняет запрос только если условие истинно\r
 */\r
function GM_IF(condition, prompt, maxTokens, temperature, _tick) {\r
  try {\r
    var condVal = false;\r
    \r
    // Нормализуем вход в одно скалярное значение\r
    var raw = condition;\r
    if (Array.isArray(raw)) {\r
      raw = (raw[0] && raw[0].length ? raw[0][0] : raw[0] || '');\r
    }\r
    \r
    var t = typeof raw;\r
    if (t === 'boolean') {\r
      condVal = raw === true;\r
    } else if (t === 'number') {\r
      condVal = raw !== 0;\r
    } else if (t === 'string') {\r
      var s = raw.trim().toLowerCase();\r
      // TRUE/FALSE в любой локали: ИСТИНА/ЛОЖЬ; также 1/0; пустая строка → false\r
      condVal = (s === 'true' || s === 'истина' || s === '1' || s === 'да');\r
    } else {\r
      condVal = !!raw;\r
    }\r
    \r
    // Если условие ложно - возвращаем пустую строку\r
    if (!condVal) return "";\r
    \r
    // Нормализуем prompt\r
    if (Array.isArray(prompt)) prompt = prompt[0][0];\r
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) return "";\r
    \r
    // Устанавливаем дефолтные значения\r
    if (maxTokens == null) maxTokens = 25000;\r
    if (temperature == null) temperature = 0.7;\r
    \r
    // Вызываем основную функцию GM\r
    return GM(prompt, maxTokens, temperature);\r
  } catch (e) {\r
    logMessage('❌ GM_IF ошибка: ' + e.message, 'ERROR');\r
    return 'Error: ' + e.message;\r
  }\r
}\r
\r
// GM_IF_STATIC removed - functionality handled by client-side version in ThinClient.gs\r
\r
/**\r
 * Преобразование номера колонки в букву (A, B, C, ...)\r
 */\r
function columnToLetter(column) {\r
  var temp, letter = '';\r
  while (column > 0) {\r
    temp = (column - 1) % 26;\r
    letter = String.fromCharCode(temp + 65) + letter;\r
    column = (column - temp - 1) / 26;\r
  }\r
  return letter;\r
}\r
\r
/**\r
 * Преобразование буквы колонки в номер (A→1, B→2, ...)\r
 */\r
function letterToColumn(letters) {\r
  var s = String(letters || '').toUpperCase().trim();\r
  var col = 0;\r
  for (var i = 0; i < s.length; i++) {\r
    col = col * 26 + (s.charCodeAt(i) - 64);\r
  }\r
  return col;\r
}\r
\r
/**\r
 * Парсинг A1 нотации (например "Распаковка!B3" или "B3")\r
 */\r
function parseTargetA1(a1) {\r
  var raw = String(a1 || '').trim();\r
  if (!raw) throw new Error('Пустая ссылка на ячейку');\r
  \r
  var m = raw.match(/^([^!]+)!([A-Za-z]+)(\\d+)$/);\r
  var sheetName, colLetters, row;\r
  \r
  if (m) {\r
    sheetName = m[1];\r
    colLetters = m[2];\r
    row = parseInt(m[3], 10);\r
  } else {\r
    var m2 = raw.match(/^([A-Za-z]+)(\\d+)$/);\r
    if (!m2) throw new Error('Неверный формат ячейки: ' + raw);\r
    sheetName = 'Распаковка'; // дефолтный лист\r
    colLetters = m2[1];\r
    row = parseInt(m2[2], 10);\r
  }\r
  \r
  if (sheetName !== 'Распаковка') {\r
    throw new Error('Ожидался лист "Распаковка", получено: ' + sheetName);\r
  }\r
  \r
  var col = letterToColumn(colLetters);\r
  return { \r
    sheetName: sheetName, \r
    row: row, \r
    col: col, \r
    a1: (colLetters.toUpperCase() + row) \r
  };\r
}\r
\r
/**\r
 * Получить значение ячейки с автопреобразованием Markdown\r
 */\r
function getCellValue(sheetName, row, col) {\r
  try {\r
    var ss = SpreadsheetApp.getActive();\r
    var sheet = ss.getSheetByName(sheetName);\r
    if (!sheet) return null;\r
    \r
    var value = sheet.getRange(row, col).getValue();\r
    \r
    // Автопреобразование Markdown для текстовых значений (кроме колонки A)\r
    if (value && typeof value === 'string' && col > 1) {\r
      var processed = processGeminiResponse(value);\r
      if (processed !== value) {\r
        sheet.getRange(row, col).setValue(processed);\r
        logMessage('🔄 Markdown преобразован в ' + sheet.getRange(row, col).getA1Notation(), 'INFO');\r
        return processed;\r
      }\r
    }\r
    \r
    return value;\r
  } catch (e) {\r
    logMessage('❌ Ошибка чтения ячейки ' + sheetName + '(' + row + ',' + col + '): ' + e.message, 'ERROR');\r
    return null;\r
  }\r
}\r
\r
/**\r
 * Установить формулу в ячейку\r
 */\r
function setFormulaToCell(row, col, formula) {\r
  try {\r
    var ss = SpreadsheetApp.getActive();\r
    var sheet = ss.getSheetByName('Распаковка');\r
    if (!sheet) {\r
      logMessage('❌ Лист "Распаковка" не найден', 'ERROR');\r
      return false;\r
    }\r
    \r
    var cell = sheet.getRange(row, col);\r
    cell.setFormula(formula);\r
    logMessage('✅ Формула установлена в ' + cell.getA1Notation() + ': ' + formula.slice(0, 80) + '...', 'INFO');\r
    return true;\r
  } catch (e) {\r
    logMessage('❌ Ошибка установки формулы в (' + row + ',' + col + '): ' + e.message, 'ERROR');\r
    return false;\r
  }\r
}\r
\r
/**\r
 * Получить формулу из Prompt_box\r
 */\r
function getPromptFormula(rowIndex) {\r
  try {\r
    var ss = SpreadsheetApp.getActive();\r
    var promptSheet = ss.getSheetByName('Prompt_box');\r
    if (!promptSheet) {\r
      logMessage('❌ Лист "Prompt_box" не найден', 'ERROR');\r
      return null;\r
    }\r
    \r
    var rng = promptSheet.getRange(rowIndex, 6); // F\r
    var formula = rng.getFormula(); // ВАЖНО: формула, а не значение\r
    if (!formula || !formula.trim()) {\r
      logMessage(`ℹ️ Формула в Prompt_box!F${rowIndex} пуста`, 'INFO');\r
      return null;\r
    }\r
    \r
    logMessage(`📥 Формула из Prompt_box!F${rowIndex}: ${formula.slice(0,80)}...`, 'DEBUG');\r
    return formula;\r
  } catch (e) {\r
    logMessage('❌ Ошибка получения формулы из F' + rowIndex + ': ' + e.message, 'ERROR');\r
    return null;\r
  }\r
}