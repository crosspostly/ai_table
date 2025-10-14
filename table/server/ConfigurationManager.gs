/**
 * Configuration Manager for CollectConfig System
 * Управление конфигурациями AI Конструктора
 * 
 * Version: 1.0.0
 * Created: 2025-01-14
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