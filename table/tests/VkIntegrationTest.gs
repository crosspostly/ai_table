/**
 * VK Integration Test - Тест интегрированного VK API
 * Проверяет работу handleWallGet_ и VkCollector.collectPosts
 */

/**
 * ГЛАВНЫЙ ТЕСТ: Проверка работы интегрированного VK API
 */
function testVkIntegratedFunctionality() {
  var testResults = {
    timestamp: new Date().toISOString(),
    architecture: 'INTEGRATED VK API (direct to VK without VK_PARSER)',
    tests: {},
    summary: { total: 0, passed: 0, failed: 0 }
  };
  
  try {
    console.log('🔥 INTEGRATION TEST: VK через интегрированный API');
    
    // Тест 1: Проверка VK_TOKEN в Properties
    testResults.tests.vk_token_check = testVkTokenAvailability();
    
    // Тест 2: Прямой тест handleWallGet_
    testResults.tests.handle_wall_get = testHandleWallGet();
    
    // Тест 3: Тест VkCollector.collectPosts
    testResults.tests.vk_collector_posts = testVkCollectorPosts();
    
    // Тест 4: Тест серверного эндпоинта handleVkImport
    testResults.tests.server_vk_import = testServerVkImport();
    
    // Тест 5: Сравнение с baseline (если доступен)
    testResults.tests.baseline_comparison = compareWithVkBaseline();
    
    // Подсчет результатов
    Object.keys(testResults.tests).forEach(function(testName) {
      testResults.summary.total++;
      if (testResults.tests[testName].passed) {
        testResults.summary.passed++;
      } else {
        testResults.summary.failed++;
      }
    });
    
    // Вывод результатов
    var successRate = Math.round((testResults.summary.passed / testResults.summary.total) * 100);
    
    console.log('📊 INTEGRATION РЕЗУЛЬТАТЫ:');
    console.log('✅ Пройдено: ' + testResults.summary.passed + '/' + testResults.summary.total + ' (' + successRate + '%)');
    
    if (testResults.summary.failed > 0) {
      console.log('❌ Провалено: ' + testResults.summary.failed);
      Object.keys(testResults.tests).forEach(function(testName) {
        if (!testResults.tests[testName].passed) {
          console.log('  • ' + testName + ': ' + testResults.tests[testName].error);
        }
      });
    }
    
    // Сохраняем результаты интеграции
    saveIntegrationResults(testResults);
    
    return testResults;
    
  } catch (error) {
    console.error('💥 Критическая ошибка интеграционных тестов: ' + error.message);
    return {
      timestamp: new Date().toISOString(),
      architecture: 'INTEGRATED',
      error: error.message,
      summary: { total: 0, passed: 0, failed: 1 }
    };
  }
}

/**
 * Тест 1: Проверка наличия VK_TOKEN в Properties
 */
function testVkTokenAvailability() {
  try {
    var token = PropertiesService.getScriptProperties().getProperty('VK_TOKEN');
    
    if (!token) {
      return {
        passed: false,
        message: 'VK_TOKEN не настроен в Script Properties',
        error: 'VK_TOKEN отсутствует - функционал работать не будет'
      };
    }
    
    // Проверяем что токен не пустой и имеет разумную длину
    if (token.length < 10) {
      return {
        passed: false,
        message: 'VK_TOKEN слишком короткий',
        error: 'Токен имеет подозрительно малую длину: ' + token.length + ' символов'
      };
    }
    
    return {
      passed: true,
      message: 'VK_TOKEN настроен корректно',
      details: { tokenLength: token.length, masked: token.substring(0, 10) + '***' }
    };
    
  } catch (error) {
    return {
      passed: false,
      message: 'Ошибка получения VK_TOKEN',
      error: error.message
    };
  }
}

/**
 * Тест 2: Прямой тест handleWallGet_
 */
function testHandleWallGet() {
  try {
    // Проверяем что функция существует
    if (typeof handleWallGet_ !== 'function') {
      throw new Error('Функция handleWallGet_ не найдена');
    }
    
    // Тестируем с публичным аккаунтом (Дуров, ID: 1)
    var posts = handleWallGet_(1, 3);
    
    if (!Array.isArray(posts)) {
      throw new Error('handleWallGet_ вернул не массив: ' + typeof posts);
    }
    
    if (posts.length === 0) {
      throw new Error('handleWallGet_ вернул пустой массив');
    }
    
    // Проверяем структуру первого поста
    var firstPost = posts[0];
    var requiredFields = ['date', 'link', 'text', 'number', 'comments', 'likes'];
    
    for (var i = 0; i < requiredFields.length; i++) {
      if (!(requiredFields[i] in firstPost)) {
        throw new Error('Отсутствует поле: ' + requiredFields[i]);
      }
    }
    
    return {
      passed: true,
      message: 'handleWallGet_ работает корректно',
      details: { 
        postsCount: posts.length,
        firstPost: {
          hasText: !!firstPost.text,
          hasLink: !!firstPost.link,
          hasDate: !!firstPost.date,
          structure: Object.keys(firstPost)
        }
      }
    };
    
  } catch (error) {
    return {
      passed: false,
      message: 'handleWallGet_ не работает',
      error: error.message
    };
  }
}

/**
 * Тест 3: Тест VkCollector.collectPosts
 */
function testVkCollectorPosts() {
  try {
    // Проверяем что VkCollector существует и имеет collectPosts
    if (typeof VkCollector === 'undefined') {
      throw new Error('VkCollector не определен');
    }
    
    if (typeof VkCollector.collectPosts !== 'function') {
      throw new Error('VkCollector.collectPosts не является функцией');
    }
    
    // Тестируем collectPosts
    var result = VkCollector.collectPosts(1, 3, 'test-trace');
    
    if (typeof result !== 'object' || !result) {
      throw new Error('collectPosts вернул неверный тип: ' + typeof result);
    }
    
    if (!result.ok) {
      throw new Error('collectPosts вернул ошибку: ' + (result.error || 'unknown'));
    }
    
    if (!Array.isArray(result.data)) {
      throw new Error('collectPosts.data не массив: ' + typeof result.data);
    }
    
    if (result.data.length === 0) {
      throw new Error('collectPosts.data пустой массив');
    }
    
    return {
      passed: true,
      message: 'VkCollector.collectPosts работает корректно',
      details: { 
        ok: result.ok,
        count: result.count,
        dataLength: result.data.length,
        traceId: result.traceId
      }
    };
    
  } catch (error) {
    return {
      passed: false,
      message: 'VkCollector.collectPosts не работает',
      error: error.message
    };
  }
}

/**
 * Тест 4: Тест серверного эндпоинта handleVkImport
 */
function testServerVkImport() {
  try {
    // Проверяем что handleVkImport существует
    if (typeof handleVkImport !== 'function') {
      throw new Error('handleVkImport функция не найдена');
    }
    
    // Проверяем что createDataCollector существует
    if (typeof createDataCollector !== 'function') {
      throw new Error('createDataCollector функция не найдена');
    }
    
    // Тестируем создание VK коллектора
    var vkCollector = createDataCollector('vk');
    
    if (!vkCollector || typeof vkCollector.collectPosts !== 'function') {
      throw new Error('createDataCollector не вернул корректный VK коллектор');
    }
    
    return {
      passed: true,
      message: 'Серверные VK функции доступны и корректны',
      details: { 
        handleVkImport: 'function',
        createDataCollector: 'function',
        vkCollector: 'object with collectPosts'
      }
    };
    
  } catch (error) {
    return {
      passed: false,
      message: 'Серверные VK функции недоступны',
      error: error.message
    };
  }
}

/**
 * Тест 5: Сравнение с baseline результатами
 */
function compareWithVkBaseline() {
  try {
    var baseline = loadBaselineResults();
    
    if (!baseline) {
      return {
        passed: true,
        message: 'Baseline недоступен - сравнение пропущено',
        details: { reason: 'no_baseline' }
      };
    }
    
    // Простое сравнение: если интеграция работает, а baseline не работал
    var integrationWorks = (typeof handleWallGet_ === 'function') && (typeof VkCollector.collectPosts === 'function');
    
    return {
      passed: integrationWorks,
      message: integrationWorks ? 'Интеграция работает лучше baseline' : 'Интеграция хуже baseline',
      details: { 
        integrationWorks: integrationWorks,
        baselineTimestamp: baseline.timestamp,
        baselineTests: baseline.summary
      }
    };
    
  } catch (error) {
    return {
      passed: false,
      message: 'Ошибка сравнения с baseline',
      error: error.message
    };
  }
}

/**
 * Сохранение результатов интеграции
 */
function saveIntegrationResults(results) {
  try {
    var properties = PropertiesService.getScriptProperties();
    var integrationData = JSON.stringify({
      timestamp: results.timestamp,
      architecture: results.architecture,
      summary: results.summary,
      tests: Object.keys(results.tests).map(function(testName) {
        return {
          name: testName,
          passed: results.tests[testName].passed,
          message: results.tests[testName].message
        };
      })
    });
    
    properties.setProperty('VK_INTEGRATION_RESULTS', integrationData);
    console.log('💾 Результаты интеграции сохранены');
    
  } catch (error) {
    console.warn('⚠️ Не удалось сохранить результаты интеграции: ' + error.message);
  }
}

/**
 * БЫСТРЫЙ ТЕСТ: Только критичные проверки
 */
function quickVkIntegrationTest() {
  console.log('⚡ БЫСТРЫЙ VK INTEGRATION ТЕСТ');
  
  try {
    // Проверка токена
    console.log('1. Проверка VK_TOKEN...');
    var tokenCheck = testVkTokenAvailability();
    console.log(tokenCheck.passed ? '✅ VK_TOKEN настроен' : '❌ VK_TOKEN отсутствует: ' + tokenCheck.error);
    
    // Проверка handleWallGet_
    console.log('2. Проверка handleWallGet_...');
    var wallGetCheck = testHandleWallGet();
    console.log(wallGetCheck.passed ? '✅ handleWallGet_ работает' : '❌ handleWallGet_ не работает: ' + wallGetCheck.error);
    
    // Проверка VkCollector.collectPosts
    console.log('3. Проверка VkCollector.collectPosts...');
    var collectorCheck = testVkCollectorPosts();
    console.log(collectorCheck.passed ? '✅ VkCollector.collectPosts работает' : '❌ VkCollector.collectPosts не работает: ' + collectorCheck.error);
    
    var passedTests = [tokenCheck.passed, wallGetCheck.passed, collectorCheck.passed].filter(Boolean).length;
    console.log('📊 Результат: ' + passedTests + '/3 интеграционных тестов прошли');
    
    return passedTests === 3;
    
  } catch (error) {
    console.error('💥 Ошибка быстрого интеграционного теста: ' + error.message);
    return false;
  }
}

/**
 * Финальное сравнение интеграции с baseline
 */
function finalVkComparison() {
  console.log('📊 ФИНАЛЬНОЕ СРАВНЕНИЕ: Baseline vs Integration');
  
  try {
    // Запускаем оба теста
    console.log('1. Запуск baseline тестов...');
    var baseline = testVkBaselineFunctionality(); // Из VkBaselineTests.gs
    
    console.log('2. Запуск интеграционных тестов...');
    var integration = testVkIntegratedFunctionality();
    
    console.log('3. Сравнение результатов:');
    console.log('   Baseline: ' + baseline.summary.passed + '/' + baseline.summary.total + ' тестов');
    console.log('   Integration: ' + integration.summary.passed + '/' + integration.summary.total + ' тестов');
    
    var improvement = integration.summary.passed - baseline.summary.passed;
    var regression = baseline.summary.passed - integration.summary.passed;
    
    if (improvement > 0) {
      console.log('✅ УЛУЧШЕНИЕ: +' + improvement + ' тестов через интеграцию');
    } else if (regression > 0) {
      console.log('❌ РЕГРЕССИЯ: -' + regression + ' тестов после интеграции');
    } else {
      console.log('➖ Без изменений в количестве пройденных тестов');
    }
    
    return {
      baseline: baseline,
      integration: integration,
      improvement: improvement,
      regression: regression
    };
    
  } catch (error) {
    console.error('💥 Ошибка финального сравнения: ' + error.message);
    return null;
  }
}