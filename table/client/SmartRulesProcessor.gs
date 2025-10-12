/**
 * Smart Rules Processor
 * Обработчик умных правил для выделенных ячеек
 * 
 * Функционал:
 * - Применение правил к выделенному тексту
 * - Замена ключевых слов на ссылки
 * - Создание формул с подставленными данными
 */

/**
 * Обработать выделенную ячейку по умным правилам
 * Вызывается из меню "Умные правила"
 */
function applySmartRulesToSelection() {
  try {
    var ui = SpreadsheetApp.getUi();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var range = sheet.getActiveRange();
    
    if (!range) {
      ui.alert('⚠️ Внимание', 'Выделите ячейку с текстом для обработки!', ui.ButtonSet.OK);
      return;
    }
    
    // Получаем значение ячейки
    var cellValue = range.getValue();
    
    if (!cellValue || typeof cellValue !== 'string') {
      ui.alert('⚠️ Внимание', 'Выделенная ячейка пуста или не содержит текст!', ui.ButtonSet.OK);
      return;
    }
    
    addSystemLog('🧠 Обработка умных правил для: ' + range.getA1Notation(), 'INFO', 'SMART_RULES');
    
    // Загружаем правила
    var rules = getRulesFromSheet();
    
    if (rules.length === 0) {
      ui.alert('⚠️ Правила не найдены', 
        'Создайте лист "Правила" с колонками:\n\n' +
        '• Ключевое слово\n' +
        '• Ссылка на данные\n' +
        '• Описание\n\n' +
        'Или нажмите "Инициализировать правила" в меню DEV.',
        ui.ButtonSet.OK);
      return;
    }
    
    // Применяем правила
    var processedText = applyRulesWithFormulaGeneration(cellValue, rules);
    
    // Проверяем были ли замены
    if (processedText === cellValue) {
      ui.alert('ℹ️ Замены не найдены', 
        'В тексте не найдено ключевых слов из правил.\n\n' +
        'Доступные ключевые слова:\n' +
        rules.slice(0, 5).map(function(r) { return '• ' + r.keyword; }).join('\n') +
        (rules.length > 5 ? '\n... и ещё ' + (rules.length - 5) : ''),
        ui.ButtonSet.OK);
      return;
    }
    
    // Спрашиваем куда записать результат
    var response = ui.alert('✅ Правила применены',
      'Найдены замены! Результат:\n\n' +
      processedText.substring(0, 200) + (processedText.length > 200 ? '...' : '') +
      '\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      'Куда записать результат?\n\n' +
      '• ОК - заменить в текущей ячейке\n' +
      '• Отмена - записать в соседнюю ячейку справа',
      ui.ButtonSet.OK_CANCEL);
    
    if (response === ui.Button.OK) {
      // Заменяем в текущей ячейке
      range.setValue(processedText);
      addSystemLog('✓ Правила применены к ' + range.getA1Notation(), 'INFO', 'SMART_RULES');
    } else {
      // Записываем в соседнюю ячейку справа
      var targetCell = range.offset(0, 1);
      targetCell.setValue(processedText);
      addSystemLog('✓ Правила применены, результат в ' + targetCell.getA1Notation(), 'INFO', 'SMART_RULES');
      
      ui.alert('✅ Готово', 
        'Результат записан в ячейку ' + targetCell.getA1Notation(),
        ui.ButtonSet.OK);
    }
    
  } catch (error) {
    addSystemLog('Ошибка обработки умных правил: ' + error.message, 'ERROR', 'SMART_RULES');
    SpreadsheetApp.getUi().alert('❌ Ошибка', 
      'Не удалось применить правила:\n\n' + error.message,
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Применяет правила с генерацией формулы
 * @param {string} text - исходный текст
 * @param {Array<Object>} rules - массив правил
 * @return {string} - обработанный текст или формула
 */
function applyRulesWithFormulaGeneration(text, rules) {
  var processedText = text;
  var hasReplacements = false;
  var replacements = [];
  
  // Применяем каждое правило
  rules.forEach(function(rule) {
    var keyword = rule.keyword;
    var reference = rule.reference;
    
    // Создаём регулярное выражение для поиска ключевого слова (регистронезависимо)
    var regex = new RegExp('\\b' + escapeRegExp(keyword) + '\\b', 'gi');
    
    if (regex.test(processedText)) {
      hasReplacements = true;
      replacements.push({
        keyword: keyword,
        reference: reference
      });
      
      // Заменяем ключевое слово на маркер для последующей сборки формулы
      processedText = processedText.replace(regex, '${' + reference + '}');
      
      addSystemLog('  ✓ Применено правило: "' + keyword + '" → ' + reference, 'INFO', 'SMART_RULES');
    }
  });
  
  if (!hasReplacements) {
    return text; // Возвращаем оригинал если замен не было
  }
  
  // Генерируем формулу с конкатенацией
  var formula = generateFormulaFromTemplate(processedText);
  
  addSystemLog('✓ Сгенерирована формула с ' + replacements.length + ' заменами', 'INFO', 'SMART_RULES');
  
  return formula;
}

/**
 * Генерирует формулу из шаблона с маркерами ${reference}
 * @param {string} template - шаблон с маркерами
 * @return {string} - готовая формула
 */
function generateFormulaFromTemplate(template) {
  // Разбиваем по маркерам ${...}
  var parts = [];
  var currentPos = 0;
  var regex = /\$\{([^}]+)\}/g;
  var match;
  
  while ((match = regex.exec(template)) !== null) {
    // Добавляем текст до маркера
    if (match.index > currentPos) {
      var textPart = template.substring(currentPos, match.index);
      parts.push('"' + textPart.replace(/"/g, '""') + '"');
    }
    
    // Добавляем ссылку
    parts.push(match[1]);
    
    currentPos = regex.lastIndex;
  }
  
  // Добавляем оставшийся текст
  if (currentPos < template.length) {
    var remainingText = template.substring(currentPos);
    parts.push('"' + remainingText.replace(/"/g, '""') + '"');
  }
  
  // Объединяем части через &
  if (parts.length === 0) {
    return '=""';
  } else if (parts.length === 1) {
    return '=' + parts[0];
  } else {
    return '=' + parts.join(' & ');
  }
}

/**
 * Показать справку по умным правилам
 */
function showSmartRulesHelp() {
  var ui = SpreadsheetApp.getUi();
  
  var rules = getRulesFromSheet();
  var rulesCount = rules.length;
  
  var helpText = '🧠 УМНЫЕ ПРАВИЛА - Справка\n\n';
  helpText += '━━━━━━━━━━━━━━━━━━━━━━\n';
  helpText += '📋 КАК ИСПОЛЬЗОВАТЬ:\n';
  helpText += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  helpText += '1️⃣ Создайте лист "Правила" с тремя колонками:\n';
  helpText += '   • Ключевое слово (например: "наша ниша")\n';
  helpText += '   • Ссылка на данные (например: "A1" или "Параметры!B2")\n';
  helpText += '   • Описание (опционально)\n\n';
  
  helpText += '2️⃣ Напишите текст в ячейке, используя ключевые слова\n';
  helpText += '   Например: "Проанализируй наша ниша"\n\n';
  
  helpText += '3️⃣ Выделите ячейку и нажмите:\n';
  helpText += '   Меню → 🧠 Умные правила\n\n';
  
  helpText += '4️⃣ Система найдёт ключевые слова и создаст формулу:\n';
  helpText += '   ="Проанализируй " & A1\n\n';
  
  helpText += '━━━━━━━━━━━━━━━━━━━━━━\n';
  helpText += '📊 ТЕКУЩИЙ СТАТУС:\n';
  helpText += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  if (rulesCount > 0) {
    helpText += '✅ Загружено правил: ' + rulesCount + '\n\n';
    helpText += 'Доступные ключевые слова:\n';
    rules.slice(0, 10).forEach(function(rule) {
      helpText += '• "' + rule.keyword + '" → ' + rule.reference + '\n';
    });
    if (rulesCount > 10) {
      helpText += '... и ещё ' + (rulesCount - 10) + ' правил\n';
    }
  } else {
    helpText += '⚠️ Правила не настроены!\n';
    helpText += 'Создайте лист "Правила" или нажмите\n';
    helpText += 'DEV → Инициализировать правила';
  }
  
  ui.alert('🧠 Умные правила', helpText, ui.ButtonSet.OK);
}

/**
 * Инициализировать лист с правилами
 * Создаёт базовые примеры правил
 */
function initializeSmartRules() {
  try {
    var sheet = getOrCreateRulesSheet();
    var ui = SpreadsheetApp.getUi();
    
    ui.alert('✅ Успех',
      'Лист "Правила" создан!\n\n' +
      'Добавлены базовые примеры правил.\n\n' +
      'Откройте лист "Правила" чтобы:\n' +
      '• Посмотреть примеры\n' +
      '• Добавить свои правила\n' +
      '• Изменить существующие',
      ui.ButtonSet.OK);
    
    addSystemLog('✓ Лист "Правила" инициализирован', 'INFO', 'SMART_RULES');
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Ошибка',
      'Не удалось создать лист "Правила":\n\n' + error.message,
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Экранирует спецсимволы для RegExp
 * @param {string} string - строка для экранирования
 * @return {string}
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Открыть лист "Правила"
 * Если не существует - предложить создать
 */
function openRulesSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var rulesSheet = ss.getSheetByName('Правила');
    
    if (!rulesSheet) {
      var ui = SpreadsheetApp.getUi();
      var response = ui.alert('Лист "Правила" не найден',
        'Лист "Правила" ещё не создан.\n\nСоздать сейчас?',
        ui.ButtonSet.YES_NO);
      
      if (response === ui.Button.YES) {
        initializeSmartRules();
      }
      return;
    }
    
    // Активируем лист
    ss.setActiveSheet(rulesSheet);
    
    SpreadsheetApp.getUi().alert('✅ Готово',
      'Лист "Правила" открыт!\n\n' +
      'Здесь вы можете:\n' +
      '• Просмотреть существующие правила\n' +
      '• Добавить свои правила\n' +
      '• Изменить правила\n\n' +
      'Формат:\n' +
      'A - Ключевое слово\n' +
      'B - Ссылка на ячейку\n' +
      'C - Описание',
      SpreadsheetApp.getUi().ButtonSet.OK);
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Ошибка',
      'Не удалось открыть лист "Правила":\n\n' + error.message,
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
