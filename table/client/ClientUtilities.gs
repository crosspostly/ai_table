/**
 * Client Utilities - Missing functions restored
 * These are helper functions that were lost during refactoring
 */

/**
 * Check License Status UI
 * Shows license information dialog
 */
function checkLicenseStatusUI() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    var creds = getClientCredentials();
    
    if (!creds.ok) {
      ui.alert('Ошибка credentials', 'Настройте license email и token в меню\\n⚙️ Настройки → 🔐 Лицензия', ui.ButtonSet.OK);
      return;
    }
    
    // Call server to check license
    var response = callServer({
      action: 'check_license',
      email: creds.email,
      token: creds.token
    });
    
    if (response.ok && response.data) {
      var data = response.data;
      var statusMsg = '📊 Статус лицензии\\n\\n' +
        '📧 Email: ' + creds.email + '\\n' +
        '✅ Статус: ' + (data.valid ? 'Активна' : 'Неактивна') + '\\n' +
        '📅 Действует до: ' + (data.expiresAt || 'N/A') + '\\n' +
        '🔢 Запросов за час: ' + (data.requestsThisHour || 0) + '/' + (data.hourlyLimit || 100) + '\\n' +
        '📊 Всего запросов: ' + (data.totalRequests || 0);
      
      ui.alert('Статус лицензии', statusMsg, ui.ButtonSet.OK);
    } else {
      ui.alert('Ошибка', 'Не удалось проверить лицензию: ' + (response.error || 'Unknown error'), ui.ButtonSet.OK);
    }
    
  } catch (e) {
    ui.alert('Ошибка проверки лицензии', e.message, ui.ButtonSet.OK);
  }
}

/**
 * Set License Credentials UI
 * Dialog for entering license email and token
 */
function setLicenseCredentialsUI() {
  var ui = SpreadsheetApp.getUi();
  
  var emailResult = ui.prompt('License Email', 'Введите email лицензии:', ui.ButtonSet.OK_CANCEL);
  
  if (emailResult.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  
  var email = emailResult.getResponseText().trim();
  
  if (!email) {
    ui.alert('Email не может быть пустым');
    return;
  }
  
  var tokenResult = ui.prompt('License Token', 'Введите токен лицензии:', ui.ButtonSet.OK_CANCEL);
  
  if (tokenResult.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  
  var token = tokenResult.getResponseText().trim();
  
  if (!token) {
    ui.alert('Токен не может быть пустым');
    return;
  }
  
  // Save to Script Properties
  var props = PropertiesService.getScriptProperties();
  props.setProperty('LICENSE_EMAIL', email);
  props.setProperty('LICENSE_TOKEN', token);
  
  ui.alert('✅ Credentials сохранены', 'Email и токен успешно сохранены', ui.ButtonSet.OK);
  
  logClient('License credentials updated');
}

/**
 * OCR Reviews - Wrapper for the actual function
 * This is the function called from menu
 */
function ocrReviews() {
  // Call the thin client function
  ocrReviewsThin();
}

/**
 * Import VK Posts - Wrapper for actual function
 * This is the function called from menu
 */
function importVkPosts() {
  // Use the universal social import instead
  try {
    importSocialPosts();
  } catch (e) {
    SpreadsheetApp.getUi().alert('Ошибка импорта', e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Initialize Chat Mode
 * Creates a chat sheet with A/B columns for conversation
 */
function initializeChatMode() {
  var ss = SpreadsheetApp.getActive();
  var ui = SpreadsheetApp.getUi();
  
  // Check if Chat sheet exists
  var chatSheet = ss.getSheetByName('Чат') || ss.getSheetByName('Chat');
  
  if (chatSheet) {
    var result = ui.alert('Лист \"Чат\" уже существует', 'Хотите очистить и пересоздать?', ui.ButtonSet.YES_NO);
    if (result !== ui.Button.YES) {
      return;
    }
    ss.deleteSheet(chatSheet);
  }
  
  // Create new chat sheet
  chatSheet = ss.insertSheet('Чат');
  
  // Setup headers
  chatSheet.getRange('A1').setValue('Ваше сообщение');
  chatSheet.getRange('B1').setValue('Ответ ассистента');
  
  // Format headers
  chatSheet.getRange('A1:B1')
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('white');
  
  // Setup first row
  chatSheet.getRange('A2').setValue('Напишите ваш вопрос здесь...');
  
  // Auto-resize columns
  chatSheet.setColumnWidth(1, 400);
  chatSheet.setColumnWidth(2, 600);
  
  ui.alert('✅ Режим чата создан', 'Лист \"Чат\" готов к использованию\\n\\nНапишите вопрос в A2 и нажмите Enter', ui.ButtonSet.OK);
  
  logClient('Chat mode initialized');
}

/**
 * Setup Smart Prompt Trigger
 * Creates trigger for automatic prompt conversion
 */
function setupSmartPromptTrigger() {
  var ui = SpreadsheetApp.getUi();
  
  // Check if trigger already exists
  var triggers = ScriptApp.getProjectTriggers();
  var existingTrigger = false;
  
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onSmartPromptEdit') {
      existingTrigger = true;
      break;
    }
  }
  
  if (existingTrigger) {
    var result = ui.alert('Триггер уже существует', 'Умные промпты уже активированы', ui.ButtonSet.OK);
    return;
  }
  
  // Create trigger
  try {
    ScriptApp.newTrigger('onSmartPromptEdit')
      .forSpreadsheet(SpreadsheetApp.getActive())
      .onEdit()
      .create();
    
    // Create rules sheet if not exists
    createSmartPromptRulesSheet();
    
    ui.alert('✅ Умные промпты активированы', 'Теперь вы можете использовать \"Промпт: текст\" в любой ячейке\\n\\nПравила замены находятся в листе \"Правила\"', ui.ButtonSet.OK);
    
    logClient('Smart prompt trigger created');
  } catch (e) {
    ui.alert('Ошибка создания триггера', e.message, ui.ButtonSet.OK);
  }
}

/**
 * Create Smart Prompt Rules Sheet
 */
function createSmartPromptRulesSheet() {
  var ss = SpreadsheetApp.getActive();
  var rulesSheet = ss.getSheetByName('Правила');
  
  if (rulesSheet) {
    return; // Already exists
  }
  
  rulesSheet = ss.insertSheet('Правила');
  
  // Headers
  rulesSheet.getRange('A1').setValue('Ключевое слово/фраза');
  rulesSheet.getRange('B1').setValue('Ссылка на ячейку');
  
  // Format headers
  rulesSheet.getRange('A1:B1')
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('white');
  
  // Sample rules
  var sampleRules = [
    ['наша ниша', 'Распаковка!A3'],
    ['анализ отзывов', 'Отзывы!C2'],
    ['анализ постов', 'Посты!K2'],
    ['описание проекта', 'Параметры!B5'],
    ['целевая аудитория', 'Параметры!B6']
  ];
  
  rulesSheet.getRange(2, 1, sampleRules.length, 2).setValues(sampleRules);
  
  // Auto-resize
  rulesSheet.autoResizeColumns(1, 2);
  
  logClient('Smart prompt rules sheet created');
}

/**
 * On Smart Prompt Edit - Handler
 * Automatically converts "Промпт: текст" to GM formula
 */
function onSmartPromptEdit(e) {
  try {
    if (!e || !e.range) return;
    
    var range = e.range;
    var value = e.value;
    
    if (!value || typeof value !== 'string') return;
    
    var trimmed = value.trim();
    
    // Check for "Промпт:" or "Промпт статичный:"
    var isStaticPrompt = trimmed.match(/^Промпт\\s+статичный\\s*:\\s*(.+)/i);
    var isDynamicPrompt = trimmed.match(/^Промпт\\s*:\\s*(.+)/i);
    
    if (!isStaticPrompt && !isDynamicPrompt) return;
    
    var promptText = isStaticPrompt ? isStaticPrompt[1] : isDynamicPrompt[1];
    
    // Apply replacement rules
    var transformedPrompt = applySmartPromptRules(promptText);
    
    // Create formula
    var formula = isStaticPrompt 
      ? '=GM_STATIC(' + transformedPrompt + ')' 
      : '=GM(' + transformedPrompt + ')';
    
    // Set formula
    range.setFormula(formula);
    
    logClient('Smart prompt converted: ' + trimmed.substring(0, 50));
    
  } catch (err) {
    // Silent fail - don't interrupt user
    logClient('Smart prompt error: ' + err.message);
  }
}

/**
 * Apply Smart Prompt Rules
 * Replaces keywords with cell references
 */
function applySmartPromptRules(promptText) {
  var ss = SpreadsheetApp.getActive();
  var rulesSheet = ss.getSheetByName('Правила');
  
  if (!rulesSheet) {
    // No rules - return as quoted string
    return '"' + promptText.replace(/"/g, '""') + '"';
  }
  
  var lastRow = rulesSheet.getLastRow();
  
  if (lastRow < 2) {
    // No rules defined
    return '"' + promptText.replace(/"/g, '""') + '"';
  }
  
  // Read rules
  var rules = rulesSheet.getRange(2, 1, lastRow - 1, 2).getValues();
  
  // Build formula parts
  var parts = [];
  var remaining = promptText;
  
  for (var i = 0; i < rules.length; i++) {
    var keyword = String(rules[i][0] || '').trim();
    var cellRef = String(rules[i][1] || '').trim();
    
    if (!keyword || !cellRef) continue;
    
    // Check if keyword exists in remaining text
    var regex = new RegExp(keyword, 'gi');
    
    if (regex.test(remaining)) {
      // Split by keyword
      var segments = remaining.split(regex);
      
      // Build formula with replacements
      var newParts = [];
      for (var j = 0; j < segments.length; j++) {
        if (segments[j]) {
          newParts.push('"' + segments[j].replace(/"/g, '""') + '"');
        }
        if (j < segments.length - 1) {
          newParts.push(cellRef);
        }
      }
      
      remaining = newParts.join(' & ');
      break; // Apply only first matching rule
    }
  }
  
  // If no rules applied, return as quoted string
  if (parts.length === 0 && remaining === promptText) {
    return '"' + promptText.replace(/"/g, '""') + '"';
  }
  
  return remaining;
}

/**
 * Prepare Chain Smart - deprecated, keeping for compatibility
 */
function prepareChainSmart() {
  SpreadsheetApp.getUi().alert('Эта функция перемещена на сервер');
}

/**
 * Refresh Current GM Cell - Force recalculation
 */
function refreshCurrentGMCell() {
  var range = SpreadsheetApp.getActiveRange();
  
  if (!range) {
    SpreadsheetApp.getUi().alert('Выберите ячейку с формулой GM');
    return;
  }
  
  var formula = range.getFormula();
  
  if (!formula || !formula.match(/^=GM(_STATIC|_IF)?\(/i)) {
    SpreadsheetApp.getUi().alert('Выбранная ячейка не содержит формулу GM');
    return;
  }
  
  // Clear and re-set formula to force recalculation
  range.clearContent();
  SpreadsheetApp.flush();
  range.setFormula(formula);
  
  SpreadsheetApp.getUi().alert('✅ Формула обновлена');
  
  logClient('GM cell refreshed: ' + range.getA1Notation());
}

/**
 * Init Gemini Key - Prompt for API key
 */
function initGeminiKey() {
  var ui = SpreadsheetApp.getUi();
  
  var result = ui.prompt('Gemini API Key', 'Введите ваш Gemini API ключ:\\n\\nПолучить можно на: https://aistudio.google.com/app/apikey', ui.ButtonSet.OK_CANCEL);
  
  if (result.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  
  var apiKey = result.getResponseText().trim();
  
  if (!apiKey) {
    ui.alert('API ключ не может быть пустым');
    return;
  }
  
  // Save to Script Properties
  var props = PropertiesService.getScriptProperties();
  props.setProperty('GEMINI_API_KEY', apiKey);
  
  ui.alert('✅ API ключ сохранен', 'Gemini API ключ успешно сохранен', ui.ButtonSet.OK);
  
  logClient('Gemini API key updated');
}

/**
 * Set Completion Phrase UI
 */
function setCompletionPhraseUI() {
  var ui = SpreadsheetApp.getUi();
  
  var result = ui.prompt('Фраза готовности', 'Введите фразу с которой должен начинаться готовый ответ:\\n\\n(по умолчанию: "Отчёт готов")', ui.ButtonSet.OK_CANCEL);
  
  if (result.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  
  var phrase = result.getResponseText().trim();
  
  if (!phrase) {
    ui.alert('Фраза не может быть пустой');
    return;
  }
  
  // Save to Script Properties
  var props = PropertiesService.getScriptProperties();
  props.setProperty('COMPLETION_PHRASE', phrase);
  
  ui.alert('✅ Фраза готовности сохранена', 'Новая фраза: ' + phrase, ui.ButtonSet.OK);
  
  logClient('Completion phrase updated: ' + phrase);
}

/**
 * Clear Chain for A3
 */
function clearChainForA3() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('Распаковка');
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Лист "Распаковка" не найден');
    return;
  }
  
  // Clear B3:G3
  sheet.getRange('B3:G3').clearContent();
  
  SpreadsheetApp.getUi().alert('✅ Очищено', 'Ячейки B3:G3 очищены');
  
  logClient('Chain cleared for A3');
}

/**
 * Cleanup Old Triggers - Remove stuck triggers
 */
function cleanupOldTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  var deleted = 0;
  
  for (var i = 0; i < triggers.length; i++) {
    var handlerFunction = triggers[i].getHandlerFunction();
    
    // Delete only chain-related triggers, keep onEdit/onOpen
    if (handlerFunction === 'checkStepCompletion' || handlerFunction === 'continueAutoProcessingChain') {
      ScriptApp.deleteTrigger(triggers[i]);
      deleted++;
    }
  }
  
  var message = '✅ Очистка завершена\\n\\nУдалено триггеров: ' + deleted;
  SpreadsheetApp.getUi().alert('Очистка триггеров', message, SpreadsheetApp.getUi().ButtonSet.OK);
  
  logClient('Old triggers cleaned: ' + deleted + ' deleted');
}

/**
 * Show Active Triggers Dialog
 */
function showActiveTriggersDialog() {
  var triggers = ScriptApp.getProjectTriggers();
  
  if (triggers.length === 0) {
    SpreadsheetApp.getUi().alert('Активные триггеры', 'Нет активных триггеров', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  
  var triggersList = triggers.map(function(trigger, index) {
    var handlerFunction = trigger.getHandlerFunction();
    var eventType = trigger.getEventType().toString();
    return (index + 1) + '. ' + handlerFunction + ' (' + eventType + ')';
  }).join('\\n');
  
  var message = 'Всего триггеров: ' + triggers.length + '\\n\\n' + triggersList;
  
  SpreadsheetApp.getUi().alert('Активные триггеры', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Open Web Interface
 */
function openWebInterface() {
  var ui = SpreadsheetApp.getUi();
  
  // Create web app HTML
  var html = HtmlService.createHtmlOutputFromFile('web/index')
    .setWidth(800)
    .setHeight(600)
    .setTitle('Table AI - Веб-интерфейс');
  
  ui.showModalDialog(html, 'Table AI - Веб-интерфейс');
}

/**
 * Server OCR Batch (gm_image action)
 * ИЗ СТАРОЙ РАБОЧЕЙ ВЕРСИИ old/ocrRunV2_client.txt
 */
function serverGmOcrBatch_(images, lang) {
  var creds = getClientCredentials();
  if (!creds.ok) {
    throw new Error('Credentials error: ' + creds.error);
  }
  
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('NO_IMAGES');
  }
  
  var payload = {
    action: 'gm_image',
    email: creds.email,
    token: creds.token,
    apiKey: creds.apiKey,
    images: images,
    lang: lang || 'ru',
    delimiter: '____'
  };
  
  addSystemLog('→ serverGmOcrBatch_: calling server with ' + images.length + ' images', 'DEBUG', 'OCR');
  
  var response = UrlFetchApp.fetch(SERVER_URL, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  
  var code = response.getResponseCode();
  var responseData = JSON.parse(response.getContentText());
  
  if (code !== 200 || !responseData.ok) {
    throw new Error(responseData.error || 'Server error: ' + code);
  }
  
  addSystemLog('← serverGmOcrBatch_: success, response length=' + (responseData.data ? responseData.data.length : 0), 'INFO', 'OCR');
  
  return responseData.data;
}

/**
 * Server Status Check (license validation)
 * ИЗ СТАРОЙ РАБОЧЕЙ ВЕРСИИ old/Main.txt
 */
function serverStatus_() {
  var creds = getClientCredentials();
  if (!creds.ok) {
    return { ok: false, error: creds.error };
  }
  
  try {
    var response = UrlFetchApp.fetch(SERVER_URL, {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify({
        action: 'status',
        email: creds.email,
        token: creds.token
      }),
      muteHttpExceptions: true
    });
    
    var code = response.getResponseCode();
    var data = JSON.parse(response.getContentText());
    
    if (code === 200 && data.ok !== undefined) {
      return data;
    }
    
    return { ok: false, error: 'Server returned ' + code };
    
  } catch (e) {
    return { ok: false, error: 'Server error: ' + e.message };
  }
}

/**
 * Get OCR Overwrite Flag
 * ИЗ СТАРОЙ РАБОЧЕЙ ВЕРСИИ old/Main.txt
 */
function getOcrOverwrite_() {
  try {
    var ss = SpreadsheetApp.getActive();
    var params = ss.getSheetByName('Параметры');
    
    if (params) {
      var val = params.getRange('B7').getDisplayValue(); // OCR Overwrite флаг
      return String(val).toLowerCase() === 'да' || String(val).toLowerCase() === 'yes';
    }
  } catch (e) {}
  
  return false;
}
