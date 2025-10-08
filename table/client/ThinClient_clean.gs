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
  if (!creds.ok) {
    ui.alert('Error: ' + creds.error);
    return;
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Reviews') || ss.getSheetByName('Отзывы');
  
  if (!sheet) {
    ui.alert('Sheet "Reviews" or "Отзывы" not found');
    return;
  }
  
  var data = sheet.getDataRange().getValues();
  var processed = 0;
  var errors = 0;
  var overwrite = getOcrOverwriteFlag();
  
  for (var i = 1; i < data.length; i++) {
    var cellData = data[i][0];
    var resultCell = data[i][1];
    
    // Skip if already processed and not in overwrite mode
    if (resultCell && !overwrite) continue;
    
    if (!cellData) continue;
    
    try {
      var response = callServer({
        action: 'ocr_process',
        email: creds.email,
        token: creds.token,
        geminiApiKey: creds.apiKey,
        cellData: cellData,
        options: {}
      });
      
      if (response.ok && response.data && response.data.length > 0) {
        // Write first result
        sheet.getRange(i + 1, 2).setValue(response.data[0]);
        
        // If multiple results, insert rows
        if (response.data.length > 1) {
          sheet.insertRowsAfter(i + 1, response.data.length - 1);
          for (var j = 1; j < response.data.length; j++) {
            sheet.getRange(i + 1 + j, 2).setValue(response.data[j]);
          }
          i += response.data.length - 1;
        }
        
        processed++;
      }
    } catch (e) {
      logClient('OCR error at row ' + (i + 1) + ': ' + e.message);
      errors++;
    }
    
    Utilities.sleep(100);
  }
  
  ui.alert('OCR Complete', 'Processed: ' + processed + ', Errors: ' + errors, ui.ButtonSet.OK);
}

/**
 * Import VK posts
 */
function importVkPostsThin() {
  var ui = SpreadsheetApp.getUi();
  
  var creds = getClientCredentials();
  if (!creds.ok) {
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
    
    if (response.ok && response.data) {
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
  if (!creds.ok) return 'ERROR: ' + creds.error;
  
  try {
    var response = callServer({
      action: 'gm',
      email: creds.email,
      token: creds.token,
      geminiApiKey: creds.apiKey,
      prompt: String(prompt),
      maxTokens: maxTokens || 1000,
      temperature: temperature || 0.7
    });
    
    if (response.ok && response.text) {
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
 */
function getClientCredentials() {
  var props = PropertiesService.getScriptProperties();
  var email = props.getProperty('LICENSE_EMAIL');
  var token = props.getProperty('LICENSE_TOKEN');
  var apiKey = props.getProperty('GEMINI_API_KEY');
  
  if (!email || !token || !apiKey) {
    return {
      ok: false,
      error: 'Missing credentials. Set LICENSE_EMAIL, LICENSE_TOKEN, and GEMINI_API_KEY in Script Properties'
    };
  }
  
  return {
    ok: true,
    email: email,
    token: token,
    apiKey: apiKey
  };
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
