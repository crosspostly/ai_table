/**
 * VK Baseline Tests - Тесты текущего VK функционала ПЕРЕД миграцией
 * Создаем точку отсчета чтобы убедиться что после миграции всё работает так же
 */

/**
 * ГЛАВНЫЙ ТЕСТ: Проверяет базовую работоспособность VK через текущую архитектуру
 */
function testVkBaselineFunctionality() {
  var testResults = {
    timestamp: new Date().toISOString(),
    architecture: 'CURRENT (Client → Server → VK_PARSER)',
    tests: {},
    summary: { total: 0, passed: 0, failed: 0 }
  };
  
  try {
    console.log('🧪 BASELINE TEST: VK функциональность через текущую архитектуру');
    
    // Тест 1: Проверка доступности VK_PARSER
    testResults.tests.vk_parser_health = testVkParserHealth();
    
    // Тест 2: Тест wall.get с публичным аккаунтом  
    testResults.tests.wall_get_public = testVkWallGetPublic();
    
    // Тест 3: Тест handleParseAlbum с публичным альбомом
    testResults.tests.parse_album_public = testVkParseAlbumPublic();
    
    // Тест 4: Проверка серверного API эндпоинта
    testResults.tests.server_endpoint = testVkServerEndpoint();
    
    // Тест 5: Проверка клиентских функций (без реального выполнения)
    testResults.tests.client_functions = testVkClientFunctions();
    
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
    
    console.log('📊 BASELINE РЕЗУЛЬТАТЫ:');
    console.log('✅ Пройдено: ' + testResults.summary.passed + '/' + testResults.summary.total + ' (' + successRate + '%)');
    
    if (testResults.summary.failed > 0) {
      console.log('❌ Провалено: ' + testResults.summary.failed);
      Object.keys(testResults.tests).forEach(function(testName) {
        if (!testResults.tests[testName].passed) {
          console.log('  • ' + testName + ': ' + testResults.tests[testName].error);
        }
      });
    }
    
    // Сохраняем результаты baseline для последующего сравнения
    saveBaselineResults(testResults);
    
    return testResults;
    
  } catch (error) {
    console.error('💥 Критическая ошибка baseline тестов: ' + error.message);
    return {
      timestamp: new Date().toISOString(),
      architecture: 'CURRENT',
      error: error.message,
      summary: { total: 0, passed: 0, failed: 1 }
    };
  }
}

/**
 * Тест 1: Проверка доступности VK_PARSER
 */
function testVkParserHealth() {
  try {
    var url = VK_PARSER_URL + '?action=wall&owner=1&count=1';
    
    var response = UrlFetchApp.fetch(url, {
      method: 'GET',
      muteHttpExceptions: true,
      timeout: 15000
    });
    
    var statusCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    if (statusCode !== 200) {
      throw new Error('HTTP ' + statusCode + ': ' + responseText);
    }
    
    var data = JSON.parse(responseText);
    
    if (data.error) {
      // VK может вернуть ошибку доступа, но сам парсер работает
      if (data.error.includes('Access denied') || data.error.includes('Private')) {
        return {
          passed: true,
          message: 'VK_PARSER доступен (получена ожидаемая ошибка доступа)',
          details: { status: statusCode, error: data.error }
        };
      }
      throw new Error('VK API error: ' + data.error);
    }
    
    return {
      passed: true,
      message: 'VK_PARSER работает корректно',
      details: { status: statusCode, dataType: Array.isArray(data) ? 'array' : typeof data }
    };
    
  } catch (error) {
    return {
      passed: false,
      message: 'VK_PARSER недоступен',
      error: error.message
    };
  }
}

/**
 * Тест 2: Проверка wall.get с публичным аккаунтом
 */
function testVkWallGetPublic() {
  try {
    // Используем Дурова (ID: 1) - публичный аккаунт
    var url = VK_PARSER_URL + '?action=wall&owner=1&count=3';
    
    var response = UrlFetchApp.fetch(url, {
      method: 'GET',
      muteHttpExceptions: true,
      timeout: 20000
    });
    
    var statusCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    if (statusCode !== 200) {
      throw new Error('HTTP ' + statusCode);
    }
    
    var data = JSON.parse(responseText);
    
    // Проверяем структуру ответа
    if (!Array.isArray(data)) {
      throw new Error('Ответ не является массивом: ' + typeof data);
    }
    
    if (data.length === 0) {
      throw new Error('Пустой массив постов');
    }
    
    // Проверяем структуру первого поста
    var firstPost = data[0];
    var requiredFields = ['date', 'link', 'text', 'number', 'comments', 'likes'];
    
    for (var i = 0; i < requiredFields.length; i++) {
      if (!(requiredFields[i] in firstPost)) {
        throw new Error('Отсутствует поле: ' + requiredFields[i]);
      }
    }
    
    return {
      passed: true,
      message: 'Wall.get работает корректно',
      details: { 
        postsCount: data.length, 
        firstPost: {
          hasText: !!firstPost.text,
          hasLink: !!firstPost.link,
          hasDate: !!firstPost.date
        }
      }
    };
    
  } catch (error) {
    return {
      passed: false,
      message: 'Wall.get не работает',
      error: error.message
    };
  }
}

/**
 * Тест 3: Проверка parseAlbum с публичным альбомом
 */
function testVkParseAlbumPublic() {
  try {
    // Используем публичный альбом (примерный URL)
    var albumUrl = 'https://vk.com/album1_00';
    var url = VK_PARSER_URL + '?action=parseAlbum&url=' + encodeURIComponent(albumUrl) + '&limit=2&offset=0';
    
    var response = UrlFetchApp.fetch(url, {
      method: 'GET',
      muteHttpExceptions: true,
      timeout: 20000
    });
    
    var statusCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    if (statusCode !== 200) {
      throw new Error('HTTP ' + statusCode);
    }
    
    var data = JSON.parse(responseText);
    
    // Для альбомов ожидаем объект с полями images, hasMore, nextOffset, total
    if (typeof data !== 'object' || data === null) {
      throw new Error('Ответ не является объектом');
    }
    
    if (!('images' in data) || !Array.isArray(data.images)) {
      // Возможно альбом не существует или недоступен
      if (data.error && (data.error.includes('album') || data.error.includes('Неверный формат'))) {
        return {
          passed: true,
          message: 'parseAlbum обрабатывает ошибки корректно',
          details: { expectedError: data.error }
        };
      }
      throw new Error('Отсутствует поле images или неверный тип');
    }
    
    return {
      passed: true,
      message: 'parseAlbum работает корректно',
      details: { 
        imagesCount: data.images.length,
        hasMore: data.hasMore,
        total: data.total
      }
    };
    
  } catch (error) {
    return {
      passed: false,
      message: 'parseAlbum не работает',
      error: error.message
    };
  }
}

/**
 * Тест 4: Проверка серверного API эндпоинта (без аутентификации)
 */
function testVkServerEndpoint() {
  try {
    // Проверяем что handleVkImport функция существует и доступна
    if (typeof handleVkImport !== 'function') {
      throw new Error('handleVkImport функция не найдена');
    }
    
    // Проверяем VkCollector в DataCollectors.gs
    if (typeof VkCollector === 'undefined') {
      throw new Error('VkCollector не определен в DataCollectors.gs');
    }
    
    return {
      passed: true,
      message: 'Серверные функции VK доступны',
      details: { 
        handleVkImport: 'function',
        vkCollector: typeof VkCollector
      }
    };
    
  } catch (error) {
    return {
      passed: false,
      message: 'Серверные функции VK недоступны',
      error: error.message
    };
  }
}

/**
 * Тест 5: Проверка клиентских функций (структурный анализ)
 */
function testVkClientFunctions() {
  try {
    var clientFunctions = [];
    
    // Проверяем существование основных клиентских функций
    try {
      // Эти функции могут быть в другом контексте, поэтому используем try/catch
      if (typeof importVkPostsThin === 'function') clientFunctions.push('importVkPostsThin');
    } catch (e) {}
    
    try {
      if (typeof getVkImportParams === 'function') clientFunctions.push('getVkImportParams');
    } catch (e) {}
    
    try {
      if (typeof writeVkPosts === 'function') clientFunctions.push('writeVkPosts');
    } catch (e) {}
    
    // Проверяем VkImportService.gs функции
    if (typeof importVkPosts === 'function') clientFunctions.push('importVkPosts');
    if (typeof createStopWordsFormulas === 'function') clientFunctions.push('createStopWordsFormulas');
    if (typeof testStopWordsFilter === 'function') clientFunctions.push('testStopWordsFilter');
    
    if (clientFunctions.length === 0) {
      throw new Error('Ни одна VK функция не найдена');
    }
    
    return {
      passed: true,
      message: 'VK клиентские функции доступны',
      details: { 
        functionsFound: clientFunctions.length,
        functions: clientFunctions
      }
    };
    
  } catch (error) {
    return {
      passed: false,
      message: 'VK клиентские функции недоступны',
      error: error.message
    };
  }
}

/**
 * Сохранение baseline результатов для последующего сравнения
 */
function saveBaselineResults(results) {
  try {
    var properties = PropertiesService.getScriptProperties();
    var baselineData = JSON.stringify({
      timestamp: results.timestamp,
      summary: results.summary,
      tests: Object.keys(results.tests).map(function(testName) {
        return {
          name: testName,
          passed: results.tests[testName].passed,
          message: results.tests[testName].message
        };
      })
    });
    
    properties.setProperty('VK_BASELINE_RESULTS', baselineData);
    console.log('💾 Baseline результаты сохранены для сравнения');
    
  } catch (error) {
    console.warn('⚠️ Не удалось сохранить baseline результаты: ' + error.message);
  }
}

/**
 * Загрузка сохранённых baseline результатов
 */
function loadBaselineResults() {
  try {
    var properties = PropertiesService.getScriptProperties();
    var baselineData = properties.getProperty('VK_BASELINE_RESULTS');
    
    if (!baselineData) {
      return null;
    }
    
    return JSON.parse(baselineData);
    
  } catch (error) {
    console.warn('⚠️ Не удалось загрузить baseline результаты: ' + error.message);
    return null;
  }
}

/**
 * БЫСТРЫЙ ТЕСТ: Только самые критичные проверки
 */
function quickVkBaselineTest() {
  console.log('⚡ БЫСТРЫЙ VK BASELINE ТЕСТ');
  
  try {
    // Проверка доступности VK_PARSER
    console.log('1. Проверка VK_PARSER...');
    var healthCheck = testVkParserHealth();
    console.log(healthCheck.passed ? '✅ VK_PARSER доступен' : '❌ VK_PARSER недоступен: ' + healthCheck.error);
    
    // Проверка wall.get
    console.log('2. Проверка wall.get...');
    var wallTest = testVkWallGetPublic();
    console.log(wallTest.passed ? '✅ Wall.get работает' : '❌ Wall.get не работает: ' + wallTest.error);
    
    // Проверка серверных функций
    console.log('3. Проверка серверных функций...');
    var serverTest = testVkServerEndpoint();
    console.log(serverTest.passed ? '✅ Серверные функции доступны' : '❌ Серверные функции недоступны: ' + serverTest.error);
    
    var passedTests = [healthCheck.passed, wallTest.passed, serverTest.passed].filter(Boolean).length;
    console.log('📊 Результат: ' + passedTests + '/3 тестов прошли');
    
    return passedTests === 3;
    
  } catch (error) {
    console.error('💥 Ошибка быстрого теста: ' + error.message);
    return false;
  }
}

/**
 * Сравнение результатов после миграции с baseline
 */
function compareWithBaseline(newResults) {
  var baseline = loadBaselineResults();
  
  if (!baseline) {
    console.log('⚠️ Baseline результаты не найдены - сравнение невозможно');
    return null;
  }
  
  console.log('📊 СРАВНЕНИЕ С BASELINE:');
  console.log('Baseline: ' + baseline.summary.passed + '/' + baseline.summary.total + ' тестов');
  console.log('Текущий: ' + newResults.summary.passed + '/' + newResults.summary.total + ' тестов');
  
  var improvement = newResults.summary.passed - baseline.summary.passed;
  var regression = baseline.summary.passed - newResults.summary.passed;
  
  if (improvement > 0) {
    console.log('✅ Улучшение: +' + improvement + ' тестов');
  } else if (regression > 0) {
    console.log('❌ Регрессия: -' + regression + ' тестов');
  } else {
    console.log('➖ Без изменений в количестве пройденных тестов');
  }
  
  return {
    baseline: baseline,
    current: newResults,
    improvement: improvement,
    regression: regression
  };
}