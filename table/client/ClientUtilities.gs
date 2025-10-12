/**
 * Client Utilities - Missing functions restored
 * These are helper functions that were lost during refactoring
 */

/**
 * Check License Status UI
 * Shows license information dialog
 */
// checkLicenseStatusUI() - основная реализация в CredentialsManager.gs


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

// importVkPosts теперь в SocialImportClient.gs - прямой VK импорт

/**
 * Initialize Chat Mode
 * Creates a chat sheet with A/B columns for conversation
 */
// initializeChatMode() moved to ChatMode.gs (line 28)
// setupSmartPromptTrigger() moved to SmartPromptProcessor.gs (line 217)

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
/**
 * Prepare Chain Smart - автоматический выбор режима
 * ВОССТАНОВЛЕНО ИЗ old/Main.txt строки 460-476
 */
function prepareChainSmart() {
  var ss = SpreadsheetApp.getActive();
  var prompt = ss.getSheetByName('Prompt_box');
  var hasTargets = false;
  
  if (prompt) {
    var lastRow = Math.max(2, prompt.getLastRow());
    var vals = prompt.getRange(2, 2, lastRow - 1, 1).getDisplayValues(); // B2:B
    
    for (var i = 0; i < vals.length; i++) {
      if (String(vals[i][0] || '').trim()) {
        hasTargets = true;
        break;
      }
    }
  }
  
  if (hasTargets) {
    prepareChainFromPromptBox();
  } else {
    prepareChainForA3();
  }
}

/**
 * Prepare Chain From Prompt Box
 * ВОССТАНОВЛЕНО ИЗ old/Main.txt строки 478-521
 */
function prepareChainFromPromptBox() {
  var ss = SpreadsheetApp.getActive();
  var prompt = ss.getSheetByName('Prompt_box');
  var pack = ss.getSheetByName('Распаковка');
  
  if (!prompt) {
    SpreadsheetApp.getUi().alert('Лист "Prompt_box" не найден');
    return;
  }
  
  if (!pack) {
    SpreadsheetApp.getUi().alert('Лист "Распаковка" не найден');
    return;
  }
  
  var lastRow = Math.max(2, prompt.getLastRow());
  var targets = prompt.getRange(2, 2, lastRow - 1, 1).getDisplayValues(); // B2:B — ячейка назначения
  var mappings = [];
  
  for (var r = 2; r <= lastRow; r++) {
    var targetStr = String(targets[r - 2][0] || '').trim();
    
    if (!targetStr) continue;
    
    try {
      var parsed = parseTargetA1(targetStr);
      mappings.push({
        promptRow: r,
        targetRow: parsed.row,
        targetCol: parsed.col,
        targetA1: parsed.a1
      });
    } catch (e) {
      addSystemLog('⚠️ Пропуск строки Prompt_box!B' + r + ': ' + e.message, 'WARN', 'CLIENT');
    }
  }
  
  if (!mappings.length) {
    SpreadsheetApp.getUi().alert('Нет целевых ячеек в Prompt_box!B, ничего не сделано.');
    return;
  }
  
  var phrase = getCompletionPhrase() || COMPLETION_PHRASE;
  var phraseEscaped = phrase.replace(/"/g, '""');
  
  for (var i = 0; i < mappings.length; i++) {
    var m = mappings[i];
    var cond;
    
    if (i === 0) {
      // Всегда якорь от A3
      cond = '$A3<>""';
    } else {
      var prev = mappings[i - 1];
      cond = 'LEFT(' + prev.targetA1 + ', LEN("' + phraseEscaped + '"))="' + phraseEscaped + '"';
    }
    
    var formula = '=GM_IF(' + cond + ', Prompt_box!$F$' + m.promptRow + ', 25000, 0.7)';
    pack.getRange(m.targetRow, m.targetCol).setFormula(formula);
    
    addSystemLog('📝 Формула установлена → Распаковка!' + m.targetA1 + ' из Prompt_box!F' + m.promptRow, 'INFO', 'CLIENT');
  }
  
  SpreadsheetApp.getUi().alert('✅ Готово: формулы расставлены по целям из Prompt_box!B.\\nПервая ячейка запустится при заполнении соответствующего A-столбца, далее — по фразе готовности.');
}

/**
 * Prepare Chain For A3 - стандартный режим B3..G3
 * ВОССТАНОВЛЕНО ИЗ old/Main.txt строки 522-548
 */
function prepareChainForA3() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('Распаковка');
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Лист "Распаковка" не найден');
    return;
  }
  
  var row = 3;
  var startCol = 2; // B
  var steps = 6;    // B..G
  var endCol = startCol + steps - 1;
  var phrase = getCompletionPhrase() || COMPLETION_PHRASE;
  var phraseEscaped = phrase.replace(/"/g, '""');
  
  for (var col = startCol; col <= endCol; col++) {
    var stepIndex = col - 1;       // B=1 -> шаг 1
    var promptRow = stepIndex + 1; // шаг 1 -> F2 ... шаг 6 -> F7
    var target = sheet.getRange(row, col);
    var promptRef = 'Prompt_box!$F$' + promptRow;
    var formula;
    
    if (col === 2) {
      formula = '=GM_IF($A3<>"", ' + promptRef + ', 25000, 0.7)';
    } else {
      var prevColLetter = columnToLetter(col - 1);
      formula = '=GM_IF(LEFT(' + prevColLetter + '3, LEN("' + phraseEscaped + '"))="' + phraseEscaped + '", ' + promptRef + ', 25000, 0.7)';
    }
    
    target.setFormula(formula);
    addSystemLog('📝 Формула ' + target.getA1Notation() + ' установлена', 'DEBUG', 'CLIENT');
  }
  
  SpreadsheetApp.getUi().alert('✅ Готово: формулы B3..G3 проставлены.\\nЗаполните A3 — шаги пойдут по очереди.');
}

// clearChainForA3() - дублирующая функция удалена, оставлена одна версия ниже

/**
 * Helper: Parse Target A1 notation
 */
function parseTargetA1(targetStr) {
  // Simple A1 notation parser
  var match = targetStr.match(/^([A-Z]+)(\d+)$/i);
  
  if (!match) {
    throw new Error('Неверный формат ячейки: ' + targetStr);
  }
  
  var col = columnLetterToIndex(match[1]);
  var row = parseInt(match[2], 10);
  
  return {
    a1: match[0].toUpperCase(),
    col: col,
    row: row
  };
}

/**
 * Helper: Column letter to index (A=1, B=2, ...)
 */
function columnLetterToIndex(letter) {
  var col = 0;
  letter = letter.toUpperCase();
  
  for (var i = 0; i < letter.length; i++) {
    col = col * 26 + (letter.charCodeAt(i) - 64);
  }
  
  return col;
}

/**
 * Helper: Column index to letter (1=A, 2=B, ...)
 */
function columnToLetter(col) {
  var letter = '';
  
  while (col > 0) {
    var mod = (col - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    col = Math.floor((col - mod) / 26);
  }
  
  return letter;
}

/**
 * Helper: Get completion phrase
 */
// getCompletionPhrase() - основная реализация в CompletionPhraseService.gs


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
// initGeminiKey() - основная реализация в GeminiClient.gs


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
// cleanupOldTriggers() - основная реализация в TriggerManager.gs


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

/**
 * Алиас для универсального импорта
 */
function importSocialPosts() {
  importSocialPostsClient();
}

/**
 * VK Token Validation Wrappers - для вызова из меню
 * КРИТИЧНО: Серверные функции НЕ ВИДНЫ из клиента напрямую!
 */

/**
 * Show VK Token Diagnosis - wrapper для серверной функции
 */
function showVkTokenDiagnosis() {
  try {
    var creds = getClientCredentials();
    
    if (!creds.ok) {
      SpreadsheetApp.getUi().alert('❌ Ошибка', 'Настройте credentials в меню\\n⚙️ Настройки → 🔐 Лицензия', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    // Call server to diagnose VK token
    var response = callServer({
      action: 'vk_token_diagnosis',
      email: creds.email,
      token: creds.token
    });
    
    if (response.ok && response.data) {
      var diagnosis = response.data;
      
      var lines = [];
      lines.push('🔍 ПОЛНАЯ ДИАГНОСТИКА VK_TOKEN');
      lines.push('═'.repeat(45));
      lines.push('');
      lines.push('📊 СТАТУС:');
      lines.push('• Существует: ' + (diagnosis.exists ? '✅' : '❌'));
      lines.push('• Валидный: ' + (diagnosis.valid ? '✅' : '❌'));
      lines.push('• Права wall: ' + (diagnosis.permissions && diagnosis.permissions.wall ? '✅' : '❌'));
      lines.push('');
      
      if (diagnosis.errors && diagnosis.errors.length > 0) {
        lines.push('❌ ОШИБКИ:');
        diagnosis.errors.forEach(function(err) {
          lines.push('• ' + err);
        });
        lines.push('');
      }
      
      if (diagnosis.warnings && diagnosis.warnings.length > 0) {
        lines.push('⚠️ ПРЕДУПРЕЖДЕНИЯ:');
        diagnosis.warnings.forEach(function(warn) {
          lines.push('• ' + warn);
        });
        lines.push('');
      }
      
      if (diagnosis.recommendations && diagnosis.recommendations.length > 0) {
        lines.push('💡 РЕКОМЕНДАЦИИ:');
        diagnosis.recommendations.forEach(function(rec) {
          lines.push('• ' + rec);
        });
      }
      
      SpreadsheetApp.getUi().alert('VK Token Diagnosis', lines.join('\\n'), SpreadsheetApp.getUi().ButtonSet.OK);
      
    } else {
      SpreadsheetApp.getUi().alert('❌ Ошибка', 'Не удалось получить диагностику: ' + (response.error || 'Unknown error'), SpreadsheetApp.getUi().ButtonSet.OK);
    }
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ошибка диагностики', e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Check VK Token Validity - wrapper для серверной функции
 */
function checkVkTokenValidity() {
  try {
    var creds = getClientCredentials();
    
    if (!creds.ok) {
      SpreadsheetApp.getUi().alert('❌ Ошибка', 'Настройте credentials в меню\\n⚙️ Настройки → 🔐 Лицензия', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    // Call server to validate VK token
    var response = callServer({
      action: 'vk_token_validate',
      email: creds.email,
      token: creds.token
    });
    
    if (response.ok && response.data) {
      var result = response.data;
      
      var report = [];
      report.push('🔍 ПРОВЕРКА VK_TOKEN');
      report.push('═'.repeat(40));
      report.push('');
      
      if (result.valid) {
        report.push('✅ СТАТУС: ВАЛИДНЫЙ!');
        report.push('');
        report.push('📊 ДЕТАЛИ:');
        report.push('• Токен: ' + (result.token || 'скрыт'));
        if (result.details) {
          report.push('• HTTP Code: ' + result.details.httpCode);
          report.push('• Тестовый запрос: users.get(id=1)');
          report.push('• Результат: ' + result.details.testUserName);
        }
        report.push('');
        if (result.details && result.details.recommendation) {
          report.push('🎉 ' + result.details.recommendation);
        }
        
      } else {
        report.push('❌ СТАТУС: НЕВАЛИДНЫЙ!');
        report.push('');
        report.push('🔴 ОШИБКА:');
        report.push(result.error || 'Неизвестная ошибка');
        report.push('');
        
        if (result.details) {
          report.push('📋 ДЕТАЛИ:');
          report.push('• Этап: ' + result.details.step);
          if (result.details.httpCode) {
            report.push('• HTTP Code: ' + result.details.httpCode);
          }
          if (result.details.vkError) {
            report.push('• VK Error: ' + result.details.vkError.error_code + ' - ' + result.details.vkError.error_msg);
          }
          report.push('');
          report.push('💡 РЕКОМЕНДАЦИЯ:');
          report.push(result.details.recommendation || 'Проверьте настройки VK_TOKEN');
        }
      }
      
      SpreadsheetApp.getUi().alert('VK Token Validation', report.join('\\n'), SpreadsheetApp.getUi().ButtonSet.OK);
      
    } else {
      SpreadsheetApp.getUi().alert('❌ Ошибка', 'Не удалось проверить токен: ' + (response.error || 'Unknown error'), SpreadsheetApp.getUi().ButtonSet.OK);
    }
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ошибка проверки', e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Smart Chain Functions
 */
function runSmartChain() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('🚀 Запуск анализа', 
    'Умная цепочка анализа данных:\n\n' +
    '• Автоматический анализ данных\n' +
    '• Применение AI обработки\n' +
    '• Формирование отчетов\n\n' +
    '💡 Функция будет активирована в следующей версии.',
    ui.ButtonSet.OK);
  addSystemLog('Smart chain execution requested', 'INFO', 'CHAIN');
}

function runChainCurrentRow() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('⚡️ Обновление ячейки', 
    'Умное обновление текущей ячейки:\n\n' +
    '• Анализ содержимого\n' +
    '• AI обработка данных\n' +
    '• Обновление результата\n\n' +
    '💡 Функция будет активирована в следующей версии.',
    ui.ButtonSet.OK);
  addSystemLog('Current row refresh requested', 'INFO', 'CHAIN');
}
