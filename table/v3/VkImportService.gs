/**
 * VK Import Service with Filtering
 * Импорт постов VK с фильтрацией по стоп-словам и позитивным словам
 */

/**
 * Импорт VK постов с автоматической фильтрацией
 */
function importVkPosts() {
  logMessage('→ Импорт VK-постов с фильтрацией', 'INFO');
  
  var ss = SpreadsheetApp.getActive();
  var params = ss.getSheetByName('Параметры');
  
  if (!params) {
    logMessage('❌ Нет листа "Параметры"', 'ERROR');
    SpreadsheetApp.getUi().alert('Лист "Параметры" не найден!');
    return;
  }
  
  var owner = params.getRange('B1').getValue();
  var count = params.getRange('B2').getValue();
  
  if (!owner || !count) {
    logMessage('❌ Не указаны owner или count', 'ERROR');
    SpreadsheetApp.getUi().alert('Введите owner и count на листе "Параметры"');
    return;
  }
  
  var url = VK_PARSER_URL + '?owner=' + encodeURIComponent(owner) + '&count=' + encodeURIComponent(count);
  
  try {
    var resp = UrlFetchApp.fetch(url);
    var arr = JSON.parse(resp.getContentText());
  } catch (e) {
    logMessage('❌ Ошибка запроса VK: ' + e.message, 'ERROR');
    SpreadsheetApp.getUi().alert('Ошибка запроса VK Parser: ' + e);
    return;
  }
  
  if (!Array.isArray(arr)) {
    logMessage('❌ Неверный массив от VK', 'ERROR');
    SpreadsheetApp.getUi().alert('Неверный формат данных от VK Parser');
    return;
  }
  
  var headers = [
    'Дата', 'Ссылка на пост', 'Текст поста', 'Номер поста',
    'Стоп-слова', 'Отфильтрованные посты', 'Новый номер',
    'Позитивные слова', 'Посты с позитивными словами', 'Новый номер (позитивные)',
    'Анализ постов'  // K1 - новая колонка для анализа контента постов
  ];
  
  var out = [headers];
  arr.forEach(function(o, i) {
    var number = o.number !== undefined ? o.number : i + 1;
    out.push([o.date, o.link, o.text, number, '', '', '', '', '', '', '']); // Добавлена пустая ячейка для K1
  });
  
  var sheet = ss.getSheetByName('посты');
  if (!sheet) {
    logMessage('❌ Лист "посты" не найден!', 'ERROR');
    SpreadsheetApp.getUi().alert('Создайте лист "посты".');
    return;
  }
  
  sheet.clear();
  sheet.getRange(1, 1, out.length, headers.length).setValues(out);
  applyUniformFormatting(sheet);
  createStopWordsFormulas(sheet, out.length);
  
  logMessage('✅ Импортировано ' + (out.length-1) + ' постов', 'INFO');
  SpreadsheetApp.getUi().alert('Импорт завершён: ' + (out.length - 1) + ' постов. Формулы фильтрации добавлены.');
}

/**
 * Создание формул фильтрации для стоп-слов и позитивных слов
 */
function createStopWordsFormulas(sheet, totalRows) {
  try {
    logMessage('→ Создание формул фильтрации', 'INFO');
    
    var stopWordsRange = '$E$2:$E$100';
    
    // Формулы для стоп-слов (колонки F и G)
    for (var row = 2; row <= totalRows; row++) {
      // F - отфильтрованные посты (скрывает посты со стоп-словами)
      var formulaF = '=IF(SUMPRODUCT(--(ISNUMBER(SEARCH(' + stopWordsRange + ', C' + row + ')))*(' + stopWordsRange + '<>"")) > 0, "", C' + row + ')';
      sheet.getRange(row, 6).setFormula(formulaF);
      
      // G - новый номер для отфильтрованных постов
      var formulaG = '=IF(F' + row + '<>"", COUNTA(F$2:F' + row + '), "")';
      sheet.getRange(row, 7).setFormula(formulaG);
    }
    
    var positiveWordsRange = '$H$2:$H$100';
    
    // Формулы для позитивных слов (колонки I и J)
    for (var row = 2; row <= totalRows; row++) {
      // I - посты с позитивными словами
      var formulaI = '=IF(SUMPRODUCT(--(ISNUMBER(SEARCH(' + positiveWordsRange + ', C' + row + ')))*(' + positiveWordsRange + '<>"")) > 0, C' + row + ', "")';
      sheet.getRange(row, 9).setFormula(formulaI);
      
      // J - новый номер для позитивных постов
      var formulaJ = '=IF(I' + row + '<>"", COUNTA(I$2:I' + row + '), "")';
      sheet.getRange(row, 10).setFormula(formulaJ);
    }
    
    // Форматирование заголовков
    sheet.getRange(1, 5, 1, 3).setFontWeight('bold').setBackground('#FFF2CC');
    sheet.getRange(1, 8, 1, 3).setFontWeight('bold').setBackground('#D9EAD3');
    
    // Автоширина колонок
    sheet.autoResizeColumns(5, 6);
    
    logMessage('✅ Формулы фильтрации созданы', 'INFO');
  } catch (e) {
    logMessage('❌ Ошибка создания формул: ' + e.message, 'ERROR');
    SpreadsheetApp.getUi().alert('Ошибка создания формул: ' + e.message);
  }
}

/**
 * Тест фильтрации стоп-слов
 */
function testStopWordsFilter() {
  try {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName('посты');
    
    if (!sheet) {
      SpreadsheetApp.getUi().alert('Лист "посты" не найден');
      return;
    }
    
    // Добавляем тестовые стоп-слова
    sheet.getRange(2, 5).setValue('консультация');
    sheet.getRange(3, 5).setValue('психолог');
    
    SpreadsheetApp.flush();
    
    var filtered2 = sheet.getRange(2, 6).getValue();
    var filtered3 = sheet.getRange(3, 6).getValue();
    var number2 = sheet.getRange(2, 7).getValue();
    var number3 = sheet.getRange(3, 7).getValue();
    
    var message = 'Тест фильтрации:\\n\\n' +
      'Строка 2: ' + (filtered2 ? 'показывается' : 'скрыто') + ', номер: ' + (number2 || '—') + '\\n' +
      'Строка 3: ' + (filtered3 ? 'показывается' : 'скрыто') + ', номер: ' + (number3 || '—');
    
    SpreadsheetApp.getUi().alert('Результаты теста', message, SpreadsheetApp.getUi().ButtonSet.OK);
    logMessage('✅ Тест фильтрации выполнен', 'INFO');
  } catch (e) {
    logMessage('❌ Ошибка теста фильтрации: ' + e.message, 'ERROR');
    SpreadsheetApp.getUi().alert('Ошибка теста: ' + e.message);
  }
}

/**
 * Применение единого форматирования к листу
 */
function applyUniformFormatting(sheet) {
  try {
    var range = sheet.getDataRange();
    range.setFontFamily('Arial')
         .setFontSize(10)
         .setVerticalAlignment('middle')
         .setHorizontalAlignment('left');
    
    logMessage('✅ Применено форматирование к листу ' + sheet.getName(), 'DEBUG');
  } catch (e) {
    logMessage('⚠️ Ошибка форматирования листа ' + sheet.getName() + ': ' + e.message, 'WARN');
  }
}