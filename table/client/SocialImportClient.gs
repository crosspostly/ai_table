// importVkPosts() - реализация в VkImportService.gs


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
