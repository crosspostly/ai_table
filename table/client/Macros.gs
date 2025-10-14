/**
 * ⌨️ МАКРОСЫ ДЛЯ ГОРЯЧИХ КЛАВИШ
 * 
 * Скопируйте этот файл в Apps Script вашей таблицы!
 * Расширения → Apps Script → Вставить этот код
 * 
 * Затем назначьте горячие клавиши:
 * Расширения → Макросы → Управление макросами
 */

/**
 * 🔄 GM() - Обновляемая формула
 * Назначьте: Ctrl+Alt+Shift+1
 * 
 * Использование:
 * 1. Выделите ячейку с текстом
 * 2. Нажмите Ctrl+Alt+Shift+1
 * 3. Текст станет =GM("текст")
 */
function GM1() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var range = sheet.getActiveRange();
    
    if (!range) {
      SpreadsheetApp.getUi().alert('⚠️ Выделите ячейку с текстом!');
      return;
    }
    
    var numRows = range.getNumRows();
    var numCols = range.getNumColumns();
    var values = range.getValues();
    var formulas = [];
    var convertedCount = 0;
    
    for (var row = 0; row < numRows; row++) {
      var formulaRow = [];
      for (var col = 0; col < numCols; col++) {
        var cellValue = values[row][col];
        
        // Проверяем что значение существует
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          formulaRow.push('');
          continue;
        }
        
        var originalFormula = range.getCell(row + 1, col + 1).getFormula();
        if (originalFormula && originalFormula.indexOf('=') === 0) {
          formulaRow.push(originalFormula);
          continue;
        }
        
        // Безопасное преобразование в строку
        var text = String(cellValue);
        if (!text || text.length === 0) {
          formulaRow.push('');
          continue;
        }
        
        text = text.trim();
        var escapedText = text.replace(/"/g, '""');
        formulaRow.push('=GM("' + escapedText + '")');
        convertedCount++;
      }
      formulas.push(formulaRow);
    }
    
    if (convertedCount === 0) {
      return;
    }
    
    range.setFormulas(formulas);
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Ошибка: ' + error.message);
  }
}

/**
 * 🔒 GM_STATIC() - Одноразовая формула
 * Назначьте: Ctrl+Alt+Shift+2
 * 
 * Использование:
 * 1. Выделите ячейку с текстом
 * 2. Нажмите Ctrl+Alt+Shift+2
 * 3. Текст станет =GM_STATIC("текст")
 */
function GM2() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var range = sheet.getActiveRange();
    
    if (!range) {
      SpreadsheetApp.getUi().alert('⚠️ Выделите ячейку с текстом!');
      return;
    }
    
    var numRows = range.getNumRows();
    var numCols = range.getNumColumns();
    var values = range.getValues();
    var formulas = [];
    var convertedCount = 0;
    
    for (var row = 0; row < numRows; row++) {
      var formulaRow = [];
      for (var col = 0; col < numCols; col++) {
        var cellValue = values[row][col];
        
        // Проверяем что значение существует
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          formulaRow.push('');
          continue;
        }
        
        var originalFormula = range.getCell(row + 1, col + 1).getFormula();
        if (originalFormula && originalFormula.indexOf('=') === 0) {
          formulaRow.push(originalFormula);
          continue;
        }
        
        // Безопасное преобразование в строку
        var text = String(cellValue);
        if (!text || text.length === 0) {
          formulaRow.push('');
          continue;
        }
        
        text = text.trim();
        var escapedText = text.replace(/"/g, '""');
        formulaRow.push('=GM_STATIC("' + escapedText + '")');
        convertedCount++;
      }
      formulas.push(formulaRow);
    }
    
    if (convertedCount === 0) {
      return;
    }
    
    range.setFormulas(formulas);
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Ошибка: ' + error.message);
  }
}

/**
 * 🧠 Умные правила
 * Назначьте: Ctrl+Alt+Shift+3
 * 
 * Работает если у вас есть лист "Правила"
 */
function GM3() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var range = sheet.getActiveRange();
    
    if (!range) {
      SpreadsheetApp.getUi().alert('⚠️ Выделите ячейку с текстом!');
      return;
    }
    
    // Проверяем есть ли функция умных правил
    if (typeof applySmartRulesToSelection !== 'undefined') {
      applySmartRulesToSelection();
    } else {
      SpreadsheetApp.getUi().alert('⚠️ Функция умных правил не найдена!\n\nИспользуйте полную версию Table AI.');
    }
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Ошибка: ' + error.message);
  }
}

/**
 * 📝 Справка по горячим клавишам
 */
function showMacroHelp() {
  var ui = SpreadsheetApp.getUi();
  
  var helpText = '⌨️ ГОРЯЧИЕ КЛАВИШИ\n\n';
  helpText += '🔄 GM() - Обновляемая:\n';
  helpText += '   Ctrl+Alt+Shift+1\n';
  helpText += '   Пересчитывается при изменениях\n';
  helpText += '   Тратит API запросы\n\n';
  
  helpText += '🔒 GM_STATIC() - Одноразовая:\n';
  helpText += '   Ctrl+Alt+Shift+2\n';
  helpText += '   Выполняется один раз\n';
  helpText += '   Экономит API\n\n';
  
  helpText += '🧠 Умные правила:\n';
  helpText += '   Ctrl+Alt+Shift+3\n';
  helpText += '   Замена ключевых слов\n\n';
  
  helpText += '💡 КАК ИСПОЛЬЗОВАТЬ:\n';
  helpText += '1. Выделите ячейку с текстом\n';
  helpText += '2. Нажмите горячую клавишу\n';
  helpText += '3. Готово!\n\n';
  
  helpText += '📝 КАК НАСТРОИТЬ:\n';
  helpText += 'Расширения → Макросы → Управление\n';
  helpText += 'Назначьте GM1, GM2, GM3 на клавиши';
  
  ui.alert('⌨️ Справка', helpText, ui.ButtonSet.OK);
}
