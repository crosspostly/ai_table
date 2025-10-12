/**
 * VK Import Service with Filtering v2.0 - ИНТЕГРИРОВАННЫЙ VK API
 * Импорт постов VK с фильтрацией по стоп-словам и позитивным словам
 * 🔥 МИГРАЦИЯ: Интегрированы функции из VK_PARSER для прямого VK API доступа
 */

/**
 * Удаляет эмодзи и смайлики из текста (локальная копия)
 * @param {string} text - Исходный текст
 * @return {string} - Текст без эмодзи
 */
function removeEmojis(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  var emojiPattern = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]|[\u2300-\u23FF]|[\u2B50]|[\uFE00-\uFE0F]|[\u200D]|[\u20E3]/g;
  var cleaned = text.replace(emojiPattern, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Получение VK токена из Properties
 * @return {string} VK токен
 */
function getVkToken_() {
  var token = PropertiesService.getScriptProperties().getProperty('VK_TOKEN');
  if (!token) {
    throw new Error('VK_TOKEN не настроен в Script Properties основного сервера');
  }
  return token;
}

/**
 * ИНТЕГРИРОВАННАЯ ФУНКЦИЯ: Получение постов со стены VK (из VK_PARSER)
 * @param {string|number} owner - ID пользователя или domain (например: 1, 'durov', '-123456')
 * @param {number} count - количество постов (макс. 100)
 * @return {Array} массив постов с полями: date, link, text, number, comments, likes
 */
function handleWallGet_(owner, count) {
  var token = getVkToken_();
  var version = '5.131';
  
  if (!owner) {
    throw new Error('Не указан параметр owner');
  }
  
  // Определяем тип параметра (ID или domain)
  var paramName = /^[-\d]+$/.test(String(owner)) ? 'owner_id' : 'domain';
  
  var apiUrl = 'https://api.vk.com/method/wall.get'
    + '?' + paramName + '=' + encodeURIComponent(owner)
    + '&count=' + encodeURIComponent(Math.min(parseInt(count) || 10, 100))
    + '&access_token=' + encodeURIComponent(token)
    + '&v=' + encodeURIComponent(version);
    
  try {
    var response = UrlFetchApp.fetch(apiUrl, { 
      muteHttpExceptions: true,
      timeout: getPlatformTimeout('vk')
    });
    
    var statusCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    if (statusCode !== 200) {
      throw new Error('HTTP ' + statusCode + ': ' + responseText);
    }
    
    var jsonResponse = JSON.parse(responseText);
    
    if (jsonResponse.error) {
      throw new Error('VK API Error: ' + (jsonResponse.error.error_msg || JSON.stringify(jsonResponse.error)));
    }
    
    if (!jsonResponse.response || !Array.isArray(jsonResponse.response.items)) {
      throw new Error('Непредвиденный формат ответа VK API');
    }
    
    // Преобразуем в формат совместимый с существующим кодом
    var posts = jsonResponse.response.items.map(function(post, index) {
      var rawText = String(post.text || '').replace(/\\n/g, ' ');
      var cleanText = removeEmojis(rawText);  // Удаляем эмодзи из текста поста
      
      return {
        date: new Date(post.date * 1000).toLocaleString(),
        link: 'https://vk.com/wall' + post.owner_id + '_' + post.id,
        text: cleanText,
        number: index + 1,
        comments: (post.comments && post.comments.count) || 0,
        likes: (post.likes && post.likes.count) || 0
      };
    });
    
    logMessage('✅ VK API handleWallGet_: получено ' + posts.length + ' постов от ' + owner, 'INFO');
    
    return posts;
    
  } catch (error) {
    logMessage('❌ VK API handleWallGet_ ошибка: ' + error.message, 'ERROR');
    throw new Error('Ошибка получения VK постов: ' + error.message);
  }
}

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
  
  // 🔥 МИГРАЦИЯ: Используем интегрированную handleWallGet_ вместо внешнего VK_PARSER
  try {
    logMessage('→ Используем интегрированный VK API вместо внешнего VK_PARSER', 'INFO');
    var arr = handleWallGet_(owner, count);
  } catch (e) {
    logMessage('❌ Ошибка интегрированного VK API: ' + e.message, 'ERROR');
    SpreadsheetApp.getUi().alert('Ошибка VK API: ' + e.message);
    return;
  }
  
  if (!Array.isArray(arr)) {
    logMessage('❌ Неверный массив от интегрированного VK API', 'ERROR');
    SpreadsheetApp.getUi().alert('Неверный формат данных от VK API');
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
      // ИСПРАВЛЕНО: Используем D (текст поста) вместо C (ссылка), чтобы при копировании получать текст!
      var formulaF = '=IF(SUMPRODUCT(--(ISNUMBER(SEARCH(' + stopWordsRange + ', D' + row + ')))*(' + stopWordsRange + '<>"")) > 0, "", D' + row + ')';
      sheet.getRange(row, 6).setFormula(formulaF);
      
      // G - новый номер для отфильтрованных постов
      var formulaG = '=IF(F' + row + '<>"", COUNTA(F$2:F' + row + '), "")';
      sheet.getRange(row, 7).setFormula(formulaG);
    }
    
    var positiveWordsRange = '$H$2:$H$100';
    
    // Формулы для позитивных слов (колонки I и J)
    for (var row = 2; row <= totalRows; row++) {
      // I - посты с позитивными словами
      // ИСПРАВЛЕНО: Используем D (текст поста) вместо C (ссылка), чтобы при копировании получать текст!
      var formulaI = '=IF(SUMPRODUCT(--(ISNUMBER(SEARCH(' + positiveWordsRange + ', D' + row + ')))*(' + positiveWordsRange + '<>"")) > 0, D' + row + ', "")';
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
    
    // ПРЕОБРАЗОВАНИЕ ФОРМУЛ В ЗНАЧЕНИЯ
    // Чтобы при копировании копировались значения, а не формулы
    convertFormulasToValues_(sheet, totalRows);
    
    logMessage('✅ Формулы фильтрации созданы и преобразованы в значения', 'INFO');
  } catch (e) {
    logMessage('❌ Ошибка создания формул: ' + e.message, 'ERROR');
    SpreadsheetApp.getUi().alert('Ошибка создания формул: ' + e.message);
  }
}

/**
 * Получение VK Reviews Regex
 * ИЗ СТАРОЙ РАБОЧЕЙ ВЕРСИИ old/VK_PARSER.txt
 * @return {RegExp}
 */
function getReviewsRegex_() {
  try {
    var s = PropertiesService.getScriptProperties().getProperty('VK_REVIEWS_REGEX');
    if (s && s.trim()) {
      return new RegExp(s, 'i');
    }
  } catch (e) {
    logMessage('⚠️ VK_REVIEWS_REGEX не задан, использую default', 'WARN');
  }
  // Default regex для отзывов
  return /(отзыв|reviews?|feedback|рейтинг|оценк|звезд)/i;
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
    
    var message = 'Тест фильтрации:\
\
' +
      'Строка 2: ' + (filtered2 ? 'показывается' : 'скрыто') + ', номер: ' + (number2 || '—') + '\
' +
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

// ============ ВОССТАНОВЛЕННЫЕ ФУНКЦИИ ИЗ old/VK_PARSER.txt ============

/**
 * Парсинг альбомов VK (восстановлено из old/VK_PARSER.txt)
 * @param {string} url - URL альбома VK
 * @param {number} limit - лимит изображений
 * @param {number} offset - смещение для пагинации
 * @return {Object} - изображения и информация о пагинации
 */
function handleParseAlbum_(url, limit, offset) {
  limit = parseInt(limit || '100', 10);
  offset = parseInt(offset || '0', 10);
  
  if (!url) {
    throw new Error('Не указан url альбома');
  }
  
  var token = getVkToken_();
  var v = '5.131';
  
  // Извлекаем owner_id и album_id из URL
  var m = String(url).match(/vk\.com\/album(-?\d+)_([0-9]+)/i);
  if (!m) {
    throw new Error('Неверный формат URL альбома');
  }
  
  var ownerId = parseInt(m[1], 10);
  var albumId = parseInt(m[2], 10);
  
  var api = 'https://api.vk.com/method/photos.get'
    + '?owner_id=' + ownerId
    + '&album_id=' + albumId
    + '&count=' + Math.max(1, Math.min(1000, limit))
    + '&offset=' + Math.max(0, offset)
    + '&photo_sizes=1'
    + '&access_token=' + encodeURIComponent(token)
    + '&v=' + v;
  
  var res = UrlFetchApp.fetch(api, { muteHttpExceptions: true });
  var code = res.getResponseCode();
  var js = JSON.parse(res.getContentText());
  
  if (code !== 200 || js.error) {
    throw new Error((js.error && js.error.error_msg) || ('HTTP_' + code));
  }
  
  var resp = js.response;
  var items = (resp && resp.items) || [];
  var total = resp && resp.count || (offset + items.length);
  
  var images = items.map(function(ph) {
    var sizes = ph.sizes || [];
    var best = null;
    for (var i = 0; i < sizes.length; i++) {
      if (!best || (sizes[i].width * sizes[i].height > best.width * best.height)) {
        best = sizes[i];
      }
    }
    return { 
      url: best ? best.url : '', 
      w: best ? best.width : 0, 
      h: best ? best.height : 0 
    };
  }).filter(function(x){ return !!x.url; });
  
  var hasMore = (offset + items.length) < total;
  var nextOffset = offset + items.length;
  
  return { 
    images: images, 
    hasMore: hasMore, 
    nextOffset: nextOffset, 
    total: total 
  };
}

/**
 * Парсинг обсуждений VK (восстановлено из old/VK_PARSER.txt)
 * @param {string} url - URL обсуждения
 * @param {number} limit - лимит комментариев
 * @param {number} offset - смещение для пагинации
 * @return {Object} - тексты и информация о пагинации
 */
function handleParseDiscussion_(url, limit, offset) {
  limit = parseInt(limit || '100', 10);
  offset = parseInt(offset || '0', 10);
  
  if (!url) {
    throw new Error('Не указан url темы');
  }
  
  var token = getVkToken_();
  var v = '5.131';
  
  // Извлекаем group_id и topic_id из URL
  var m = String(url).match(/vk\.com\/topic(-?\d+)_([0-9]+)/i);
  if (!m) {
    throw new Error('Неверный формат URL темы');
  }
  
  var ownerId = parseInt(m[1], 10); // может быть отрицательным (группа)
  var groupId = Math.abs(ownerId);
  var topicId = parseInt(m[2], 10);
  
  var api = 'https://api.vk.com/method/board.getComments'
    + '?group_id=' + groupId
    + '&topic_id=' + topicId
    + '&count=' + Math.max(1, Math.min(100, limit))
    + '&offset=' + Math.max(0, offset)
    + '&access_token=' + encodeURIComponent(token)
    + '&v=' + v;
  
  var res = UrlFetchApp.fetch(api, { muteHttpExceptions: true });
  var code = res.getResponseCode();
  var js = JSON.parse(res.getContentText());
  
  if (code !== 200 || js.error) {
    throw new Error((js.error && js.error.error_msg) || ('HTTP_' + code));
  }
  
  var resp = js.response;
  var items = (resp && resp.items) || [];
  var total = resp && resp.count || (offset + items.length);
  
  var texts = items.map(function(c) { 
    return String(c.text || '').trim(); 
  }).filter(function(s){ return !!s; });
  
  var hasMore = (offset + items.length) < total;
  var nextOffset = offset + items.length;
  
  return { 
    texts: texts, 
    hasMore: hasMore, 
    nextOffset: nextOffset, 
    total: total 
  };
}

/**
 * Парсинг отзывов VK (восстановлено из old/VK_PARSER.txt)
 * @param {string} url - URL страницы с отзывами
 * @param {number} limit - лимит отзывов
 * @param {number} offset - смещение для пагинации
 * @return {Object} - тексты и информация о пагинации
 */
function handleParseReviews_(url, limit, offset) {
  limit = parseInt(limit || '100', 10);
  offset = parseInt(offset || '0', 10);
  
  if (!url) {
    throw new Error('Не указан url reviews-страницы');
  }
  
  var token = getVkToken_();
  var v = '5.131';
  
  // Извлекаем group_id из URL
  var m = String(url).match(/vk\.com\/reviews-([0-9]+)/i);
  if (!m) {
    throw new Error('Неверный формат URL reviews-страницы');
  }
  
  var groupId = parseInt(m[1], 10);
  
  // 1) Получаем темы обсуждений и фильтруем по ключевым словам "отзыв", "review", "feedback"
  var topicsApi = 'https://api.vk.com/method/board.getTopics'
    + '?group_id=' + groupId
    + '&order=2&count=200'
    + '&extended=0'
    + '&access_token=' + encodeURIComponent(token)
    + '&v=' + v;
  
  var tRes = UrlFetchApp.fetch(topicsApi, { muteHttpExceptions: true });
  var tCode = tRes.getResponseCode();
  var tJs = JSON.parse(tRes.getContentText());
  
  if (tCode !== 200 || tJs.error) {
    throw new Error((tJs.error && tJs.error.error_msg) || ('HTTP_' + tCode));
  }
  
  var topics = (tJs.response && tJs.response.items) || [];
  var re = getReviewsRegex_();
  topics = topics.filter(function(tp){ 
    return re.test(String(tp.title || '')); 
  });
  
  if (!topics.length) {
    return { texts: [], hasMore: false, nextOffset: offset, total: 0 };
  }
  
  // 2) Глобальная пагинация: offset относится к сумме комментариев по всем подходящим темам
  var total = 0; 
  for (var i=0; i<topics.length; i++) {
    total += (topics[i].comments || 0);
  }
  
  var texts = [];
  var remain = Math.max(0, Math.min(1000, limit)); // защитный предел
  var skip = Math.max(0, offset);
  var idx = 0;
  
  while (idx < topics.length && remain > 0) {
    var tp = topics[idx];
    var cCount = tp.comments || 0;
    
    if (skip >= cCount) { 
      skip -= cCount; 
      idx++; 
      continue; 
    }
    
    // Берём из этой темы, начиная с skip, до remain
    var take = Math.min(remain, 100); // API limit 100
    var commentsApi = 'https://api.vk.com/method/board.getComments'
      + '?group_id=' + groupId
      + '&topic_id=' + tp.id
      + '&count=' + take
      + '&offset=' + skip
      + '&access_token=' + encodeURIComponent(token)
      + '&v=' + v;
    
    var cRes = UrlFetchApp.fetch(commentsApi, { muteHttpExceptions: true });
    var cCode = cRes.getResponseCode();
    var cJs = JSON.parse(cRes.getContentText());
    
    if (cCode !== 200 || cJs.error) {
      throw new Error((cJs.error && cJs.error.error_msg) || ('HTTP_' + cCode));
    }
    
    var items = (cJs.response && cJs.response.items) || [];
    var parts = items.map(function(c){ 
      return String(c.text || '').trim(); 
    }).filter(function(s){ return !!s; });
    
    for (var k=0; k<parts.length && remain>0; k++) { 
      texts.push(parts[k]); 
      remain--; 
    }
    
    // после первого захода по теме, дальше offset=0 (мы "съели" skip)
    skip = 0;
    
    // если всё ещё есть место и комментарии закончились — двигаемся к следующей теме
    if (parts.length < take) { 
      idx++; 
    }
  }
  
  var nextOffset = offset + texts.length;
  var hasMore = nextOffset < total;
  
  return { 
    texts: texts, 
    hasMore: hasMore, 
    nextOffset: nextOffset, 
    total: total, 
    topicCount: topics.length 
  };
}

/**
 * Получение регулярного выражения для фильтрации отзывов
 */
function getReviewsRegex_() {
  try {
    var s = PropertiesService.getScriptProperties().getProperty('VK_REVIEWS_REGEX');
    if (s && s.trim()) {
      return new RegExp(s, 'i');
    }
  } catch (e) {}
  return /(отзыв|reviews?|feedback|рейтинг|оценк|звезд)/i;
}