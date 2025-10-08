// New/tests/TestSuite.gs
// Комплексные тесты для проверки функционала Table AI v2.0

/**
 * Главная функция тестирования - запускает все тесты
 */
function runAllTests() {
  var ui = SpreadsheetApp.getUi();
  var results = [];
  
  addSystemLog('Starting Table AI v2.0 test suite', 'INFO', 'TESTS');
  
  try {
    // Тесты утилит
    results.push(testUtilities());
    
    // Тесты лицензионной системы  
    results.push(testLicenseSystem());
    
    // Тесты детектора источников
    results.push(testSourceDetector());
    
    // Тесты коллекторов данных
    results.push(testDataCollectors());
    
    // Тесты OCR сервиса
    results.push(testOcrService());
    
    // Тесты серверных эндпоинтов
    results.push(testServerEndpoints());
    
    // Тесты клиентского API
    results.push(testClientFunctions());
    
    // Сводка результатов
    var summary = generateTestSummary(results);
    addSystemLog('Test suite completed: ' + summary.status, summary.status === 'PASSED' ? 'INFO' : 'ERROR', 'TESTS');
    
    ui.alert('Результаты тестирования', summary.report, ui.ButtonSet.OK);
    
    return summary;
    
  } catch (error) {
    var errorMsg = 'Test suite failed: ' + error.message;
    addSystemLog(errorMsg, 'ERROR', 'TESTS');
    ui.alert('Ошибка тестирования', errorMsg, ui.ButtonSet.OK);
    
    return {
      status: 'FAILED',
      error: error.message
    };
  }
}

/**
 * Тестирование утилит
 */
function testUtilities() {
  var testName = 'Utilities';
  var tests = [];
  
  try {
    // Тест Markdown конвертации
    tests.push({
      name: 'Markdown conversion',
      passed: testMarkdownConversion(),
      error: null
    });
    
    // Тест логирования
    tests.push({
      name: 'System logging',
      passed: testSystemLogging(),
      error: null
    });
    
    // Тест JSON утилит
    tests.push({
      name: 'JSON utilities',
      passed: testJsonUtilities(),
      error: null
    });
    
    // Тест email валидации
    tests.push({
      name: 'Email validation',
      passed: testEmailValidation(),
      error: null
    });
    
    // Тест генерации traceId
    tests.push({
      name: 'TraceId generation',
      passed: testTraceIdGeneration(),
      error: null
    });
    
  } catch (error) {
    tests.push({
      name: 'Utilities error',
      passed: false,
      error: error.message
    });
  }
  
  return {
    suite: testName,
    tests: tests,
    passed: tests.every(function(t) { return t.passed; })
  };
}

/**
 * Тестирование лицензионной системы
 */
function testLicenseSystem() {
  var testName = 'License System';
  var tests = [];
  
  try {
    // Тест невалидных credentials
    tests.push({
      name: 'Invalid credentials rejection',
      passed: testInvalidCredentials(),
      error: null
    });
    
    // Тест rate limiting
    tests.push({
      name: 'Rate limiting',
      passed: testRateLimiting(),
      error: null
    });
    
    // Тест маскирования email
    tests.push({
      name: 'Email masking',
      passed: testEmailMasking(),
      error: null
    });
    
  } catch (error) {
    tests.push({
      name: 'License system error',
      passed: false,
      error: error.message
    });
  }
  
  return {
    suite: testName,
    tests: tests,
    passed: tests.every(function(t) { return t.passed; })
  };
}

/**
 * Тестирование детектора источников
 */
function testSourceDetector() {
  var testName = 'Source Detector';
  var tests = [];
  
  try {
    // Тест извлечения VK ссылок
    tests.push({
      name: 'VK URL extraction',
      passed: testVkUrlExtraction(),
      error: null
    });
    
    // Тест извлечения Drive ссылок
    tests.push({
      name: 'Drive URL extraction',
      passed: testDriveUrlExtraction(),
      error: null
    });
    
    // Тест извлечения обычных ссылок
    tests.push({
      name: 'Generic URL extraction',
      passed: testGenericUrlExtraction(),
      error: null
    });
    
    // Тест дедупликации
    tests.push({
      name: 'URL deduplication',
      passed: testUrlDeduplication(),
      error: null
    });
    
  } catch (error) {
    tests.push({
      name: 'Source detector error',
      passed: false,
      error: error.message
    });
  }
  
  return {
    suite: testName,
    tests: tests,
    passed: tests.every(function(t) { return t.passed; })
  };
}

/**
 * Тестирование коллекторов данных
 */
function testDataCollectors() {
  var testName = 'Data Collectors';
  var tests = [];
  
  try {
    // Тест Factory pattern
    tests.push({
      name: 'Collector factory',
      passed: testCollectorFactory(),
      error: null
    });
    
    // Тест VK коллектора (mock)
    tests.push({
      name: 'VK collector mock',
      passed: testVkCollectorMock(),
      error: null
    });
    
    // Тест URL коллектора
    tests.push({
      name: 'URL collector',
      passed: testUrlCollector(),
      error: null
    });
    
  } catch (error) {
    tests.push({
      name: 'Data collectors error',
      passed: false,
      error: error.message
    });
  }
  
  return {
    suite: testName,
    tests: tests,
    passed: tests.every(function(t) { return t.passed; })
  };
}

/**
 * Тестирование OCR сервиса
 */
function testOcrService() {
  var testName = 'OCR Service';
  var tests = [];
  
  try {
    // Тест батчирования
    tests.push({
      name: 'Image batching',
      passed: testImageBatching(),
      error: null
    });
    
    // Тест разделения по delimiter
    tests.push({
      name: 'Delimiter splitting',
      passed: testDelimiterSplitting(),
      error: null
    });
    
    // Тест chunking
    tests.push({
      name: 'Image chunking',
      passed: testImageChunking(),
      error: null
    });
    
  } catch (error) {
    tests.push({
      name: 'OCR service error',
      passed: false,
      error: error.message
    });
  }
  
  return {
    suite: testName,
    tests: tests,
    passed: tests.every(function(t) { return t.passed; })
  };
}

/**
 * Тестирование серверных эндпоинтов
 */
function testServerEndpoints() {
  var testName = 'Server Endpoints';
  var tests = [];
  
  try {
    // Тест парсинга запросов
    tests.push({
      name: 'Request parsing',
      passed: testRequestParsing(),
      error: null
    });
    
    // Тест создания ответов
    tests.push({
      name: 'Response creation',
      passed: testResponseCreation(),
      error: null
    });
    
    // Тест health check
    tests.push({
      name: 'Health check',
      passed: testHealthCheck(),
      error: null
    });
    
  } catch (error) {
    tests.push({
      name: 'Server endpoints error',
      passed: false,
      error: error.message
    });
  }
  
  return {
    suite: testName,
    tests: tests,
    passed: tests.every(function(t) { return t.passed; })
  };
}

/**
 * Тестирование клиентских функций
 */
function testClientFunctions() {
  var testName = 'Client Functions';
  var tests = [];
  
  try {
    // Тест получения credentials
    tests.push({
      name: 'Credentials retrieval',
      passed: testCredentialsRetrieval(),
      error: null
    });
    
    // Тест нормализации условий
    tests.push({
      name: 'Condition normalization',
      passed: testConditionNormalization(),
      error: null
    });
    
    // Тест клиентского логирования
    tests.push({
      name: 'Client logging',
      passed: testClientLogging(),
      error: null
    });
    
  } catch (error) {
    tests.push({
      name: 'Client functions error',
      passed: false,
      error: error.message
    });
  }
  
  return {
    suite: testName,
    tests: tests,
    passed: tests.every(function(t) { return t.passed; })
  };
}

// ============ КОНКРЕТНЫЕ ТЕСТЫ ============

function testMarkdownConversion() {
  var input = '# Заголовок\
\
**Жирный текст** и *курсив*\
\
```code block```';
  var result = convertMarkdownToReadableText(input);
  return result.includes('ЗАГОЛОВОК:') && result.includes('ЖИРНЫЙ ТЕКСТ');
}

function testSystemLogging() {
  addSystemLog('Test message', 'INFO', 'TEST');
  var logs = getSystemLogs(1);
  return logs.includes('Test message');
}

function testJsonUtilities() {
  var obj = { test: 'value' };
  var json = safeJsonStringify(obj);
  var parsed = safeJsonParse(json);
  return parsed.test === 'value';
}

function testEmailValidation() {
  return isValidEmail('test@example.com') && !isValidEmail('invalid-email');
}

function testTraceIdGeneration() {
  var id1 = generateTraceId('test');
  var id2 = generateTraceId('test');
  return id1 !== id2 && id1.startsWith('test-');
}

function testInvalidCredentials() {
  var result = checkUserLicense('invalid@email.com', 'invalid-token');
  return !result.ok;
}

function testRateLimiting() {
  // Простой тест - функция должна работать без ошибок
  var result = checkRateLimit('test-token');
  return typeof result === 'boolean';
}

function testEmailMasking() {
  var masked = maskEmail('test@example.com');
  return masked.includes('***') && masked.includes('@example.com');
}

function testVkUrlExtraction() {
  var sources = extractImageSources('https://vk.com/photo123_456', '', '');
  return sources.length > 0 && sources[0].source === IMAGE_SOURCES.VK;
}

function testDriveUrlExtraction() {
  var sources = extractImageSources('https://drive.google.com/file/d/abc123', '', '');
  return sources.length > 0 && sources[0].source === IMAGE_SOURCES.DRIVE;
}

function testGenericUrlExtraction() {
  var sources = extractImageSources('https://example.com/image.jpg', '', '');
  return sources.length > 0 && sources[0].source === IMAGE_SOURCES.URL;
}

function testUrlDeduplication() {
  var sources = extractImageSources('https://example.com/image.jpg https://example.com/image.jpg', '', '');
  return sources.length === 1;
}

function testCollectorFactory() {
  var vkCollector = createDataCollector(IMAGE_SOURCES.VK);
  var urlCollector = createDataCollector(IMAGE_SOURCES.URL);
  return vkCollector && urlCollector;
}

function testVkCollectorMock() {
  // Mock тест без реального VK API
  try {
    var vkCollector = createDataCollector(IMAGE_SOURCES.VK);
    return vkCollector.type === IMAGE_SOURCES.VK;
  } catch (e) {
    return false;
  }
}

function testUrlCollector() {
  try {
    var urlCollector = createDataCollector(IMAGE_SOURCES.URL);
    return urlCollector.type === IMAGE_SOURCES.URL;
  } catch (e) {
    return false;
  }
}

function testImageBatching() {
  // Тест создания batch'а изображений
  var images = ['img1', 'img2', 'img3'];
  return createImageBatch(images, 2, 'trace').length <= 2;
}

function testDelimiterSplitting() {
  var text = 'Часть 1---Часть 2---Часть 3';
  var parts = splitTextByDelimiter(text, '---');
  return parts.length === 3 && parts[0].trim() === 'Часть 1';
}

function testImageChunking() {
  var images = new Array(10).fill('test');
  var chunks = chunkArray(images, 3);
  return chunks.length === 4 && chunks[0].length === 3;
}

function testRequestParsing() {
  try {
    var mockEvent = {
      postData: {
        contents: JSON.stringify({ action: 'test' })
      }
    };
    var parsed = parseRequestBody(mockEvent);
    return parsed.action === 'test';
  } catch (e) {
    return false;
  }
}

function testResponseCreation() {
  var response = createSuccessResponse({ test: 'data' }, 'trace-123');
  var content = response.getContent();
  var data = JSON.parse(content);
  return data.ok === true && data.traceId === 'trace-123';
}

function testHealthCheck() {
  var health = {
    ok: true,
    services: {
      ocr: checkOcrServiceHealth(),
      licensing: checkLicensingHealth()
    }
  };
  return health.services.ocr.status && health.services.licensing.status;
}

function testCredentialsRetrieval() {
  var creds = getClientCredentials();
  return creds && typeof creds.valid === 'boolean';
}

function testConditionNormalization() {
  return normalizeCondition(true) === true && 
         normalizeCondition('false') === false &&
         normalizeCondition(1) === true &&
         normalizeCondition(0) === false;
}

function testClientLogging() {
  logClient('Test client message');
  return true; // Простая проверка что функция не падает
}

// ============ УТИЛИТЫ ТЕСТИРОВАНИЯ ============

/**
 * Генерация сводки результатов тестов
 */
function generateTestSummary(results) {
  var totalSuites = results.length;
  var passedSuites = results.filter(function(r) { return r.passed; }).length;
  var failedSuites = totalSuites - passedSuites;
  
  var totalTests = 0;
  var passedTests = 0;
  var failedTests = [];
  
  results.forEach(function(suite) {
    totalTests += suite.tests.length;
    suite.tests.forEach(function(test) {
      if (test.passed) {
        passedTests++;
      } else {
        failedTests.push(suite.suite + ': ' + test.name + (test.error ? ' (' + test.error + ')' : ''));
      }
    });
  });
  
  var status = failedTests.length === 0 ? 'PASSED' : 'FAILED';
  
  var report = 'Результаты тестирования Table AI v2.0:\
\
' +
               'Статус: ' + status + '\
' +
               'Тестовых наборов: ' + passedSuites + '/' + totalSuites + '\
' +
               'Тестов: ' + passedTests + '/' + totalTests + '\
';
  
  if (failedTests.length > 0) {
    report += '\
Неудачные тесты:\
' + failedTests.join('\
');
  }
  
  return {
    status: status,
    totalSuites: totalSuites,
    passedSuites: passedSuites,
    failedSuites: failedSuites,
    totalTests: totalTests,
    passedTests: passedTests,
    failedTests: failedTests.length,
    report: report
  };
}

/**
 * Создание batch'а изображений для тестирования
 */
function createImageBatch(images, maxSize, traceId) {
  return images.slice(0, maxSize);
}

/**
 * Разделение текста по разделителю для тестирования
 */
function splitTextByDelimiter(text, delimiter) {
  return text.split(delimiter);
}

/**
 * Создание chunks из массива для тестирования
 */
function chunkArray(array, chunkSize) {
  var chunks = [];
  for (var i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Быстрый тест отдельного компонента
 */
function quickTest(componentName) {
  var ui = SpreadsheetApp.getUi();
  
  try {
    var result;
    
    switch (componentName) {
      case 'utils':
        result = testUtilities();
        break;
      case 'license':
        result = testLicenseSystem();
        break;
      case 'source':
        result = testSourceDetector();
        break;
      case 'collectors':
        result = testDataCollectors();
        break;
      case 'ocr':
        result = testOcrService();
        break;
      case 'endpoints':
        result = testServerEndpoints();
        break;
      case 'client':
        result = testClientFunctions();
        break;
      default:
        throw new Error('Unknown component: ' + componentName);
    }
    
    var summary = result.passed ? 'PASSED' : 'FAILED';
    var details = result.tests.map(function(t) {
      return (t.passed ? '✅' : '❌') + ' ' + t.name;
    }).join('\
');
    
    ui.alert('Тест ' + componentName, summary + '\
\
' + details, ui.ButtonSet.OK);
    
  } catch (error) {
    ui.alert('Ошибка теста', 'Ошибка тестирования ' + componentName + ': ' + error.message, ui.ButtonSet.OK);
  }
}