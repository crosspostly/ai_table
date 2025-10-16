/**
 * VK Import Service with Filtering v2.0 - Refactored and Stabilized
 * Uses direct VK API access for importing posts with filtering capabilities.
 */

// --- Stubs for stability ---
function removeEmojis(text) { return text; } // Placeholder
function getPlatformTimeout(platform) { return 30000; } // Placeholder
function addSystemLog(message, level, context) { console.log(`${level} [${context}]: ${message}`); }

/**
 * Gets the VK token from Script Properties.
 */
function getVkToken_() {
  var token = PropertiesService.getScriptProperties().getProperty('VK_TOKEN');
  if (!token) throw new Error('VK_TOKEN is not configured.');
  return token;
}

/**
 * Fetches posts from a VK wall using the VK API.
 */
function handleWallGet_(owner, count) {
  var token = getVkToken_();
  var paramName = /^[-\d]+$/.test(String(owner)) ? 'owner_id' : 'domain';
  var apiUrl = `https://api.vk.com/method/wall.get?${paramName}=${encodeURIComponent(owner)}&count=${Math.min(count || 10, 100)}&access_token=${token}&v=5.131`;

  try {
    var response = UrlFetchApp.fetch(apiUrl, { muteHttpExceptions: true });
    var jsonResponse = JSON.parse(response.getContentText());

    if (response.getResponseCode() !== 200 || jsonResponse.error) {
      throw new Error(jsonResponse.error ? jsonResponse.error.error_msg : 'HTTP ' + response.getResponseCode());
    }

    return jsonResponse.response.items.map(function(post, i) {
      return {
        date: new Date(post.date * 1000).toLocaleString(),
        link: `https://vk.com/wall${post.owner_id}_${post.id}`,
        text: removeEmojis(post.text || ''),
        number: i + 1,
        comments: post.comments ? post.comments.count : 0,
        likes: post.likes ? post.likes.count : 0
      };
    });
  } catch (e) {
    addSystemLog('VK API handleWallGet_ error: ' + e.message, 'ERROR', 'VK_IMPORT');
    throw new Error('Failed to get VK posts: ' + e.message);
  }
}

/**
 * Imports and filters VK posts into the spreadsheet.
 */
function importVkPosts() {
  var ss = SpreadsheetApp.getActive();
  var params = ss.getSheetByName('Параметры');
  if (!params) {
    SpreadsheetApp.getUi().alert('Sheet "Параметры" not found.');
    return;
  }

  var owner = params.getRange('B1').getValue();
  var count = params.getRange('B2').getValue();
  if (!owner || !count) {
    SpreadsheetApp.getUi().alert('Owner and count must be set in "Параметры".');
    return;
  }

  try {
    var posts = handleWallGet_(owner, count);
    var sheet = ss.getSheetByName('посты');
    if (!sheet) {
      SpreadsheetApp.getUi().alert('Sheet "посты" not found.');
      return;
    }
    
    var headers = ['Дата', 'Ссылка', 'Текст', '№', 'Стоп-слова', 'Фильтр', '№ фил.', 'Позитив', 'Фильтр поз.', '№ поз.', 'Анализ'];
    var output = posts.map(function(p) { return [p.date, p.link, p.text, p.number, '', '', '', '', '', '', '']; });
    
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (output.length > 0) {
        sheet.getRange(2, 1, output.length, headers.length).setValues(output);
    }
    createStopWordsFormulas(sheet, posts.length + 1);
    SpreadsheetApp.getUi().alert('Imported ' + posts.length + ' posts.');

  } catch (e) {
    SpreadsheetApp.getUi().alert('VK Import Error: ' + e.message);
  }
}

/**
 * Creates filtering formulas on the sheet.
 */
function createStopWordsFormulas(sheet, totalRows) {
    if(totalRows <= 1) return;
    var stopWordsRange = '$E$2:$E$100';
    var positiveWordsRange = '$H$2:$H$100';

    for (var row = 2; row <= totalRows; row++) {
        sheet.getRange(row, 6).setFormula(`=IF(SUMPRODUCT(--(ISNUMBER(SEARCH(${stopWordsRange}, C${row}))))>0, "", C${row})`);
        sheet.getRange(row, 7).setFormula(`=IF(F${row}<>"", COUNTA(F$2:F${row}), "")`);
        sheet.getRange(row, 9).setFormula(`=IF(SUMPRODUCT(--(ISNUMBER(SEARCH(${positiveWordsRange}, C${row}))))>0, C${row}, "")`);
        sheet.getRange(row, 10).setFormula(`=IF(I${row}<>"", COUNTA(I$2:I${row}), "")`);
    }
}

/**
 * Fetches VK reviews by searching relevant topics.
 */
function handleParseReviews_(url, limit, offset) {
    var m = String(url).match(/vk\.com\/reviews-([0-9]+)/i);
    if (!m) throw new Error('Invalid reviews page URL.');
    var groupId = parseInt(m[1], 10);

    // This is a simplified stub. A full implementation would require pagination logic across multiple topics.
    addSystemLog('handleParseReviews_ is a stub and may not fetch all reviews.', 'WARN', 'VK_IMPORT');
    return { texts: [], hasMore: false, nextOffset: 0, total: 0 };
}
