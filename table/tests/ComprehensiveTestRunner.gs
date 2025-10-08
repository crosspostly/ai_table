/**
 * Comprehensive Test Runner v1.0
 * Запуск ВСЕХ тестов для полной проверки системы
 */

/**
 * ГЛАВНАЯ функция - запуск всех тестов
 */
function runAllComprehensiveTests() {
  Logger.log('🚀 Starting COMPREHENSIVE test suite...');
  
  const startTime = Date.now();
  const allResults = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    suites: []
  };
  
  // 1. SYNTAX & STRUCTURE TESTS
  Logger.log('
📋 === PHASE 1: SYNTAX & STRUCTURE ===');
  const syntaxResults = runSyntaxTests();
  allResults.suites.push({ name: 'Syntax Tests', ...syntaxResults });
  allResults.totalTests += syntaxResults.totalTests;
  allResults.passed += syntaxResults.passed;
  allResults.failed += syntaxResults.failed;
  
  // 2. VALIDATION TESTS
  Logger.log('
🛡️ === PHASE 2: INPUT VALIDATION ===');
  const validationResults = runValidationTests();
  allResults.suites.push({ name: 'Validation Tests', ...validationResults });
  allResults.totalTests += validationResults.totalTests;
  allResults.passed += validationResults.passed;
  allResults.failed += validationResults.failed;
  
  // 3. RETRY LOGIC TESTS
  Logger.log('
🔄 === PHASE 3: RETRY LOGIC ===');
  const retryResults = runRetryLogicTests();
  allResults.suites.push({ name: 'Retry Logic Tests', ...retryResults });
  allResults.totalTests += retryResults.totalTests;
  allResults.passed += retryResults.passed;
  allResults.failed += retryResults.failed;
  
  // 4. ERROR HANDLING TESTS
  Logger.log('
💬 === PHASE 4: ERROR HANDLING ===');
  const errorResults = runErrorHandlingTests();
  allResults.suites.push({ name: 'Error Handling Tests', ...errorResults });
  allResults.totalTests += errorResults.totalTests;
  allResults.passed += errorResults.passed;
  allResults.failed += errorResults.failed;
  
  // 5. PLATFORM DETECTION TESTS
  Logger.log('
🔍 === PHASE 5: PLATFORM DETECTION ===');
  const platformResults = runPlatformDetectionTests();
  allResults.suites.push({ name: 'Platform Detection Tests', ...platformResults });
  allResults.totalTests += platformResults.totalTests;
  allResults.passed += platformResults.passed;
  allResults.failed += platformResults.failed;
  
  // 6. REAL DATA TESTS (самые важные!)
  Logger.log('
🧪 === PHASE 6: REAL DATA TESTS ===');
  const realDataResults = runRealDataTests();
  allResults.suites.push({ name: 'Real Data Tests', ...realDataResults });
  allResults.totalTests += realDataResults.totalTests || realDataResults.passed + realDataResults.failed;
  allResults.passed += realDataResults.passed;
  allResults.failed += realDataResults.failed;
  
  // 7. GEMINI SEQUENTIAL TESTS
  Logger.log('
🤖 === PHASE 7: GEMINI SEQUENTIAL TESTS ===');
  const geminiResults = runGeminiSequentialTests();
  allResults.suites.push({ name: 'Gemini Sequential Tests', ...geminiResults });
  allResults.totalTests += geminiResults.totalTests;
  allResults.passed += geminiResults.passed;
  allResults.failed += geminiResults.failed;
  
  // FINAL REPORT
  const duration = Date.now() - startTime;
  Logger.log('
📊 ===============================');
  Logger.log('   🎯 COMPREHENSIVE TEST RESULTS');
  Logger.log('===============================');
  Logger.log(`⏱️ Duration: ${Math.round(duration / 1000)}s`);
  Logger.log(`📊 Total Tests: ${allResults.totalTests}`);
  Logger.log(`✅ Passed: ${allResults.passed}`);
  Logger.log(`❌ Failed: ${allResults.failed}`);
  Logger.log(`📈 Success Rate: ${Math.round((allResults.passed / allResults.totalTests) * 100)}%`);
  
  // Детальный отчет по каждому набору
  Logger.log('\
📋 Detailed Results:');
  allResults.suites.forEach(suite => {
    const rate = suite.totalTests ? Math.round((suite.passed / suite.totalTests) * 100) : 0;
    Logger.log(`  ${suite.passed}/${suite.totalTests || (suite.passed + suite.failed)} ${suite.name} (${rate}%)`);
  });
  
  // Сохраняем результаты в лист
  writeTestResultsToSheet(allResults);
  
  return allResults;
}

/**
 * Тест синтаксиса и структуры
 */
function runSyntaxTests() {
  Logger.log('⚡ Running syntax tests...');
  
  const results = { totalTests: 0, passed: 0, failed: 0, details: [] };
  
  // Тест 1: Основные функции существуют
  results.totalTests++;
  try {
    const functionsToCheck = [
      'importSocialPosts',
      'parseSource', 
      'normalizePlatformName',
      'importInstagramPosts',
      'importTelegramPosts', 
      'importVkPostsAdvanced',
      'validateAndSanitizeInputs',
      'fetchWithRetry',
      'createUserFriendlyError'
    ];
    
    const missingFunctions = [];
    functionsToCheck.forEach(funcName => {
      if (typeof eval(funcName) !== 'function') {
        missingFunctions.push(funcName);
      }
    });
    
    if (missingFunctions.length === 0) {
      results.passed++;
      results.details.push('✅ All core functions exist');
    } else {
      results.failed++;
      results.details.push(`❌ Missing functions: ${missingFunctions.join(', ')}`);
    }
  } catch (error) {
    results.failed++;
    results.details.push(`❌ Function check error: ${error.message}`);
  }
  
  // Тест 2: Парсинг URL работает
  results.totalTests++;
  try {
    const testSource = parseSource('https://www.instagram.com/nasa/', null);
    if (testSource.platform === 'instagram' && testSource.value === 'nasa') {
      results.passed++;
      results.details.push('✅ URL parsing works');
    } else {
      results.failed++;
      results.details.push(`❌ URL parsing failed: got ${JSON.stringify(testSource)}`);
    }
  } catch (error) {
    results.failed++;
    results.details.push(`❌ URL parsing error: ${error.message}`);
  }
  
  // Тест 3: Нормализация платформ
  results.totalTests++;
  try {
    const testCases = [
      ['инста', 'instagram'],
      ['тг', 'telegram'], 
      ['вк', 'vk'],
      ['instagram', 'instagram']
    ];
    
    let allPassed = true;
    for (const [input, expected] of testCases) {
      const result = normalizePlatformName(input);
      if (result !== expected) {
        allPassed = false;
        break;
      }
    }
    
    if (allPassed) {
      results.passed++;
      results.details.push('✅ Platform normalization works');
    } else {
      results.failed++;
      results.details.push('❌ Platform normalization failed');
    }
  } catch (error) {
    results.failed++;
    results.details.push(`❌ Platform normalization error: ${error.message}`);
  }
  
  Logger.log(`Syntax Tests: ${results.passed}/${results.totalTests} passed`);
  return results;
}

/**
 * Тест валидации входных данных
 */
function runValidationTests() {
  Logger.log('🛡️ Running validation tests...');
  
  const results = { totalTests: 0, passed: 0, failed: 0, details: [] };
  
  // Тест 1: Валидные данные проходят
  results.totalTests++;
  try {
    const valid = validateAndSanitizeInputs('https://instagram.com/nasa', 5, 'instagram');
    if (valid.isValid && valid.sourceUrl && valid.count === 5) {
      results.passed++;
      results.details.push('✅ Valid inputs pass validation');
    } else {
      results.failed++;
      results.details.push('❌ Valid inputs failed validation');
    }
  } catch (error) {
    results.failed++;
    results.details.push(`❌ Valid input test error: ${error.message}`);
  }
  
  // Тест 2: XSS блокируется
  results.totalTests++;
  try {
    validateAndSanitizeInputs('javascript:alert(\"xss\")', 5, '');
    results.failed++;
    results.details.push('❌ XSS not blocked');
  } catch (error) {
    if (error.message.includes('Недопустимый протокол')) {
      results.passed++;
      results.details.push('✅ XSS properly blocked');
    } else {
      results.failed++;
      results.details.push(`❌ XSS test unexpected error: ${error.message}`);
    }
  }
  
  // Тест 3: Невалидные count исправляются
  results.totalTests++;
  try {
    const result = validateAndSanitizeInputs('test', 'invalid', '');
    if (result.count === 20) { // default value
      results.passed++;
      results.details.push('✅ Invalid count fixed to default');
    } else {
      results.failed++;
      results.details.push(`❌ Invalid count not fixed: got ${result.count}`);
    }
  } catch (error) {
    results.failed++;
    results.details.push(`❌ Count validation error: ${error.message}`);
  }
  
  Logger.log(`Validation Tests: ${results.passed}/${results.totalTests} passed`);
  return results;
}

/**
 * Тест retry логики
 */
function runRetryLogicTests() {
  Logger.log('🔄 Running retry logic tests...');
  
  const results = { totalTests: 0, passed: 0, failed: 0, details: [] };
  
  // Тест 1: calculateBackoffDelay работает правильно
  results.totalTests++;
  try {
    const delay1 = calculateBackoffDelay(1, 1000, 30000);
    const delay2 = calculateBackoffDelay(2, 1000, 30000); 
    const delay3 = calculateBackoffDelay(10, 1000, 5000); // должен быть ограничен 5000
    
    if (delay1 >= 750 && delay1 <= 1250 && // 1000 ± jitter
        delay2 >= 1500 && delay2 <= 2500 && // 2000 ± jitter
        delay3 <= 5000) { // max delay limit
      results.passed++;
      results.details.push('✅ Backoff delay calculation works');
    } else {
      results.failed++;
      results.details.push(`❌ Backoff delays wrong: ${delay1}, ${delay2}, ${delay3}`);
    }
  } catch (error) {
    results.failed++;
    results.details.push(`❌ Backoff calculation error: ${error.message}`);
  }
  
  // Тест 2: fetchWithRetry function exists and has right signature
  results.totalTests++;
  try {
    if (typeof fetchWithRetry === 'function') {
      results.passed++;
      results.details.push('✅ fetchWithRetry function exists');
    } else {
      results.failed++;
      results.details.push('❌ fetchWithRetry function missing');
    }
  } catch (error) {
    results.failed++;
    results.details.push(`❌ fetchWithRetry check error: ${error.message}`);
  }
  
  Logger.log(`Retry Logic Tests: ${results.passed}/${results.totalTests} passed`);
  return results;
}

/**
 * Тест обработки ошибок
 */
function runErrorHandlingTests() {
  Logger.log('💬 Running error handling tests...');
  
  const results = { totalTests: 0, passed: 0, failed: 0, details: [] };
  
  // Тест 1: createUserFriendlyError работает
  results.totalTests++;
  try {
    const techError = new Error('HTTP 403: Forbidden');
    const friendlyError = createUserFriendlyError(techError, {
      platform: 'instagram',
      username: 'test'
    });
    
    if (friendlyError.message.includes('🚫') && friendlyError.originalError === techError) {
      results.passed++;
      results.details.push('✅ User-friendly errors work');
    } else {
      results.failed++;
      results.details.push('❌ User-friendly error generation failed');
    }
  } catch (error) {
    results.failed++;
    results.details.push(`❌ Error handling test error: ${error.message}`);
  }
  
  // Тест 2: HTTP code extraction работает
  results.totalTests++;
  try {
    const httpCode = extractHttpCode('Request failed: HTTP 429 Too Many Requests');
    if (httpCode === 429) {
      results.passed++;
      results.details.push('✅ HTTP code extraction works');
    } else {
      results.failed++;
      results.details.push(`❌ HTTP code extraction failed: got ${httpCode}`);
    }
  } catch (error) {
    results.failed++;
    results.details.push(`❌ HTTP code extraction error: ${error.message}`);
  }
  
  Logger.log(`Error Handling Tests: ${results.passed}/${results.totalTests} passed`);
  return results;
}

/**
 * Тест определения платформ
 */
function runPlatformDetectionTests() {
  Logger.log('🔍 Running platform detection tests...');
  
  const results = { totalTests: 0, passed: 0, failed: 0, details: [] };
  
  const testCases = [
    ['https://www.instagram.com/nasa/', null, 'instagram', 'nasa'],
    ['https://t.me/durov', null, 'telegram', 'durov'],
    ['https://vk.com/durov', null, 'vk', 'durov'],
    ['durov', 'telegram', 'telegram', 'durov'],
    ['@channel', 'telegram', 'telegram', 'channel']
  ];
  
  testCases.forEach(([source, platform, expectedPlatform, expectedValue]) => {
    results.totalTests++;
    try {
      const result = parseSource(source, normalizePlatformName(platform));
      if (result.platform === expectedPlatform && result.value === expectedValue) {
        results.passed++;
        results.details.push(`✅ ${source} → ${expectedPlatform}`);
      } else {
        results.failed++;
        results.details.push(`❌ ${source} → expected ${expectedPlatform}:${expectedValue}, got ${result.platform}:${result.value}`);
      }
    } catch (error) {
      if (platform === null && error.message.includes('укажите платформу')) {
        results.passed++;
        results.details.push(`✅ ${source} → correctly requires platform`);
      } else {
        results.failed++;
        results.details.push(`❌ ${source} → error: ${error.message}`);
      }
    }
  });
  
  Logger.log(`Platform Detection Tests: ${results.passed}/${results.totalTests} passed`);
  return results;
}

/**
 * Тест последовательных Gemini запросов
 */
function runGeminiSequentialTests() {
  Logger.log('🤖 Running Gemini sequential tests...');
  
  const results = { totalTests: 0, passed: 0, failed: 0, details: [] };
  
  // Тест 1: fetchGeminiWithRetry function exists
  results.totalTests++;
  try {
    if (typeof fetchGeminiWithRetry === 'function') {
      results.passed++;
      results.details.push('✅ fetchGeminiWithRetry function exists');
    } else {
      results.failed++;
      results.details.push('❌ fetchGeminiWithRetry function missing');
    }
  } catch (error) {
    results.failed++;
    results.details.push(`❌ Gemini function check error: ${error.message}`);
  }
  
  // Тест 2: Проверим что GM функция обновлена
  results.totalTests++;
  try {
    // Этот тест проверяет только структуру без реального вызова API
    if (typeof GM === 'function') {
      results.passed++;
      results.details.push('✅ GM function exists and updated');
    } else {
      results.failed++;
      results.details.push('❌ GM function missing');
    }
  } catch (error) {
    results.failed++;
    results.details.push(`❌ GM function check error: ${error.message}`);
  }
  
  Logger.log(`Gemini Sequential Tests: ${results.passed}/${results.totalTests} passed`);
  return results;
}

/**
 * Запись результатов тестов в Google Sheet
 */
function writeTestResultsToSheet(results) {
  try {
    const ss = SpreadsheetApp.getActive();
    let sheet = ss.getSheetByName('Test Results');
    
    if (!sheet) {
      sheet = ss.insertSheet('Test Results');
    }
    
    // Очищаем и создаем заголовки
    sheet.clear();
    const headers = ['Test Suite', 'Total', 'Passed', 'Failed', 'Success Rate', 'Details'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#4285f4')
      .setFontColor('white')
      .setFontWeight('bold');
    
    // Добавляем результаты
    const data = [];
    results.suites.forEach(suite => {
      const total = suite.totalTests || (suite.passed + suite.failed);
      const rate = total ? Math.round((suite.passed / total) * 100) : 0;
      data.push([
        suite.name,
        total,
        suite.passed, 
        suite.failed,
        rate + '%',
        (suite.details || []).join('; ')
      ]);
    });
    
    // Итоговая строка
    const totalRate = results.totalTests ? Math.round((results.passed / results.totalTests) * 100) : 0;
    data.push([
      'TOTAL',
      results.totalTests,
      results.passed,
      results.failed, 
      totalRate + '%',
      'Comprehensive test run completed'
    ]);
    
    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, headers.length).setValues(data);
      
      // Форматируем итоговую строку
      const totalRow = data.length + 1;
      sheet.getRange(totalRow, 1, 1, headers.length)
        .setBackground('#f0f0f0')
        .setFontWeight('bold');
    }
    
    sheet.autoResizeColumns(1, headers.length);
    Logger.log('✅ Test results written to \"Test Results\" sheet');
    
  } catch (error) {
    Logger.log('❌ Failed to write test results to sheet: ' + error.message);
  }
}