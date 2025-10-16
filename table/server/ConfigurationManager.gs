/**
 * Configuration Manager for CollectConfig System
 * Управление конфигурациями и пресетами AI Конструктора
 * 
 * Version: 2.1.0
 * Updated: 2025-01-28 - Reworked executeCollectConfig with detailed logging
 */

// [Предыдущий код файла: saveCollectConfig, loadCollectConfig, etc. остается без изменений]

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
    }
    
    var existingRowIndex = findExistingConfig(configSheet, sheetName, cellAddress);
    var currentTime = new Date().toISOString();
    var systemPromptSheet = config.systemPrompt ? config.systemPrompt.sheet : '';
    var systemPromptCell = config.systemPrompt ? config.systemPrompt.cell : '';
    var userDataJSON = JSON.stringify(config.userData || []);
    
    if (existingRowIndex > 0) {
      configSheet.getRange(existingRowIndex, 1, 1, 5).setValues([[sheetName, cellAddress, systemPromptSheet, systemPromptCell, userDataJSON]]);
    } else {
      configSheet.appendRow([sheetName, cellAddress, systemPromptSheet, systemPromptCell, userDataJSON, currentTime, null, '']);
    }
    
    addSystemLog(`✅ Конфигурация сохранена для ${sheetName}!${cellAddress}`, 'INFO', 'COLLECT_CONFIG');
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = ss.getSheetByName('ConfigData');
  if (!configSheet) return null;
  
  var rowIndex = findExistingConfig(configSheet, sheetName, cellAddress);
  if (rowIndex <= 0) return null;

  var rowData = configSheet.getRange(rowIndex, 1, 1, 8).getValues()[0];
  var systemPrompt = (rowData[2] && rowData[3]) ? { sheet: rowData[2], cell: rowData[3] } : null;
  var userData = [];
  try {
    if (rowData[4]) userData = JSON.parse(rowData[4]);
  } catch (e) {}

  return {
    systemPrompt: systemPrompt,
    userData: userData,
    name: rowData[7] || ''
  };
}

/**
 * Выполнение AI запроса по сохраненной конфигурации С ПОДРОБНЫМ ЛОГИРОВАНИЕМ
 * @param {string} sheetName - имя листа с результатом
 * @param {string} cellAddress - адрес ячейки с результатом
 * @return {Object} {success: boolean, result?: string, error?: string}
 */
function executeCollectConfig(sheetName, cellAddress) {
  var traceId = Utilities.getUuid(); // Уникальный ID для отслеживания операции
  var fullExecutionStart = Date.now();
  var targetCell = `'${sheetName}'!${cellAddress}`;

  try {
    logCollectConfigOperation('START', targetCell, 'IN_PROGRESS', null, traceId);

    var credentials = getClientCredentials();
    if (!credentials || !credentials.geminiKey) {
      throw new Error('Не настроен Gemini API Key. Используйте меню: 🤖 Table AI → ⚙️ Настройки');
    }

    var stepStart = Date.now();
    var config = loadCollectConfig(sheetName, cellAddress);
    logCollectConfigOperation('LOAD_CONFIG', targetCell, config ? 'SUCCESS' : 'FAILED', 
                              { loaded: !!config }, traceId, Date.now() - stepStart, config ? null : new Error('Config not found'));
    if (!config) throw new Error('Конфигурация не найдена. Сначала настройте и сохраните запрос.');

    stepStart = Date.now();
    var systemPrompt = '';
    if (config.systemPrompt && config.systemPrompt.sheet && config.systemPrompt.cell) {
      var spSource = `'${config.systemPrompt.sheet}'!${config.systemPrompt.cell}`;
      try {
        systemPrompt = collectDataFromRange(config.systemPrompt.sheet, config.systemPrompt.cell);
        logCollectConfigOperation('COLLECT_SYSTEM_PROMPT', targetCell, 'SUCCESS', { source: spSource, length: systemPrompt.length }, traceId, Date.now() - stepStart);
      } catch (e) {
        logCollectConfigOperation('COLLECT_SYSTEM_PROMPT', targetCell, 'FAILED', { source: spSource, error: e.message }, traceId, Date.now() - stepStart, e);
      }
    }

    stepStart = Date.now();
    var userData = [];
    var userDataLogs = [];
    if (config.userData) {
      config.userData.forEach(function(source) {
        if (source.sheet && source.cell) {
          var udSource = `'${source.sheet}'!${source.cell}`;
          try {
            var data = collectDataFromRange(source.sheet, source.cell);
            userData.push({ source: udSource, content: data });
            userDataLogs.push({ source: udSource, length: data.length, status: 'SUCCESS' });
          } catch (e) {
            userData.push({ source: udSource, content: `[ОШИБКА: ${e.message}]` });
            userDataLogs.push({ source: udSource, error: e.message, status: 'FAILED' });
          }
        }
      });
    }
    logCollectConfigOperation('COLLECT_USER_DATA', targetCell, 'SUCCESS', { sources: userDataLogs }, traceId, Date.now() - stepStart);

    var fullPrompt = (systemPrompt ? systemPrompt + '\n\n' : '') + 
                     (userData.length > 0 ? 'Данные для анализа:\n\n' + userData.map(function(d, i) { return `Источник ${i + 1} (${d.source}):\n${d.content}`}).join('\n\n') : '');

    if (!fullPrompt.trim()) throw new Error('Нет данных для обработки. Настройте System Prompt или User Data.');

    stepStart = Date.now();
    logCollectConfigOperation('API_CALL', targetCell, 'IN_PROGRESS', { promptLength: fullPrompt.length }, traceId, 0);
    var geminiResult = callGeminiAPI(fullPrompt, credentials.geminiKey);
    var apiTime = Date.now() - stepStart;

    if (!geminiResult || geminiResult.error) {
      var error = new Error('Gemini API не вернул результат: ' + (geminiResult ? geminiResult.error : 'неизвестная ошибка'));
      logCollectConfigOperation('API_RESPONSE', targetCell, 'FAILED', { error: error.message, executionTime: apiTime }, traceId, apiTime, error);
      throw error;
    }
    logCollectConfigOperation('API_RESPONSE', targetCell, 'SUCCESS', { resultLength: geminiResult.result.length, executionTime: apiTime }, traceId, apiTime);

    stepStart = Date.now();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var targetSheet = ss.getSheetByName(sheetName);
    if (!targetSheet) throw new Error(`Лист "${sheetName}" не найден`);

    targetSheet.getRange(cellAddress).setValue(geminiResult.result);
    logCollectConfigOperation('WRITE_RESULT', targetCell, 'SUCCESS', null, traceId, Date.now() - stepStart);

    updateLastRun(sheetName, cellAddress);
    logCollectConfigOperation('END', targetCell, 'SUCCESS', null, traceId, Date.now() - fullExecutionStart);
    forceFlushAllLogs();
    return { success: true, result: geminiResult.result };

  } catch (error) {
    var totalTime = Date.now() - fullExecutionStart;
    logCollectConfigOperation('ERROR', targetCell, 'FAILED', { error: error.message, stack: error.stack }, traceId, totalTime, error);
    logCollectConfigOperation('END', targetCell, 'FAILED', { error: error.message }, traceId, totalTime, error);
    forceFlushAllLogs(); 
    return { success: false, error: error.message };
  }
}

/**
 * Остальные функции файла (deleteCollectConfig, findExistingConfig, etc.)
 */
function findExistingConfig(configSheet, sheetName, cellAddress) {
  var lastRow = configSheet.getLastRow();
  if (lastRow <= 1) return -1;
  var data = configSheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === sheetName && data[i][1] === cellAddress) {
      return i + 2;
    }
  }
  return -1;
}

function updateLastRun(sheetName, cellAddress) {
  try {
    var configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ConfigData');
    if (!configSheet) return;
    var rowIndex = findExistingConfig(configSheet, sheetName, cellAddress);
    if (rowIndex > 0) {
      configSheet.getRange(rowIndex, 7).setValue(new Date().toISOString());
    }
  } catch (e) { /* ignore */ }
}

function collectDataFromRange(sheetName, cellAddress) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Лист "${sheetName}" не найден`);

  if (/^[A-Z]+:[A-Z]+$/.test(cellAddress)) {
    var col = cellAddress.split(':')[0];
    cellAddress = `${col}1:${col}${sheet.getLastRow()}`;
  }

  return sheet.getRange(cellAddress).getValues().flat().filter(String).join('\n');
}

// Функции пресетов и другие остаются без изменений...