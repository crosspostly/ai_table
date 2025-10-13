/**
 * Macro Helpers
 * Универсальные функции для макросов с горячими клавишами
 * 
 * ВАЖНО: Эти функции работают с ТЕКУЩЕЙ выделенной ячейкой,
 * а не с конкретной захардкоженной!
 */

/**
 * 🔄 Преобразовать выделенную ячейку в GM()
 * Назначьте на горячую клавишу через макрос!
 * Рекомендуемая клавиша: Ctrl+Alt+Shift+1
 */
function macroConvertToGM() {
  // Просто вызываем существующую функцию
  // Она уже работает с sheet.getActiveRange()
  convertTextToGMFormula();
}

/**
 * 🔒 Преобразовать выделенную ячейку в GM_STATIC()
 * Назначьте на горячую клавишу через макрос!
 * Рекомендуемая клавиша: Ctrl+Alt+Shift+2
 */
function macroConvertToGMStatic() {
  // Просто вызываем существующую функцию
  // Она уже работает с sheet.getActiveRange()
  convertTextToGMStaticFormula();
}

/**
 * 🧠 Применить умные правила к выделенной ячейке
 * Назначьте на горячую клавишу через макрос!
 * Рекомендуемая клавиша: Ctrl+Alt+Shift+3
 */
function macroApplySmartRules() {
  // Вызываем функцию умных правил
  applySmartRulesToSelection();
}

/**
 * ⚡ БЫСТРОЕ ПРЕОБРАЗОВАНИЕ - просто вызовите эту функцию
 * Работает с любой выделенной ячейкой!
 * 
 * Использование:
 * 1. Выделите ячейку с текстом
 * 2. Запустите эту функцию (или назначьте на горячую клавишу)
 * 3. Текст станет формулой =GM("текст")
 */
function quickConvertGM() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var range = sheet.getActiveRange();
    
    if (!range) {
      SpreadsheetApp.getUi().alert('Выделите ячейку!');
      return;
    }
    
    // Вызываем конвертер
    convertTextToGMFormula();
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('Ошибка: ' + error.message);
  }
}

/**
 * ⚡ БЫСТРОЕ ПРЕОБРАЗОВАНИЕ В STATIC
 */
function quickConvertGMStatic() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var range = sheet.getActiveRange();
    
    if (!range) {
      SpreadsheetApp.getUi().alert('Выделите ячейку!');
      return;
    }
    
    convertTextToGMStaticFormula();
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('Ошибка: ' + error.message);
  }
}
