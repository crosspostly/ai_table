// New/client/ThinClient.gs
// YAGNI: только необходимая функциональность, без избыточных абстракций
// KISS: простые функции-прокси к серверу + static values

/**
 * Тонкий клиент для OCR обработки с заменой формул на статичные значения
 */
function ocrReviewsThin() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('Отзывы');
  
  if (!sheet) {
    ui.alert('Лист \"Отзывы\" не найден');
    return;
  }
  
  var credentials = getClientCredentials();
  if (!credentials.valid) {
    ui.alert('Не настроены credentials: ' + credentials.error);
    return;
  }
  
  var lastRow = Math.max(2, sheet.getLastRow());
  var processed = 0, errors = 0, skipped = 0;
  var overwrite = getOcrOverwriteFlag();
  
  logClient('Начат OCR процесс: rows=' + lastRow + ', overwrite=' + overwrite);
  
  for (var r = 2; r <= lastRow; r++) {
    try {
      var cellRange = sheet.getRange(r, 1);
      var cellData = String(cellRange.getDisplayValue() || '').trim();
      var formula = String(cellRange.getFormula() || '');
      
      if (!cellData && !formula) {
        continue; // Пустая ячейка
      }
      
      // Проверяем, заполнен ли уже результат
      var bValue = String(sheet.getRange(r, 2).getDisplayValue() || '').trim();
      if (!overwrite && bValue) {
        skipped++;
        continue;
      }
      
      // Собираем метаданные ячейки
      var cellMeta = extractCellMetadata(cellRange);
      
      // Вызов серверного API
      var serverRequest = {
        action: 'ocr_process',
        email: credentials.email,
        token: credentials.token,
        geminiApiKey: credentials.geminiApiKey,
        cellData: cellData,
        cellMeta: cellMeta,
        options: {
          limit: 50,
          language: 'ru'
        }
      };
      
      var result = callServer(serverRequest);
      
      if (result.ok && result.data && result.data.length) {
        // Записываем результаты в ячейки
        writeOcrResults(sheet, r, result.data);
        processed++;
        
        logClient('OCR успешно: row=' + r + ', items=' + result.data.length + 
                 ', traceId=' + (result.traceId || 'none'));
      } else {
        errors++;
        logClient('OCR ошибка: row=' + r + ', error=' + (result.error || 'unknown'));
      }
      
    } catch (e) {
      errors++;
      logClient('Исключение в row ' + r + ': ' + e.message);
    }
    
    // Небольшая задержка для избежания rate limiting
    if (r % 5 === 0) {
      Utilities.sleep(100);
    }
  }
  
  var summary = 'OCR завершён:\
' +
                'Обработано: ' + processed + '\
' +
                'Пропущено: ' + skipped + '\
' +
                'Ошибок: ' + errors;
  
  logClient(summary.replace(/\n/g, ', '));
  ui.alert(summary);
}

/**
 * Извлечение метаданных ячейки (формула, rich text ссылки)
 */
function extractCellMetadata(cellRange) {
  var meta = {
    formula: '',
    richTextUrl: ''
  };
  
  try {
    // Формула
    meta.formula = cellRange.getFormula() || '';
    
    // Rich text ссылки
    var richText = cellRange.getRichTextValue();
    if (richText) {
      meta.richTextUrl = extractFirstLink(richText);
    }
  } catch (e) {
    // Игнорируем ошибки извлечения метаданных
  }
  
  return meta;
}

/**
 * Извлечение первой ссылки из rich text
 */
function extractFirstLink(richText) {
  try {
    // Проверяем сегменты
    var runs = richText.getRuns && richText.getRuns();
    if (runs && runs.length) {
      for (var i = 0; i < runs.length; i++) {
        var style = runs[i].getTextStyle && runs[i].getTextStyle();
        var linkUrl = style && style.getLinkUrl && style.getLinkUrl();
        if (linkUrl) return String(linkUrl).trim();
      }
    }
    
    // Проверяем ссылку на всю ячейку
    var cellLinkUrl = richText.getLinkUrl && richText.getLinkUrl();
    if (cellLinkUrl) return String(cellLinkUrl).trim();
    
    // Проверяем через стиль
    var textStyle = richText.getTextStyle && richText.getTextStyle();
    var styleLinkUrl = textStyle && textStyle.getLinkUrl && textStyle.getLinkUrl();
    if (styleLinkUrl) return String(styleLinkUrl).trim();
    
  } catch (e) {
    // Игнорируем ошибки
  }
  
  return '';
}

/**
 * Запись результатов OCR в ячейки
 */
function writeOcrResults(sheet, startRow, results) {
  if (!results || !results.length) return;
  
  // Если результатов больше одного, вставляем дополнительные строки
  if (results.length > 1) {
    sheet.insertRowsAfter(startRow, results.length - 1);
  }
  
  // Записываем результаты
  for (var i = 0; i < results.length; i++) {
    var targetRow = startRow + i;
    sheet.getRange(targetRow, 2).setValue(results[i]);
  }
}

/**
 * Тонкий клиент для VK импорта
 */
function importVkPostsThin() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  
  var credentials = getClientCredentials();
  if (!credentials.valid) {
    ui.alert('Не настроены credentials: ' + credentials.error);
    return;
  }
  
  // Получаем параметры VK из листа
  var vkParams = getVkImportParams();
  if (!vkParams.valid) {
    ui.alert('Не настроены параметры VK: ' + vkParams.error);
    return;
  }
  
  // Вызов серверного API
  var serverRequest = {
    action: 'vk_import',
    email: credentials.email,
    token: credentials.token,
    owner: vkParams.owner,
    count: vkParams.count
  };
  
  logClient('VK импорт: owner=' + vkParams.owner + ', count=' + vkParams.count);
  
  try {
    var result = callServer(serverRequest);
    
    if (result.ok && result.data && result.data.length) {
      writeVkPosts(ss, result.data);
      
      var summary = 'VK импорт завершён:\
Импортировано: ' + result.data.length + ' постов';
      logClient(summary.replace(/\n
/g, ', '));
      ui.alert(summary);
      
    } else {
      var error = 'VK импорт не удался: ' + (result.error || 'неизвестная ошибка');
      logClient(error);
      ui.alert(error);
    }
    
  } catch (e) {
    var error = 'Ошибка VK импорта: ' + e.message;
    logClient(error);
    ui.alert(error);
  }
}

/**
 * Запись VK постов в лист
 */
function writeVkPosts(spreadsheet, posts) {
  var sheet = spreadsheet.getSheetByName('посты');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('посты');
  }
  
  // Заголовки
  var headers = ['Дата', 'Ссылка на пост', 'Текст поста', 'Номер поста', 'Комментарии', 'Лайки'];
  
  // Данные
  var data = [headers];
  posts.forEach(function(post) {
    data.push([
      post.date || '',
      post.link || '',
      post.text || '',
      post.number || '',
      post.comments || 0,
      post.likes || 0
    ]);
  });
  
  // Очищаем и записываем
  sheet.clear();
  sheet.getRange(1, 1, data.length, headers.length).setValues(data);
  
  // Форматирование заголовков
  sheet.getRange(1, 1, 1, headers.length)
       .setFontWeight('bold')
       .setBackground('#E8F0FE');
  
  // Автоширина колонок
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Новые функции GM с заменой на статичные значения
 */
function GM_STATIC(prompt, maxTokens, temperature) {
  // Получаем текущую ячейку
  var activeRange = SpreadsheetApp.getActiveRange();
  if (!activeRange) {
    throw new Error('Функция должна вызываться из ячейки');
  }
  
  var cell = activeRange.getCell(1, 1);
  
  // Проверяем, не заменена ли уже формула на статичное значение
  var currentFormula = cell.getFormula();
  if (!currentFormula || !currentFormula.includes('GM_STATIC')) {
    // Формула уже заменена, возвращаем текущее значение
    return cell.getValue();
  }
  
  var credentials = getClientCredentials();
  if (!credentials.valid) {
    return 'Error: Credentials not configured';
  }
  
  try {
    // Вызов Gemini через сервер
    var serverRequest = {
      action: 'gm',
      email: credentials.email,
      token: credentials.token,
      geminiApiKey: credentials.geminiApiKey,
      prompt: prompt,
      maxTokens: maxTokens || 25000,
      temperature: temperature || 0.7
    };
    
    var result = callServer(serverRequest);
    
    if (result.ok && result.data) {
      var response = String(result.data);
      
      // КЛЮЧЕВАЯ ФИЧА: заменяем формулу на статичное значение
      // Это предотвращает повторные вычисления
      setTimeout(function() {
        try {
          cell.setValue(response);
          logClient('Static value set for cell ' + cell.getA1Notation());
        } catch (e) {
          logClient('Failed to set static value: ' + e.message);
        }
      }, 100);
      
      return response;
      
    } else {
      var error = 'GM Error: ' + (result.error || 'unknown');
      logClient(error);
      return error;
    }
    
  } catch (e) {
    var error = 'GM Exception: ' + e.message;
    logClient(error);
    return error;
  }
}

/**
 * Обертка GM_IF с поддержкой статичных значений
 */
function GM_IF_STATIC(condition, prompt, maxTokens, temperature) {
  // Нормализуем условие
  var conditionValue = normalizeCondition(condition);
  
  if (!conditionValue) {
    return ''; // Условие не выполнено
  }
  
  // Вызываем GM_STATIC если условие выполнено
  return GM_STATIC(prompt, maxTokens, temperature);
}

/**
 * Нормализация условия для GM_IF
 */
function normalizeCondition(condition) {
  try {
    var raw = condition;
    
    // Обработка массивов
    if (Array.isArray(raw)) {
      raw = (raw[0] && raw[0].length ? raw[0][0] : raw[0] || '');
    }
    
    var type = typeof raw;
    
    if (type === 'boolean') {
      return raw === true;
    } else if (type === 'number') {
      return raw !== 0;
    } else if (type === 'string') {
      var s = raw.trim().toLowerCase();
      return (s === 'true' || s === 'истина' || s === '1' || s === 'да');
    } else {
      return !!raw;
    }
  } catch (e) {
    return false;
  }
}

/**
 * Получение credentials пользователя
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
 * Получение параметров VK импорта
 */
function getVkImportParams() {
  try {
    var ss = SpreadsheetApp.getActive();
    var paramsSheet = ss.getSheetByName('Параметры');
    
    if (!paramsSheet) {
      return {
        valid: false,
        error: 'Лист \"Параметры\" не найден'
      };
    }
    
    var owner = paramsSheet.getRange('B1').getValue();
    var count = paramsSheet.getRange('B2').getValue();
    
    if (!owner) {
      return {
        valid: false,
        error: 'Не указан owner в Параметры!B1'
      };
    }
    
    return {
      valid: true,
      owner: String(owner),
      count: Math.min(parseInt(count) || 50, 100)
    };
    
  } catch (e) {
    return {
      valid: false,
      error: 'Ошибка чтения параметров VK: ' + e.message
    };
  }
}

/**
 * Получение флага перезаписи для OCR
 */
function getOcrOverwriteFlag() {
  try {
    var props = PropertiesService.getScriptProperties();
    var flag = props.getProperty('OCR_OVERWRITE');
    
    if (!flag) return false;
    
    var normalized = String(flag).toLowerCase().trim();
    return (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'да');
  } catch (e) {
    return false;
  }
}

/**
 * Вызов серверного API
 */
function callServer(requestData) {
  var serverUrl = getServerUrl();
  
  var response = UrlFetchApp.fetch(serverUrl, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(requestData),
    muteHttpExceptions: true
  });
  
  var responseCode = response.getResponseCode();
  var responseText = response.getContentText();
  
  if (responseCode >= 300) {
    throw new Error('Server error: HTTP ' + responseCode + ' - ' + responseText);
  }
  
  try {
    return JSON.parse(responseText);
  } catch (e) {
    throw new Error('Invalid JSON response from server: ' + responseText);
  }
}

/**
 * Получение URL сервера
 */
function getServerUrl() {
  // Используем константу из Constants.gs или глобальную
  if (typeof SERVER_URL !== 'undefined' && SERVER_URL) {
    return String(SERVER_URL).replace(/\\/$/, '');
  }
  throw new Error('SERVER_URL not configured');
}

/**
 * Простое логирование на клиенте
 */
function logClient(message) {
  var timestamp = new Date().toISOString();
  console.log('[CLIENT ' + timestamp + '] ' + message);
  
  // Дополнительно сохраняем в кэш
  try {
    var cache = CacheService.getScriptCache();
    var logKey = 'client_log_' + Date.now();
    cache.put(logKey, JSON.stringify({
      timestamp: timestamp,
      message: message
    }), 3600); // TTL 1 час
  } catch (e) {
    // Игнорируем ошибки кэширования
  }
}