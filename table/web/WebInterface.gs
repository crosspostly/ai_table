/**
 * Modern Web Interface for Table AI Bot v1.0
 * Красивый веб-интерфейс для замены убогих Google Sheets
 */

/**
 * Открыть реалистичный веб-интерфейс (РАБОТАЕТ в Google Apps Script)
 */
function openWebInterface() {
  try {
    // Создаем HTML из реалистичного шаблона
    var htmlOutput = HtmlService.createHtmlOutputFromFile('RealisticWebApp')
      .setTitle('🤖 Table AI Bot - Веб Интерфейс')
      .setWidth(750)
      .setHeight(700);
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Table AI Bot');
    
    // Логируем успешное открытие
    addSystemLog('Web interface opened successfully', 'INFO', 'WEB_INTERFACE');
    
  } catch (error) {
    // Fallback: если HTML не работает, показываем простое сообщение
    var ui = SpreadsheetApp.getUi();
    ui.alert('Web Interface Error', 
             'Failed to open web interface: ' + error.message + '\\n\\nPlease use the standard menu.', 
             ui.ButtonSet.OK);
    
    addSystemLog('Web interface error: ' + error.message, 'ERROR', 'WEB_INTERFACE');
  }
}

/**
 * Получение данных статуса системы для веба
 */
function getSystemStatusData() {
  var credentials = getClientCredentials();
  
  return {
    credentialsOk: credentials.valid,
    credentialsError: credentials.error || '',
    hasEmail: !!(credentials.email),
    hasToken: !!(credentials.token),
    hasGeminiKey: !!(credentials.geminiApiKey),
    
    // Проверяем листы
    hasReviewsSheet: !!SpreadsheetApp.getActive().getSheetByName('Отзывы'),
    hasParamsSheet: !!SpreadsheetApp.getActive().getSheetByName('Параметры'),
    hasPostsSheet: !!SpreadsheetApp.getActive().getSheetByName('посты'),
    
    // Настройки
    ocrOverwrite: PropertiesService.getScriptProperties().getProperty('OCR_OVERWRITE') === 'true'
  };
}

/**
 * Получение последних результатов
 */
function getRecentResults() {
  try {
    var ss = SpreadsheetApp.getActive();
    var results = [];
    
    // Последние OCR результаты
    var reviewsSheet = ss.getSheetByName('Отзывы');
    if (reviewsSheet) {
      var data = reviewsSheet.getRange(2, 1, Math.min(reviewsSheet.getLastRow() - 1, 5), 2).getValues();
      data.forEach(function(row, i) {
        if (row[0] && row[1]) {
          results.push({
            type: 'OCR',
            source: String(row[0]).substring(0, 50) + '...',
            result: String(row[1]).substring(0, 100) + '...',
            row: i + 2,
            timestamp: new Date().toISOString()
          });
        }
      });
    }
    
    // Последние посты
    var postsSheet = ss.getSheetByName('посты');
    if (postsSheet && postsSheet.getLastRow() > 1) {
      var postData = postsSheet.getRange(2, 1, Math.min(postsSheet.getLastRow() - 1, 5), 4).getValues();
      postData.forEach(function(row, i) {
        if (row[0]) {
          results.push({
            type: 'POST',
            source: row[0] || 'Unknown',
            result: (row[3] || '').substring(0, 100) + '...',
            row: i + 2,
            timestamp: row[1] || new Date().toISOString()
          });
        }
      });
    }
    
    return results.slice(0, 10); // Максимум 10 результатов
    
  } catch (error) {
    addSystemLog('Error getting recent results: ' + error.message, 'ERROR', 'WEB_INTERFACE');
    return [];
  }
}

/**
 * API для веб-интерфейса: социальный импорт
 */
function webApiSocialImport(params) {
  try {
    addSystemLog('Web API: Social import request', 'INFO', 'WEB_API');
    
    // Валидация
    if (!params.source || !params.count) {
      return {
        success: false,
        error: 'Заполните источник и количество постов'
      };
    }
    
    // Записываем параметры в лист (для совместимости)
    var ss = SpreadsheetApp.getActive();
    var paramsSheet = ss.getSheetByName('Параметры');
    if (!paramsSheet) {
      paramsSheet = ss.insertSheet('Параметры');
    }
    
    paramsSheet.getRange('B1').setValue(params.source);
    paramsSheet.getRange('B2').setValue(params.count);
    paramsSheet.getRange('C1').setValue(params.platform || '');
    
    // Вызываем импорт через существующий клиент
    var result = importSocialPostsClient();
    
    return {
      success: true,
      message: 'Импорт запущен успешно!',
      details: result
    };
    
  } catch (error) {
    addSystemLog('Web API social import error: ' + error.message, 'ERROR', 'WEB_API');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * API для веб-интерфейса: OCR анализ
 */
function webApiOcrAnalysis(params) {
  try {
    addSystemLog('Web API: OCR analysis request', 'INFO', 'WEB_API');
    
    // Настраиваем OCR параметры
    if (params.overwrite !== undefined) {
      PropertiesService.getScriptProperties().setProperty('OCR_OVERWRITE', params.overwrite ? 'true' : 'false');
    }
    
    // Запускаем OCR
    var result = ocrReviewsThin();
    
    return {
      success: true,
      message: 'OCR анализ завершен!',
      details: result
    };
    
  } catch (error) {
    addSystemLog('Web API OCR error: ' + error.message, 'ERROR', 'WEB_API');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * API для веб-интерфейса: сохранение настроек
 */
function webApiSaveSettings(settings) {
  try {
    addSystemLog('Web API: Save settings request', 'INFO', 'WEB_API');
    
    var props = PropertiesService.getScriptProperties();
    
    if (settings.email) {
      props.setProperty('LICENSE_EMAIL', settings.email);
    }
    
    if (settings.token) {
      props.setProperty('LICENSE_TOKEN', settings.token);
    }
    
    if (settings.geminiKey) {
      props.setProperty('GEMINI_API_KEY', settings.geminiKey);
    }
    
    if (settings.ocrOverwrite !== undefined) {
      props.setProperty('OCR_OVERWRITE', settings.ocrOverwrite ? 'true' : 'false');
    }
    
    return {
      success: true,
      message: 'Настройки сохранены успешно!'
    };
    
  } catch (error) {
    addSystemLog('Web API save settings error: ' + error.message, 'ERROR', 'WEB_API');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * API для получения данных таблиц
 */
function webApiGetTableData(tableName, limit) {
  try {
    limit = limit || 50;
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(tableName);
    
    if (!sheet) {
      return {
        success: false,
        error: 'Лист "' + tableName + '" не найден'
      };
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return {
        success: true,
        data: [],
        headers: []
      };
    }
    
    // Получаем заголовки
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Получаем данные
    var dataRows = Math.min(lastRow - 1, limit);
    var data = sheet.getRange(2, 1, dataRows, sheet.getLastColumn()).getValues();
    
    return {
      success: true,
      data: data,
      headers: headers,
      totalRows: lastRow - 1
    };
    
  } catch (error) {
    addSystemLog('Web API get table data error: ' + error.message, 'ERROR', 'WEB_API');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * API для Gemini запросов из веба
 */
function webApiGeminiRequest(prompt, options) {
  try {
    addSystemLog('Web API: Gemini request', 'INFO', 'WEB_API');
    
    options = options || {};
    
    var credentials = getClientCredentials();
    if (!credentials.valid) {
      return {
        success: false,
        error: 'Не настроены credentials: ' + credentials.error
      };
    }
    
    // Используем существующий GM_STATIC для запроса
    var result = GM_STATIC(prompt, options.maxTokens, options.temperature);
    
    return {
      success: true,
      result: result
    };
    
  } catch (error) {
    addSystemLog('Web API Gemini error: ' + error.message, 'ERROR', 'WEB_API');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * API для тестирования соединения
 */
function webApiTestConnection() {
  try {
    var credentials = getClientCredentials();
    var systemStatus = getSystemStatusData();
    
    // Пробуем подключиться к серверу
    var serverStatus = 'unknown';
    try {
      var testResult = testSocialImportConnection();
      serverStatus = 'connected';
    } catch (e) {
      serverStatus = 'failed: ' + e.message;
    }
    
    return {
      success: true,
      status: {
        credentials: credentials.valid,
        system: systemStatus,
        server: serverStatus,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    addSystemLog('Web API test connection error: ' + error.message, 'ERROR', 'WEB_API');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Включить файл CSS/JS в HTML
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}