/**
 * Social Import Client v2.0
 * Клиентский интерфейс для универсального импорта социальных сетей
 * ВОССТАНОВЛЕНО ИЗ old/Main.txt - ЧТЕНИЕ ИЗ ЛИСТА "Параметры" B1, B2, C1
 */

/**
 * ОРИГИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ ИЗ old/Main.txt
 * Импорт VK постов через Google Apps Script парсер
 * Использует VK_PARSER_URL с параметрами owner и count
 */
function importVkPosts() {
  // Используем константу VK_PARSER_URL как в старой версии
  var VK_PARSER_URL = 'https://script.google.com/macros/s/AKfycbzttbqz16EmmcXbEYCuYhNlXkCxAnCG77phspFL1_rTCi4xVqoorByJAPa4dI4iwT8/exec';
  
  addSystemLog('→ Импорт VK-постов с фильтрацией', 'INFO');
  
  var ss = SpreadsheetApp.getActive();
  var params = ss.getSheetByName('Параметры');
  
  if (!params) { 
    addSystemLog('❌ Нет листа "Параметры"', 'ERROR'); 
    SpreadsheetApp.getUi().alert('Лист "Параметры" не найден!'); 
    return; 
  }
  
  var owner = params.getRange('B1').getValue();
  var count = params.getRange('B2').getValue();
  
  if (!owner || !count) { 
    addSystemLog('❌ Не указаны owner или count', 'ERROR'); 
    SpreadsheetApp.getUi().alert('Введите owner и count на листе "Параметры"'); 
    return; 
  }
  
  // Формируем URL точно как в старой версии
  var url = VK_PARSER_URL + '?owner=' + encodeURIComponent(owner) + '&count=' + encodeURIComponent(count);
  
  try {
    var resp = UrlFetchApp.fetch(url);
    var arr = JSON.parse(resp.getContentText());
  } catch (e) {
    addSystemLog('❌ Ошибка запроса VK: ' + e.message, 'ERROR');
    SpreadsheetApp.getUi().alert('Ошибка запроса VK Parser: ' + e);
    return;
  }
  
  if (!Array.isArray(arr)) { 
    addSystemLog('❌ Неверный массив от VK', 'ERROR'); 
    SpreadsheetApp.getUi().alert('Неверный формат данных от VK Parser'); 
    return; 
  }

  var headers = [
    'Дата', 'Ссылка на пост', 'Текст поста', 'Номер поста',
    'Стоп-слова', 'Отфильтрованные посты', 'Новый номер',
    'Позитивные слова', 'Посты с позитивными словами', 'Новый номер (позитивные)'
  ];
  
  var out = [headers];
  
  arr.forEach(function(o, i) {
    var number = o.number !== undefined ? o.number : i + 1;
    out.push([o.date, o.link, o.text, number, '', '', '', '', '', '']);
  });

  var sheet = ss.getSheetByName('посты');
  
  if (!sheet) { 
    addSystemLog('❌ Лист "посты" не найден!', 'ERROR'); 
    SpreadsheetApp.getUi().alert('Создайте лист "посты".'); 
    return; 
  }

  sheet.clear();
  sheet.getRange(1, 1, out.length, headers.length).setValues(out);
  
  // Применяем форматирование
  applyUniformFormatting(sheet);
  
  // Создаем формулы фильтрации
  createStopWordsFormulas(sheet, out.length);
  
  addSystemLog('✅ Импортировано ' + (out.length-1) + ' постов', 'INFO');
  SpreadsheetApp.getUi().alert('Импорт завершён: ' + (out.length - 1) + ' постов. Формулы фильтрации добавлены.');
}

/**
 * Запись социальных постов в лист
 * ВОССТАНОВЛЕНО ИЗ old/Main.txt
 */
function writeSocialPostsToSheet(ss, posts, platform) {
  if (!posts || !posts.length) {
    return;
  }
  
  try {
    var sheet = ss.getActiveSheet();
    var startRow = sheet.getLastRow() + 1;
    
    // Если первая строка пуста, начинаем с неё
    if (startRow === 1 && !sheet.getRange('A1').getValue()) {
      // Добавляем заголовки
      var headers = ['Платформа', 'Дата', 'Ссылка', 'Текст', 'ID', 'Лайки', 'Комментарии'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#4285f4')
        .setFontColor('white');
      startRow = 2;
    }
    
    // Записываем данные постов
    var data = [];
    for (var i = 0; i < posts.length; i++) {
      var post = posts[i];
      data.push([
        (platform || 'social').toUpperCase(),
        post.date || '',
        post.link || post.url || '',
        post.text || '',
        post.id || '',
        post.likes || 0,
        post.comments || 0
      ]);
    }
    
    sheet.getRange(startRow, 1, data.length, 7).setValues(data);
    
    // Авто-ширина колонок
    sheet.autoResizeColumns(1, 7);
    
    addSystemLog('Posts written to sheet: ' + data.length + ' rows', 'INFO', 'SOCIAL');
    
  } catch (e) {
    addSystemLog('Error writing posts to sheet: ' + e.message, 'ERROR', 'SOCIAL');
    throw new Error('Ошибка записи в лист: ' + e.message);
  }
}

/**
 * Создание формул фильтрации по стоп-словам и позитивным словам
 * ТОЧНАЯ КОПИЯ ИЗ old/Main.txt
 */
function createStopWordsFormulas(sheet, totalRows) {
  try {
    addSystemLog('→ Создание формул фильтрации', 'INFO');
    var stopWordsRange = '$E$2:$E$100';
    for (var row = 2; row <= totalRows; row++) {
      var formulaF = '=IF(SUMPRODUCT(--(ISNUMBER(SEARCH(' + stopWordsRange + ', C' + row + ')))*(' + stopWordsRange + '<>"")) > 0, "", C' + row + ')';
      sheet.getRange(row, 6).setFormula(formulaF); // F
      var formulaG = '=IF(F' + row + '<>"", COUNTA(F$2:F' + row + '), "")';
      sheet.getRange(row, 7).setFormula(formulaG); // G
    }
    var positiveWordsRange = '$H$2:$H$100';
    for (var row = 2; row <= totalRows; row++) {
      var formulaI = '=IF(SUMPRODUCT(--(ISNUMBER(SEARCH(' + positiveWordsRange + ', C' + row + ')))*(' + positiveWordsRange + '<>"")) > 0, C' + row + ', "")';
      sheet.getRange(row, 9).setFormula(formulaI); // I
      var formulaJ = '=IF(I' + row + '<>"", COUNTA(I$2:I' + row + '), "")';
      sheet.getRange(row, 10).setFormula(formulaJ); // J
    }
    sheet.getRange(1, 5, 1, 3).setFontWeight('bold').setBackground('#FFF2CC');
    sheet.getRange(1, 8, 1, 3).setFontWeight('bold').setBackground('#D9EAD3');
    sheet.autoResizeColumns(5, 6);
    addSystemLog('✅ Формулы фильтрации созданы', 'INFO');
  } catch (e) {
    addSystemLog('❌ Ошибка создания формул: ' + e.message, 'ERROR');
    SpreadsheetApp.getUi().alert('Ошибка создания формул: ' + e.message);
  }
}

/**
 * Применение единообразного форматирования к листу
 * ТОЧНАЯ КОПИЯ ИЗ old/Main.txt
 */
function applyUniformFormatting(sheet) {
  try {
    var range = sheet.getDataRange();
    range.setFontFamily('Arial')
         .setFontSize(10)
         .setVerticalAlignment('middle')
         .setHorizontalAlignment('left');
    addSystemLog('✅ Применено форматирование к листу ' + sheet.getName(), 'DEBUG');
  } catch (e) {
    addSystemLog('⚠️ Ошибка форматирования листа ' + sheet.getName() + ': ' + e.message, 'WARN');
  }
}
