/**
 * Collect Config UI Functions
 * Функции для работы с веб-интерфейсом настройки
 * 
 * Version: 1.0.0
 * Last updated: 2024-10-14
 */

/**
 * Открыть интерфейс настройки для текущей ячейки
 */
function openCollectConfigUI() {
  try {
    // ВАЖНО: Apps Script не поддерживает пути с папками!
    // Файл должен называться просто 'CollectConfigUI' в плоской структуре
    var html = HtmlService.createHtmlOutputFromFile('CollectConfigUI')
      .setWidth(650)
      .setHeight(600)
      .setTitle('🎯 Настройка AI запроса');
    
    SpreadsheetApp.getUi().showModalDialog(html, 'Настройка запроса');
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Ошибка открытия интерфейса: ' + error.message);
  }
}

/**
 * Получить данные для инициализации интерфейса
 * @return {Object} {sheetName, cellAddress, sheets}
 */
function getCollectConfigInitData() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var range = sheet.getActiveRange();
    
    if (!range) {
      throw new Error('Выделите ячейку!');
    }
    
    var sheetName = sheet.getName();
    var cellAddress = range.getA1Notation();
    var sheets = getAllSheetNames();
    
    return {
      sheetName: sheetName,
      cellAddress: cellAddress,
      sheets: sheets
    };
    
  } catch (error) {
    throw new Error('Ошибка инициализации: ' + error.message);
  }
}

/**
 * Обновить текущую ячейку по сохранённой конфигурации
 * Вызывается из меню "🔄 Обновить ячейку"
 */
function refreshCellWithConfig() {
  try {
    var ui = SpreadsheetApp.getUi();
    var sheet = SpreadsheetApp.getActiveSheet();
    var range = sheet.getActiveRange();
    
    if (!range) {
      ui.alert('⚠️ Внимание', 'Выделите ячейку!', ui.ButtonSet.OK);
      return;
    }
    
    var sheetName = sheet.getName();
    var cellAddress = range.getA1Notation();
    
    // Проверяем есть ли сохранённая конфигурация
    var config = loadCollectConfig(sheetName, cellAddress);
    
    if (!config) {
      var response = ui.alert(
        '⚠️ Конфигурация не найдена',
        'Для ячейки ' + sheetName + '!' + cellAddress + ' нет сохранённой конфигурации.\n\n' +
        'Хотите создать новую?',
        ui.ButtonSet.YES_NO
      );
      
      if (response == ui.Button.YES) {
        openCollectConfigUI();
      }
      return;
    }
    
    // Показываем информацию о запуске
    ui.alert(
      '🚀 Запуск обновления',
      'Конфигурация найдена!\n\n' +
      'System Prompt: ' + (config.systemPrompt ? 
        config.systemPrompt.sheet + '!' + config.systemPrompt.cell : 'не задан') + '\n' +
      'User Data: ' + config.userData.length + ' источник(ов)\n\n' +
      'Запускаю обработку...',
      ui.ButtonSet.OK
    );
    
    // Выполняем запрос
    var result = executeCollectConfig(sheetName, cellAddress);
    
    if (result.success) {
      // Записываем результат в ячейку
      range.setValue(result.result);
      
      ui.alert(
        '✅ Готово!',
        'Результат записан в ячейку ' + cellAddress,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        '❌ Ошибка',
        'Не удалось выполнить запрос:\n' + result.error,
        ui.ButtonSet.OK
      );
    }
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Ошибка: ' + error.message);
  }
}

/**
 * Проверить есть ли конфигурация для текущей ячейки
 * @return {boolean}
 */
function hasConfigForCurrentCell() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var range = sheet.getActiveRange();
    
    if (!range) {
      return false;
    }
    
    var sheetName = sheet.getName();
    var cellAddress = range.getA1Notation();
    var config = loadCollectConfig(sheetName, cellAddress);
    
    return config !== null;
    
  } catch (error) {
    return false;
  }
}

/**
 * Получить список всех листов в таблице
 * @return {Array<string>} Массив названий листов
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
    Logger.log('Error getting sheet names: ' + error.message);
    return [];
  }
}

/**
 * Получить предпросмотр содержимого ячейки (первые 100 символов)
 * @param {string} sheetName - Название листа
 * @param {string} cellAddress - Адрес ячейки (A1 notation)
 * @return {string} Первые 100 символов или "пусто"
 */
function getCellPreview(sheetName, cellAddress) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return '❌ Лист не найден';
    }
    
    var cell = sheet.getRange(cellAddress);
    var value = cell.getValue();
    
    if (!value || value.toString().trim() === '') {
      return '(пусто)';
    }
    
    var text = value.toString();
    
    if (text.length <= 100) {
      return text;
    }
    
    return text.substring(0, 100) + '...';
    
  } catch (error) {
    return '❌ Ошибка: ' + error.message;
  }
}

/**
 * Справка по AI Конструктору
 */
function showCollectConfigHelp() {
  var ui = SpreadsheetApp.getUi();
  
  var helpText = '🎯 AI КОНСТРУКТОР - ЧТО ЭТО?\n\n';
  helpText += '💡 ПРОБЛЕМА:\n';
  helpText += 'Google Sheets ограничивает формулу 50,000 символами.\n';
  helpText += 'Если вы собираете данные из многих ячеек:\n';
  helpText += '=GM("Промпт: " & A1 & A2 & ... & A1000)\n';
  helpText += '❌ Формула слишком длинная = ОШИБКА!\n\n';
  
  helpText += '✅ РЕШЕНИЕ:\n';
  helpText += 'AI Конструктор собирает данные НА СЕРВЕРЕ!\n';
  helpText += '1. Выбираете ячейку (например B3)\n';
  helpText += '2. Настраиваете:\n';
  helpText += '   • System Prompt - инструкция для AI\n';
  helpText += '   • User Data - листы и ячейки с данными\n';
  helpText += '3. Нажимаете "Запустить"\n';
  helpText += '4. Результат появляется в B3\n\n';
  
  helpText += '🎯 КАК ИСПОЛЬЗОВАТЬ:\n';
  helpText += '1. Выделите ячейку где нужен результат\n';
  helpText += '2. Меню → 🎯 AI Конструктор → 🎯 Настроить запрос\n';
  helpText += '3. Выберите лист и ячейку для System Prompt\n';
  helpText += '4. Добавьте источники данных (+ Добавить данные)\n';
  helpText += '5. Нажмите "Запустить"\n\n';
  
  helpText += '💾 НАСТРОЙКИ СОХРАНЯЮТСЯ!\n';
  helpText += 'При повторном открытии - все поля заполнены.\n';
  helpText += 'Можно быстро обновить: 🔄 Обновить ячейку\n\n';
  
  helpText += '📊 ДАННЫЕ В JSON:\n';
  helpText += 'Все данные отправляются в AI в структурированном\n';
  helpText += 'JSON формате - нейросеть лучше понимает!\n\n';
  
  helpText += '🔒 ХРАНЕНИЕ:\n';
  helpText += 'Конфигурации сохраняются в скрытом листе\n';
  helpText += '"ConfigData" - нет лимитов, легко экспортировать!';
  
  ui.alert('🎯 AI Конструктор', helpText, ui.ButtonSet.OK);
}


// ============================================================================
// CONFIGURATION MANAGEMENT (Copied from server for client-side access)
// ============================================================================

var CONFIG_SHEET_NAME = 'ConfigData';

function getOrCreateConfigSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG_SHEET_NAME);
      sheet.getRange('A1:G1').setValues([[
        'Sheet', 'Cell', 'SystemPromptSheet', 'SystemPromptCell', 
        'UserDataJSON', 'CreatedAt', 'LastRun'
      ]]);
      sheet.getRange('A1:G1').setBackground('#4285f4').setFontColor('#ffffff').setFontWeight('bold');
      sheet.setFrozenRows(1);
      sheet.hideSheet();
    }
    
    return sheet;
  } catch (error) {
    Logger.log('Error creating config sheet: ' + error.message);
    throw error;
  }
}

function findConfigRow(configSheet, sheetName, cellAddress) {
  try {
    var data = configSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === sheetName && data[i][1] === cellAddress) {
        return i + 1;
      }
    }
    return -1;
  } catch (error) {
    Logger.log('Error finding config row: ' + error.message);
    return -1;
  }
}

function saveCollectConfig(sheetName, cellAddress, config) {
  try {
    var configSheet = getOrCreateConfigSheet();
    var row = findConfigRow(configSheet, sheetName, cellAddress);
    
    var systemPromptSheet = config.systemPrompt ? config.systemPrompt.sheet : '';
    var systemPromptCell = config.systemPrompt ? config.systemPrompt.cell : '';
    var userDataJSON = JSON.stringify(config.userData || []);
    var createdAt = new Date().toISOString();
    
    var rowData = [sheetName, cellAddress, systemPromptSheet, systemPromptCell, userDataJSON, createdAt, ''];
    
    if (row === -1) {
      configSheet.appendRow(rowData);
    } else {
      var existingCreatedAt = configSheet.getRange(row, 6).getValue();
      rowData[5] = existingCreatedAt || createdAt;
      configSheet.getRange(row, 1, 1, 7).setValues([rowData]);
    }
    
    return true;
  } catch (error) {
    Logger.log('Error saving config: ' + error.message);
    throw new Error('Ошибка сохранения: ' + error.message);
  }
}

function loadCollectConfig(sheetName, cellAddress) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    
    if (!configSheet) return null;
    
    var row = findConfigRow(configSheet, sheetName, cellAddress);
    if (row === -1) return null;
    
    var data = configSheet.getRange(row, 1, 1, 7).getValues()[0];
    
    return {
      systemPrompt: data[2] && data[3] ? { sheet: data[2], cell: data[3] } : null,
      userData: data[4] ? JSON.parse(data[4]) : [],
      createdAt: data[5],
      lastRun: data[6] || null
    };
  } catch (error) {
    Logger.log('Error loading config: ' + error.message);
    return null;
  }
}

function deleteCollectConfig(sheetName, cellAddress) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    
    if (!configSheet) return true;
    
    var row = findConfigRow(configSheet, sheetName, cellAddress);
    if (row === -1) return true;
    
    configSheet.deleteRow(row);
    return true;
  } catch (error) {
    Logger.log('Error deleting config: ' + error.message);
    throw new Error('Ошибка удаления: ' + error.message);
  }
}

function executeCollectConfig(sheetName, cellAddress) {
  try {
    var config = loadCollectConfig(sheetName, cellAddress);
    if (!config) throw new Error('Конфигурация не найдена');
    
    var systemPrompt = '';
    if (config.systemPrompt) {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.systemPrompt.sheet);
      if (sheet) {
        systemPrompt = sheet.getRange(config.systemPrompt.cell).getValue().toString();
      }
    }
    
    var userData = '';
    if (config.userData && config.userData.length > 0) {
      var dataParts = [];
      for (var i = 0; i < config.userData.length; i++) {
        var dataItem = config.userData[i];
        var dataSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(dataItem.sheet);
        if (dataSheet) {
          var values = dataSheet.getRange(dataItem.cell).getValues();
          for (var r = 0; r < values.length; r++) {
            for (var c = 0; c < values[r].length; c++) {
              if (values[r][c] && values[r][c].toString().trim() !== '') {
                dataParts.push(values[r][c].toString());
              }
            }
          }
        }
      }
      userData = dataParts.join('\n\n');
    }
    
    var finalPrompt = '';
    if (systemPrompt) finalPrompt += systemPrompt;
    if (userData) {
      if (finalPrompt) finalPrompt += '\n\n';
      finalPrompt += userData;
    }
    if (!finalPrompt) throw new Error('Нет данных для отправки');
    
    var result = GM(finalPrompt);
    
    var targetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!targetSheet) throw new Error('Лист ' + sheetName + ' не найден');
    
    targetSheet.getRange(cellAddress).setValue(result);
    
    var configSheet = getOrCreateConfigSheet();
    var row = findConfigRow(configSheet, sheetName, cellAddress);
    if (row !== -1) {
      configSheet.getRange(row, 7).setValue(new Date().toISOString());
    }
    
    return { success: true };
  } catch (error) {
    Logger.log('Error executing config: ' + error.message);
    return { success: false, error: error.message };
  }
}
