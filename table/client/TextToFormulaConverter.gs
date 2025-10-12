/**
 * Text to Formula Converter
 * Простое преобразование текста в формулу GM()
 * 
 * Функционал:
 * - Берёт текст из ячейки
 * - Оборачивает в =GM("текст")
 * - Экранирует кавычки правильно
 */

/**
 * Преобразовать текст в формулу GM()
 * Вызывается из меню
 */
function convertTextToGMFormula() {
  try {
    var ui = SpreadsheetApp.getUi();
    var sheet = SpreadsheetApp.getActiveSheet();
    var range = sheet.getActiveRange();
    
    if (!range) {
      ui.alert('⚠️ Внимание', 'Выделите ячейку или диапазон ячеек с текстом!', ui.ButtonSet.OK);
      return;
    }
    
    // Получаем размер выделенного диапазона
    var numRows = range.getNumRows();
    var numCols = range.getNumColumns();
    var values = range.getValues();
    var formulas = [];
    var convertedCount = 0;
    
    // Обрабатываем каждую ячейку
    for (var row = 0; row < numRows; row++) {
      var formulaRow = [];
      for (var col = 0; col < numCols; col++) {
        var cellValue = values[row][col];
        
        // Пропускаем пустые ячейки
        if (!cellValue || cellValue === '') {
          formulaRow.push('');
          continue;
        }
        
        // Если это уже формула - пропускаем
        var originalFormula = range.getCell(row + 1, col + 1).getFormula();
        if (originalFormula && originalFormula.indexOf('=') === 0) {
          formulaRow.push(originalFormula);
          continue;
        }
        
        // Преобразуем текст в формулу
        var text = String(cellValue);
        var formula = createGMFormula(text);
        formulaRow.push(formula);
        convertedCount++;
      }
      formulas.push(formulaRow);
    }
    
    if (convertedCount === 0) {
      ui.alert('ℹ️ Ничего не изменилось', 
        'Выделенные ячейки пустые или уже содержат формулы.',
        ui.ButtonSet.OK);
      return;
    }
    
    // Спрашиваем подтверждение
    var response = ui.alert('✅ Преобразование готово',
      'Найдено ячеек с текстом: ' + convertedCount + '\n\n' +
      'Они будут преобразованы в формулы =GM("текст")\n\n' +
      '⚠️ Это действие нельзя отменить через Ctrl+Z!\n' +
      'Убедитесь что выделили правильные ячейки.\n\n' +
      'Продолжить?',
      ui.ButtonSet.OK_CANCEL);
    
    if (response !== ui.Button.OK) {
      return;
    }
    
    // Записываем формулы
    range.setFormulas(formulas);
    
    addSystemLog('✓ Преобразовано в GM(): ' + convertedCount + ' ячеек в диапазоне ' + range.getA1Notation(), 'INFO', 'TEXT_TO_FORMULA');
    
    ui.alert('✅ Готово!', 
      'Преобразовано ячеек: ' + convertedCount + '\n\n' +
      'Формулы GM() начнут выполняться автоматически.\n' +
      'Результаты появятся через несколько секунд.',
      ui.ButtonSet.OK);
    
  } catch (error) {
    addSystemLog('Ошибка преобразования текста в формулу: ' + error.message, 'ERROR', 'TEXT_TO_FORMULA');
    SpreadsheetApp.getUi().alert('❌ Ошибка', 
      'Не удалось преобразовать текст в формулу:\n\n' + error.message,
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Создаёт формулу GM() из текста с правильным экранированием
 * @param {string} text - исходный текст
 * @return {string} - формула =GM("...")
 */
function createGMFormula(text) {
  // Убираем лишние пробелы по краям
  text = String(text).trim();
  
  // Экранируем кавычки: " → ""
  text = text.replace(/"/g, '""');
  
  // Создаём формулу
  return '=GM("' + text + '")';
}

/**
 * Преобразовать текст в формулу GM_STATIC()
 * Для единоразового выполнения (не обновляется при изменениях)
 */
function convertTextToGMStaticFormula() {
  try {
    var ui = SpreadsheetApp.getUi();
    var sheet = SpreadsheetApp.getActiveSheet();
    var range = sheet.getActiveRange();
    
    if (!range) {
      ui.alert('⚠️ Внимание', 'Выделите ячейку или диапазон ячеек с текстом!', ui.ButtonSet.OK);
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
        
        if (!cellValue || cellValue === '') {
          formulaRow.push('');
          continue;
        }
        
        var originalFormula = range.getCell(row + 1, col + 1).getFormula();
        if (originalFormula && originalFormula.indexOf('=') === 0) {
          formulaRow.push(originalFormula);
          continue;
        }
        
        var text = String(cellValue).trim();
        var escapedText = text.replace(/"/g, '""');
        formulaRow.push('=GM_STATIC("' + escapedText + '")');
        convertedCount++;
      }
      formulas.push(formulaRow);
    }
    
    if (convertedCount === 0) {
      ui.alert('ℹ️ Ничего не изменилось', 
        'Выделенные ячейки пустые или уже содержат формулы.',
        ui.ButtonSet.OK);
      return;
    }
    
    var response = ui.alert('✅ Преобразование готово',
      'Найдено ячеек с текстом: ' + convertedCount + '\n\n' +
      'Они будут преобразованы в формулы =GM_STATIC("текст")\n\n' +
      '💡 STATIC версия выполнится один раз и сохранит результат.\n' +
      'Формула не будет пересчитываться при изменениях.\n\n' +
      'Продолжить?',
      ui.ButtonSet.OK_CANCEL);
    
    if (response !== ui.Button.OK) {
      return;
    }
    
    range.setFormulas(formulas);
    
    addSystemLog('✓ Преобразовано в GM_STATIC(): ' + convertedCount + ' ячеек', 'INFO', 'TEXT_TO_FORMULA');
    
    ui.alert('✅ Готово!', 
      'Преобразовано ячеек: ' + convertedCount + '\n\n' +
      'Формулы GM_STATIC() выполнятся один раз.',
      ui.ButtonSet.OK);
    
  } catch (error) {
    addSystemLog('Ошибка преобразования в GM_STATIC: ' + error.message, 'ERROR', 'TEXT_TO_FORMULA');
    SpreadsheetApp.getUi().alert('❌ Ошибка', 
      'Не удалось преобразовать:\n\n' + error.message,
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Показать справку по преобразованию текста в формулы
 */
function showTextToFormulaHelp() {
  var ui = SpreadsheetApp.getUi();
  
  var helpText = '📝 ТЕКСТ В ФОРМУЛУ - Справка\n\n';
  helpText += '━━━━━━━━━━━━━━━━━━━━━━\n';
  helpText += '🎯 ЧТО ЭТО ДЕЛАЕТ:\n';
  helpText += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  helpText += 'Автоматически оборачивает ваш текст\n';
  helpText += 'в формулу для работы с Gemini AI.\n\n';
  
  helpText += '📋 КАК ИСПОЛЬЗОВАТЬ:\n\n';
  
  helpText += '1️⃣ Напишите текст в ячейке:\n';
  helpText += '   "Проанализируй эти данные"\n\n';
  
  helpText += '2️⃣ Выделите ячейку (или несколько ячеек)\n\n';
  
  helpText += '3️⃣ Нажмите в меню:\n';
  helpText += '   🤖 Table AI → 📝 Текст в формулу → GM()\n\n';
  
  helpText += '4️⃣ Текст автоматически преобразуется:\n';
  helpText += '   =GM("Проанализируй эти данные")\n\n';
  
  helpText += '━━━━━━━━━━━━━━━━━━━━━━\n';
  helpText += '🔧 ДВА РЕЖИМА:\n';
  helpText += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  helpText += '• GM() - динамическая формула\n';
  helpText += '  Обновляется при изменении данных\n\n';
  
  helpText += '• GM_STATIC() - статическая формула\n';
  helpText += '  Выполняется один раз, сохраняет результат\n\n';
  
  helpText += '━━━━━━━━━━━━━━━━━━━━━━\n';
  helpText += '💡 АВТОМАТИЧЕСКОЕ ЭКРАНИРОВАНИЕ:\n';
  helpText += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  helpText += 'Система правильно обрабатывает:\n';
  helpText += '• Кавычки (" → "")\n';
  helpText += '• Многострочный текст\n';
  helpText += '• Спецсимволы\n\n';
  
  helpText += '⚠️ ВАЖНО:\n';
  helpText += '• Пустые ячейки пропускаются\n';
  helpText += '• Существующие формулы не изменяются\n';
  helpText += '• Работает с диапазонами (выделите несколько ячеек)';
  
  ui.alert('📝 Текст в формулу', helpText, ui.ButtonSet.OK);
}
