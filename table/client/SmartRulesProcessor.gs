/**
 * Smart Rules Processor
 * Обработчик умных правил для выделенных ячеек
 */

function applySmartRulesToSelection() {
  try {
    var ui = SpreadsheetApp.getUi();
    var range = SpreadsheetApp.getActiveRange();
    if (!range) {
      ui.alert('Выделите ячейку с текстом!');
      return;
    }
    var cellValue = range.getValue();
    if (typeof cellValue !== 'string' || !cellValue) {
      ui.alert('Ячейка пуста или не содержит текст.');
      return;
    }

    var rules = getRulesFromSheet();
    if (rules.length === 0) {
      ui.alert('Правила не найдены. Создайте лист "Правила".');
      return;
    }

    var processedText = applyRulesWithFormulaGeneration(cellValue, rules);

    if (processedText === cellValue) {
      ui.alert('Замены по правилам не найдены.');
      return;
    }

    var response = ui.alert('Применить изменения?', 
      'Результат:\n' + processedText.substring(0, 200) + '...\n\n' + 
      'ОК - заменить в текущей ячейке, Отмена - в соседней.',
      ui.ButtonSet.OK_CANCEL);

    if (response === ui.Button.OK) {
      range.setValue(processedText);
    } else {
      range.offset(0, 1).setValue(processedText);
    }

  } catch (e) {
    SpreadsheetApp.getUi().alert('Ошибка: ' + e.message);
  }
}

function applyRulesWithFormulaGeneration(text, rules) {
  var processedText = text;
  var replacements = [];

  rules.forEach(function(rule) {
    var regex = new RegExp('\\b' + escapeRegExp(rule.keyword) + '\\b', 'gi');
    if (regex.test(processedText)) {
      replacements.push(rule);
      processedText = processedText.replace(regex, '${' + rule.reference + '}');
    }
  });

  if (replacements.length === 0) {
    return text;
  }

  return generateFormulaFromTemplate(processedText);
}

function generateFormulaFromTemplate(template) {
  var parts = [];
  var currentPos = 0;
  var regex = /\$\{([^}]+)\}/g;
  var match;

  while ((match = regex.exec(template)) !== null) {
    if (match.index > currentPos) {
      parts.push('"' + template.substring(currentPos, match.index).replace(/"/g, '""') + '"');
    }
    parts.push(match[1]);
    currentPos = regex.lastIndex;
  }

  if (currentPos < template.length) {
    parts.push('"' + template.substring(currentPos).replace(/"/g, '""') + '"');
  }

  return (parts.length > 0) ? '=' + parts.join(' & ') : '=""';
}

function showSmartRulesHelp() {
  var rules = getRulesFromSheet();
  var helpText = 'УМНЫЕ ПРАВИЛА:\n\n' +
    '1. Создайте лист "Правила" (колонки: Ключевое слово, Ссылка).\n' +
    '2. Напишите текст с ключевыми словами в ячейке.\n' +
    '3. Выделите ячейку и вызовите "Умные правила" из меню.\n\n' + 
    'Загружено правил: ' + rules.length;
  SpreadsheetApp.getUi().alert(helpText);
}

function initializeSmartRules() {
  getOrCreateRulesSheet();
  SpreadsheetApp.getUi().alert('Лист "Правила" создан с примерами.');
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function openRulesSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rulesSheet = ss.getSheetByName('Правила');
  if (rulesSheet) {
    ss.setActiveSheet(rulesSheet);
  } else {
    if (SpreadsheetApp.getUi().alert('Лист "Правила" не найден. Создать?', SpreadsheetApp.getUi().ButtonSet.YES_NO) === SpreadsheetApp.getUi().Button.YES) {
      initializeSmartRules();
    }
  }
}
function getRulesFromSheet() {
    // Implementation to get rules from a sheet
    return [];
}
function getOrCreateRulesSheet() {
    // Implementation to get or create the sheet
}
