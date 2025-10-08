/**
 * System Check v1.0
 * Быстрая диагностика системы без запуска полных тестов
 */

/**
 * Проверка доступности критичных функций
 */
function checkCriticalFunctions() {
  Logger.log('🔍 System Diagnostic Check...');
  
  const criticalFunctions = [
    'importSocialPosts',
    'validateAndSanitizeInputs', 
    'fetchWithRetry',
    'createUserFriendlyError',
    'parseSource',
    'normalizePlatformName',
    'calculateBackoffDelay',
    'executeWithErrorHandling'
  ];
  
  let available = 0, missing = 0;
  const results = [];
  
  criticalFunctions.forEach(funcName => {
    try {
      if (typeof eval(funcName) === 'function') {
        available++;
        results.push(`✅ ${funcName}`);
        Logger.log(`✅ ${funcName} - OK`);
      } else {
        missing++;
        results.push(`❌ ${funcName} - NOT A FUNCTION`);
        Logger.log(`❌ ${funcName} - NOT A FUNCTION`);
      }
    } catch (error) {
      missing++;
      results.push(`❌ ${funcName} - ${error.message}`);
      Logger.log(`❌ ${funcName} - ERROR: ${error.message}`);
    }
  });
  
  Logger.log(`
📊 SUMMARY: ${available}/${available + missing} functions available`);
  
  if (missing > 0) {
    Logger.log('🚨 CRITICAL: Missing functions detected!');
    return false;
  } else {
    Logger.log('✅ All critical functions available');
    return true;
  }
}

/**
 * Базовая проверка URL парсинга
 */
function testBasicUrlParsing() {
  Logger.log('
🔗 Testing URL parsing...');
  
  const tests = [
    ['https://www.instagram.com/nasa', 'instagram'],
    ['https://t.me/durov', 'telegram'],
    ['https://vk.com/durov', 'vk']
  ];
  
  let passed = 0, failed = 0;
  
  tests.forEach(([url, expectedPlatform]) => {
    try {
      const result = parseSource(url, null);
      if (result && result.platform === expectedPlatform) {
        passed++;
        Logger.log(`✅ ${url} → ${result.platform}`);
      } else {
        failed++;
        Logger.log(`❌ ${url} → expected ${expectedPlatform}, got ${result?.platform || 'null'}`);
      }
    } catch (error) {
      failed++;
      Logger.log(`❌ ${url} → ERROR: ${error.message}`);
    }
  });
  
  Logger.log(`📊 URL parsing: ${passed}/${passed + failed} passed`);
  return failed === 0;
}

/**
 * Проверка валидации входных данных
 */
function testValidationBasics() {
  Logger.log('
🛡️ Testing validation...');
  
  try {
    // Test 1: Валидный input
    const valid = validateAndSanitizeInputs('https://instagram.com/test', 5, 'instagram');
    if (valid && valid.isValid) {
      Logger.log('✅ Valid input accepted');
    } else {
      Logger.log('❌ Valid input rejected');
      return false;
    }
    
    // Test 2: XSS блокировка
    try {
      validateAndSanitizeInputs('javascript:alert(1)', 5, '');
      Logger.log('❌ XSS not blocked - CRITICAL!');
      return false;
    } catch (error) {
      if (error.message.includes('протокол') || error.message.includes('Invalid')) {
        Logger.log('✅ XSS properly blocked');
      } else {
        Logger.log(`❌ Unexpected XSS error: ${error.message}`);
        return false;
      }
    }
    
    Logger.log('📊 Validation tests passed');
    return true;
    
  } catch (error) {
    Logger.log(`❌ Validation system error: ${error.message}`);
    return false;
  }
}

/**
 * Проверка error handling
 */
function testErrorHandling() {
  Logger.log('
💬 Testing error handling...');
  
  try {
    const testError = new Error('HTTP 403: Forbidden');
    const friendlyError = createUserFriendlyError(testError, { platform: 'instagram' });
    
    if (friendlyError && friendlyError.message && 
        (friendlyError.message.includes('🚫') || friendlyError.message.includes('заблокирован'))) {
      Logger.log('✅ User-friendly errors work');
      return true;
    } else {
      Logger.log(`❌ Error not user-friendly: ${friendlyError?.message || 'null'}`);
      return false;
    }
  } catch (error) {
    Logger.log(`❌ Error handling broken: ${error.message}`);
    return false;
  }
}

/**
 * Полная диагностика системы
 */
function runSystemDiagnostic() {
  Logger.log('⚡ Starting System Diagnostic...
');
  
  const startTime = Date.now();
  const tests = [
    { name: 'Critical Functions', test: checkCriticalFunctions },
    { name: 'URL Parsing', test: testBasicUrlParsing },
    { name: 'Input Validation', test: testValidationBasics },
    { name: 'Error Handling', test: testErrorHandling }
  ];
  
  let passed = 0, total = tests.length;
  const results = [];
  
  tests.forEach(({ name, test }) => {
    Logger.log(`
--- ${name} ---`);
    try {
      const result = test();
      if (result) {
        passed++;
        results.push(`✅ ${name}`);
      } else {
        results.push(`❌ ${name}`);
      }
    } catch (error) {
      Logger.log(`❌ ${name} failed with error: ${error.message}`);
      results.push(`❌ ${name} - ERROR`);
    }
  });
  
  const duration = Date.now() - startTime;
  const successRate = Math.round((passed / total) * 100);
  
  Logger.log('
📊 =============================');
  Logger.log('   ⚡ SYSTEM DIAGNOSTIC RESULTS');
  Logger.log('=============================');
  Logger.log(`⏱️ Duration: ${Math.round(duration / 1000)}s`);
  Logger.log(`📊 Tests: ${total}`);
  Logger.log(`✅ Passed: ${passed}`);
  Logger.log(`❌ Failed: ${total - passed}`);
  Logger.log(`📈 Success Rate: ${successRate}%`);
  
  Logger.log('
📝 Results:');
  results.forEach(result => Logger.log(`  ${result}`));
  
  // Вердикт
  if (successRate === 100) {
    Logger.log('
🎯 VERDICT: ✅ ALL SYSTEMS OPERATIONAL');
    Logger.log('   System ready for full testing!');
  } else if (successRate >= 75) {
    Logger.log('
⚠️ VERDICT: 🔄 PARTIAL FUNCTIONALITY');
    Logger.log('   Some issues detected, review needed!');
  } else {
    Logger.log('
🚨 VERDICT: ❌ CRITICAL ISSUES');
    Logger.log('   Major problems found, fix before proceeding!');
  }
  
  return {
    passed: passed,
    total: total,
    successRate: successRate,
    results: results
  };
}

/**
 * Быстрая проверка только основных функций (для развертывания)
 */
function quickHealthCheck() {
  Logger.log('⚡ Quick Health Check...');
  
  const checks = [
    () => typeof importSocialPosts === 'function',
    () => typeof validateAndSanitizeInputs === 'function',
    () => typeof parseSource === 'function'
  ];
  
  const passed = checks.filter(check => {
    try {
      return check();
    } catch {
      return false;
    }
  }).length;
  
  Logger.log(`📊 Core functions: ${passed}/${checks.length} available`);
  
  if (passed === checks.length) {
    Logger.log('✅ HEALTHY - Core functions available');
    return true;
  } else {
    Logger.log('❌ UNHEALTHY - Missing core functions');
    return false;
  }
}