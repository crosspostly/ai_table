/**
 * Configuration Manager for CollectConfig System - FINAL INTEGRATED VERSION
 * Uses the project's core Gemini and Logging functions.
 * 
 * Version: 3.1.0
 * Updated: 2025-01-30 - Added saveAndExecuteCollectConfig and deleteCollectConfig wrappers for UI.
 */

/**
 * Wrapper function for the UI: saves the configuration and then executes it.
 * @param {string} sheetName - The name of the target sheet.
 * @param {string} cellAddress - The A1 notation of the target cell.
 * @param {Object} config - The configuration object from the UI.
 * @return {{success: boolean, result?: string, error?: string}}
 */
function saveAndExecuteCollectConfig(sheetName, cellAddress, config) {
  try {
    // First, save the configuration that came from the UI
    var saveSuccess = saveCollectConfig(sheetName, cellAddress, config);
    if (!saveSuccess) {
      throw new Error('Failed to save the configuration before execution.');
    }
    
    // Now, execute the logic using the saved configuration
    return executeCollectConfig(sheetName, cellAddress);
    
  } catch (error) {
    addSystemLog(`saveAndExecuteCollectConfig FAILED: ${error.message}`, 'ERROR', {target: `'${sheetName}'!${cellAddress}`});
    return { success: false, error: error.message };
  }
}

/**
 * Deletes a saved configuration for a specific cell.
 * @param {string} sheetName - The name of the sheet.
 * @param {string} cellAddress - The A1 notation of the cell.
 * @return {{success: boolean, message?: string, error?: string}}
 */
function deleteCollectConfig(sheetName, cellAddress) {
  try {
    var configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ConfigData');
    if (!configSheet) {
      return { success: true, message: 'No configurations to delete.' };
    }
    
    var rowIndex = findExistingConfig(configSheet, sheetName, cellAddress);
    
    if (rowIndex > 0) {
      configSheet.deleteRow(rowIndex);
      addSystemLog(`Deleted configuration for ${sheetName}!${cellAddress}`, 'INFO', 'COLLECT_CONFIG');
      return { success: true, message: 'Configuration deleted.' };
    } else {
      return { success: true, message: 'Configuration not found.' };
    }
  } catch (error) {
    addSystemLog(`deleteCollectConfig FAILED: ${error.message}`, 'ERROR', 'COLLECT_CONFIG');
    return { success: false, error: error.message };
  }
}


/**
 * Выполнение AI запроса по сохраненной конфигурации, используя GM_RAW.
 * @param {string} sheetName - Имя листа с результатом.
 * @param {string} cellAddress - Адрес ячейки с результатом.
 * @return {{success: boolean, result?: string, error?: string}}
 */
function executeCollectConfig(sheetName, cellAddress) {
  var logCtx = { traceId: Utilities.getUuid(), target: `'${sheetName}'!${cellAddress}` };
  addSystemLog('executeCollectConfig START', 'INFO', logCtx);

  try {
    var config = loadCollectConfig(sheetName, cellAddress);
    if (!config) throw new Error('Конфигурация не найдена. Настройте и сохраните запрос.');
    addSystemLog('Config loaded successfully', 'DEBUG', logCtx);

    var systemPrompt = '';
    if (config.systemPrompt && config.systemPrompt.sheet && config.systemPrompt.cell) {
      systemPrompt = collectDataFromRange(config.systemPrompt.sheet, config.systemPrompt.cell);
    }

    var userDataContent = [];
    if (config.userData) {
      config.userData.forEach(function(source) {
        if (source.sheet && source.cell) {
          try {
            var data = collectDataFromRange(source.sheet, source.cell);
            userDataContent.push(`Источник (${source.sheet}!${source.cell}):\n${data}`);
          } catch (e) {
            userDataContent.push(`Источник (${source.sheet}!${source.cell}):\n[ОШИБКА СБОРА ДАННЫХ: ${e.message}]`);
          }
        }
      });
    }
    
    var fullPrompt = (systemPrompt ? systemPrompt + '\n\n---\n\n' : '') + 
                     (userDataContent.length > 0 ? 'ДАННЫЕ ДЛЯ АНАЛИЗА:\n' + userDataContent.join('\n\n') : '');

    if (!fullPrompt.trim()) throw new Error('Нет данных для обработки. Настройте System Prompt или User Data.');

    var geminiResult = GM_RAW(fullPrompt, null, null, logCtx.traceId, `CollectConfig:${logCtx.target}`);

    if (!geminiResult || geminiResult.startsWith('Error:')) throw new Error('API Error: ' + geminiResult);

    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName).getRange(cellAddress).setValue(geminiResult);
    updateLastRun(sheetName, cellAddress);
    addSystemLog('executeCollectConfig END', 'SUCCESS', logCtx);
    return { success: true, result: geminiResult };

  } catch (error) {
    addSystemLog(`executeCollectConfig FAILED: ${error.message}`, 'ERROR', logCtx);
    try {
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName).getRange(cellAddress).setValue(`ОШИБКА: ${error.message}`);
    } catch(e) { /* ignore */ }
    return { success: false, error: error.message };
  }
}


// --- Функции управления конфигурациями (без изменений) ---

function saveCollectConfig(sheetName, cellAddress, config) {
  try {
    if (!sheetName || !cellAddress || !config) throw new Error('Требуются sheetName, cellAddress и config');
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = ss.getSheetByName('ConfigData') || ss.insertSheet('ConfigData').hideSheet();
    if (configSheet.getLastRow() === 0) {
        var headers = ['Sheet', 'Cell', 'SystemPromptSheet', 'SystemPromptCell', 'UserDataJSON', 'CreatedAt', 'LastRun', 'ConfigName'];
        configSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
    }
    
    var existingRowIndex = findExistingConfig(configSheet, sheetName, cellAddress);
    var rowData = [
      sheetName, cellAddress,
      config.systemPrompt ? config.systemPrompt.sheet : '',
      config.systemPrompt ? config.systemPrompt.cell : '',
      JSON.stringify(config.userData || [])
    ];

    if (existingRowIndex > 0) {
      configSheet.getRange(existingRowIndex, 1, 1, 5).setValues([rowData]);
    } else {
      rowData.push(new Date().toISOString(), null, '');
      configSheet.appendRow(rowData);
    }
    return true;
  } catch (error) {
    addSystemLog(`Ошибка сохранения конфигурации: ${error.message}`, 'ERROR', 'COLLECT_CONFIG');
    return false;
  }
}

function loadCollectConfig(sheetName, cellAddress) {
  var configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ConfigData');
  if (!configSheet) return null;
  var rowIndex = findExistingConfig(configSheet, sheetName, cellAddress);
  if (rowIndex <= 0) return null;

  var rowData = configSheet.getRange(rowIndex, 1, 1, 8).getValues()[0];
  var userData = [];
  try {
    if (rowData[4]) userData = JSON.parse(rowData[4]);
  } catch (e) { /* ignore malformed JSON */ }

  return {
    systemPrompt: (rowData[2] && rowData[3]) ? { sheet: rowData[2], cell: rowData[3] } : null,
    userData: userData,
    name: rowData[7] || ''
  };
}

function findExistingConfig(configSheet, sheetName, cellAddress) {
  var data = configSheet.getRange(2, 1, configSheet.getLastRow() - 1, 2).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === sheetName && data[i][1] === cellAddress) return i + 2;
  }
  return -1;
}

function updateLastRun(sheetName, cellAddress) {
  var configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ConfigData');
  if (!configSheet) return;
  var rowIndex = findExistingConfig(configSheet, sheetName, cellAddress);
  if (rowIndex > 0) {
    configSheet.getRange(rowIndex, 7).setValue(new Date().toISOString());
  }
}

function collectDataFromRange(sheetName, cellAddress) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Лист \"${sheetName}\" не найден.`);
  
  if (/^[A-Z]+:[A-Z]+$/.test(cellAddress)) {
    var col = cellAddress.split(':')[0];
    var fullRangeAddress = `${col}1:${col}${sheet.getLastRow()}`;
    return sheet.getRange(fullRangeAddress).getValues().flat().filter(String).join('\n');
  } else {
    return sheet.getRange(cellAddress).getValues().flat().filter(String).join('\n');
  }
}
