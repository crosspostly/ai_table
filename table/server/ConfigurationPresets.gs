/**
 * Configuration Presets Manager
 * Управление пресетами конфигураций AI Конструктора
 * 
 * Version: 1.0.0
 * Created: 2025-01-14
 */

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
        `Не удалось применить пресет "${selectedPresetName}":${result.error}`,
        ui.ButtonSet.OK
      );
    }
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Ошибка', 'Ошибка применения пресета: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Экспорт пресетов в JSON для резервного копирования
 * @return {string} JSON с пресетами
 */
function exportPresetsToJSON() {
  try {
    var presets = getAllConfigPresets();
    var exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      presets: []
    };
    
    // Загружаем полные данные каждого пресета
    for (var i = 0; i < presets.length; i++) {
      var preset = loadConfigPreset(presets[i].name);
      if (preset) {
        exportData.presets.push(preset);
      }
    }
    
    return JSON.stringify(exportData, null, 2);
    
  } catch (error) {
    addSystemLog(`❌ Ошибка экспорта пресетов: ${error.message}`, 'ERROR', 'PRESETS');
    throw error;
  }
}