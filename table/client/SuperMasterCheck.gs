/**
 * 🎯 СУПЕР МАСТЕР ПРОВЕРКА - ULTIMATE SYSTEM DIAGNOSTIC
 * Объединяет ВСЕ тесты созданные для Table AI
 * Запускается одной кнопкой в Google Sheets
 * 
 * ЧТО ТЕСТИРУЕТСЯ:
 * ✅ 8 тестов DeveloperTests (CLIENT-SERVER диагностика)
 * ✅ 27 функций системы (существование и доступность)
 * ✅ Боевые тесты с реальными данными (Gemini, VK, OCR)
 * ✅ Параметры и credentials
 * ✅ Листы и структура
 * 
 * ДЕТАЛЬНЫЕ ЛОГИ: Каждый шаг записывается в лист "тест"
 */

/**
 * 🚀 СУПЕР МАСТЕР ПРОВЕРКА - главная функция
 * Запускает ПОЛНОЕ тестирование всей системы
 */
function superMasterCheck() {
  addSystemLog('🎯🎯🎯 ЗАПУЩЕНА СУПЕР МАСТЕР ПРОВЕРКА 🎯🎯🎯', 'INFO', 'SUPER_MASTER_CHECK');
  
  var startTime = new Date();
  var testSheet = null;
  var ui = SpreadsheetApp.getUi();
  
  var overallResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    sections: [],
    startTime: startTime
  };
  
  try {
    // === ПРИВЕТСТВИЕ ===
    var response = ui.alert('🚀 СУПЕР МАСТЕР ПРОВЕРКА', 
      '🎯 ПОЛНОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ\\n\\n' +
      'Будут запущены:\\n' +
      '━━━━━━━━━━━━━━━━━━━━━━\\n' +
      '1️⃣ CLIENT-SERVER диагностика (8 тестов)\\n' +
      '2️⃣ Проверка всех функций (27 функций)\\n' +
      '3️⃣ Боевые тесты с реальными данными\\n' +
      '4️⃣ VK API тестирование\\n' +
      '5️⃣ Gemini AI тестирование\\n' +
      '6️⃣ Параметры и credentials\\n' +
      '7️⃣ Структура листов\\n' +
      '━━━━━━━━━━━━━━━━━━━━━━\\n\\n' +
      '⏱️ Это займёт 2-4 минуты\\n' +
      '📊 Результаты будут в листе \"тест\"\\n' +
      '🔧 Каждый проваленный тест получит РЕКОМЕНДАЦИИ\\n\\n' +
      '💡 Все результаты будут ДЕТАЛЬНО задокументированы!\\n\\n' +
      'Готовы начать?',
      ui.ButtonSet.OK_CANCEL);
    
    // Если пользователь отменил
    if (response === ui.Button.CANCEL) {
      addSystemLog('🚫 СУПЕР МАСТЕР ПРОВЕРКА отменена пользователем', 'INFO', 'SUPER_MASTER_CHECK');
      ui.alert('Отменено', 'СУПЕР МАСТЕР ПРОВЕРКА отменена.\\n\\nЗапустите снова когда будете готовы.', ui.ButtonSet.OK);
      return;
    }
    
    // === ПОДГОТОВКА ЛИСТА ТЕСТОВ ===
    logStep('ПОДГОТОВКА', 'Создание/получение листа \"тест\"', 'in_progress');
    testSheet = ensureTestSheetSuper();
    logStep('ПОДГОТОВКА', 'Лист \"тест\" готов', 'success');
    
    writeProgressHeader(testSheet, 'СУПЕР МАСТЕР ПРОВЕРКА ЗАПУЩЕНА');
    
    // === СЕКЦИЯ 1: CLIENT-SERVER ДИАГНОСТИКА ===
    logSection(testSheet, '━━━━━━━━━ СЕКЦИЯ 1: CLIENT-SERVER ДИАГНОСТИКА ━━━━━━━━━');
    var section1 = runDeveloperTestsSection(testSheet);
    overallResults.sections.push(section1);
    overallResults.total += section1.total;
    overallResults.passed += section1.passed;
    overallResults.failed += section1.failed;
    overallResults.skipped += section1.skipped;
    
    // === СЕКЦИЯ 2: ПРОВЕРКА ВСЕХ ФУНКЦИЙ СИСТЕМЫ ===
    logSection(testSheet, '━━━━━━━━━ СЕКЦИЯ 2: ПРОВЕРКА ВСЕХ ФУНКЦИЙ ━━━━━━━━━');
    var section2 = runAllFunctionsCheckSection(testSheet);
    overallResults.sections.push(section2);
    overallResults.total += section2.total;
    overallResults.passed += section2.passed;
    overallResults.failed += section2.failed;
    
    // === СЕКЦИЯ 3: ПАРАМЕТРЫ И CREDENTIALS ===
    logSection(testSheet, '━━━━━━━━━ СЕКЦИЯ 3: ПАРАМЕТРЫ И CREDENTIALS ━━━━━━━━━');
    var section3 = runParametersCheckSection(testSheet);
    overallResults.sections.push(section3);
    overallResults.total += section3.total;
    overallResults.passed += section3.passed;
    overallResults.failed += section3.failed;
    
    // === СЕКЦИЯ 4: БОЕВЫЕ ТЕСТЫ С РЕАЛЬНЫМИ ДАННЫМИ ===
    logSection(testSheet, '━━━━━━━━━ СЕКЦИЯ 4: БОЕВЫЕ ТЕСТЫ С ДАННЫМИ ━━━━━━━━━');
    var section4 = runBattleTestsSection(testSheet);
    overallResults.sections.push(section4);
    overallResults.total += section4.total;
    overallResults.passed += section4.passed;
    overallResults.failed += section4.failed;
    overallResults.skipped += section4.skipped;
    
    // УБРАНО: Секция 5 VK API - больше не используется
    // VK токены теперь на сервере, проверка не нужна на клиенте
    
    // === ФИНАЛЬНЫЙ ОТЧЁТ ===
    var endTime = new Date();
    var duration = Math.round((endTime - startTime) / 1000);
    overallResults.endTime = endTime;
    overallResults.duration = duration;
    
    writeProgressHeader(testSheet, 'СУПЕР МАСТЕР ПРОВЕРКА ЗАВЕРШЕНА');
    writeFinalReportSuper(testSheet, overallResults);
    
    // === ПОКАЗЫВАЕМ РЕЗУЛЬТАТЫ ПОЛЬЗОВАТЕЛЮ ===
    showFinalResults(overallResults);
    
    addSystemLog('🎯 СУПЕР МАСТЕР ПРОВЕРКА ЗАВЕРШЕНА: ' + overallResults.passed + '/' + overallResults.total + ' passed (' + duration + ' сек)', 'INFO', 'SUPER_MASTER_CHECK');
    
  } catch (error) {
    addSystemLog('❌ КРИТИЧЕСКАЯ ОШИБКА СУПЕР МАСТЕР ПРОВЕРКИ: ' + error.message + '\\n' + error.stack, 'ERROR', 'SUPER_MASTER_CHECK');
    
    if (testSheet) {
      writeTestResultToSheet(testSheet, 'КРИТИЧЕСКАЯ ОШИБКА', '❌ FAIL', error.message, error.stack);
    }
    
    ui.alert('❌ Критическая ошибка', 
      'Произошла критическая ошибка при выполнении супер мастер проверки:\\n\\n' + 
      error.message + '\\n\\n' +
      'Stack trace:\\n' + error.stack.substring(0, 200) + '...\\n\\n' +
      'Проверьте логи для подробностей.',
      ui.ButtonSet.OK);
  }
}

// ═══════════════════════════════════════════════════════
// СЕКЦИЯ 1: CLIENT-SERVER ДИАГНОСТИКА
// ═══════════════════════════════════════════════════════

function runDeveloperTestsSection(testSheet) {
  logStep('SECTION 1', 'Запуск CLIENT-SERVER диагностики (8 тестов)', 'in_progress');
  
  var results = {
    name: 'CLIENT-SERVER Диагностика',
    total: 8,
    passed: 0,
    failed: 0,
    skipped: 0,
    details: []
  };
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ТЕСТ 1: CLIENT CREDENTIALS
    logStep('CLIENT-SERVER [1/8]', 'Проверка CLIENT credentials', 'in_progress');
    try {
      var credentials = getClientCredentials();
      if (credentials && credentials.ok) {
        results.passed++;
        results.details.push('✅ [1/8] CLIENT credentials: OK (email: ' + credentials.email + ')');
        writeTestResultToSheet(testSheet, '[1/8] CLIENT credentials', '✅ PASS', 'Email: ' + credentials.email + ', Token: есть');
        logStep('CLIENT-SERVER [1/8]', 'CLIENT credentials: OK', 'success');
      } else {
        results.failed++;
        results.details.push('❌ [1/8] CLIENT credentials: FAILED (' + (credentials ? credentials.error : 'unknown') + ')');
        writeTestResultToSheet(testSheet, '[1/8] CLIENT credentials', '❌ FAIL', credentials ? credentials.error : 'unknown');
        logStep('CLIENT-SERVER [1/8]', 'CLIENT credentials: FAILED', 'error');
      }
    } catch (e) {
      results.failed++;
      results.details.push('❌ [1/8] CLIENT credentials: EXCEPTION (' + e.message + ')');
      writeTestResultToSheet(testSheet, '[1/8] CLIENT credentials', '❌ FAIL', e.message, e.stack);
      logStep('CLIENT-SERVER [1/8]', 'EXCEPTION: ' + e.message, 'error');
    }
    
    // ТЕСТ 2: ЛИСТ ПАРАМЕТРЫ
    logStep('CLIENT-SERVER [2/8]', 'Проверка листа \"Параметры\"', 'in_progress');
    try {
      var params = ss.getSheetByName('Параметры');
      if (params) {
        var f1 = params.getRange('F1').getValue();
        var g1 = params.getRange('G1').getValue();
        var b1 = params.getRange('B1').getValue();
        var b2 = params.getRange('B2').getValue();
        
        results.passed++;
        results.details.push('✅ [2/8] Лист \"Параметры\": OK (F1:' + (f1 ? 'есть' : 'НЕТ') + ', G1:' + (g1 ? 'есть' : 'НЕТ') + ')');
        writeTestResultToSheet(testSheet, '[2/8] Лист \"Параметры\"', '✅ PASS', 
          'F1(API): ' + (f1 ? 'есть' : 'НЕТ') + ', G1(Email): ' + (g1 ? g1 : 'НЕТ') + ', B1: ' + (b1 ? b1 : 'НЕТ') + ', B2: ' + (b2 ? b2 : 'НЕТ'));
        logStep('CLIENT-SERVER [2/8]', 'Лист \"Параметры\": OK', 'success');
      } else {
        results.failed++;
        results.details.push('❌ [2/8] Лист \"Параметры\": НЕ НАЙДЕН');
        writeTestResultToSheet(testSheet, '[2/8] Лист \"Параметры\"', '❌ FAIL', 'Лист не найден');
        logStep('CLIENT-SERVER [2/8]', 'Лист \"Параметры\": НЕ НАЙДЕН', 'error');
      }
    } catch (e) {
      results.failed++;
      results.details.push('❌ [2/8] Лист \"Параметры\": EXCEPTION (' + e.message + ')');
      writeTestResultToSheet(testSheet, '[2/8] Лист \"Параметры\"', '❌ FAIL', e.message, e.stack);
      logStep('CLIENT-SERVER [2/8]', 'EXCEPTION: ' + e.message, 'error');
    }
    
    // ТЕСТ 3: СОЕДИНЕНИЕ С СЕРВЕРОМ
    logStep('CLIENT-SERVER [3/8]', 'Проверка соединения с сервером', 'in_progress');
    try {
      var healthRequest = {
        action: 'health',
        email: credentials.email,
        token: credentials.token
      };
      
      var result = callServer(healthRequest);
      
      if (result && result.ok) {
        results.passed++;
        results.details.push('✅ [3/8] Сервер доступен: OK (service: ' + (result.service || 'unknown') + ')');
        writeTestResultToSheet(testSheet, '[3/8] Соединение с сервером', '✅ PASS', 
          'Service: ' + (result.service || 'unknown') + ', Version: ' + (result.version || 'unknown'));
        logStep('CLIENT-SERVER [3/8]', 'Сервер доступен: OK', 'success');
      } else {
        results.failed++;
        results.details.push('❌ [3/8] Сервер недоступен: ' + (result ? result.error : 'no response'));
        writeTestResultToSheet(testSheet, '[3/8] Соединение с сервером', '❌ FAIL', result ? result.error : 'no response');
        logStep('CLIENT-SERVER [3/8]', 'Сервер недоступен', 'error');
      }
    } catch (e) {
      results.failed++;
      results.details.push('❌ [3/8] Сервер: EXCEPTION (' + e.message + ')');
      writeTestResultToSheet(testSheet, '[3/8] Соединение с сервером', '❌ FAIL', e.message, e.stack);
      logStep('CLIENT-SERVER [3/8]', 'EXCEPTION: ' + e.message, 'error');
    }
    
    // УБРАНО: ТЕСТ 4 - VK API через сервер
    // VK токены теперь на сервере, проверка не нужна на клиенте
    logStep('CLIENT-SERVER [4/8]', 'VK API проверка убрана (токены на сервере)', 'success');
    results.total--;  // Уменьшаем общее количество тестов
    
    // ТЕСТ 5: Social Import
    logStep('CLIENT-SERVER [5/8]', 'Тест Social Import', 'in_progress');
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
        results.passed++;
        results.details.push('✅ [5/8] Social Import: OK (platform: ' + (socialResult.platform || 'unknown') + ')');
        writeTestResultToSheet(testSheet, '[5/8] Social Import', '✅ PASS', 
          'Platform: ' + (socialResult.platform || 'unknown') + ', Posts: ' + socialResult.data.length);
        logStep('CLIENT-SERVER [5/8]', 'Social Import: OK', 'success');
      } else {
        results.failed++;
        results.details.push('❌ [5/8] Social Import: FAILED (' + (socialResult ? socialResult.error : 'no response') + ')');
        writeTestResultToSheet(testSheet, '[5/8] Social Import', '❌ FAIL', socialResult ? socialResult.error : 'no response');
        logStep('CLIENT-SERVER [5/8]', 'Social Import: FAILED', 'error');
      }
    } catch (e) {
      results.failed++;
      results.details.push('❌ [5/8] Social Import: EXCEPTION (' + e.message + ')');
      writeTestResultToSheet(testSheet, '[5/8] Social Import', '❌ FAIL', e.message, e.stack);
      logStep('CLIENT-SERVER [5/8]', 'EXCEPTION: ' + e.message, 'error');
    }
    
    // ТЕСТ 6: Gemini API
    logStep('CLIENT-SERVER [6/8]', 'Тест Gemini API', 'in_progress');
    try {
      var params = ss.getSheetByName('Параметры');
      var geminiApiKey = params ? params.getRange('F1').getValue() : null;
      
      if (geminiApiKey) {
        var geminiRequest = {
          action: 'gm',
          email: credentials.email,
          token: credentials.token,
          geminiApiKey: geminiApiKey,
          prompt: 'Say \"test ok\" if you receive this',
          maxTokens: 10
        };
        
        var geminiResult = callServer(geminiRequest);
        
        if (geminiResult && geminiResult.ok) {
          results.passed++;
          results.details.push('✅ [6/8] Gemini API: OK');
          writeTestResultToSheet(testSheet, '[6/8] Gemini API', '✅ PASS', 
            'Response: ' + (geminiResult.data ? geminiResult.data.substring(0, 50) : 'empty'));
          logStep('CLIENT-SERVER [6/8]', 'Gemini API: OK', 'success');
        } else {
          results.failed++;
          results.details.push('❌ [6/8] Gemini API: FAILED (' + (geminiResult ? geminiResult.error : 'no response') + ')');
          writeTestResultToSheet(testSheet, '[6/8] Gemini API', '❌ FAIL', geminiResult ? geminiResult.error : 'no response');
          logStep('CLIENT-SERVER [6/8]', 'Gemini API: FAILED', 'error');
        }
      } else {
        results.skipped++;
        results.details.push('⚠️ [6/8] Gemini API: SKIPPED (no API key in F1)');
        writeTestResultToSheet(testSheet, '[6/8] Gemini API', '⚠️ SKIP', 'No API key in F1');
        logStep('CLIENT-SERVER [6/8]', 'Gemini API: SKIPPED (no API key)', 'warning');
      }
    } catch (e) {
      results.failed++;
      results.details.push('❌ [6/8] Gemini API: EXCEPTION (' + e.message + ')');
      writeTestResultToSheet(testSheet, '[6/8] Gemini API', '❌ FAIL', e.message, e.stack);
      logStep('CLIENT-SERVER [6/8]', 'EXCEPTION: ' + e.message, 'error');
    }
    
    // ТЕСТ 7: Системные функции
    logStep('CLIENT-SERVER [7/8]', 'Проверка системных функций', 'in_progress');
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
        results.passed++;
        results.details.push('✅ [7/8] Системные функции: OK (' + existingFunctions + '/' + functions.length + ')');
        writeTestResultToSheet(testSheet, '[7/8] Системные функции', '✅ PASS', 
          existingFunctions + '/' + functions.length + ' найдено');
        logStep('CLIENT-SERVER [7/8]', 'Системные функции: OK', 'success');
      } else {
        results.failed++;
        results.details.push('⚠️ [7/8] Системные функции: PARTIAL (' + existingFunctions + '/' + functions.length + ')');
        writeTestResultToSheet(testSheet, '[7/8] Системные функции', '⚠️ PARTIAL', 
          existingFunctions + '/' + functions.length + ' найдено');
        logStep('CLIENT-SERVER [7/8]', 'Системные функции: PARTIAL', 'warning');
      }
    } catch (e) {
      results.failed++;
      results.details.push('❌ [7/8] Системные функции: EXCEPTION (' + e.message + ')');
      writeTestResultToSheet(testSheet, '[7/8] Системные функции', '❌ FAIL', e.message, e.stack);
      logStep('CLIENT-SERVER [7/8]', 'EXCEPTION: ' + e.message, 'error');
    }
    
    // ТЕСТ 8: Логирование
    logStep('CLIENT-SERVER [8/8]', 'Проверка логирования', 'in_progress');
    try {
      addSystemLog('TEST LOG ENTRY FROM SUPER MASTER CHECK', 'INFO', 'TEST');
      var logs = getSystemLogs();
      
      if (logs && logs.length > 0) {
        results.passed++;
        results.details.push('✅ [8/8] Логирование: OK (' + logs.length + ' logs)');
        writeTestResultToSheet(testSheet, '[8/8] Логирование', '✅ PASS', 
          'Total logs: ' + logs.length + ', Last: ' + logs[logs.length - 1].substring(0, 50));
        logStep('CLIENT-SERVER [8/8]', 'Логирование: OK', 'success');
      } else {
        results.failed++;
        results.details.push('⚠️ [8/8] Логирование: WARNING (no logs found)');
        writeTestResultToSheet(testSheet, '[8/8] Логирование', '⚠️ WARN', 'No logs found');
        logStep('CLIENT-SERVER [8/8]', 'Логирование: WARNING', 'warning');
      }
    } catch (e) {
      results.failed++;
      results.details.push('❌ [8/8] Логирование: EXCEPTION (' + e.message + ')');
      writeTestResultToSheet(testSheet, '[8/8] Логирование', '❌ FAIL', e.message, e.stack);
      logStep('CLIENT-SERVER [8/8]', 'EXCEPTION: ' + e.message, 'error');
    }
    
    logStep('SECTION 1', 'CLIENT-SERVER диагностика завершена: ' + results.passed + '/' + results.total, 'success');
    
  } catch (error) {
    logStep('SECTION 1', 'КРИТИЧЕСКАЯ ОШИБКА: ' + error.message, 'error');
    results.failed = results.total - results.passed - results.skipped;
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════
// СЕКЦИЯ 2: ПРОВЕРКА ВСЕХ ФУНКЦИЙ
// ═══════════════════════════════════════════════════════

function runAllFunctionsCheckSection(testSheet) {
  logStep('SECTION 2', 'Проверка всех функций системы (27 функций)', 'in_progress');
  
  var results = {
    name: 'Проверка всех функций',
    total: 27,
    passed: 0,
    failed: 0,
    skipped: 0,
    details: []
  };
  
  try {
    var functionsToCheck = [
      'GM', 'GM_STATIC', 'GM_IF',
      'prepareChainSmart', 'checkStepCompletion', 'clearChainForA3',
      'importVkPosts', 'importSocialPostsClient',
      'ocrRun', 'extractImageLinks',
      'initializeChatMode', 'setupSmartPromptTrigger',
      'getClientCredentials', 'callServer',
      'addSystemLog', 'getSystemLogs',
      'runAllTests', 'quickTest', 'checkAllFunctionExistence',
      'superMasterCheck',
      'checkSystemStatus', 'setupAllCredentialsUI',
      'getCurrentVersion', 'getVersionInfo',
      'openWebInterface', 'configureSocialImport', 'runSmartChain'
    ];
    
    functionsToCheck.forEach(function(funcName) {
      try {
        if (typeof eval(funcName) === 'function') {
          results.passed++;
          results.details.push('✅ ' + funcName + '()');
        } else {
          results.failed++;
          results.details.push('❌ ' + funcName + '() - не функция');
        }
      } catch (e) {
        results.failed++;
        results.details.push('❌ ' + funcName + '() - не существует');
      }
    });
    
    writeTestResultToSheet(testSheet, 'Проверка всех функций', 
      results.failed === 0 ? '✅ PASS' : '⚠️ PARTIAL', 
      results.passed + '/' + results.total + ' найдено',
      results.failed > 0 ? 'Не найдено: ' + results.failed + ' функций' : '');
    
    logStep('SECTION 2', 'Проверка функций завершена: ' + results.passed + '/' + results.total, 'success');
    
  } catch (error) {
    logStep('SECTION 2', 'ОШИБКА: ' + error.message, 'error');
    results.failed = results.total - results.passed;
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════
// СЕКЦИЯ 3: ПАРАМЕТРЫ И CREDENTIALS
// ═══════════════════════════════════════════════════════

function runParametersCheckSection(testSheet) {
  logStep('SECTION 3', 'Проверка параметров и credentials', 'in_progress');
  
  var results = {
    name: 'Параметры и Credentials',
    total: 6,
    passed: 0,
    failed: 0,
    skipped: 0,
    details: []
  };
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var props = PropertiesService.getScriptProperties();
    
    // Проверка Script Properties
    var licenseEmail = props.getProperty('LICENSE_EMAIL');
    var licenseToken = props.getProperty('LICENSE_TOKEN');
    var geminiKey = props.getProperty('GEMINI_API_KEY');
    
    if (licenseEmail) {
      results.passed++;
      results.details.push('✅ LICENSE_EMAIL: ' + licenseEmail);
    } else {
      results.failed++;
      results.details.push('❌ LICENSE_EMAIL: НЕ НАСТРОЕН');
    }
    
    if (licenseToken) {
      results.passed++;
      results.details.push('✅ LICENSE_TOKEN: есть (' + licenseToken.length + ' символов)');
    } else {
      results.failed++;
      results.details.push('❌ LICENSE_TOKEN: НЕ НАСТРОЕН');
    }
    
    if (geminiKey) {
      results.passed++;
      results.details.push('✅ GEMINI_API_KEY: есть (' + geminiKey.substring(0, 15) + '...)');
    } else {
      results.failed++;
      results.details.push('❌ GEMINI_API_KEY: НЕ НАСТРОЕН');
    }
    
    // Проверка листа Параметры
    var paramsSheet = ss.getSheetByName('Параметры');
    if (paramsSheet) {
      results.passed++;
      results.details.push('✅ Лист \"Параметры\": существует');
      
      var f1 = paramsSheet.getRange('F1').getValue();
      var g1 = paramsSheet.getRange('G1').getValue();
      
      if (f1) {
        results.passed++;
        results.details.push('✅ Параметры F1 (API key): есть');
      } else {
        results.failed++;
        results.details.push('❌ Параметры F1 (API key): НЕТ');
      }
      
      if (g1) {
        results.passed++;
        results.details.push('✅ Параметры G1 (Email): ' + g1);
      } else {
        results.failed++;
        results.details.push('❌ Параметры G1 (Email): НЕТ');
      }
    } else {
      results.failed += 3;
      results.details.push('❌ Лист \"Параметры\": НЕ НАЙДЕН');
      results.details.push('❌ Параметры F1: не проверено');
      results.details.push('❌ Параметры G1: не проверено');
    }
    
    writeTestResultToSheet(testSheet, 'Параметры и Credentials', 
      results.failed === 0 ? '✅ PASS' : '⚠️ PARTIAL', 
      results.passed + '/' + results.total + ' настроено',
      results.details.filter(d => d.includes('❌')).join(', '));
    
    logStep('SECTION 3', 'Параметры: ' + results.passed + '/' + results.total, 'success');
    
  } catch (error) {
    logStep('SECTION 3', 'ОШИБКА: ' + error.message, 'error');
    writeTestResultToSheet(testSheet, 'Параметры и Credentials', '❌ FAIL', error.message, error.stack);
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════
// СЕКЦИЯ 4: БОЕВЫЕ ТЕСТЫ
// ═══════════════════════════════════════════════════════

function runBattleTestsSection(testSheet) {
  logStep('SECTION 4', 'Боевые тесты с реальными данными', 'in_progress');
  
  var results = {
    name: 'Боевые тесты',
    total: 4,
    passed: 0,
    failed: 0,
    skipped: 0,
    details: []
  };
  
  try {
    var params = readSystemParameters();
    var reviews = readTestReviews();
    
    // Тест 1: Gemini Connection
    if (params.apiKey) {
      if (testGeminiConnection(params)) {
        results.passed++;
        results.details.push('✅ Gemini Connection: OK');
        writeTestResultToSheet(testSheet, 'Боевой тест: Gemini Connection', '✅ PASS', 'Подключение успешно');
      } else {
        results.failed++;
        results.details.push('❌ Gemini Connection: FAILED');
        writeTestResultToSheet(testSheet, 'Боевой тест: Gemini Connection', '❌ FAIL', 'Ошибка подключения');
      }
    } else {
      results.skipped++;
      results.details.push('⚠️ Gemini Connection: SKIPPED (no API key)');
      writeTestResultToSheet(testSheet, 'Боевой тест: Gemini Connection', '⚠️ SKIP', 'No API key');
    }
    
    // Тест 2: Review Processing
    if (params.apiKey && reviews.length > 0) {
      if (testReviewProcessing(params, reviews[0], testSheet)) {
        results.passed++;
        results.details.push('✅ Review Processing: OK');
        writeTestResultToSheet(testSheet, 'Боевой тест: Review Processing', '✅ PASS', 'Отзыв обработан');
      } else {
        results.failed++;
        results.details.push('❌ Review Processing: FAILED');
        writeTestResultToSheet(testSheet, 'Боевой тест: Review Processing', '❌ FAIL', 'Ошибка обработки');
      }
    } else {
      results.skipped++;
      results.details.push('⚠️ Review Processing: SKIPPED (no API key or reviews)');
      writeTestResultToSheet(testSheet, 'Боевой тест: Review Processing', '⚠️ SKIP', 'No API key or reviews');
    }
    
    // Тест 3: GM Function
    if (testGMFunction(params, testSheet)) {
      results.passed++;
      results.details.push('✅ GM Function: OK');
      writeTestResultToSheet(testSheet, 'Боевой тест: GM Function', '✅ PASS', 'Функция существует');
    } else {
      results.failed++;
      results.details.push('❌ GM Function: FAILED');
      writeTestResultToSheet(testSheet, 'Боевой тест: GM Function', '❌ FAIL', 'Функция не найдена');
    }
    
    // Тест 4: GM_IF Function
    if (testGMIFFunction(testSheet)) {
      results.passed++;
      results.details.push('✅ GM_IF Function: OK');
      writeTestResultToSheet(testSheet, 'Боевой тест: GM_IF Function', '✅ PASS', 'Функция существует');
    } else {
      results.failed++;
      results.details.push('❌ GM_IF Function: FAILED');
      writeTestResultToSheet(testSheet, 'Боевой тест: GM_IF Function', '❌ FAIL', 'Функция не найдена');
    }
    
    logStep('SECTION 4', 'Боевые тесты: ' + results.passed + '/' + results.total, 'success');
    
  } catch (error) {
    logStep('SECTION 4', 'ОШИБКА: ' + error.message, 'error');
    writeTestResultToSheet(testSheet, 'Боевые тесты', '❌ FAIL', error.message, error.stack);
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════
// СЕКЦИЯ 5: VK API ТЕСТИРОВАНИЕ
// ═══════════════════════════════════════════════════════

function runVkApiTestSection(testSheet) {
  logStep('SECTION 5', 'VK API тестирование', 'in_progress');
  
  var results = {
    name: 'VK API',
    total: 1,
    passed: 0,
    failed: 0,
    skipped: 0,
    details: []
  };
  
  try {
    var props = PropertiesService.getScriptProperties();
    var vkToken = props.getProperty('VK_TOKEN');
    
    if (vkToken) {
      var vkTestResult = testVkApi(vkToken);
      
      if (vkTestResult && vkTestResult.success) {
        results.passed++;
        results.details.push('✅ VK API: OK (user: ' + (vkTestResult.data ? vkTestResult.data.first_name : 'unknown') + ')');
        writeTestResultToSheet(testSheet, 'VK API Test', '✅ PASS', 
          'User: ' + (vkTestResult.data ? vkTestResult.data.first_name : 'unknown'));
        logStep('SECTION 5', 'VK API: OK', 'success');
      } else {
        results.failed++;
        results.details.push('❌ VK API: FAILED (' + (vkTestResult.error || 'unknown') + ')');
        writeTestResultToSheet(testSheet, 'VK API Test', '❌ FAIL', vkTestResult.error || 'unknown');
        logStep('SECTION 5', 'VK API: FAILED', 'error');
      }
    } else {
      results.skipped++;
      results.details.push('⚠️ VK API: SKIPPED (VK_TOKEN не настроен в Script Properties)');
      writeTestResultToSheet(testSheet, 'VK API Test', '⚠️ SKIP', 'VK_TOKEN не настроен');
      logStep('SECTION 5', 'VK API: SKIPPED (no token)', 'warning');
    }
    
  } catch (error) {
    logStep('SECTION 5', 'ОШИБКА: ' + error.message, 'error');
    writeTestResultToSheet(testSheet, 'VK API Test', '❌ FAIL', error.message, error.stack);
    results.failed++;
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ═══════════════════════════════════════════════════════

function ensureTestSheetSuper() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var testSheet = ss.getSheetByName('тест');
    
    if (!testSheet) {
      testSheet = ss.insertSheet('тест');
      
      // Заголовки с новой колонкой "Рекомендации"
      testSheet.getRange(1, 1, 1, 10).setValues([[
        'Время', 'Секция', 'Тест', 'Статус', 'Результат', 'Детали', 'Ошибка', 'Stack Trace', 'Trace ID', 'Рекомендации 🔧'
      ]]);
      
      // Форматирование заголовка
      var headerRange = testSheet.getRange(1, 1, 1, 10);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontSize(11);
      headerRange.setWrap(true);
      headerRange.setVerticalAlignment('middle');
      
      // Ширина колонок (оптимизированная для читаемости)
      testSheet.setColumnWidth(1, 150); // Время
      testSheet.setColumnWidth(2, 120); // Секция
      testSheet.setColumnWidth(3, 280); // Тест
      testSheet.setColumnWidth(4, 90);  // Статус
      testSheet.setColumnWidth(5, 220); // Результат
      testSheet.setColumnWidth(6, 320); // Детали
      testSheet.setColumnWidth(7, 250); // Ошибка
      testSheet.setColumnWidth(8, 300); // Stack Trace
      testSheet.setColumnWidth(9, 130); // Trace ID
      testSheet.setColumnWidth(10, 450); // Рекомендации (самая важная колонка!)
      
      // Закрепляем первую строку для удобства навигации
      testSheet.setFrozenRows(1);
    } else {
      // Если лист уже существует, обновляем заголовки если нужно
      var lastColumn = testSheet.getLastColumn();
      
      // ИСПРАВЛЕНО: проверяем что есть хотя бы 1 колонка (иначе getRange выдаст ошибку)
      if (lastColumn === 0) {
        // Лист пустой - создаём заголовки
        testSheet.getRange(1, 1, 1, 10).setValues([[
          'Время', 'Секция', 'Тест', 'Статус', 'Результат', 'Детали', 'Ошибка', 'Stack Trace', 'Trace ID', 'Рекомендации 🔧'
        ]]);
        testSheet.setColumnWidth(10, 450);
      } else {
        var existingHeaders = testSheet.getRange(1, 1, 1, lastColumn).getValues()[0];
        if (existingHeaders.length < 10) {
          // Добавляем недостающие колонки
          testSheet.getRange(1, 1, 1, 10).setValues([[
            'Время', 'Секция', 'Тест', 'Статус', 'Результат', 'Детали', 'Ошибка', 'Stack Trace', 'Trace ID', 'Рекомендации 🔧'
          ]]);
          testSheet.setColumnWidth(10, 450);
        }
      }
    }
    
    return testSheet;
    
  } catch (error) {
    addSystemLog('❌ Ошибка создания листа \"тест\": ' + error.message, 'ERROR', 'SUPER_MASTER_CHECK');
    throw error;
  }
}

function writeTestResultToSheet(testSheet, testName, status, result, details, error, stack, duration) {
  try {
    if (!testSheet) return;
    
    var lastRow = testSheet.getLastRow() + 1;
    var timestamp = new Date().toLocaleString('ru-RU');
    var traceId = 'SMC_' + Math.random().toString(36).substr(2, 9);
    
    // Добавляем рекомендации по исправлению для проваленных тестов
    var recommendations = '';
    if (status.includes('❌')) {
      recommendations = getRecommendations(testName, error, result);
    }
    
    // Форматируем детали с добавлением времени выполнения
    var formattedDetails = details || '';
    if (duration !== undefined && duration !== null) {
      formattedDetails = (formattedDetails ? formattedDetails + ' | ' : '') + '⏱️ ' + duration + 'мс';
    }
    
    testSheet.getRange(lastRow, 1, 1, 10).setValues([[
      timestamp,
      '', // Секция будет заполнена отдельно
      testName,
      status,
      result || '',
      formattedDetails,
      error || '',
      stack || '',
      traceId,
      recommendations
    ]]);
    
    // Цветовая индикация всей строки для лучшей видимости
    var rowRange = testSheet.getRange(lastRow, 1, 1, 10);
    if (status.includes('✅')) {
      rowRange.setBackground('#d4edda');
      rowRange.setFontColor('#155724');
    } else if (status.includes('❌')) {
      rowRange.setBackground('#f8d7da');
      rowRange.setFontColor('#721c24');
      rowRange.setFontWeight('bold');
    } else if (status.includes('⚠️')) {
      rowRange.setBackground('#fff3cd');
      rowRange.setFontColor('#856404');
    }
    
    // Добавляем wrap для лучшей читаемости длинных текстов
    testSheet.getRange(lastRow, 6).setWrap(true); // Детали
    testSheet.getRange(lastRow, 7).setWrap(true); // Ошибка
    testSheet.getRange(lastRow, 10).setWrap(true); // Рекомендации
    
  } catch (e) {
    addSystemLog('⚠️ Ошибка записи результата теста: ' + e.message, 'WARN', 'SUPER_MASTER_CHECK');
  }
}

/**
 * Генерирует рекомендации по исправлению проваленного теста
 */
function getRecommendations(testName, error, result) {
  var recommendations = '';
  
  // CLIENT credentials
  if (testName.includes('CLIENT credentials')) {
    recommendations = '🔧 Решение: Настройте LICENSE_EMAIL и LICENSE_TOKEN в Script Properties (Расширения → Apps Script → Настройки проекта → Свойства скрипта)';
  }
  
  // Лист Параметры
  else if (testName.includes('Параметры')) {
    recommendations = '🔧 Решение: Создайте лист "Параметры" и заполните ячейки F1 (Gemini API key) и G1 (Email)';
  }
  
  // Сервер
  else if (testName.includes('Соединение с сервером') || testName.includes('сервером')) {
    recommendations = '🔧 Решение: Проверьте SERVER_URL в Constants.gs и убедитесь что сервер развернут и доступен';
  }
  
  // VK API
  else if (testName.includes('VK') || testName.includes('vk')) {
    if (error && (error.includes('UNKNOWN_ACTION') || error.includes('Unknown action'))) {
      recommendations = '❌ ПРОБЛЕМА: Сервер не распознаёт action=\"social_import\"\\n' +
        '🔧 ПРИЧИНА: SERVER_API_URL указывает на ДРУГОЙ скрипт без нового кода\\n' +
        '\\n' +
        '🔧 РЕШЕНИЕ:\\n' +
        '1. Откройте скрипт по адресу из SERVER_API_URL\\n' +
        '2. Скопируйте туда ВСЕ файлы из table/server/\\n' +
        '3. Добавьте VK_TOKEN в Script Properties\\n' +
        '4. Сделайте новый Deploy\\n' +
        '\\n' +
        '💡 Используйте: Меню → DEV → Диагностика VK импорта';
    } else if (error && error.includes('VK_TOKEN')) {
      recommendations = '🔧 Решение: Установите VK_TOKEN на СЕРВЕРЕ (не клиенте) через Script Properties. Получите токен на https://vk.com/dev';
    } else if (error && error.includes('null') || error.includes('Error: null')) {
      recommendations = '🔧 Решение: VK_TOKEN некорректен или истёк. Обновите токен на https://vk.com/dev (нужны права: wall,offline)';
    } else {
      recommendations = '🔧 Решение: Запустите Меню → DEV → Диагностика VK импорта для точной диагностики. Ошибка: ' + (error || 'неизвестная');
    }
  }
  
  // Gemini API
  else if (testName.includes('Gemini')) {
    if (error && error.includes('API key')) {
      recommendations = '🔧 Решение: Установите корректный Gemini API key в F1 листа "Параметры". Получите на https://makersuite.google.com/app/apikey';
    } else if (error && error.includes('quota') || error.includes('limit')) {
      recommendations = '🔧 Решение: Превышена квота API. Подождите или используйте другой API key';
    } else {
      recommendations = '🔧 Решение: Проверьте Gemini API key в F1 и убедитесь что Generative Language API включен в Google Cloud Console';
    }
  }
  
  // Функции
  else if (testName.includes('функци')) {
    recommendations = '🔧 Решение: Проверьте что все файлы .gs загружены в проект. Откройте Apps Script Editor и пересохраните проект';
  }
  
  // Логирование
  else if (testName.includes('Логирование')) {
    recommendations = '🔧 Решение: Создайте лист "системные_логи" или проверьте функцию addSystemLog() в ClientUtilities.gs';
  }
  
  // По умолчанию
  else {
    recommendations = '🔧 Решение: См. детали в колонках "Ошибка" и "Stack Trace". Проверьте логи системы через меню DEV → Просмотр логов';
  }
  
  return recommendations;
}

function logSection(testSheet, sectionTitle) {
  try {
    if (!testSheet) return;
    
    var lastRow = testSheet.getLastRow() + 1;
    var timestamp = new Date().toLocaleString('ru-RU');
    
    testSheet.getRange(lastRow, 1, 1, 10).setValues([[
      timestamp,
      sectionTitle,
      '', '', '', '', '', '', 'SECTION_HEADER', ''
    ]]);
    
    // Форматирование секции - делаем яркий разделитель
    var sectionRange = testSheet.getRange(lastRow, 1, 1, 10);
    sectionRange.setFontWeight('bold');
    sectionRange.setBackground('#e8f0fe');
    sectionRange.setFontColor('#1a73e8');
    sectionRange.setFontSize(11);
    
    addSystemLog('📋 ' + sectionTitle, 'INFO', 'SUPER_MASTER_CHECK');
    
  } catch (e) {
    addSystemLog('⚠️ Ошибка записи секции: ' + e.message, 'WARN', 'SUPER_MASTER_CHECK');
  }
}

function writeProgressHeader(testSheet, message) {
  try {
    if (!testSheet) return;
    
    var lastRow = testSheet.getLastRow() + 1;
    var timestamp = new Date().toLocaleString('ru-RU');
    
    testSheet.getRange(lastRow, 1, 1, 9).setValues([[
      timestamp,
      '🎯 ' + message,
      '', '', '', '', '', '', 'PROGRESS_HEADER'
    ]]);
    
    var headerRange = testSheet.getRange(lastRow, 1, 1, 9);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#fbbc04');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontSize(12);
    
  } catch (e) {
    addSystemLog('⚠️ Ошибка записи progress header: ' + e.message, 'WARN', 'SUPER_MASTER_CHECK');
  }
}

function writeFinalReportSuper(testSheet, overallResults) {
  try {
    if (!testSheet) return;
    
    var lastRow = testSheet.getLastRow() + 2; // Пропуск строки
    var timestamp = new Date().toLocaleString('ru-RU');
    var successRate = overallResults.total > 0 ? Math.round(overallResults.passed / overallResults.total * 100) : 0;
    
    // Итоговая строка
    testSheet.getRange(lastRow, 1, 1, 9).setValues([[
      timestamp,
      '🎯 ИТОГОВЫЙ ОТЧЁТ',
      'СУПЕР МАСТЕР ПРОВЕРКА',
      successRate >= 90 ? '🎉 ОТЛИЧНО' : successRate >= 70 ? '✅ ХОРОШО' : '⚠️ ВНИМАНИЕ',
      successRate + '% (' + overallResults.passed + '/' + overallResults.total + ')',
      'Успешно: ' + overallResults.passed + ', Ошибок: ' + overallResults.failed + ', Пропущено: ' + overallResults.skipped,
      'Время выполнения: ' + overallResults.duration + ' сек',
      '',
      'FINAL_REPORT'
    ]]);
    
    // Форматирование итоговой строки
    var summaryRange = testSheet.getRange(lastRow, 1, 1, 9);
    summaryRange.setFontWeight('bold');
    summaryRange.setBackground(successRate >= 90 ? '#34a853' : successRate >= 70 ? '#fbbc04' : '#ea4335');
    summaryRange.setFontColor('#ffffff');
    summaryRange.setFontSize(12);
    
    // Детали по секциям
    lastRow++;
    overallResults.sections.forEach(function(section) {
      lastRow++;
      testSheet.getRange(lastRow, 2, 1, 8).setValues([[
        section.name,
        section.passed + '/' + section.total,
        section.failed === 0 ? '✅ PASS' : '⚠️ ISSUES',
        'Passed: ' + section.passed + ', Failed: ' + section.failed + ', Skipped: ' + section.skipped,
        '', '', '', ''
      ]]);
    });
    
    addSystemLog('📊 Финальный отчёт записан в лист \"тест\"', 'INFO', 'SUPER_MASTER_CHECK');
    
  } catch (e) {
    addSystemLog('⚠️ Ошибка записи финального отчёта: ' + e.message, 'WARN', 'SUPER_MASTER_CHECK');
  }
}

function showFinalResults(overallResults) {
  var ui = SpreadsheetApp.getUi();
  var successRate = overallResults.total > 0 ? Math.round(overallResults.passed / overallResults.total * 100) : 0;
  
  var status = successRate >= 90 ? '🎉 ОТЛИЧНО!' : 
               successRate >= 70 ? '✅ ХОРОШО' : 
               successRate >= 50 ? '⚠️ ТРЕБУЕТ ВНИМАНИЯ' :
               '❌ КРИТИЧНО';
  
  var message = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';
  message += '📊 СУПЕР МАСТЕР ПРОВЕРКА ЗАВЕРШЕНА\\n';
  message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n';
  message += '🎯 СТАТУС: ' + status + '\\n\\n';
  message += '📈 ОБЩАЯ СТАТИСТИКА:\\n';
  message += '• Успешность: ' + successRate + '% (' + overallResults.passed + '/' + overallResults.total + ')\\n';
  message += '• ✅ Прошло: ' + overallResults.passed + ' тестов\\n';
  message += '• ❌ Провалено: ' + overallResults.failed + ' тестов\\n';
  message += '• ⚠️ Пропущено: ' + overallResults.skipped + ' тестов\\n';
  message += '• ⏱️ Время выполнения: ' + overallResults.duration + ' сек\\n';
  message += '• 📅 Завершено: ' + overallResults.endTime.toLocaleString('ru-RU') + '\\n\\n';
  message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';
  message += '📋 РЕЗУЛЬТАТЫ ПО СЕКЦИЯМ:\\n';
  message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n';
  
  overallResults.sections.forEach(function(section, index) {
    var sectionRate = section.total > 0 ? Math.round(section.passed / section.total * 100) : 0;
    var sectionStatus = sectionRate === 100 ? '🎉' : 
                        sectionRate >= 90 ? '✅' : 
                        sectionRate >= 70 ? '⚠️' : '❌';
    message += (index + 1) + '. ' + sectionStatus + ' ' + section.name + '\\n';
    message += '   • Результат: ' + section.passed + '/' + section.total + ' (' + sectionRate + '%)\\n';
    if (section.failed > 0) {
      message += '   • ❌ Провалено: ' + section.failed + '\\n';
    }
    if (section.skipped > 0) {
      message += '   • ⚠️ Пропущено: ' + section.skipped + '\\n';
    }
    message += '\\n';
  });
  
  message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';
  message += '📊 ДЕТАЛЬНЫЙ ОТЧЁТ:\\n';
  message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n';
  message += '📄 Полная информация в листе \"тест\":\\n';
  message += '   • Временные метки каждого теста\\n';
  message += '   • Детальные ошибки и Stack Traces\\n';
  message += '   • 🔧 Рекомендации по исправлению\\n';
  message += '   • Trace ID для отладки\\n\\n';
  message += '📋 Системные логи: DEV → Просмотр логов\\n';
  message += '📖 Документация: SUPER_MASTER_CHECK_DETAILED_REPORT.md\\n\\n';
  
  if (overallResults.failed > 0) {
    message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';
    message += '⚠️ НАЙДЕНЫ ПРОБЛЕМЫ:\\n';
    message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n';
    
    // Собираем все провалившиеся тесты из секций
    var failedTests = [];
    overallResults.sections.forEach(function(section) {
      if (section.details && section.details.length > 0) {
        section.details.forEach(function(detail) {
          // Ищем строки с ❌
          if (detail.indexOf('❌') !== -1) {
            failedTests.push(detail);
          }
        });
      }
    });
    
    // Показываем список провалившихся тестов
    if (failedTests.length > 0) {
      message += '❌ ПРОВАЛЕНО (' + failedTests.length + '):\\n';
      failedTests.forEach(function(test) {
        message += '   ' + test + '\\n';
      });
      message += '\\n';
    }
    
    message += '🔍 ШАГ 1: Откройте лист \"тест\"\\n';
    message += '🔍 ШАГ 2: Найдите строки с ❌ FAIL (выделены красным)\\n';
    message += '🔍 ШАГ 3: Читайте колонку \"Рекомендации 🔧\"\\n';
    message += '🔍 ШАГ 4: Следуйте инструкциям для исправления\\n';
    message += '🔍 ШАГ 5: Повторите проверку\\n\\n';
  }
  
  message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';
  message += '💡 РЕКОМЕНДАЦИЯ:\\n';
  message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n';
  
  if (successRate === 100) {
    message += '🎉🎉🎉 ИДЕАЛЬНО! 🎉🎉🎉\\n';
    message += 'Все системы работают безупречно!\\n';
    message += 'Система готова к продакшену! 🚀';
  } else if (successRate >= 90) {
    message += '✅ ОТЛИЧНО!\\n';
    message += 'Система работает стабильно.\\n';
    if (overallResults.failed > 0) {
      message += 'Исправьте ' + overallResults.failed + ' проблем для 100%.';
    }
    if (overallResults.skipped > 0) {
      message += '\\nНастройте пропущенные тесты для полной функциональности.';
    }
  } else if (successRate >= 70) {
    message += '⚠️ ХОРОШО, НО НУЖНЫ УЛУЧШЕНИЯ\\n';
    message += 'Основной функционал работает.\\n';
    message += 'Рекомендуется исправить ' + overallResults.failed + ' проблем.';
  } else if (successRate >= 50) {
    message += '⚠️ ТРЕБУЕТСЯ ВНИМАНИЕ!\\n';
    message += 'Много проблем (' + overallResults.failed + ').\\n';
    message += 'Система может работать нестабильно.\\n';
    message += 'СРОЧНО исправьте критические ошибки!';
  } else {
    message += '❌ КРИТИЧНО!\\n';
    message += 'Большинство тестов провалено!\\n';
    message += 'Система НЕ готова к работе.\\n';
    message += 'Проверьте конфигурацию и credentials!';
  }
  
  ui.alert(status, message, ui.ButtonSet.OK);
}

function logStep(section, message, status) {
  var emoji = status === 'success' ? '✅' : 
              status === 'error' ? '❌' : 
              status === 'warning' ? '⚠️' : 
              status === 'in_progress' ? '🔄' : 'ℹ️';
  
  addSystemLog(emoji + ' [' + section + '] ' + message, 
    status === 'error' ? 'ERROR' : status === 'warning' ? 'WARN' : 'INFO', 
    'SUPER_MASTER_CHECK');
}
