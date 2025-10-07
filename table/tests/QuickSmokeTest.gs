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
  Logger.log('\n🔍 Testing critical function availability...');
  
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
  Logger.log('\n🛡️ Testing input validation...');
  
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
  Logger.log('\n🔍 Testing platform detection...');
  
  const quickPlatformTests = [
    ['https://www.instagram.com/nasa/', 'instagram', 'nasa'],
    ['https://t.me/durov', 'telegram', 'durov'],
    ['https://vk.com/durov', 'vk', 'durov']
  ];\n  \n  quickPlatformTests.forEach(([url, expectedPlatform, expectedValue]) => {\n    results.totalTests++;\n    try {\n      const result = parseSource(url, null);\n      if (result.platform === expectedPlatform && result.value === expectedValue) {\n        results.passed++;\n        results.details.push(`✅ ${expectedPlatform} URL parsed`);\n        Logger.log(`✅ ${url} → ${expectedPlatform}`);\n      } else {\n        results.failed++;\n        results.criticalFailures.push(`${expectedPlatform} parsing failed`);\n        results.details.push(`❌ ${expectedPlatform} URL parsing failed`);\n        Logger.log(`❌ ${url} → expected ${expectedPlatform}, got ${result.platform}`);\n      }\n    } catch (error) {\n      results.failed++;\n      results.criticalFailures.push(`Platform detection error: ${error.message}`);\n      results.details.push(`❌ Platform detection error`);\n      Logger.log(`❌ Platform detection error for ${url}: ${error.message}`);\n    }\n  });\n  \n  // === ERROR HANDLING SMOKE TEST ===\n  Logger.log('\\n💬 Testing error handling...');\n  \n  results.totalTests++;\n  try {\n    const testError = new Error('HTTP 403: Forbidden');\n    const friendlyError = createUserFriendlyError(testError, { platform: 'instagram' });\n    \n    if (friendlyError.message.includes('🚫') || friendlyError.message.includes('заблокирован')) {\n      results.passed++;\n      results.details.push('✅ User-friendly errors work');\n      Logger.log('✅ Error handling creates friendly messages');\n    } else {\n      results.failed++;\n      results.criticalFailures.push('Error handling not user-friendly');\n      results.details.push('❌ Error handling not user-friendly');\n      Logger.log(`❌ Error message not friendly: ${friendlyError.message}`);\n    }\n  } catch (error) {\n    results.failed++;\n    results.criticalFailures.push(`Error handling broken: ${error.message}`);\n    results.details.push('❌ Error handling system broken');\n    Logger.log(`❌ Error handling test failed: ${error.message}`);\n  }\n  \n  // === RETRY LOGIC SMOKE TEST ===\n  Logger.log('\\n🔄 Testing retry logic...');\n  \n  results.totalTests++;\n  try {\n    const delay = calculateBackoffDelay(2, 1000, 10000);\n    if (delay >= 1500 && delay <= 2500) { // 2000 ± jitter\n      results.passed++;\n      results.details.push('✅ Retry backoff calculation works');\n      Logger.log(`✅ Backoff delay: ${delay}ms`);\n    } else {\n      results.failed++;\n      results.criticalFailures.push('Retry backoff calculation wrong');\n      results.details.push('❌ Retry backoff wrong');\n      Logger.log(`❌ Wrong backoff delay: ${delay}ms`);\n    }\n  } catch (error) {\n    results.failed++;\n    results.criticalFailures.push(`Retry logic error: ${error.message}`);\n    results.details.push('❌ Retry logic broken');\n    Logger.log(`❌ Retry logic error: ${error.message}`);\n  }\n  \n  // === FINAL RESULTS ===\n  const duration = Date.now() - startTime;\n  const successRate = Math.round((results.passed / results.totalTests) * 100);\n  \n  Logger.log('\\n📊 =============================');\n  Logger.log('   ⚡ QUICK SMOKE TEST RESULTS');\n  Logger.log('=============================');\n  Logger.log(`⏱️ Duration: ${Math.round(duration / 1000)}s`);\n  Logger.log(`📊 Tests: ${results.totalTests}`);\n  Logger.log(`✅ Passed: ${results.passed}`);\n  Logger.log(`❌ Failed: ${results.failed}`);\n  Logger.log(`📈 Success Rate: ${successRate}%`);\n  \n  if (results.criticalFailures.length > 0) {\n    Logger.log('\\n🚨 CRITICAL FAILURES:');\n    results.criticalFailures.forEach(failure => {\n      Logger.log(`  💥 ${failure}`);\n    });\n  }\n  \n  // VERDICT\n  if (results.criticalFailures.length === 0 && successRate >= 90) {\n    Logger.log('\\n🎯 VERDICT: ✅ READY FOR TESTING');\n    Logger.log('   All critical systems operational!');\n  } else if (results.criticalFailures.length > 0) {\n    Logger.log('\\n🚨 VERDICT: ❌ CRITICAL ISSUES FOUND');\n    Logger.log('   Fix critical failures before proceeding!');\n  } else {\n    Logger.log('\\n⚠️ VERDICT: 🔄 NEEDS ATTENTION');\n    Logger.log('   Some tests failed, review before production!');\n  }\n  \n  // Сохраняем в лист для быстрого доступа\n  writeSmokeTestResults(results);\n  \n  return results;\n}\n\n/**\n * Простой тест только URL парсинга (без API вызовов)\n */\nfunction testUrlParsingOnly() {\n  Logger.log('🔗 URL Parsing Only Test...');\n  \n  const testUrls = [\n    // Instagram\n    ['https://www.instagram.com/nasa/', 'instagram', 'nasa'],\n    ['https://instagram.com/natgeo', 'instagram', 'natgeo'],\n    \n    // Telegram\n    ['https://t.me/durov', 'telegram', 'durov'],\n    ['https://telegram.me/meduzalive', 'telegram', 'meduzalive'],\n    \n    // VK\n    ['https://vk.com/durov', 'vk', 'durov'],\n    ['https://vk.com/club123456', 'vk', '-123456'],\n    ['https://vk.com/public789', 'vk', '-789'],\n    \n    // Edge cases that should require explicit platform\n    ['durov', null, 'should_fail'],\n    ['@channel', null, 'should_fail'],\n    ['-123456', null, 'should_fail']\n  ];\n  \n  let passed = 0, failed = 0;\n  \n  testUrls.forEach(([url, expectedPlatform, expectedValue]) => {\n    try {\n      const result = parseSource(url, null);\n      \n      if (expectedValue === 'should_fail') {\n        failed++;\n        Logger.log(`❌ ${url} → Should have failed but got: ${result.platform}`);\n      } else if (result.platform === expectedPlatform && result.value === expectedValue) {\n        passed++;\n        Logger.log(`✅ ${url} → ${result.platform}:${result.value}`);\n      } else {\n        failed++;\n        Logger.log(`❌ ${url} → Expected ${expectedPlatform}:${expectedValue}, got ${result.platform}:${result.value}`);\n      }\n    } catch (error) {\n      if (expectedValue === 'should_fail' && error.message.includes('укажите платформу')) {\n        passed++;\n        Logger.log(`✅ ${url} → Correctly requires platform`);\n      } else {\n        failed++;\n        Logger.log(`❌ ${url} → Error: ${error.message}`);\n      }\n    }\n  });\n  \n  Logger.log(`\\nURL Parsing Results: ${passed}/${passed + failed} passed`);\n  return { passed, failed, total: passed + failed };\n}\n\n/**\n * Запись результатов smoke test в лист\n */\nfunction writeSmokeTestResults(results) {\n  try {\n    const ss = SpreadsheetApp.getActive();\n    let sheet = ss.getSheetByName('Smoke Test');\n    \n    if (!sheet) {\n      sheet = ss.insertSheet('Smoke Test');\n    }\n    \n    sheet.clear();\n    \n    // Заголовок\n    sheet.getRange('A1').setValue('⚡ Quick Smoke Test Results');\n    sheet.getRange('A1').setFontSize(14).setFontWeight('bold');\n    \n    // Метрики\n    const data = [\n      ['Timestamp', new Date().toLocaleString()],\n      ['Total Tests', results.totalTests],\n      ['Passed', results.passed],\n      ['Failed', results.failed],\n      ['Success Rate', Math.round((results.passed / results.totalTests) * 100) + '%'],\n      ['Critical Failures', results.criticalFailures.length],\n      [''],\n      ['Status', results.criticalFailures.length === 0 ? '✅ READY' : '❌ ISSUES FOUND']\n    ];\n    \n    sheet.getRange(3, 1, data.length, 2).setValues(data);\n    \n    // Critical failures\n    if (results.criticalFailures.length > 0) {\n      sheet.getRange(3 + data.length + 1, 1).setValue('🚨 Critical Failures:');\n      sheet.getRange(3 + data.length + 1, 1).setFontWeight('bold').setFontColor('red');\n      \n      results.criticalFailures.forEach((failure, index) => {\n        sheet.getRange(3 + data.length + 2 + index, 1).setValue(`💥 ${failure}`);\n      });\n    }\n    \n    sheet.autoResizeColumns(1, 2);\n    Logger.log('✅ Smoke test results written to \"Smoke Test\" sheet');\n    \n  } catch (error) {\n    Logger.log(`⚠️ Could not write smoke test results: ${error.message}`);\n  }\n}\n\n/**\n * Тест только базовых функций без внешних вызовов\n */\nfunction testBasicFunctionsOnly() {\n  Logger.log('⚡ Basic Functions Test...');\n  \n  const tests = [\n    () => {\n      const normalized = normalizePlatformName('инста');\n      return normalized === 'instagram' ? '✅ normalizePlatformName works' : `❌ Expected instagram, got ${normalized}`;\n    },\n    () => {\n      const valid = validateAndSanitizeInputs('test', 5, 'instagram');\n      return valid.isValid ? '✅ validateAndSanitizeInputs works' : '❌ Validation failed';\n    },\n    () => {\n      const delay = calculateBackoffDelay(1, 1000, 5000);\n      return (delay >= 750 && delay <= 1250) ? '✅ calculateBackoffDelay works' : `❌ Wrong delay: ${delay}`;\n    },\n    () => {\n      const error = createUserFriendlyError(new Error('HTTP 404'), { platform: 'test' });\n      return error.message.includes('🔍') ? '✅ createUserFriendlyError works' : '❌ Error not user-friendly';\n    }\n  ];\n  \n  tests.forEach((test, index) => {\n    try {\n      const result = test();\n      Logger.log(`Test ${index + 1}: ${result}`);\n    } catch (error) {\n      Logger.log(`Test ${index + 1}: ❌ ${error.message}`);\n    }\n  });\n}"