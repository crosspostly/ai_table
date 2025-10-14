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
