/**
 * Rules Engine v2.0
 * Система правил для умной замены естественного языка на ссылки на данные
 * 
 * Функционал:
 * - Управление листом "Правила" 
 * - Автоматическое создание базовых правил
 * - Загрузка и применение пользовательских правил
 * - Валидация правил и ссылок
 */

/**
 * Название листа с правилами
 */
var RULES_SHEET_NAME = 'Правила';

/**
 * Получает правила из листа "Правила"
 * @return {Array<Object>} массив объектов {keyword: string, reference: string, description: string}
 */
function getRulesFromSheet() {
  try {
    var sheet = getOrCreateRulesSheet();
    var data = sheet.getDataRange().getValues();
    
    // Пропускаем заголовок (первая строка)
    var rules = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var keyword = row[0] ? String(row[0]).trim() : '';
      var reference = row[1] ? String(row[1]).trim() : '';
      var description = row[2] ? String(row[2]).trim() : '';
      
      // Пропускаем пустые строки
      if (!keyword || !reference) continue;
      
      // Валидируем ссылку
      if (!isValidReference(reference)) {
        addSystemLog('⚠️ Некорректная ссылка в правиле: "' + keyword + '" → ' + reference, 'WARN', 'RULES_ENGINE');
        continue;
      }
      
      rules.push({
        keyword: keyword,
        reference: reference,
        description: description
      });
    }
    
    addSystemLog('📋 Загружено правил: ' + rules.length, 'INFO', 'RULES_ENGINE');
    return rules;
    
  } catch (error) {
    addSystemLog('Ошибка загрузки правил: ' + error.message, 'ERROR', 'RULES_ENGINE');
    return getDefaultRules(); // Возвращаем базовые правила при ошибке
  }
}

/**
 * Получает или создает лист "Правила"
 * @return {Sheet}
 */
function getOrCreateRulesSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(RULES_SHEET_NAME);
  
  if (!sheet) {
    sheet = createRulesSheet(spreadsheet);
    addSystemLog('✨ Создан лист "' + RULES_SHEET_NAME + '" с базовыми правилами', 'INFO', 'RULES_ENGINE');
  }
  
  return sheet;
}

/**
 * Создает лист "Правила" с базовой структурой и примерами
 * @param {Spreadsheet} spreadsheet - таблица
 * @return {Sheet}
 */
function createRulesSheet(spreadsheet) {
  try {
    var sheet = spreadsheet.insertSheet(RULES_SHEET_NAME);
    
    // Настраиваем заголовки
    var headers = ['Ключевое слово', 'Ссылка на данные', 'Описание'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Форматируем заголовки
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold')
               .setBackground('#4285f4')
               .setFontColor('white')
               .setHorizontalAlignment('center');
    
    // Добавляем базовые правила
    var defaultRules = getDefaultRules();
    if (defaultRules.length > 0) {
      var rulesData = defaultRules.map(function(rule) {
        return [rule.keyword, rule.reference, rule.description];
      });
      
      sheet.getRange(2, 1, rulesData.length, 3).setValues(rulesData);
    }
    
    // Настраиваем ширину колонок
    sheet.setColumnWidth(1, 200); // Ключевое слово
    sheet.setColumnWidth(2, 150); // Ссылка на данные
    sheet.setColumnWidth(3, 300); // Описание
    
    // Добавляем инструкции
    var instructionRow = 2 + defaultRules.length + 2;
    sheet.getRange(instructionRow, 1, 1, 3).merge();
    sheet.getRange(instructionRow, 1)
         .setValue('📝 ИНСТРУКЦИЯ: Добавьте свои правила ниже. Ключевое слово - то, что пишет пользователь, ссылка - куда это ведет.')
         .setFontStyle('italic')
         .setBackground('#f1f3f4');
    
    addSystemLog('✅ Лист правил создан с ' + defaultRules.length + ' базовыми правилами', 'INFO', 'RULES_ENGINE');
    
    return sheet;
    
  } catch (error) {
    addSystemLog('Ошибка создания листа правил: ' + error.message, 'ERROR', 'RULES_ENGINE');
    throw error;
  }
}

/**
 * Возвращает базовые правила системы
 * @return {Array<Object>}
 */
function getDefaultRules() {
  return [
    {
      keyword: 'анализ отзывов',
      reference: 'Отзывы!C2',
      description: 'Анализ отзывов с листа "Отзывы", колонка C, строка 2'
    },
    {
      keyword: 'анализ постов',
      reference: 'Посты!K2',
      description: 'Анализ постов с листа "Посты", колонка K, строка 2'
    },
    {
      keyword: 'наша ниша',
      reference: 'Распаковка!A3',
      description: 'Описание ниши с листа "Распаковка", ячейка A3'
    },
    {
      keyword: 'ниша',
      reference: 'Распаковка!A3',
      description: 'Короткое обозначение ниши'
    },
    {
      keyword: 'целевая аудитория',
      reference: 'Распаковка!B3',
      description: 'ЦА с листа "Распаковка", ячейка B3'
    },
    {
      keyword: 'конкуренты',
      reference: 'Распаковка!C3',
      description: 'Анализ конкурентов с листа "Распаковка", ячейка C3'
    },
    {
      keyword: 'контент план',
      reference: 'Контент!A:Z',
      description: 'Весь контент план с листа "Контент"'
    },
    {
      keyword: 'последние посты',
      reference: 'Посты!A2:J10',
      description: 'Последние 9 постов из VK'
    },
    {
      keyword: 'отзывы клиентов',
      reference: 'Отзывы!A2:C20',
      description: 'Отзывы клиентов для анализа'
    }
  ];
}

/**
 * Проверяет корректность ссылки на ячейку/диапазон
 * @param {string} reference - ссылка для проверки
 * @return {boolean}
 */
function isValidReference(reference) {
  if (!reference || typeof reference !== 'string') return false;
  
  // Базовые паттерны для Google Sheets ссылок:
  // Лист!A1, Лист!A1:B2, A1, A1:B2, Лист!A:A, A:A
  var patterns = [
    /^[A-Za-zА-Яа-я0-9_\s]+![A-Z]+\d+$/,        // Лист!A1
    /^[A-Za-zА-Яа-я0-9_\s]+![A-Z]+\d+:[A-Z]+\d+$/, // Лист!A1:B2
    /^[A-Za-zА-Яа-я0-9_\s]+![A-Z]+:[A-Z]+$/,     // Лист!A:B
    /^[A-Z]+\d+$/,                               // A1
    /^[A-Z]+\d+:[A-Z]+\d+$/,                     // A1:B2
    /^[A-Z]+:[A-Z]+$/                            // A:B
  ];
  
  return patterns.some(function(pattern) {
    return pattern.test(reference.trim());
  });
}

/**
 * Добавляет новое правило в лист
 * @param {string} keyword - ключевое слово
 * @param {string} reference - ссылка на данные
 * @param {string} description - описание правила
 * @return {boolean} - успешность добавления
 */
function addRule(keyword, reference, description) {
  try {
    if (!keyword || !reference) {
      throw new Error('Ключевое слово и ссылка обязательны');
    }
    
    if (!isValidReference(reference)) {
      throw new Error('Некорректная ссылка: ' + reference);
    }
    
    var sheet = getOrCreateRulesSheet();
    var lastRow = sheet.getLastRow();
    
    // Добавляем правило в следующую строку
    sheet.getRange(lastRow + 1, 1, 1, 3).setValues([[
      keyword.trim(),
      reference.trim(),
      description ? description.trim() : ''
    ]]);
    
    addSystemLog('✅ Добавлено правило: "' + keyword + '" → ' + reference, 'INFO', 'RULES_ENGINE');
    return true;
    
  } catch (error) {
    addSystemLog('Ошибка добавления правила: ' + error.message, 'ERROR', 'RULES_ENGINE');
    return false;
  }
}

/**
 * Удаляет правило по ключевому слову
 * @param {string} keyword - ключевое слово для удаления
 * @return {boolean} - успешность удаления
 */
function removeRule(keyword) {
  try {
    if (!keyword) return false;
    
    var sheet = getOrCreateRulesSheet();
    var data = sheet.getDataRange().getValues();
    
    // Ищем строку с данным ключевым словом
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === keyword.trim().toLowerCase()) {
        sheet.deleteRow(i + 1);
        addSystemLog('🗑️ Удалено правило: "' + keyword + '"', 'INFO', 'RULES_ENGINE');
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    addSystemLog('Ошибка удаления правила: ' + error.message, 'ERROR', 'RULES_ENGINE');
    return false;
  }
}

/**
 * Обновляет существующее правило
 * @param {string} oldKeyword - старое ключевое слово
 * @param {string} newKeyword - новое ключевое слово
 * @param {string} newReference - новая ссылка
 * @param {string} newDescription - новое описание
 * @return {boolean} - успешность обновления
 */
function updateRule(oldKeyword, newKeyword, newReference, newDescription) {
  try {
    if (!oldKeyword || !newKeyword || !newReference) {
      throw new Error('Все основные поля обязательны');
    }
    
    if (!isValidReference(newReference)) {
      throw new Error('Некорректная ссылка: ' + newReference);
    }
    
    var sheet = getOrCreateRulesSheet();
    var data = sheet.getDataRange().getValues();
    
    // Ищем строку с данным ключевым словом
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === oldKeyword.trim().toLowerCase()) {
        sheet.getRange(i + 1, 1, 1, 3).setValues([[
          newKeyword.trim(),
          newReference.trim(),
          newDescription ? newDescription.trim() : ''
        ]]);
        
        addSystemLog('📝 Обновлено правило: "' + oldKeyword + '" → "' + newKeyword + '" (' + newReference + ')', 'INFO', 'RULES_ENGINE');
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    addSystemLog('Ошибка обновления правила: ' + error.message, 'ERROR', 'RULES_ENGINE');
    return false;
  }
}

/**
 * Получает статистику по правилам
 * @return {Object} - объект со статистикой
 */
function getRulesStatistics() {
  try {
    var rules = getRulesFromSheet();
    var defaultRulesCount = getDefaultRules().length;
    var customRulesCount = Math.max(0, rules.length - defaultRulesCount);
    
    return {
      totalRules: rules.length,
      defaultRules: Math.min(rules.length, defaultRulesCount),
      customRules: customRulesCount,
      isRulesSheetExists: true
    };
    
  } catch (error) {
    addSystemLog('Ошибка получения статистики правил: ' + error.message, 'ERROR', 'RULES_ENGINE');
    return {
      totalRules: 0,
      defaultRules: 0,
      customRules: 0,
      isRulesSheetExists: false
    };
  }
}

/**
 * Экспортирует правила в JSON формат
 * @return {string} - JSON строка с правилами
 */
function exportRules() {
  try {
    var rules = getRulesFromSheet();
    return JSON.stringify(rules, null, 2);
  } catch (error) {
    addSystemLog('Ошибка экспорта правил: ' + error.message, 'ERROR', 'RULES_ENGINE');
    return '[]';
  }
}

/**
 * Импортирует правила из JSON формата
 * @param {string} jsonRules - JSON строка с правилами
 * @return {boolean} - успешность импорта
 */
function importRules(jsonRules) {
  try {
    var rules = JSON.parse(jsonRules);
    
    if (!Array.isArray(rules)) {
      throw new Error('Правила должны быть массивом');
    }
    
    var sheet = getOrCreateRulesSheet();
    
    // Очищаем существующие правила (кроме заголовка)
    if (sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }
    
    // Добавляем новые правила
    if (rules.length > 0) {
      var rulesData = rules.map(function(rule) {
        return [
          rule.keyword || '',
          rule.reference || '',
          rule.description || ''
        ];
      });
      
      sheet.getRange(2, 1, rulesData.length, 3).setValues(rulesData);
    }
    
    addSystemLog('📥 Импортировано правил: ' + rules.length, 'INFO', 'RULES_ENGINE');
    return true;
    
  } catch (error) {
    addSystemLog('Ошибка импорта правил: ' + error.message, 'ERROR', 'RULES_ENGINE');
    return false;
  }
}