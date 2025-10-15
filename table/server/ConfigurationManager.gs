/**
 * Configuration Manager for CollectConfig System
 * Управление конфигурациями и пресетами AI Конструктора
 * 
 * Version: 2.0.0
 * Created: 2025-01-14
 * Updated: 2025-01-27 - Added presets functionality
 */

/**
 * Сохранение конфигурации AI Конструктора
 * @param {string} sheetName - имя листа с результатом
 * @param {string} cellAddress - адрес ячейки с результатом (A1 notation)
 * @param {Object} config - конфигурация {systemPrompt, userData[]}
 * @return {boolean} успешность операции
 */
function saveCollectConfig(sheetName, cellAddress, config) {
  try {
    addSystemLog(`saveCollectConfig START: ${sheetName}!${cellAddress}`, 'DEBUG', 'COLLECT_CONFIG');
    
    // Валидация входных данных
    if (!sheetName || !cellAddress || !config) {
      throw new Error('Требуются sheetName, cellAddress и config');
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Получаем или создаем скрытый лист ConfigData
    var configSheet = ss.getSheetByName('ConfigData');
    
    if (!configSheet) {
      addSystemLog('Создание листа ConfigData', 'INFO', 'COLLECT_CONFIG');
      configSheet = ss.insertSheet('ConfigData');
      
      // Скрываем лист
      configSheet.hideSheet();
      
      // Создаем заголовки
      var headers = ['Sheet', 'Cell', 'SystemPromptSheet', 'SystemPromptCell', 'UserDataJSON', 'CreatedAt', 'LastRun', 'ConfigName'];
      configSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      configSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
      
      // Форматирование столбцов
      configSheet.setColumnWidth(1, 120); // Sheet
      configSheet.setColumnWidth(2, 80);  // Cell
      configSheet.setColumnWidth(3, 150); // SystemPromptSheet
      configSheet.setColumnWidth(4, 100); // SystemPromptCell
      configSheet.setColumnWidth(5, 300); // UserDataJSON
      configSheet.setColumnWidth(6, 150); // CreatedAt
      configSheet.setColumnWidth(7, 150); // LastRun
      configSheet.setColumnWidth(8, 200); // ConfigName
    }
    
    // Ищем существующую конфигурацию
    var existingRowIndex = findExistingConfig(configSheet, sheetName, cellAddress);
    
    // Подготавливаем данные для сохранения
    var currentTime = new Date().toISOString();
    var systemPromptSheet = config.systemPrompt ? config.systemPrompt.sheet : '';
    var systemPromptCell = config.systemPrompt ? config.systemPrompt.cell : '';
    var userDataJSON = JSON.stringify(config.userData || []);
    var configName = config.name || ''; // Для будущих пресетов
    
    if (existingRowIndex > 0) {
      // Обновляем существующую конфигурацию
      addSystemLog(`Обновление существующей конфигурации в строке ${existingRowIndex}`, 'INFO', 'COLLECT_CONFIG');
      
      var rowData = [
        [sheetName, cellAddress, systemPromptSheet, systemPromptCell, userDataJSON, 
         configSheet.getRange(existingRowIndex, 6).getValue(), // Сохраняем CreatedAt
         null, // LastRun обнуляем до выполнения
         configName]
      ];
      
      configSheet.getRange(existingRowIndex, 1, 1, rowData[0].length).setValues(rowData);
      
    } else {
      // Создаем новую конфигурацию
      addSystemLog('Создание новой конфигурации', 'INFO', 'COLLECT_CONFIG');
      
      var lastRow = configSheet.getLastRow();
      var rowData = [
        [sheetName, cellAddress, systemPromptSheet, systemPromptCell, userDataJSON, 
         currentTime, null, configName]
      ];
      
      configSheet.getRange(lastRow + 1, 1, 1, rowData[0].length).setValues(rowData);
    }
    
    addSystemLog(`✅ Конфигурация сохранена: ${userDataJSON.length} символов JSON`, 'INFO', 'COLLECT_CONFIG');
    return true;
    
  } catch (error) {
    addSystemLog(`❌ Ошибка сохранения конфигурации: ${error.message}`, 'ERROR', 'COLLECT_CONFIG');
    throw error;
  }
}

/**
 * Загрузка конфигурации AI Конструктора
 * @param {string} sheetName - имя листа
 * @param {string} cellAddress - адрес ячейки  
 * @return {Object|null} конфигурация или null если не найдена
 */
function loadCollectConfig(sheetName, cellAddress) {
  try {
    addSystemLog(`loadCollectConfig START: ${sheetName}!${cellAddress}`, 'DEBUG', 'COLLECT_CONFIG');
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = ss.getSheetByName('ConfigData');
    
    if (!configSheet) {
      addSystemLog('Лист ConfigData не существует', 'WARN', 'COLLECT_CONFIG');
      return null;
    }
    
    var rowIndex = findExistingConfig(configSheet, sheetName, cellAddress);
    
    if (rowIndex <= 0) {
      addSystemLog('Конфигурация не найдена', 'INFO', 'COLLECT_CONFIG');
      return null;
    }
    
    // Читаем данные из строки
    var rowData = configSheet.getRange(rowIndex, 1, 1, 8).getValues()[0];
    
    var systemPrompt = null;
    if (rowData[2] && rowData[3]) { // SystemPromptSheet и SystemPromptCell
      systemPrompt = {
        sheet: rowData[2],
        cell: rowData[3]
      };
    }
    
    var userData = [];
    try {
      if (rowData[4]) { // UserDataJSON
        userData = JSON.parse(rowData[4]);
      }
    } catch (parseError) {
      addSystemLog(`⚠️ Ошибка парсинга UserDataJSON: ${parseError.message}`, 'WARN', 'COLLECT_CONFIG');
    }
    
    var config = {
      systemPrompt: systemPrompt,
      userData: userData,
      name: rowData[7] || '', // ConfigName
      createdAt: rowData[5],   // CreatedAt
      lastRun: rowData[6]      // LastRun
    };
    
    addSystemLog(`✅ Конфигурация загружена: SystemPrompt=${systemPrompt ? 'да' : 'нет'}, UserData=${userData.length} элементов`, 'INFO', 'COLLECT_CONFIG');
    return config;
    
  } catch (error) {
    addSystemLog(`❌ Ошибка загрузки конфигурации: ${error.message}`, 'ERROR', 'COLLECT_CONFIG');
    return null;
  }
}

/**
 * Выполнение AI запроса по сохраненной конфигурации
 * @param {string} sheetName - имя листа с результатом
 * @param {string} cellAddress - адрес ячейки с результатом
 * @return {Object} {success: boolean, result?: string, error?: string}
 */
function executeCollectConfig(sheetName, cellAddress) {
  try {
    addSystemLog(`executeCollectConfig START: ${sheetName}!${cellAddress}`, 'INFO', 'COLLECT_EXEC');
    
    // 1. Проверяем Gemini API Key
    var credentials = getClientCredentials();
    if (!credentials.geminiKey) {
      return {
        success: false,
        error: 'Не настроен Gemini API Key. Используйте меню: 🤖 Table AI → ⚙️ Настройки → 🌟 НАСТРОИТЬ ВСЕ КЛЮЧИ'
      };
    }
    
    // 2. Загружаем конфигурацию
    addSystemLog('Загрузка конфигурации...', 'DEBUG', 'COLLECT_EXEC');
    var config = loadCollectConfig(sheetName, cellAddress);
    
    if (!config) {
      return {
        success: false,
        error: 'Конфигурация не найдена. Сначала настройте запрос через: 🎯 AI Конструктор → Настроить запрос'
      };
    }
    
    addSystemLog(`✅ Конфигурация загружена: ${JSON.stringify(config).substring(0, 100)}...`, 'DEBUG', 'COLLECT_EXEC');
    
    // 3. Собираем System Prompt
    var systemPrompt = '';
    if (config.systemPrompt && config.systemPrompt.sheet && config.systemPrompt.cell) {
      addSystemLog(`Сбор System Prompt из ${config.systemPrompt.sheet}!${config.systemPrompt.cell}`, 'DEBUG', 'COLLECT_EXEC');
      
      try {
        systemPrompt = collectDataFromRange(config.systemPrompt.sheet, config.systemPrompt.cell);
        addSystemLog(`System Prompt собран: ${systemPrompt.length} символов`, 'DEBUG', 'COLLECT_EXEC');
      } catch (error) {
        addSystemLog(`⚠️ Ошибка сбора System Prompt: ${error.message}`, 'WARN', 'COLLECT_EXEC');
      }
    }
    
    // 4. Собираем User Data
    var userData = [];
    addSystemLog(`Сбор User Data из ${config.userData.length} источников`, 'DEBUG', 'COLLECT_EXEC');
    
    for (var i = 0; i < config.userData.length; i++) {
      var source = config.userData[i];
      if (source.sheet && source.cell) {
        try {
          addSystemLog(`  [${i}] ${source.sheet}!${source.cell}`, 'DEBUG', 'COLLECT_EXEC');
          var data = collectDataFromRange(source.sheet, source.cell);
          
          userData.push({
            source: `${source.sheet}!${source.cell}`,
            content: data
          });
          
          addSystemLog(`  ✅ Собрано ${data.length} символов`, 'DEBUG', 'COLLECT_EXEC');
        } catch (error) {
          addSystemLog(`  ❌ Ошибка сбора из ${source.sheet}!${source.cell}: ${error.message}`, 'ERROR', 'COLLECT_EXEC');
          
          userData.push({
            source: `${source.sheet}!${source.cell}`,
            content: `[ОШИБКА: ${error.message}]`
          });
        }
      }
    }
    
    // 5. Формируем запрос
    var requestData = {
      systemInstruction: systemPrompt,
      userData: userData
    };
    
    // Создаем итоговый промпт для Gemini
    var fullPrompt = '';
    
    if (systemPrompt) {
      fullPrompt += systemPrompt + '\n\n';
    }
    
    if (userData.length > 0) {
      fullPrompt += 'Данные для анализа:\n\n';
      for (var j = 0; j < userData.length; j++) {
        fullPrompt += `Источник ${j + 1} (${userData[j].source}):\n${userData[j].content}\n\n`;
      }
    }
    
    if (!fullPrompt.trim()) {
      return {
        success: false,
        error: 'Нет данных для обработки. Настройте System Prompt или User Data.'
      };
    }
    
    addSystemLog(`Сформированный промпт: ${fullPrompt.length} символов`, 'DEBUG', 'COLLECT_EXEC');
    
    // 6. Отправляем в Gemini
    addSystemLog('Отправка в Gemini...', 'INFO', 'COLLECT_EXEC');
    
    var geminiResult = callGeminiAPI(fullPrompt, credentials.geminiKey);
    
    if (!geminiResult || !geminiResult.result) {
      return {
        success: false,
        error: 'Gemini API не вернул результат: ' + (geminiResult ? geminiResult.error : 'неизвестная ошибка')
      };
    }
    
    addSystemLog(`✅ Получен ответ от Gemini: ${geminiResult.result.length} символов`, 'INFO', 'COLLECT_EXEC');
    
    // 7. Записываем результат в ячейку
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var targetSheet = ss.getSheetByName(sheetName);
    
    if (!targetSheet) {
      return {
        success: false,
        error: `Лист "${sheetName}" не найден`
      };
    }
    
    try {
      var targetRange = targetSheet.getRange(cellAddress);
      targetRange.setValue(geminiResult.result);
      
      addSystemLog(`✅ Результат записан в ${sheetName}!${cellAddress}`, 'INFO', 'COLLECT_EXEC');
      
      // 8. Обновляем LastRun
      updateLastRun(sheetName, cellAddress);
      
      return {
        success: true,
        result: geminiResult.result
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Ошибка записи в ячейку ${cellAddress}: ${error.message}`
      };
    }
    
  } catch (error) {
    addSystemLog(`❌ Критическая ошибка executeCollectConfig: ${error.message}`, 'ERROR', 'COLLECT_EXEC');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Удаление конфигурации
 * @param {string} sheetName - имя листа
 * @param {string} cellAddress - адрес ячейки
 * @return {boolean} успешность операции
 */
function deleteCollectConfig(sheetName, cellAddress) {
  try {
    addSystemLog(`deleteCollectConfig START: ${sheetName}!${cellAddress}`, 'DEBUG', 'COLLECT_CONFIG');
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = ss.getSheetByName('ConfigData');
    
    if (!configSheet) {
      return true; // Нечего удалять
    }
    
    var rowIndex = findExistingConfig(configSheet, sheetName, cellAddress);
    
    if (rowIndex > 0) {
      configSheet.deleteRow(rowIndex);
      addSystemLog(`✅ Конфигурация удалена из строки ${rowIndex}`, 'INFO', 'COLLECT_CONFIG');
    }
    
    return true;
    
  } catch (error) {
    addSystemLog(`❌ Ошибка удаления конфигурации: ${error.message}`, 'ERROR', 'COLLECT_CONFIG');
    return false;
  }
}

/**
 * Поиск существующей конфигурации
 * @param {Sheet} configSheet - лист ConfigData
 * @param {string} sheetName - имя листа
 * @param {string} cellAddress - адрес ячейки
 * @return {number} индекс строки или -1 если не найдена
 */
function findExistingConfig(configSheet, sheetName, cellAddress) {
  var lastRow = configSheet.getLastRow();
  
  if (lastRow <= 1) {
    return -1; // Только заголовок или пустой лист
  }
  
  // Читаем все данные за раз для оптимизации
  var data = configSheet.getRange(2, 1, lastRow - 1, 2).getValues();
  
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === sheetName && data[i][1] === cellAddress) {
      return i + 2; // +2 потому что начали с строки 2 и индекс 0-based
    }
  }
  
  return -1;
}

/**
 * Обновление времени последнего выполнения
 * @param {string} sheetName - имя листа
 * @param {string} cellAddress - адрес ячейки
 */
function updateLastRun(sheetName, cellAddress) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = ss.getSheetByName('ConfigData');
    
    if (!configSheet) return;
    
    var rowIndex = findExistingConfig(configSheet, sheetName, cellAddress);
    
    if (rowIndex > 0) {
      configSheet.getRange(rowIndex, 7).setValue(new Date().toISOString()); // LastRun
      addSystemLog(`LastRun обновлен для ${sheetName}!${cellAddress}`, 'DEBUG', 'COLLECT_CONFIG');
    }
    
  } catch (error) {
    addSystemLog(`⚠️ Ошибка обновления LastRun: ${error.message}`, 'WARN', 'COLLECT_CONFIG');
  }
}

/**
 * Сбор данных из диапазона ячеек
 * @param {string} sheetName - имя листа
 * @param {string} cellAddress - адрес ячейки/диапазона (A1, C1:C100, C:C)
 * @return {string} собранные данные
 */
function collectDataFromRange(sheetName, cellAddress) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error(`Лист "${sheetName}" не найден`);
    }
    
    // Обрабатываем специальные случаи для полных столбцов
    var normalizedAddress = cellAddress;
    
    // Если это полный столбец (C:C), преобразуем в C1:C (до последней строки с данными)
    if (/^[A-Z]+:[A-Z]+$/.test(cellAddress)) {
      var columnLetter = cellAddress.split(':')[0];
      var lastRow = sheet.getLastRow();
      normalizedAddress = `${columnLetter}1:${columnLetter}${lastRow}`;
    }
    
    var range = sheet.getRange(normalizedAddress);
    var values = range.getValues();
    
    // Собираем все непустые значения в строку
    var result = [];
    
    for (var i = 0; i < values.length; i++) {
      for (var j = 0; j < values[i].length; j++) {
        var value = values[i][j];
        if (value !== null && value !== undefined && value.toString().trim() !== '') {
          result.push(value.toString());
        }
      }
    }
    
    return result.join('\n');
    
  } catch (error) {
    throw new Error(`Ошибка сбора данных из ${sheetName}!${cellAddress}: ${error.message}`);
  }
}

/**
 * Логи AI Конструктора
 * @return {Array<string>} массив логов
 */
function showCollectConfigLogs() {
  try {
    var ui = SpreadsheetApp.getUi();
    
    // Получаем логи из CacheService
    var logs = [];
    
    try {
      var cache = CacheService.getScriptCache();
      var props = PropertiesService.getScriptProperties();
      var allProps = props.getProperties();
      
      // Ищем логи в Properties
      Object.keys(allProps).forEach(function(key) {
        if (key.startsWith('log_') && (key.indexOf('COLLECT_CONFIG') > -1 || key.indexOf('COLLECT_EXEC') > -1)) {
          try {
            var logEntry = JSON.parse(allProps[key]);
            logs.push(`[${logEntry.timestamp}] ${logEntry.level} [${logEntry.component}] ${logEntry.message}`);
          } catch (e) {
            // Пропускаем невалидные записи
          }
        }
      });
      
    } catch (cacheError) {
      logs.push('⚠️ Ошибка доступа к свойствам: ' + cacheError.message);
    }
    
    if (logs.length === 0) {
      logs.push('📋 Логи пусты. Попробуйте:\n1. Настроить запрос (💾 Сохранить)\n2. Выполнить запрос (🚀 Запустить)\n3. Сразу после этого открыть логи');
    }
    
    // Сортируем логи по времени (новые сверху)
    logs.sort().reverse();
    
    var logText = logs.slice(0, 50).join('\n\n'); // Показываем последние 50 записей
    
    ui.alert(
      '🔍 Логи AI Конструктора',
      logText.length > 8000 ? logText.substring(0, 8000) + '\n\n... (показаны первые 8000 символов)' : logText,
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Ошибка', 'Не удалось загрузить логи: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// ========================================
// CONFIGURATION PRESETS FUNCTIONALITY
// Функциональность пресетов конфигураций
// ========================================

/**
 * Сохранение конфигурации как пресет
 * @param {string} presetName - название пресета
 * @param {Object} config - конфигурация {systemPrompt, userData[]}
 * @return {boolean} успешность операции
 */
function saveConfigAsPreset(presetName, config) {
  try {
    addSystemLog(`saveConfigAsPreset: ${presetName}`, 'INFO', 'PRESETS');
    
    // Валидация
    if (!presetName || !config) {
      throw new Error('Требуются presetName и config');
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Получаем или создаем скрытый лист ConfigPresets
    var presetsSheet = ss.getSheetByName('ConfigPresets');
    
    if (!presetsSheet) {
      addSystemLog('Создание листа ConfigPresets', 'INFO', 'PRESETS');
      presetsSheet = ss.insertSheet('ConfigPresets');
      
      // Скрываем лист
      presetsSheet.hideSheet();
      
      // Создаем заголовки
      var headers = ['PresetName', 'SystemPromptSheet', 'SystemPromptCell', 'UserDataJSON', 'CreatedAt', 'LastUsed', 'Description'];
      presetsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      presetsSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#34A853').setFontColor('white');
      
      // Форматирование столбцов
      presetsSheet.setColumnWidth(1, 200); // PresetName
      presetsSheet.setColumnWidth(2, 150); // SystemPromptSheet
      presetsSheet.setColumnWidth(3, 100); // SystemPromptCell
      presetsSheet.setColumnWidth(4, 300); // UserDataJSON
      presetsSheet.setColumnWidth(5, 150); // CreatedAt
      presetsSheet.setColumnWidth(6, 150); // LastUsed
      presetsSheet.setColumnWidth(7, 300); // Description
    }
    
    // Проверяем существует ли пресет с таким именем
    var existingRow = findPresetRow(presetsSheet, presetName);
    
    // Подготавливаем данные
    var currentTime = new Date().toISOString();
    var systemPromptSheet = config.systemPrompt ? config.systemPrompt.sheet : '';
    var systemPromptCell = config.systemPrompt ? config.systemPrompt.cell : '';
    var userDataJSON = JSON.stringify(config.userData || []);
    var description = config.description || '';
    
    if (existingRow > 0) {
      // Обновляем существующий пресет
      addSystemLog(`Обновление пресета: ${presetName}`, 'INFO', 'PRESETS');
      
      var rowData = [
        [presetName, systemPromptSheet, systemPromptCell, userDataJSON, 
         presetsSheet.getRange(existingRow, 5).getValue(), // Сохраняем CreatedAt
         currentTime, // Обновляем LastUsed
         description]
      ];
      
      presetsSheet.getRange(existingRow, 1, 1, rowData[0].length).setValues(rowData);
      
    } else {
      // Создаем новый пресет
      addSystemLog(`Создание нового пресета: ${presetName}`, 'INFO', 'PRESETS');
      
      var lastRow = presetsSheet.getLastRow();
      var rowData = [
        [presetName, systemPromptSheet, systemPromptCell, userDataJSON, 
         currentTime, currentTime, description]
      ];
      
      presetsSheet.getRange(lastRow + 1, 1, 1, rowData[0].length).setValues(rowData);
    }
    
    addSystemLog(`✅ Пресет "${presetName}" сохранен`, 'INFO', 'PRESETS');
    return true;
    
  } catch (error) {
    addSystemLog(`❌ Ошибка сохранения пресета: ${error.message}`, 'ERROR', 'PRESETS');
    throw error;
  }
}

/**
 * Загрузка пресета по имени
 * @param {string} presetName - название пресета
 * @return {Object|null} конфигурация или null если не найдена
 */
function loadConfigPreset(presetName) {
  try {
    addSystemLog(`loadConfigPreset: ${presetName}`, 'DEBUG', 'PRESETS');
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var presetsSheet = ss.getSheetByName('ConfigPresets');
    
    if (!presetsSheet) {
      addSystemLog('Лист ConfigPresets не существует', 'WARN', 'PRESETS');
      return null;
    }
    
    var rowIndex = findPresetRow(presetsSheet, presetName);
    
    if (rowIndex <= 0) {
      addSystemLog(`Пресет "${presetName}" не найден`, 'INFO', 'PRESETS');
      return null;
    }
    
    // Читаем данные из строки
    var rowData = presetsSheet.getRange(rowIndex, 1, 1, 7).getValues()[0];
    
    var systemPrompt = null;
    if (rowData[1] && rowData[2]) { // SystemPromptSheet и SystemPromptCell
      systemPrompt = {
        sheet: rowData[1],
        cell: rowData[2]
      };
    }
    
    var userData = [];
    try {
      if (rowData[3]) { // UserDataJSON
        userData = JSON.parse(rowData[3]);
      }
    } catch (parseError) {
      addSystemLog(`⚠️ Ошибка парсинга UserDataJSON для пресета "${presetName}": ${parseError.message}`, 'WARN', 'PRESETS');
    }
    
    var config = {
      name: rowData[0],          // PresetName
      systemPrompt: systemPrompt,
      userData: userData,
      description: rowData[6] || '', // Description
      createdAt: rowData[4],     // CreatedAt
      lastUsed: rowData[5]       // LastUsed
    };
    
    // Обновляем LastUsed при загрузке
    presetsSheet.getRange(rowIndex, 6).setValue(new Date().toISOString());
    
    addSystemLog(`✅ Пресет "${presetName}" загружен: SystemPrompt=${systemPrompt ? 'да' : 'нет'}, UserData=${userData.length} элементов`, 'INFO', 'PRESETS');
    return config;
    
  } catch (error) {
    addSystemLog(`❌ Ошибка загрузки пресета: ${error.message}`, 'ERROR', 'PRESETS');
    return null;
  }
}

/**
 * Получить список всех пресетов
 * @return {Array<Object>} массив с информацией о пресетах
 */
function getAllConfigPresets() {
  try {
    addSystemLog('getAllConfigPresets START', 'DEBUG', 'PRESETS');
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var presetsSheet = ss.getSheetByName('ConfigPresets');
    
    if (!presetsSheet) {
      return [];
    }
    
    var lastRow = presetsSheet.getLastRow();
    if (lastRow <= 1) {
      return [];
    }
    
    var data = presetsSheet.getRange(2, 1, lastRow - 1, 7).getValues();
    var presets = [];
    
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      
      // Подсчитываем количество источников данных
      var userDataCount = 0;
      try {
        if (row[3]) {
          var userData = JSON.parse(row[3]);
          userDataCount = userData.length;
        }
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
      
      presets.push({
        name: row[0],
        systemPromptSheet: row[1] || '',
        systemPromptCell: row[2] || '',
        userDataCount: userDataCount,
        description: row[6] || '',
        createdAt: row[4],
        lastUsed: row[5]
      });
    }
    
    // Сортируем по последнему использованию (новые сверху)
    presets.sort(function(a, b) {
      var dateA = new Date(a.lastUsed || a.createdAt);
      var dateB = new Date(b.lastUsed || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
    
    addSystemLog(`✅ Найдено ${presets.length} пресетов`, 'INFO', 'PRESETS');
    return presets;
    
  } catch (error) {
    addSystemLog(`❌ Ошибка получения пресетов: ${error.message}`, 'ERROR', 'PRESETS');
    return [];
  }
}

/**
 * Удаление пресета
 * @param {string} presetName - название пресета
 * @return {boolean} успешность операции
 */
function deleteConfigPreset(presetName) {
  try {
    addSystemLog(`deleteConfigPreset: ${presetName}`, 'DEBUG', 'PRESETS');
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var presetsSheet = ss.getSheetByName('ConfigPresets');
    
    if (!presetsSheet) {
      return true; // Нечего удалять
    }
    
    var rowIndex = findPresetRow(presetsSheet, presetName);
    
    if (rowIndex > 0) {
      presetsSheet.deleteRow(rowIndex);
      addSystemLog(`✅ Пресет "${presetName}" удален`, 'INFO', 'PRESETS');
    }
    
    return true;
    
  } catch (error) {
    addSystemLog(`❌ Ошибка удаления пресета: ${error.message}`, 'ERROR', 'PRESETS');
    return false;
  }
}

/**
 * Применение пресета к указанной ячейке
 * @param {string} presetName - название пресета
 * @param {string} targetSheetName - лист для результата
 * @param {string} targetCellAddress - ячейка для результата
 * @return {Object} {success: boolean, result?: string, error?: string}
 */
function applyPresetToCell(presetName, targetSheetName, targetCellAddress) {
  try {
    addSystemLog(`applyPresetToCell: ${presetName} → ${targetSheetName}!${targetCellAddress}`, 'INFO', 'PRESETS');
    
    // Загружаем пресет
    var preset = loadConfigPreset(presetName);
    
    if (!preset) {
      return {
        success: false,
        error: `Пресет "${presetName}" не найден`
      };
    }
    
    // Сохраняем конфигурацию для целевой ячейки (без имени пресета)
    var config = {
      systemPrompt: preset.systemPrompt,
      userData: preset.userData
    };
    
    var saveResult = saveCollectConfig(targetSheetName, targetCellAddress, config);
    
    if (!saveResult) {
      return {
        success: false,
        error: 'Ошибка сохранения конфигурации'
      };
    }
    
    // Выполняем запрос
    var executeResult = executeCollectConfig(targetSheetName, targetCellAddress);
    
    if (executeResult.success) {
      addSystemLog(`✅ Пресет "${presetName}" применен к ${targetSheetName}!${targetCellAddress}`, 'INFO', 'PRESETS');
    }
    
    return executeResult;
    
  } catch (error) {
    addSystemLog(`❌ Ошибка применения пресета: ${error.message}`, 'ERROR', 'PRESETS');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Поиск строки пресета по имени
 * @param {Sheet} presetsSheet - лист с пресетами
 * @param {string} presetName - название пресета
 * @return {number} индекс строки или -1 если не найден
 */
function findPresetRow(presetsSheet, presetName) {
  var lastRow = presetsSheet.getLastRow();
  
  if (lastRow <= 1) {
    return -1; // Только заголовок или пустой лист
  }
  
  // Читаем все данные за раз для оптимизации
  var data = presetsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
  
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === presetName) {
      return i + 2; // +2 потому что начали с строки 2 и индекс 0-based
    }
  }
  
  return -1;
}

/**
 * Управление пресетами через UI
 */
function showPresetsManager() {
  try {
    var ui = SpreadsheetApp.getUi();
    var presets = getAllConfigPresets();
    
    if (presets.length === 0) {
      ui.alert(
        '📋 Менеджер пресетов', 
        'У вас пока нет сохраненных пресетов.\\n\\nДля создания пресета:\\n1. Настройте AI Конструктор для любой ячейки\\n2. В интерфейсе настройки введите имя пресета\\n3. Нажмите "Сохранить как пресет"',
        ui.ButtonSet.OK
      );
      return;
    }
    
    var message = '📋 ВАШИ ПРЕСЕТЫ КОНФИГУРАЦИЙ\\n\\n';
    
    for (var i = 0; i < Math.min(presets.length, 10); i++) {
      var preset = presets[i];
      var createdDate = preset.createdAt ? new Date(preset.createdAt).toLocaleString('ru-RU') : 'Неизвестно';
      var lastUsedDate = preset.lastUsed ? new Date(preset.lastUsed).toLocaleString('ru-RU') : 'Никогда';
      
      message += `${i + 1}. "${preset.name}"\\n`;
      message += `   • System Prompt: ${preset.systemPromptSheet ? preset.systemPromptSheet + '!' + preset.systemPromptCell : 'не задан'}\\n`;
      message += `   • User Data: ${preset.userDataCount} источник(ов)\\n`;
      message += `   • Создан: ${createdDate}\\n`;
      if (preset.description) {
        message += `   • Описание: ${preset.description}\\n`;
      }
      message += `\\n`;
    }
    
    if (presets.length > 10) {
      message += `... и еще ${presets.length - 10} пресет(ов)\\n\\n`;
    }
    
    message += 'Для применения пресета:\\n';
    message += '1. Выделите целевую ячейку\\n';
    message += '2. Меню → 🎯 AI Конструктор → 📋 Применить пресет';
    
    ui.alert('📋 Менеджер пресетов', message, ui.ButtonSet.OK);
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Ошибка', 'Не удалось загрузить пресеты: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Применение пресета к текущей ячейке через UI
 */
function applyPresetToCurrentCell() {
  try {
    var ui = SpreadsheetApp.getUi();
    var sheet = SpreadsheetApp.getActiveSheet();
    var range = sheet.getActiveRange();
    
    if (!range) {
      ui.alert('⚠️ Внимание', 'Выделите ячейку для применения пресета!', ui.ButtonSet.OK);
      return;
    }
    
    var targetSheetName = sheet.getName();
    var targetCellAddress = range.getA1Notation();
    
    // Получаем список пресетов
    var presets = getAllConfigPresets();
    
    if (presets.length === 0) {
      ui.alert(
        '📋 Нет пресетов', 
        'У вас нет сохраненных пресетов конфигураций.\\n\\nСоздайте пресет через:\\n🎯 AI Конструктор → Настроить запрос → введите имя пресета',
        ui.ButtonSet.OK
      );
      return;
    }
    
    // Формируем список для выбора (упрощенно через prompt)
    var presetsList = '';
    for (var i = 0; i < Math.min(presets.length, 10); i++) {
      presetsList += `${i + 1}. "${presets[i].name}"`;
      if (presets[i].description) {
        presetsList += ` - ${presets[i].description}`;
      }
      presetsList += '\\n';
    }
    
    var response = ui.prompt(
      '📋 Выберите пресет для применения',
      `Целевая ячейка: ${targetSheetName}!${targetCellAddress}\\n\\nДоступные пресеты:\\n${presetsList}\\nВведите название пресета:`,
      ui.ButtonSet.OK_CANCEL
    );
    
    if (response.getSelectedButton() !== ui.Button.OK) {
      return;
    }
    
    var selectedPresetName = response.getResponseText().trim();
    
    if (!selectedPresetName) {
      ui.alert('❌ Ошибка', 'Название пресета не может быть пустым!', ui.ButtonSet.OK);
      return;
    }
    
    // Применяем пресет
    ui.alert('🚀 Применение пресета', `Применяю пресет "${selectedPresetName}" к ячейке ${targetCellAddress}...`, ui.ButtonSet.OK);
    
    var result = applyPresetToCell(selectedPresetName, targetSheetName, targetCellAddress);
    
    if (result.success) {
      ui.alert(
        '✅ Пресет применен!',
        `Пресет "${selectedPresetName}" успешно применен к ${targetCellAddress}.\\n\\nРезультат записан в ячейку.`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        '❌ Ошибка применения',
        `Не удалось применить пресет "${selectedPresetName}": ${result.error}`,
        ui.ButtonSet.OK
      );
    }
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Ошибка', 'Ошибка применения пресета: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Получить список всех листов в таблице
 * @return {Array} Массив названий листов
 */
function getAllSheetNames() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var names = [];
    
    for (var i = 0; i < sheets.length; i++) {
      names.push(sheets[i].getName());
    }
    
    return names;
    
  } catch (error) {
    addSystemLog(`❌ Ошибка получения списка листов: ${error.message}`, 'ERROR', 'COLLECT_CONFIG');
    return [];
  }
}