/**
 * Thin Client - Calls backend server for OCR, VK import, and Gemini API
 */

/**
 * OCR processing for reviews sheet
 */
function ocrReviewsThin() {
  var ui = SpreadsheetApp.getUi();
  
  // Check credentials
  var creds = getClientCredentials();
  if (!creds.valid) {
    ui.alert('Error: ' + creds.error);
    return;
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Reviews') || ss.getSheetByName('Отзывы');
  
  if (!sheet) {
    ui.alert('Sheet "Reviews" or "Отзывы" not found');
    return;
  }
  
  var lastRow = Math.max(2, sheet.getLastRow());
  var processed = 0;
  var errors = 0;
  var skipped = 0;
  var overwrite = getOcrOverwriteFlag();
  
  logClient('Starting OCR process: rows=' + lastRow + ', overwrite=' + overwrite);
  
  for (var r = 2; r <= lastRow; r++) {
    try {
      var cellRange = sheet.getRange(r, 1);
      var cellData = String(cellRange.getDisplayValue() || '').trim();
      var formula = String(cellRange.getFormula() || '');
      
      // Skip empty cells
      if (!cellData && !formula) {
        continue;
      }
      
      // Check if result already exists
      var resultValue = String(sheet.getRange(r, 2).getDisplayValue() || '').trim();
      if (!overwrite && resultValue) {
        skipped++;
        continue;
      }
      
      // Extract cell metadata (formula, rich text links)
      var cellMeta = extractCellMetadata(cellRange);
      
      // Call server API
      var response = callServer({
        action: 'ocr_process',
        email: creds.email,
        token: creds.token,
        geminiApiKey: creds.geminiApiKey,
        cellData: cellData,
        cellMeta: cellMeta,
        options: {
          limit: 50,
          language: 'ru'
        }
      });
      
      if (response.valid && response.data && response.data.length > 0) {
        // Write results using helper function
        writeOcrResults(sheet, r, response.data);
        processed++;
        logClient('OCR success: row=' + r + ', items=' + response.data.length);
      } else {
        errors++;
        logClient('OCR error: row=' + r + ', error=' + (response.error || 'unknown'));
      }
      
    } catch (e) {
      errors++;
      logClient('Exception at row ' + r + ': ' + e.message);
    }
    
    // Rate limiting
    if (r % 5 === 0) {
      Utilities.sleep(100);
    }
  }
  
  var summary = 'OCR Complete:\nProcessed: ' + processed + '\nSkipped: ' + skipped + '\nErrors: ' + errors;
  logClient(summary.replace(/\n/g, ', '));
  ui.alert(summary);
}

/**
 * Extract cell metadata (formula, rich text links)
 */
function extractCellMetadata(cellRange) {
  var meta = {
    formula: '',
    richTextUrl: ''
  };
  
  try {
    // Extract formula
    meta.formula = cellRange.getFormula() || '';
    
    // Extract rich text link
    var richText = cellRange.getRichTextValue();
    if (richText) {
      meta.richTextUrl = extractFirstLink(richText);
    }
  } catch (e) {
    // Ignore metadata extraction errors
  }
  
  return meta;
}

/**
 * Extract first link from rich text
 */
function extractFirstLink(richText) {
  try {
    // Check text runs
    var runs = richText.getRuns && richText.getRuns();
    if (runs && runs.length) {
      for (var i = 0; i < runs.length; i++) {
        var style = runs[i].getTextStyle && runs[i].getTextStyle();
        var linkUrl = style && style.getLinkUrl && style.getLinkUrl();
        if (linkUrl) return String(linkUrl).trim();
      }
    }
    
    // Check cell link
    var cellLinkUrl = richText.getLinkUrl && richText.getLinkUrl();
    if (cellLinkUrl) return String(cellLinkUrl).trim();
    
    // Check text style
    var textStyle = richText.getTextStyle && richText.getTextStyle();
    var styleLinkUrl = textStyle && textStyle.getLinkUrl && textStyle.getLinkUrl();
    if (styleLinkUrl) return String(styleLinkUrl).trim();
    
  } catch (e) {
    // Ignore errors
  }
  
  return '';
}

/**
 * Write OCR results to sheet
 */
function writeOcrResults(sheet, startRow, results) {
  if (!results || !results.length) return;
  
  // Insert additional rows if needed
  if (results.length > 1) {
    sheet.insertRowsAfter(startRow, results.length - 1);
  }
  
  // Write results
  for (var i = 0; i < results.length; i++) {
    var targetRow = startRow + i;
    sheet.getRange(targetRow, 2).setValue(results[i]);
  }
}

/**
 * Import VK posts
 */
function importVkPostsThin() {
  var ui = SpreadsheetApp.getUi();
  
  var creds = getClientCredentials();
  if (!creds.valid) {
    ui.alert('Error: ' + creds.error);
    return;
  }
  
  var vkParams = getVkImportParams();
  if (!vkParams.ok) {
    ui.alert('Error: ' + vkParams.error);
    return;
  }
  
  try {
    var response = callServer({
      action: 'vk_import',
      email: creds.email,
      token: creds.token,
      ownerId: vkParams.ownerId,
      count: vkParams.count
    });
    
    if (response.valid && response.data) {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      writeVkPosts(ss, response.data);
      
      var summary = 'VK import completed: ' + response.data.length + ' posts imported';
      logClient(summary);
      ui.alert(summary);
    } else {
      ui.alert('Import failed: ' + (response.error || 'Unknown error'));
    }
  } catch (e) {
    ui.alert('Error: ' + e.message);
  }
}

/**
 * Write VK posts to sheet
 */
function writeVkPosts(spreadsheet, posts) {
  var sheetName = 'Posts';
  var sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  } else {
    sheet.clear();
  }
  
  // Headers
  var headers = ['Date', 'Post Link', 'Text', 'Post #', 'Comments', 'Likes'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e8f0fe');
  
  // Data
  if (posts.length > 0) {
    var rows = posts.map(function(post) {
      return [
        post.date || '',
        post.link || '',
        post.text || '',
        post.number || '',
        post.comments || 0,
        post.likes || 0
      ];
    });
    
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Static Gemini call - replaces formula with result
 */
function GM_STATIC(prompt, maxTokens, temperature) {
  if (!prompt) return '';
  
  var creds = getClientCredentials();
  if (!creds.valid) return 'ERROR: ' + creds.error;
  
  try {
    var response = callServer({
      action: 'gm',
      email: creds.email,
      token: creds.token,
      geminiApiKey: creds.geminiApiKey,
      prompt: String(prompt),
      maxTokens: maxTokens || 1000,
      temperature: temperature || 0.7
    });
    
    if (response.valid && response.text) {
      // Replace formula with static value
      var range = SpreadsheetApp.getActiveRange();
      if (range) {
        range.setValue(response.text);
      }
      return response.text;
    }
    
    return 'ERROR: ' + (response.error || 'No response');
  } catch (e) {
    return 'ERROR: ' + e.message;
  }
}

/**
 * Conditional static Gemini call
 */
function GM_IF_STATIC(condition, prompt, maxTokens, temperature) {
  var normalized = normalizeCondition(condition);
  
  if (!normalized) return '';
  
  return GM_STATIC(prompt, maxTokens, temperature);
}

/**
 * Normalize condition to boolean
 */
function normalizeCondition(condition) {
  if (typeof condition === 'boolean') return condition;
  if (typeof condition === 'number') return condition !== 0;
  if (typeof condition === 'string') {
    var lower = condition.toLowerCase().trim();
    return lower !== '' && lower !== 'false' && lower !== '0' && lower !== 'no' && lower !== 'нет';
  }
  return !!condition;
}

/**
 * Get client credentials from script properties
 * ВОЗВРАЩЕНО К OLD СТРУКТУРЕ: valid, geminiApiKey
 */
function getClientCredentials() {
  try {
    var props = PropertiesService.getScriptProperties();
    
    var email = props.getProperty('LICENSE_EMAIL');
    var token = props.getProperty('LICENSE_TOKEN');
    var geminiApiKey = props.getProperty('GEMINI_API_KEY');
    
    if (!email || !token) {
      return {
        valid: false,
        error: 'LICENSE_EMAIL или LICENSE_TOKEN не настроены'
      };
    }
    
    if (!geminiApiKey) {
      return {
        valid: false,
        error: 'GEMINI_API_KEY не настроен'
      };
    }
    
    return {
      valid: true,
      email: email,
      token: token,
      geminiApiKey: geminiApiKey
    };
    
  } catch (e) {
    return {
      valid: false,
      error: 'Ошибка чтения credentials: ' + e.message
    };
  }
}

/**
 * Get VK import parameters
 */
function getVkImportParams() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var paramSheet = ss.getSheetByName('Parameters') || ss.getSheetByName('Параметры');
    
    if (!paramSheet) {
      return {ok: false, error: 'Sheet "Parameters" not found'};
    }
    
    var ownerId = paramSheet.getRange('B1').getValue();
    var count = paramSheet.getRange('B2').getValue();
    
    if (!ownerId) {
      return {ok: false, error: 'VK Owner ID not set in B1'};
    }
    
    return {
      ok: true,
      ownerId: String(ownerId),
      count: Number(count) || 10
    };
  } catch (e) {
    return {ok: false, error: e.message};
  }
}

/**
 * Get OCR overwrite flag
 */
function getOcrOverwriteFlag() {
  var props = PropertiesService.getScriptProperties();
  var flag = props.getProperty('OCR_OVERWRITE');
  
  if (!flag) return false;
  
  var lower = flag.toLowerCase().trim();
  return lower === '1' || lower === 'true' || lower === 'yes' || lower === 'да';
}

/**
 * Call backend server
 */
function callServer(requestData) {
  var serverUrl = getServerUrl();
  
  var response = UrlFetchApp.fetch(serverUrl, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(requestData),
    muteHttpExceptions: true
  });
  
  var code = response.getResponseCode();
  
  if (code !== 200) {
    throw new Error('Server error: ' + code);
  }
  
  return JSON.parse(response.getContentText());
}

/**
 * Get server URL
 */
function getServerUrl() {
  if (typeof SERVER_URL !== 'undefined' && SERVER_URL) {
    return String(SERVER_URL).replace(/\/$/, '');
  }
  throw new Error('SERVER_URL not configured');
}

/**
 * Log to console and cache
 */
function logClient(message) {
  console.log('[CLIENT] ' + message);
  
  try {
    var cache = CacheService.getScriptCache();
    var key = 'log_' + Date.now();
    cache.put(key, message, 3600);
  } catch (e) {
    // Cache errors are non-critical
  }
}
