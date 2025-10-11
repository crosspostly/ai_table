/**
 * Расширения для веб-интерфейса Table AI
 * Дополнительные функции которые отсутствовали после рефакторинга
 */

/**
 * Импорт постов из соцсетей (для веб-интерфейса)
 */
function importSocialPosts(source, count, platform) {
  try {
    // Проверяем параметры
    if (!source || source.trim() === '') {
      throw new Error('Источник не может быть пустым');
    }
    
    // Устанавливаем значения в лист Параметры
    var ss = SpreadsheetApp.getActive();
    var paramsSheet = ss.getSheetByName('Параметры');
    if (!paramsSheet) {
      paramsSheet = ss.insertSheet('Параметры');
    }
    
    paramsSheet.getRange('B1').setValue(source.trim());
    paramsSheet.getRange('B2').setValue(count || 20);
    if (platform && platform.trim() !== '') {
      paramsSheet.getRange('C1').setValue(platform.trim());
    }
    
    addSystemLog('Web interface import started: ' + source, 'INFO', 'WEB_INTERFACE');
    
    // Вызываем основную функцию импорта
    var result = importVkPosts();
    
    addSystemLog('Web interface import completed', 'INFO', 'WEB_INTERFACE');
    return result;
    
  } catch (error) {
    addSystemLog('Web interface import error: ' + error.message, 'ERROR', 'WEB_INTERFACE');
    throw error;
  }
}

/**
 * Тест соединения с Gemini для веб-интерфейса
 */
function testGeminiConnection() {
  try {
    addSystemLog('Testing Gemini connection from web interface', 'INFO', 'WEB_INTERFACE');
    
    var result = GM('Тест соединения', 100, 0.5);
    
    if (result && !result.toString().startsWith('Error:')) {
      addSystemLog('Gemini connection test successful', 'INFO', 'WEB_INTERFACE');
      return {
        success: true,
        message: 'Gemini API работает корректно',
        result: result.toString().substring(0, 100) + '...'
      };
    } else {
      addSystemLog('Gemini connection test failed: ' + result, 'WARN', 'WEB_INTERFACE');
      return {
        success: false,
        message: result || 'Неизвестная ошибка',
        result: null
      };
    }
    
  } catch (error) {
    addSystemLog('Gemini connection test error: ' + error.message, 'ERROR', 'WEB_INTERFACE');
    return {
      success: false,
      message: error.message,
      result: null
    };
  }
}

/**
 * УДАЛЕНО: Дублирующая функция getClientCredentials()
 * Используйте единственную реализацию из table/client/CredentialsManager.gs
 * 
 * Причина удаления:
 * - Конфликт с CredentialsManager.gs
 * - Ложное требование GEMINI_API_KEY для импорта постов
 * - Нарушение принципа единого источника правды (Single Source of Truth)
 * 
 * Миграция:
 * - Все вызовы getClientCredentials() теперь используют CredentialsManager.gs
 * - Поддерживаются оба варианта полей: ok/valid, apiKey/geminiApiKey
 * - Импорт постов НЕ требует GEMINI_API_KEY
 */

/**
 * Валидация промпта для веб-интерфейса  
 */
function validatePromptInput(prompt) {
  if (!prompt) {
    throw new Error('Аргумент не может быть пустым: prompt');
  }
  
  if (typeof prompt !== 'string') {
    throw new Error('Промпт должен быть строкой');
  }
  
  if (prompt.trim() === '') {
    throw new Error('Промпт не может быть пустым');
  }
  
  return prompt.trim();
}

/**
 * Обертка GM функции для веб-интерфейса с валидацией
 */
function webGM(prompt, maxTokens, temperature) {
  try {
    // ВАЖНО БЕЗОПАСНОСТЬ: валидация промпта
    var validatedPrompt = validatePromptInput(prompt);
    
    addSystemLog('Web GM request: ' + validatedPrompt.substring(0, 50) + '...', 'INFO', 'WEB_INTERFACE');
    
    var result = GM(validatedPrompt, maxTokens, temperature);
    
    addSystemLog('Web GM response received', 'INFO', 'WEB_INTERFACE');
    return result;
    
  } catch (error) {
    addSystemLog('Web GM error: ' + error.message, 'ERROR', 'WEB_INTERFACE');
    throw error;
  }
}

/**
 * Получение статуса системы для веб-интерфейса
 */
function getSystemStatusData() {
  try {
    var credentials = getClientCredentials();
    var status = {
      timestamp: new Date().toISOString(),
      credentials: {
        license: credentials.ok && credentials.email && credentials.token,
        gemini: credentials.ok && credentials.apiKey
      },
      functions: {
        GM: typeof GM === 'function',
        importVkPosts: typeof importVkPosts === 'function',
        addSystemLog: typeof addSystemLog === 'function'
      },
      version: getCurrentVersion ? getCurrentVersion() : '2.0.1'
    };
    
    addSystemLog('System status checked from web interface', 'INFO', 'WEB_INTERFACE');
    return status;
    
  } catch (error) {
    addSystemLog('System status check error: ' + error.message, 'ERROR', 'WEB_INTERFACE');
    return {
      timestamp: new Date().toISOString(),
      error: error.message,
      credentials: { license: false, gemini: false },
      functions: { GM: false, importVkPosts: false, addSystemLog: false },
      version: '2.0.1'
    };
  }
}

/**
 * Открытие веб-интерфейса
 */
function openWebInterface() {
  try {
    addSystemLog('Opening web interface', 'INFO', 'WEB_INTERFACE');
    
    var htmlOutput = HtmlService.createHtmlOutputFromFile('WebApp')
        .setWidth(1000)
        .setHeight(600);
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'AI_TABLE Web Interface');
    
  } catch (error) {
    addSystemLog('Web interface open error: ' + error.message, 'ERROR', 'WEB_INTERFACE');
    SpreadsheetApp.getUi().alert('Ошибка', 'Не удалось открыть веб-интерфейс: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}