/**
 * Configuration Manager
 * Управление конфигурациями ячеек для GM_COLLECT
 * 
 * Хранит настройки в отдельном скрытом листе "ConfigData"
 * Структура:
 * | Sheet | Cell | SystemPromptSheet | SystemPromptCell | UserDataJSON | CreatedAt | LastRun |
 * 
 * Преимущества:
 * - Нет лимитов PropertiesService (500KB)
 * - Легко просматривать все конфигурации
 * - Можно экспортировать/импортировать
 */

var CONFIG_SHEET_NAME = 'ConfigData';

/**
 * Инициализировать лист конфигураций
 * @return {Sheet} Лист конфигураций
 */
function getOrCreateConfigSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    
    if (!sheet) {
      // Создаём новый лист
      sheet = ss.insertSheet(CONFIG_SHEET_NAME);
      
      // Заголовки
      sheet.getRange('A1:G1').setValues([[
        'Sheet', 'Cell', 'SystemPromptSheet', 'SystemPromptCell', 
        'UserDataJSON', 'CreatedAt', 'LastRun'
      ]]);
      
      // Форматирование заголовков
      sheet.getRange('A1:G1')
        .setBackground('#4285f4')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      
      // Замораживаем первую строку
      sheet.setFrozenRows(1);
      
      // Скрываем лист
      sheet.hideSheet();
      
      Logger.log('✅ Создан лист конфигураций: ' + CONFIG_SHEET_NAME);
    }
    
    return sheet;
    
  } catch (error) {
    Logger.log('❌ Ошибка создания листа конфигураций: ' + error.message);
    throw error;
  }
}

/**
 * Найти строку конфигурации для ячейки
 * @param {Sheet} configSheet - Лист конфигураций
 * @param {string} sheetName - Имя листа
 * @param {string} cellAddress - Адрес ячейки
 * @return {number} Номер строки или -1 если не найдено
 */
function findConfigRow(configSheet, sheetName, cellAddress) {
  try {
    var data = configSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) { // Пропускаем заголовок
      if (data[i][0] === sheetName && data[i][1] === cellAddress) {
        return i + 1; // +1 потому что индексы с 1
      }
    }
    
    return -1;
    
  } catch (error) {
    Logger.log('❌ Ошибка поиска конфигурации: ' + error.message);
    return -1;
  }
}

/**
 * Сохранить конфигурацию для ячейки
 * @param {string} sheetName - Имя листа
 * @param {string} cellAddress - Адрес ячейки (например "B3")
 * @param {Object} config - Конфигурация
 */
function saveCollectConfig(sheetName, cellAddress, config) {
  try {
    var configSheet = getOrCreateConfigSheet();
    var row = findConfigRow(configSheet, sheetName, cellAddress);
    
    var systemPromptSheet = config.systemPrompt ? config.systemPrompt.sheet : '';
    var systemPromptCell = config.systemPrompt ? config.systemPrompt.cell : '';
    var userDataJSON = JSON.stringify(config.userData || []);
    var createdAt = new Date().toISOString();
    
    var rowData = [
      sheetName,
      cellAddress,
      systemPromptSheet,
      systemPromptCell,
      userDataJSON,
      createdAt,
      '' // LastRun пустой при создании
    ];
    
    if (row === -1) {
      // Добавляем новую строку
      configSheet.appendRow(rowData);
      Logger.log('✅ Конфигурация создана для ' + sheetName + '!' + cellAddress);
    } else {
      // Обновляем существующую (сохраняем CreatedAt)
      var existingCreatedAt = configSheet.getRange(row, 6).getValue();
      rowData[5] = existingCreatedAt || createdAt;
      configSheet.getRange(row, 1, 1, 7).setValues([rowData]);
      Logger.log('✅ Конфигурация обновлена для ' + sheetName + '!' + cellAddress);
    }
    
    return true;
    
  } catch (error) {
    Logger.log('❌ Ошибка сохранения конфигурации: ' + error.message);
    return false;
  }
}

/**
 * Загрузить конфигурацию для ячейки
 * @param {string} sheetName - Имя листа
 * @param {string} cellAddress - Адрес ячейки
 * @return {Object|null} Конфигурация или null
 */
function loadCollectConfig(sheetName, cellAddress) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    
    if (!configSheet) {
      return null; // Лист не создан = нет конфигураций
    }
    
    var row = findConfigRow(configSheet, sheetName, cellAddress);
    
    if (row === -1) {
      return null; // Конфигурация не найдена
    }
    
    var data = configSheet.getRange(row, 1, 1, 7).getValues()[0];
    
    var config = {
      systemPrompt: data[2] && data[3] ? {
        sheet: data[2],
        cell: data[3]
      } : null,
      userData: data[4] ? JSON.parse(data[4]) : [],
      createdAt: data[5],
      lastRun: data[6] || null
    };
    
    Logger.log('✅ Конфигурация загружена для ' + sheetName + '!' + cellAddress);
    return config;
    
  } catch (error) {
    Logger.log('❌ Ошибка загрузки конфигурации: ' + error.message);
    return null;
  }
}

/**
 * Удалить конфигурацию для ячейки
 * @param {string} sheetName - Имя листа
 * @param {string} cellAddress - Адрес ячейки
 */
function deleteCollectConfig(sheetName, cellAddress) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    
    if (!configSheet) {
      return true; // Нет листа = нечего удалять
    }
    
    var row = findConfigRow(configSheet, sheetName, cellAddress);
    
    if (row === -1) {
      return true; // Конфигурация не найдена = уже удалена
    }
    
    configSheet.deleteRow(row);
    Logger.log('✅ Конфигурация удалена для ' + sheetName + '!' + cellAddress);
    return true;
    
  } catch (error) {
    Logger.log('❌ Ошибка удаления конфигурации: ' + error.message);
    return false;
  }
}

/**
 * Обновить время последнего запуска
 * @param {string} sheetName - Имя листа
 * @param {string} cellAddress - Адрес ячейки
 */
function updateLastRun(sheetName, cellAddress) {
  try {
    var config = loadCollectConfig(sheetName, cellAddress);
    if (!config) {
      return false;
    }
    
    config.lastRun = new Date().toISOString();
    saveCollectConfig(sheetName, cellAddress, config);
    return true;
    
  } catch (error) {
    Logger.log('❌ Ошибка обновления lastRun: ' + error.message);
    return false;
  }
}

/**
 * Получить все листы в таблице
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
    Logger.log('❌ Ошибка получения списка листов: ' + error.message);
    return [];
  }
}

/**
 * Собрать данные из ячейки/диапазона
 * @param {string} sheetName - Имя листа
 * @param {string} cellAddress - Адрес ячейки или диапазона
 * @return {string} Собранные данные
 */
function collectDataFromRange(sheetName, cellAddress) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      Logger.log('❌ Лист не найден: ' + sheetName);
      return '';
    }
    
    var range = sheet.getRange(cellAddress);
    var values = range.getValues();
    var result = [];
    
    // Собираем все непустые значения
    for (var row = 0; row < values.length; row++) {
      for (var col = 0; col < values[row].length; col++) {
        var value = values[row][col];
        if (value !== null && value !== undefined && value !== '') {
          result.push(String(value));
        }
      }
    }
    
    return result.join(' ');
    
  } catch (error) {
    Logger.log('❌ Ошибка сбора данных из ' + sheetName + '!' + cellAddress + ': ' + error.message);
    return '';
  }
}

/**
 * Выполнить запрос по сохранённой конфигурации
 * @param {string} sheetName - Имя листа
 * @param {string} cellAddress - Адрес ячейки
 * @return {Object} {success, result, error}
 */
function executeCollectConfig(sheetName, cellAddress) {
  try {
    addSystemLog('→ executeCollectConfig START: ' + sheetName + '!' + cellAddress, 'INFO', 'COLLECT_EXEC');
    
    // 🔐 Проверка credentials
    var props = PropertiesService.getScriptProperties();
    var geminiKey = props.getProperty('GEMINI_API_KEY');
    
    if (!geminiKey) {
      addSystemLog('❌ GEMINI_API_KEY не настроен!', 'ERROR', 'COLLECT_EXEC');
      return {
        success: false,
        error: '❌ Не настроен Gemini API Key! Меню → Настройки → Gemini API'
      };
    }
    
    // Загружаем конфигурацию
    addSystemLog('   Загрузка конфигурации...', 'DEBUG', 'COLLECT_EXEC');
    var config = loadCollectConfig(sheetName, cellAddress);
    if (!config) {
      addSystemLog('❌ Конфигурация не найдена!', 'ERROR', 'COLLECT_EXEC');
      return {
        success: false,
        error: 'Конфигурация не найдена для ' + sheetName + '!' + cellAddress
      };
    }
    
    addSystemLog('✅ Конфигурация загружена: ' + JSON.stringify(config), 'DEBUG', 'COLLECT_EXEC');
    
    // Собираем System Prompt
    var systemPrompt = '';
    if (config.systemPrompt) {
      addSystemLog('   Сбор System Prompt из ' + config.systemPrompt.sheet + '!' + config.systemPrompt.cell, 'DEBUG', 'COLLECT_EXEC');
      systemPrompt = collectDataFromRange(
        config.systemPrompt.sheet,
        config.systemPrompt.cell
      );
      addSystemLog('   System Prompt: ' + systemPrompt.substring(0, 100) + '...', 'DEBUG', 'COLLECT_EXEC');
    }
    
    // Собираем User Data
    var userData = [];
    if (config.userData && config.userData.length > 0) {
      addSystemLog('   Сбор User Data из ' + config.userData.length + ' источников', 'DEBUG', 'COLLECT_EXEC');
      for (var i = 0; i < config.userData.length; i++) {
        var dataSource = config.userData[i];
        addSystemLog('     [' + i + '] ' + dataSource.sheet + '!' + dataSource.cell, 'DEBUG', 'COLLECT_EXEC');
        var data = collectDataFromRange(dataSource.sheet, dataSource.cell);
        if (data) {
          userData.push({
            source: dataSource.sheet + '!' + dataSource.cell,
            content: data
          });
          addSystemLog('     ✅ Собрано ' + data.length + ' символов', 'DEBUG', 'COLLECT_EXEC');
        }
      }
    }
    
    // Формируем JSON для отправки в AI
    var requestData = {
      systemInstruction: systemPrompt,
      userData: userData
    };
    
    addSystemLog('   Отправка в Gemini...', 'INFO', 'COLLECT_EXEC');
    
    // Отправляем в Gemini
    var result = sendToGeminiWithJSON(requestData);
    
    addSystemLog('✅ Получен ответ от Gemini: ' + result.substring(0, 100) + '...', 'INFO', 'COLLECT_EXEC');
    
    // Записываем результат в ячейку
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var targetSheet = ss.getSheetByName(sheetName);
    if (targetSheet) {
      targetSh                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    