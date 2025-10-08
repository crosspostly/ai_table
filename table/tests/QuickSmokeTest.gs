/**
 * Quick Smoke Test v1.0
 * Быстрая проверка самых критичных функций перед релизом
 */

/**
 * ГЛАВНАЯ ФУНКЦИЯ - быстрый smoke test
 */
function runQuickSmokeTest() {
  Logger.log('⚡ Starting Quick Smoke Test...');
  
  const startTime = Date.now();
  const results = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    criticalFailures: [],
    details: []
  };
  
  // === CRITICAL FUNCTION CHECKS ===
  Logger.log('
🔍 Testing critical function availability...');
  
  const criticalFunctions = [
    'importSocialPosts',
    'validateAndSanitizeInputs', 
    'fetchWithRetry',
    'createUserFriendlyError',
    'parseSource',
    'normalizePlatformName'
  ];
  
  criticalFunctions.forEach(funcName => {
    results.totalTests++;
    try {
      if (typeof eval(funcName) === 'function') {
        results.passed++;
        results.details.push(`✅ ${funcName} available`);
        Logger.log(`✅ ${funcName}`);
      } else {
        results.failed++;
        results.criticalFailures.push(`${funcName} missing`);
        results.details.push(`❌ ${funcName} MISSING`);
        Logger.log(`❌ ${funcName} MISSING`);
      }
    } catch (error) {
      results.failed++;
      results.criticalFailures.push(`${funcName}: ${error.message}`);
      results.details.push(`❌ ${funcName} ERROR`);
      Logger.log(`❌ ${funcName} ERROR: ${error.message}`);
    }
  });
  
  // === VALIDATION SMOKE TEST ===
  Logger.log('
🛡️ Testing input validation...');
  
  results.totalTests++;
  try {
    // Тест валидного input
    const validResult = validateAndSanitizeInputs('https://instagram.com/nasa', 5, 'instagram');
    if (validResult.isValid) {
      results.passed++;
      results.details.push('✅ Valid input passes');
      Logger.log('✅ Valid input validation works');
    } else {
      results.failed++;
      results.criticalFailures.push('Valid input rejected');
      results.details.push('❌ Valid input rejected');
      Logger.log('❌ Valid input validation failed');
    }
  } catch (error) {
    results.failed++;
    results.criticalFailures.push(`Validation error: ${error.message}`);
    results.details.push('❌ Validation system broken');
    Logger.log(`❌ Validation error: ${error.message}`);
  }
  
  results.totalTests++;
  try {
    // Тест XSS блокировки
    validateAndSanitizeInputs('javascript:alert(1)', 5, '');
    results.failed++;
    results.criticalFailures.push('XSS not blocked');
    results.details.push('❌ XSS not blocked');
    Logger.log('❌ XSS not blocked - CRITICAL SECURITY ISSUE');
  } catch (error) {
    if (error.message.includes('Недопустимый протокол') || error.message.includes('Invalid')) {
      results.passed++;
      results.details.push('✅ XSS properly blocked');
      Logger.log('✅ XSS blocked correctly');
    } else {
      results.failed++;
      results.criticalFailures.push('Unexpected XSS error');
      results.details.push('❌ XSS test unexpected result');
      Logger.log(`❌ XSS test error: ${error.message}`);
    }
  }
  
  // === PLATFORM DETECTION SMOKE TEST ===
  Logger.log('
🔍 Testing platform detection...');
  
  const quickPlatformTests = [
    ['https://www.instagram.com/nasa/', 'instagram', 'nasa'],
    ['https://t.me/durov', 'telegram', 'durov'],
    ['https://vk.com/durov', 'vk', 'durov']
  ];
  
  quickPlatformTests.forEach(([url, expectedPlatform, expectedValue]) => {
    results.totalTests++;
    try {
      const result = parseSource(url, null);
      if (result.platform === expectedPlatform && result.value === expectedValue) {
        results.passed++;
        results.details.push(`✅ ${expectedPlatform} URL parsed`);
        Logger.log(`✅ ${url} → ${expectedPlatform}`);
      } else {
        results.failed++;
        results.criticalFailures.push(`${expectedPlatform} parsing failed`);
        results.details.push(`❌ ${expectedPlatform} URL parsing failed`);
        Logger.log(`❌ ${url} → expected ${expectedPlatform}, got ${result.platform}`);
      }
    } catch (error) {
      results.failed++;
      results.criticalFailures.push(`Platform detection error: ${error.message}`);
      results.details.push(`❌ Platform detection error`);
      Logger.log(`❌ Platform detection error for ${url}: ${error.message}`);
    }
  });
  
  // === ERROR HANDLING SMOKE TEST ===
  Logger.log('\
💬 Testing error handling...');
  
  results.totalTests++;
  try {
    const testError = new Error('HTTP 403: Forbidden');
    const friendlyError = createUserFriendlyError(testError, { platform: 'instagram' });
    
    if (friendlyError.message.includes('🚫') || friendlyError.message.includes('заблокирован')) {
      results.passed++;
      results.details.push('✅ User-friendly errors work');
      Logger.log('✅ Error handling creates friendly messages');
    } else {
      results.failed++;
      results.criticalFailures.push('Error handling not user-friendly');
      results.details.push('❌ Error handling not user-friendly');
      Logger.log(`❌ Error message not friendly: ${friendlyError.message}`);
    }
  } catch (error) {
    results.failed++;
    results.criticalFailures.push(`Error handling broken: ${error.message}`);
    results.details.push('❌ Error handling system broken');
    Logger.log(`❌ Error handling test failed: ${error.message}`);
  }
  
  // === RETRY LOGIC SMOKE TEST ===
  Logger.log('\
🔄 Testing retry logic...');
  
  results.totalTests++;
  try {
    const delay = calculateBackoffDelay(2, 1000, 10000);
    if (delay >= 1500 && delay <= 2500) { // 2000 ± jitter
      results.passed++;
      results.details.push('✅ Retry backoff calculation works');
      Logger.log(`✅ Backoff delay: ${delay}ms`);
    } else {
      results.failed++;
      results.criticalFailures.push('Retry backoff calculation wrong');
      results.details.push('❌ Retry backoff wrong');
      Logger.log(`❌ Wrong backoff delay: ${delay}ms`);
    }
  } catch (error) {
    results.failed++;
    results.criticalFailures.push(`Retry logic error: ${error.message}`);
    results.details.push('❌ Retry logic broken');
    Logger.log(`❌ Retry logic error: ${error.message}`);
  }
  
  // === FINAL RESULTS ===
  const duration = Date.now() - startTime;
  const successRate = Math.round((results.passed / results.totalTests) * 100);
  
  Logger.log('\
📊 =============================');
  Logger.log('   ⚡ QUICK SMOKE TEST RESULTS');
  Logger.log('=============================');
  Logger.log(`⏱️ Duration: ${Math.round(duration / 1000)}s`);
  Logger.log(`📊 Tests: ${results.totalTests}`);
  Logger.log(`✅ Passed: ${results.passed}`);
  Logger.log(`❌ Failed: ${results.failed}`);
  Logger.log(`📈 Success Rate: ${successRate}%`);
  
  if (results.criticalFailures.length > 0) {
    Logger.log('\
🚨 CRITICAL FAILURES:');
    results.criticalFailures.forEach(failure => {
      Logger.log(`  💥 ${failure}`);
    });
  }
  
  // VERDICT
  if (results.criticalFailures.length === 0 && successRate >= 90) {
    Logger.log('\
🎯 VERDICT: ✅ READY FOR TESTING');
    Logger.log('   All critical systems operational!');
  } else if (results.criticalFailures.length > 0) {
    Logger.log('\
🚨 VERDICT: ❌ CRITICAL ISSUES FOUND');
    Logger.log('   Fix critical failures before proceeding!');
  } else {
    Logger.log('\
⚠️ VERDICT: 🔄 NEEDS ATTENTION');
    Logger.log('   Some tests failed, review before production!');
  }
  
  // Сохраняем в лист для быстрого доступа
  writeSmokeTestResults(results);
  
  return results;
}

/**
 * Простой тест только URL парсинга (без API вызовов)
 */
function testUrlParsingOnly() {
  Logger.log('🔗 URL Parsing Only Test...');
  
  const testUrls = [
    // Instagram
    ['https://www.instagram.com/nasa/', 'instagram', 'nasa'],
    ['https://instagram.com/natgeo', 'instagram', 'natgeo'],
    
    // Telegram
    ['https://t.me/durov', 'telegram', 'durov'],
    ['https://telegram.me/meduzalive', 'telegram', 'meduzalive'],
    
    // VK
    ['https://vk.com/durov', 'vk', 'durov'],
    ['https://vk.com/club123456', 'vk', '-123456'],
    ['https://vk.com/public789', 'vk', '-789'],
    
    // Edge cases that should require explicit platform
    ['durov', null, 'should_fail'],
    ['@channel', null, 'should_fail'],
    ['-123456', null, 'should_fail']
  ];
  
  let passed = 0, failed = 0;
  
  testUrls.forEach(([url, expectedPlatform, expectedValue]) => {
    try {
      const result = parseSource(url, null);
      
      if (expectedValue === 'should_fail') {
        failed++;
        Logger.log(`❌ ${url} → Should have failed but got: ${result.platform}`);
      } else if (result.platform === expectedPlatform && result.value === expectedValue) {
        passed++;
        Logger.log(`✅ ${url} → ${result.platform}:${result.value}`);
      } else {
        failed++;
        Logger.log(`❌ ${url} → Expected ${expectedPlatform}:${expectedValue}, got ${result.platform}:${result.value}`);
      }
    } catch (error) {
      if (expectedValue === 'should_fail' && error.message.includes('укажите платформу')) {
        passed++;
        Logger.log(`✅ ${url} → Correctly requires platform`);
      } else {
        failed++;
        Logger.log(`❌ ${url} → Error: ${error.message}`);
      }
    }
  });
  
  Logger.log(`\
URL Parsing Results: ${passed}/${passed + failed} passed`);
  return { passed, failed, total: passed + failed };
}

/**
 * Запись результатов smoke test в лист
 */
function writeSmokeTestResults(results) {
  try {
    const ss = SpreadsheetApp.getActive();
    let sheet = ss.getSheetByName('Smoke Test');
    
    if (!sheet) {
      sheet = ss.insertSheet('Smoke Test');
    }
    
    sheet.clear();
    
    // Заголовок
    sheet.getRange('A1').setValue('⚡ Quick Smoke Test Results');
    sheet.getRange('A1').setFontSize(14).setFontWeight('bold');
    
    // Метрики
    const data = [
      ['Timestamp', new Date().toLocaleString()],
      ['Total Tests', results.totalTests],
      ['Passed', results.passed],
      ['Failed', results.failed],
      ['Success Rate', Math.round((results.passed / results.totalTests) * 100) + '%'],
      ['Critical Failures', results.criticalFailures.length],
      [''],
      ['Status', results.criticalFailures.length === 0 ? '✅ READY' : '❌ ISSUES FOUND']
    ];
    
    sheet.getRange(3, 1, data.length, 2).setValues(data);
    
    // Critical failures
    if (results.criticalFailures.length > 0) {
      sheet.getRange(3 + data.length + 1, 1).setValue('🚨 Critical Failures:');
      sheet.getRange(3 + data.length + 1, 1).setFontWeight('bold').setFontColor('red');
      
      results.criticalFailures.forEach((failure, index) => {
        sheet.getRange(3 + data.length + 2 + index, 1).setValue(`💥 ${failure}`);
      });
    }
    
    sheet.autoResizeColumns(1, 2);
    Logger.log('✅ Smoke test results written to \"Smoke Test\" sheet');
    
  } catch (error) {
    Logger.log(`⚠️ Could not write smoke test results: ${error.message}`);
  }
}

/**
 * Тест только базовых функций без внешних вызовов
 */
function testBasicFunctionsOnly() {
  Logger.log('⚡ Basic Functions Test...');
  
  const tests = [
    () => {
      const normalized = normalizePlatformName('инста');
      return normalized === 'instagram' ? '✅ normalizePlatformName works' : `❌ Expected instagram, got ${normalized}`;
    },
    () => {
      const valid = validateAndSanitizeInputs('test', 5, 'instagram');
      return valid.isValid ? '✅ validateAndSanitizeInputs works' : '❌ Validation failed';
    },
    () => {
      const delay = calculateBackoffDelay(1, 1000, 5000);
      return (delay >= 750 && delay <= 1250) ? '✅ calculateBackoffDelay works' : `❌ Wrong delay: ${delay}`;
    },
    () => {
      const error = createUserFriendlyError(new Error('HTTP 404'), { platform: 'test' });
      return error.message.includes('🔍') ? '✅ createUserFriendlyError works' : '❌ Error not user-friendly';
    }
  ];
  
  tests.forEach((test, index) => {
    try {
      const result = test();
      Logger.log(`Test ${index + 1}: ${result}`);
    } catch (error) {
      Logger.log(`Test ${index + 1}: ❌ ${error.message}`);
    }
  });
}"