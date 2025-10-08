/**
 * ButtonFunctions.gs
 * Функции для кнопок на листах Google Sheets
 * 
 * Эти функции привязываются к кнопкам через:
 * Правый клик на кнопку → "Assign script" → Имя функции
 */

/**
 * Кнопка "Вжух" на листе с VK ссылкой
 * Импортирует посты из VK альбома по ссылке в A1
 */
function btnVzhuh() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var url = sheet.getRange('A1').getValue();
    
    if (!url || typeof url !== 'string') {
      SpreadsheetApp.getUi().alert('❌ Ошибка', 
        'В ячейке A1 должна быть ссылка на VK альбом или пост', 
        SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    // Вызываем импорт VK
    importVkPosts();
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ошибка', 
      'Не удалось выполнить импорт: ' + e.message, 
      SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log('btnVzhuh error: ' + e.message);
  }
}

/**
 * Кнопка "Распаковаться" на листе "Распаковка" 
 * Запускает импорт постов из социальных сетей
 */
function btnRaspakovatsa() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var sheetName = sheet.getName();
    
    Logger.log('btnRaspakovatsa called from sheet: ' + sheetName);
    
    // Проверяем что находимся на правильном листе
    if (sheetName !== 'Распаковка' && sheetName !== 'Raspakovka') {
      SpreadsheetApp.getUi().alert('⚠️ Внимание', 
        'Эта кнопка работает только на листе "Распаковка"', 
        SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    // Вызываем функцию импорта с подсказкой
    importVkPostsWithHelp();
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ошибка', 
      'Не удалось выполнить распаковку: ' + e.message, 
      SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log('btnRaspakovatsa error: ' + e.message);
  }
}

/**
 * Кнопка на листе "Отзывы" (ячейка A3)
 * Запускает OCR обработку отзывов (изображения → текст)
 */
function btnProcessReviews() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var sheetName = sheet.getName();
    
    Logger.log('btnProcessReviews called from sheet: ' + sheetName);
    
    // Проверяем что находимся на правильном листе
    if (sheetName !== 'Отзывы' && sheetName !== 'Reviews' && sheetName !== 'Otzivi') {
      SpreadsheetApp.getUi().alert('⚠️ Внимание', 
        'Эта кнопка работает только на листе "Отзывы"', 
        SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    // Вызываем функцию OCR с подсказкой
    ocrReviewsWithHelp();
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ошибка', 
      'Не удалось обработать отзывы: ' + e.message, 
      SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log('btnProcessReviews error: ' + e.message);
  }
}

/**
 * Универсальная кнопка "Обработать"
 * Определяет тип данных в колонке A и запускает соответствующую обработку
 */
function btnProcessData() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var range = sheet.getDataRange();
    var values = range.getValues();
    
    // Проверяем первую ячейку с данными
    var firstCell = values[0][0];
    
    if (!firstCell || typeof firstCell !== 'string') {
      SpreadsheetApp.getUi().alert('❌ Ошибка', 
        'Не найдены данные для обработки в колонке A', 
        SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    // Определяем тип данных по URL
    if (firstCell.includes('vk.com') || firstCell.includes('vkontakte')) {
      // VK link
      importVkPosts();
    } else if (firstCell.includes('http') && (firstCell.includes('jpg') || firstCell.includes('png') || firstCell.includes('jpeg'))) {
      // Image link - OCR
      ocrReviews();
    } else if (firstCell.includes('t.me') || firstCell.includes('telegram')) {
      // Telegram link
      SpreadsheetApp.getUi().alert('ℹ️ Telegram', 
        'Для импорта из Telegram используйте меню "Table AI" → "Получить VK посты"', 
        SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      // Unknown - показываем меню выбора
      var ui = SpreadsheetApp.getUi();
      var response = ui.alert('Выберите действие', 
        'Что вы хотите сделать с данными в колонке A?', 
        ui.ButtonSet.YES_NO_CANCEL);
      
      if (response == ui.Button.YES) {
        importVkPosts();
      } else if (response == ui.Button.NO) {
        ocrReviews();
      }
    }
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ошибка', 
      'Не удалось обработать данные: ' + e.message, 
      SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log('btnProcessData error: ' + e.message);
  }
}

/**
 * Кнопка "Запустить анализ"
 * Запускает умные цепочки A3→B3→C3→...→G3
 */
function btnRunAnalysis() {
  try {
    prepareChainSmartWithHelp();
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ошибка', 
      'Не удалось запустить анализ: ' + e.message, 
      SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log('btnRunAnalysis error: ' + e.message);
  }
}

/**
 * Кнопка "Очистить"
 * Очищает формулы в B3..G3
 */
function btnClearFormulas() {
  try {
    clearChainForA3WithHelp();
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ошибка', 
      'Не удалось очистить формулы: ' + e.message, 
      SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log('btnClearFormulas error: ' + e.message);
  }
}

/**
 * Тестовая кнопка для отладки
 */
function btnTest() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var sheetName = sheet.getName();
    var range = sheet.getActiveRange();
    var cell = range.getA1Notation();
    
    var message = 'Тестовая кнопка работает!\n\n' +
                  'Лист: ' + sheetName + '\n' +
                  'Активная ячейка: ' + cell;
    
    SpreadsheetApp.getUi().alert('✅ Тест', message, SpreadsheetApp.getUi().ButtonSet.OK);
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ошибка', 
      'Ошибка теста: ' + e.message, 
      SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log('btnTest error: ' + e.message);
  }
}
