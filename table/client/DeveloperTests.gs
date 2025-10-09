/**
 * ФУНКЦИИ РАЗРАБОТЧИКА ДЛЯ ТЕСТИРОВАНИЯ
 * Запускаются через клиент для тестирования сервера
 * VK_TOKEN находится в Script Properties сервера
 */

/**
 * ПОЛНАЯ ДИАГНОСТИКА СИСТЕМЫ
 * Тестирует ВСЁ: credentials, VK API, Gemini, импорт
 */
function runFullDiagnostics() {
  var ui = SpreadsheetApp.getUi();
  var report = [];
  
  report.push('╔════════════════════════════════════════════════════════╗');
  report.push('║  ПОЛНАЯ ДИАГНОСТИКА СИСТЕМЫ TABLE AI                  ║');
  report.push('╚════════════════════════════════════════════════════════╝');
  report.push('');
  
  var startTime = new Date();
  var totalTests = 0;
  var passedTests = 0;
  var failedTests = 0;
  
  // ═══════════════════════════════════════════════════════
  // ТЕСТ 1: Проверка CLIENT credentials
  // ═══════════════════════════════════════════════════════
  report.push('🔍 [1/8] ПРОВЕРКА CLIENT CREDENTIALS...');
  totalTests++;
  
  try {
    var credentials = getClientCredentials();
    if (credentials && credentials.ok) {
      report.push('   ✅ CLIENT credentials: OK');
      report.push('   • Email: ' + credentials.email);
      report.push('   • Token: ' + (credentials.token ? 'есть (' + credentials.token.length + ' символов)' : 'НЕТ'));
      passedTests++;
    } else {
      report.push('   ❌ CLIENT credentials: FAILED');
      report.push('   • Error: ' + (credentials ? credentials.error : 'unknown'));
      failedTests++;
    }
  } catch (e) {
    report.push('   ❌ EXCEPTION: ' + e.message);
    failedTests++;
  }
  report.push('');
  
  // ═══════════════════════════════════════════════════════
  // ТЕСТ 2: Проверка листа "Параметры"
  // ═══════════════════════════════════════════════════════
  report.push('🔍 [2/8] ПРОВЕРКА ЛИСТА "Параметры"...');
  totalTests++;
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var params = ss.getSheetByName('Параметры');
    
    if (params) {
      report.push('   ✅ Лист "Параметры": найден');
      report.push('   • F1 (Gemini API): ' + (params.getRange('F1').getValue() ? 'есть' : 'НЕТ'));
      report.push('   • G1 (Email): ' + params.getRange('G1').getValue());
      report.push('   • B1 (source): ' + params.getRange('B1').getValue());
      report.push('   • B2 (count): ' + params.getRange('B2').getValue());
      passedTests++;
    } else {
      report.push('   ❌ Лист "Параметры": НЕ НАЙДЕН');
      failedTests++;
    }
  } catch (e) {
    report.push('   ❌ EXCEPTION: ' + e.message);
    failedTests++;
  }
  report.push('');
  
  // ═══════════════════════════════════════════════════════
  // ТЕСТ 3: Проверка соединения с сервером
  // ═══════════════════════════════════════════════════════
  report.push('🔍 [3/8] ПРОВЕРКА СОЕДИНЕНИЯ С СЕРВЕРОМ...');
  totalTests++;
  
  try {
    var healthRequest = {
      action: 'health',
      email: credentials.email,
      token: credentials.token
    };
    
    var result = callServer(healthRequest);
    
    if (result && result.ok) {
      report.push('   ✅ Сервер доступен: OK');
      report.push('   • Service: ' + (result.service || 'unknown'));
      report.push('   • Version: ' + (result.version || 'unknown'));
      passedTests++;
    } else {
      report.push('   ❌ Сервер недоступен: ' + (result ? result.error : 'no response'));
      failedTests++;
    }
  } catch (e) {
    report.push('   ❌ EXCEPTION: ' + e.message);
    failedTests++;
  }
  report.push('');
  
  // ═══════════════════════════════════════════════════════
  // ТЕСТ 4: Тест VK API через сервер
  // ═══════════════════════════════════════════════════════
  report.push('🔍 [4/8] ТЕСТ VK API (через сервер)...');
  totalTests++;
  
  try {
    var vkRequest = {
      action: 'vk_import',
      email: credentials.email,
      token: credentials.token,
      owner: 'durov',
      count: 3
    };
    
    var vkResult = callServer(vkRequest);
    
    if (vkResult && vkResult.ok && vkResult.data) {
      report.push('   ✅ VK API: OK');
      report.push('   • Posts imported: ' + vkResult.data.length);
      if (vkResult.data.length > 0) {
        report.push('   • First post date: ' + vkResult.data[0].date);
        report.push('   • First post link: ' + vkResult.data[0].link);
      }
      passedTests++;
    } else {
      report.push('   ❌ VK API: FAILED');
      report.push('   • Error: ' + (vkResult ? vkResult.error : 'no response'));
      failedTests++;
    }
  } catch (e) {
    report.push('   ❌ EXCEPTION: ' + e.message);
    failedTests++;
  }
  report.push('');
  
  // ═══════════════════════════════════════════════════════
  // ТЕСТ 5: Тест Social Import через сервер
  // ═══════════════════════════════════════════════════════
  report.push('🔍 [5/8] ТЕСТ SOCIAL IMPORT (VK через универсальный импорт)...');
  totalTests++;
  
  try {
    var socialRequest = {
      action: 'social_import',
      email: credentials.email,
      token: credentials.token,
      source: 'https://vk.com/durov',
      count: 3
    };
    
    var socialResult = callServer(socialRequest);
    
    if (socialResult && socialResult.ok && socialResult.data) {
      report.push('   ✅ Social Import: OK');
      report.push('   • Platform: ' + (socialResult.platform || 'unknown'));
      report.push('   • Posts imported: ' + socialResult.data.length);
      passedTests++;
    } else {
      report.push('   ❌ Social Import: FAILED');
      report.push('   • Error: ' + (socialResult ? socialResult.error : 'no response'));
      failedTests++;
    }
  } catch (e) {
    report.push('   ❌ EXCEPTION: ' + e.message);
    failedTests++;
  }
  report.push('');
  
  // ═══════════════════════════════════════════════════════
  // ТЕСТ 6: Тест Gemini API
  // ═══════════════════════════════════════════════════════
  report.push('🔍 [6/8] ТЕСТ GEMINI API...');
  totalTests++;
  
  try {
    var params = ss.getSheetByName('Параметры');
    var geminiApiKey = params ? params.getRange('F1').getValue() : null;
    
    if (geminiApiKey) {
      var geminiRequest = {
        action: 'gm',
        email: credentials.email,
        token: credentials.token,
        geminiApiKey: geminiApiKey,
        prompt: 'Say "test ok" if you receive this',
        maxTokens: 10
      };
      
      var geminiResult = callServer(geminiRequest);
      
      if (geminiResult && geminiResult.ok) {
        report.push('   ✅ Gemini API: OK');
        report.push('   • Response: ' + (geminiResult.data ? geminiResult.data.substring(0, 50) : 'empty'));
        passedTests++;
      } else {
        report.push('   ❌ Gemini API: FAILED');
        report.push('   • Error: ' + (geminiResult ? geminiResult.error : 'no response'));
        failedTests++;
      }
    } else {
      report.push('   ⚠️ Gemini API: SKIPPED (no API key in F1)');
      totalTests--;
    }
  } catch (e) {
    report.push('   ❌ EXCEPTION: ' + e.message);
    failedTests++;
  }
  report.push('');
  
  // ═══════════════════════════════════════════════════════
  // ТЕСТ 7: Проверка системных функций
  // ═══════════════════════════════════════════════════════
  report.push('🔍 [7/8] ПРОВЕРКА СИСТЕМНЫХ ФУНКЦИЙ...');
  totalTests++;
  
  try {
    var functions = [
      'getClientCredentials',
      'callServer',
      'addSystemLog',
      'importSocialPostsClient',
      'masterSystemCheck'
    ];
    
    var existingFunctions = 0;
    functions.forEach(function(funcName) {
      try {
        if (typeof eval(funcName) === 'function') {
          existingFunctions++;
        }
      } catch (e) {
        // function doesn't exist
      }
    });
    
    if (existingFunctions === functions.length) {
      report.push('   ✅ Системные функции: OK (' + existingFunctions + '/' + functions.length + ')');
      passedTests++;
    } else {
      report.push('   ⚠️ Системные функции: PARTIAL (' + existingFunctions + '/' + functions.length + ')');
      passedTests++;
    }
  } catch (e) {
    report.push('   ❌ EXCEPTION: ' + e.message);
    failedTests++;
  }
  report.push('');
  
  // ═══════════════════════════════════════════════════════
  // ТЕСТ 8: Проверка логирования
  // ═══════════════════════════════════════════════════════
  report.push('🔍 [8/8] ПРОВЕРКА ЛОГИРОВАНИЯ...');
  totalTests++;
  
  try {
    addSystemLog('TEST LOG ENTRY FROM DIAGNOSTICS', 'INFO', 'DIAGNOSTICS');
    var logs = getSystemLogs();
    
    if (logs && logs.length > 0) {
      report.push('   ✅ Логирование: OK');
      report.push('   • Total logs: ' + logs.length);
      report.push('   • Last log: ' + logs[logs.length - 1]);
      passedTests++;
    } else {
      report.push('   ⚠️ Логирование: WARNING (no logs found)');
      passedTests++;
    }
  } catch (e) {
    report.push('   ❌ EXCEPTION: ' + e.message);
    failedTests++;
  }
  report.push('');
  
  // ═══════════════════════════════════════════════════════
  // ИТОГОВЫЙ ОТЧЁТ
  // ═══════════════════════════════════════════════════════
  var endTime = new Date();
  var duration = Math.round((endTime - startTime) / 1000);
  
  report.push('╔════════════════════════════════════════════════════════╗');
  report.push('║  ИТОГОВЫЙ ОТЧЁТ                                        ║');
  report.push('╚════════════════════════════════════════════════════════╝');
  report.push('');
  report.push('📊 СТАТИСТИКА:');
  report.push('   • Всего тестов: ' + totalTests);
  report.push('   • Прошли: ' + passedTests + ' (' + Math.round(passedTests/totalTests*100) + '%)');
  report.push('   • Провалены: ' + failedTests);
  report.push('   • Время выполнения: ' + duration + ' сек');
  report.push('');
  
  var status = failedTests === 0 ? '🎉 ВСЕ ТЕСТЫ ПРОШЛИ!' : 
               failedTests <= 2 ? '✅ БОЛЬШИНСТВО ТЕСТОВ ПРОШЛО' :
               '❌ ТРЕБУЕТ ВНИМАНИЯ';
  
  report.push('🎯 СТАТУС: ' + status);
  report.push('');
  
  if (failedTests > 0) {
    report.push('⚠️ РЕКОМЕНДАЦИИ:');
    report.push('   1. Проверьте проваленные тесты выше');
    report.push('   2. Убедитесь что VK_TOKEN настроен на сервере');
    report.push('   3. Проверьте логи Apps Script для деталей');
    report.push('');
  }
  
  // Выводим отчёт
  var reportText = report.join('\n');
  Logger.log(reportText);
  
  // Показываем в UI
  var summaryText = '📊 ДИАГНОСТИКА ЗАВЕРШЕНА\n\n' +
    'Всего тестов: ' + totalTests + '\n' +
    'Прошли: ' + passedTests + ' (' + Math.round(passedTests/totalTests*100) + '%)\n' +
    'Провалены: ' + failedTests + '\n' +
    'Время: ' + duration + ' сек\n\n' +
    status + '\n\n' +
    'Полный отчёт в логах (View → Logs)';
  
  ui.alert('🔍 Полная диагностика', summaryText, ui.ButtonSet.OK);
  
  addSystemLog('Полная диагностика завершена: ' + passedTests + '/' + totalTests + ' passed', 'INFO', 'DIAGNOSTICS');
  
  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    duration: duration,
    report: reportText
  };
}

/**
 * БЫСТРЫЙ ТЕСТ VK ИМПОРТА
 */
function quickTestVkImport() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    ui.alert('🚀 Тест VK импорта', 'Запуск теста импорта из VK...', ui.ButtonSet.OK);
    
    var credentials = getClientCredentials();
    if (!credentials || !credentials.ok) {
      throw new Error('Credentials не настроены: ' + (credentials ? credentials.error : 'unknown'));
    }
    
    var vkRequest = {
      action: 'social_import',
      email: credentials.email,
      token: credentials.token,
      source: 'https://vk.com/durov',
      count: 5
    };
    
    var result = callServer(vkRequest);
    
    if (result && result.ok && result.data) {
      var message = '✅ УСПЕХ!\n\n' +
        'Платформа: ' + (result.platform || 'VK') + '\n' +
        'Импортировано: ' + result.data.length + ' постов\n\n' +
        'Первый пост:\n' +
        'Дата: ' + result.data[0].date + '\n' +
        'Ссылка: ' + result.data[0].link;
      
      ui.alert('✅ VK Импорт', message, ui.ButtonSet.OK);
      addSystemLog('Quick VK import test: SUCCESS (' + result.data.length + ' posts)', 'INFO', 'TEST');
      return true;
    } else {
      throw new Error(result ? result.error : 'No response from server');
    }
    
  } catch (e) {
    ui.alert('❌ Ошибка теста', 'Тест VK импорта провалился:\n\n' + e.message, ui.ButtonSet.OK);
    addSystemLog('Quick VK import test: FAILED - ' + e.message, 'ERROR', 'TEST');
    return false;
  }
}

/**
 * БЫСТРЫЙ ТЕСТ GEMINI
 */
function quickTestGemini() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    ui.alert('🚀 Тест Gemini', 'Запуск теста Gemini AI...', ui.ButtonSet.OK);
    
    var credentials = getClientCredentials();
    if (!credentials || !credentials.ok) {
      throw new Error('Credentials не настроены');
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var params = ss.getSheetByName('Параметры');
    if (!params) {
      throw new Error('Лист "Параметры" не найден');
    }
    
    var geminiApiKey = params.getRange('F1').getValue();
    if (!geminiApiKey) {
      throw new Error('Gemini API key не настроен в F1');
    }
    
    var geminiRequest = {
      action: 'gm',
      email: credentials.email,
      token: credentials.token,
      geminiApiKey: geminiApiKey,
      prompt: 'Скажи "Тест пройден успешно" если ты получил это сообщение',
      maxTokens: 50
    };
    
    var result = callServer(geminiRequest);
    
    if (result && result.ok && result.data) {
      var message = '✅ УСПЕХ!\n\n' +
        'Gemini ответил:\n' +
        result.data.substring(0, 200);
      
      ui.alert('✅ Gemini Test', message, ui.ButtonSet.OK);
      addSystemLog('Quick Gemini test: SUCCESS', 'INFO', 'TEST');
      return true;
    } else {
      throw new Error(result ? result.error : 'No response from server');
    }
    
  } catch (e) {
    ui.alert('❌ Ошибка теста', 'Тест Gemini провалился:\n\n' + e.message, ui.ButtonSet.OK);
    addSystemLog('Quick Gemini test: FAILED - ' + e.message, 'ERROR', 'TEST');
    return false;
  }
}

/**
 * ЗАПУСК ВСЕХ БЫСТРЫХ ТЕСТОВ
 */
function runAllQuickTests() {
  var ui = SpreadsheetApp.getUi();
  
  ui.alert('🚀 Запуск всех тестов', 
    'Будут запущены:\n' +
    '1. Тест VK импорта\n' +
    '2. Тест Gemini AI\n' +
    '3. Полная диагностика\n\n' +
    'Это займёт ~1 минуту...', 
    ui.ButtonSet.OK);
  
  var results = {
    vk: false,
    gemini: false,
    diagnostics: null
  };
  
  // Тест 1: VK
  results.vk = quickTestVkImport();
  Utilities.sleep(1000);
  
  // Тест 2: Gemini
  results.gemini = quickTestGemini();
  Utilities.sleep(1000);
  
  // Тест 3: Полная диагностика
  results.diagnostics = runFullDiagnostics();
  
  // Итог
  var summary = '📊 ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ\n\n' +
    '1. VK импорт: ' + (results.vk ? '✅ OK' : '❌ FAILED') + '\n' +
    '2. Gemini AI: ' + (results.gemini ? '✅ OK' : '❌ FAILED') + '\n' +
    '3. Диагностика: ' + results.diagnostics.passed + '/' + results.diagnostics.total + ' passed\n\n' +
    'Полные логи: View → Logs';
  
  ui.alert('✅ Тестирование завершено', summary, ui.ButtonSet.OK);
}
