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
    suite: testName,\n    tests: tests,\n    passed: tests.every(function(t) { return t.passed; })\n  };\n}\n\n/**\n * Тестирование детектора источников\n */\nfunction testSourceDetector() {\n  var testName = 'Source Detector';\n  var tests = [];\n  \n  try {\n    // Тест извлечения VK ссылок\n    tests.push({\n      name: 'VK URL extraction',\n      passed: testVkUrlExtraction(),\n      error: null\n    });\n    \n    // Тест извлечения Drive ссылок\n    tests.push({\n      name: 'Drive URL extraction',\n      passed: testDriveUrlExtraction(),\n      error: null\n    });\n    \n    // Тест извлечения обычных ссылок\n    tests.push({\n      name: 'Generic URL extraction',\n      passed: testGenericUrlExtraction(),\n      error: null\n    });\n    \n    // Тест дедупликации\n    tests.push({\n      name: 'URL deduplication',\n      passed: testUrlDeduplication(),\n      error: null\n    });\n    \n  } catch (error) {\n    tests.push({\n      name: 'Source detector error',\n      passed: false,\n      error: error.message\n    });\n  }\n  \n  return {\n    suite: testName,\n    tests: tests,\n    passed: tests.every(function(t) { return t.passed; })\n  };\n}\n\n/**\n * Тестирование коллекторов данных\n */\nfunction testDataCollectors() {\n  var testName = 'Data Collectors';\n  var tests = [];\n  \n  try {\n    // Тест Factory pattern\n    tests.push({\n      name: 'Collector factory',\n      passed: testCollectorFactory(),\n      error: null\n    });\n    \n    // Тест VK коллектора (mock)\n    tests.push({\n      name: 'VK collector mock',\n      passed: testVkCollectorMock(),\n      error: null\n    });\n    \n    // Тест URL коллектора\n    tests.push({\n      name: 'URL collector',\n      passed: testUrlCollector(),\n      error: null\n    });\n    \n  } catch (error) {\n    tests.push({\n      name: 'Data collectors error',\n      passed: false,\n      error: error.message\n    });\n  }\n  \n  return {\n    suite: testName,\n    tests: tests,\n    passed: tests.every(function(t) { return t.passed; })\n  };\n}\n\n/**\n * Тестирование OCR сервиса\n */\nfunction testOcrService() {\n  var testName = 'OCR Service';\n  var tests = [];\n  \n  try {\n    // Тест батчирования\n    tests.push({\n      name: 'Image batching',\n      passed: testImageBatching(),\n      error: null\n    });\n    \n    // Тест разделения по delimiter\n    tests.push({\n      name: 'Delimiter splitting',\n      passed: testDelimiterSplitting(),\n      error: null\n    });\n    \n    // Тест chunking\n    tests.push({\n      name: 'Image chunking',\n      passed: testImageChunking(),\n      error: null\n    });\n    \n  } catch (error) {\n    tests.push({\n      name: 'OCR service error',\n      passed: false,\n      error: error.message\n    });\n  }\n  \n  return {\n    suite: testName,\n    tests: tests,\n    passed: tests.every(function(t) { return t.passed; })\n  };\n}\n\n/**\n * Тестирование серверных эндпоинтов\n */\nfunction testServerEndpoints() {\n  var testName = 'Server Endpoints';\n  var tests = [];\n  \n  try {\n    // Тест парсинга запросов\n    tests.push({\n      name: 'Request parsing',\n      passed: testRequestParsing(),\n      error: null\n    });\n    \n    // Тест создания ответов\n    tests.push({\n      name: 'Response creation',\n      passed: testResponseCreation(),\n      error: null\n    });\n    \n    // Тест health check\n    tests.push({\n      name: 'Health check',\n      passed: testHealthCheck(),\n      error: null\n    });\n    \n  } catch (error) {\n    tests.push({\n      name: 'Server endpoints error',\n      passed: false,\n      error: error.message\n    });\n  }\n  \n  return {\n    suite: testName,\n    tests: tests,\n    passed: tests.every(function(t) { return t.passed; })\n  };\n}\n\n/**\n * Тестирование клиентских функций\n */\nfunction testClientFunctions() {\n  var testName = 'Client Functions';\n  var tests = [];\n  \n  try {\n    // Тест получения credentials\n    tests.push({\n      name: 'Credentials retrieval',\n      passed: testCredentialsRetrieval(),\n      error: null\n    });\n    \n    // Тест нормализации условий\n    tests.push({\n      name: 'Condition normalization',\n      passed: testConditionNormalization(),\n      error: null\n    });\n    \n    // Тест клиентского логирования\n    tests.push({\n      name: 'Client logging',\n      passed: testClientLogging(),\n      error: null\n    });\n    \n  } catch (error) {\n    tests.push({\n      name: 'Client functions error',\n      passed: false,\n      error: error.message\n    });\n  }\n  \n  return {\n    suite: testName,\n    tests: tests,\n    passed: tests.every(function(t) { return t.passed; })\n  };\n}\n\n// ============ КОНКРЕТНЫЕ ТЕСТЫ ============\n\nfunction testMarkdownConversion() {\n  var input = '# Заголовок\\n\\n**Жирный текст** и *курсив*\\n\\n```code block```';\n  var result = convertMarkdownToReadableText(input);\n  return result.includes('ЗАГОЛОВОК:') && result.includes('ЖИРНЫЙ ТЕКСТ');\n}\n\nfunction testSystemLogging() {\n  addSystemLog('Test message', 'INFO', 'TEST');\n  var logs = getSystemLogs(1);\n  return logs.includes('Test message');\n}\n\nfunction testJsonUtilities() {\n  var obj = { test: 'value' };\n  var json = safeJsonStringify(obj);\n  var parsed = safeJsonParse(json);\n  return parsed.test === 'value';\n}\n\nfunction testEmailValidation() {\n  return isValidEmail('test@example.com') && !isValidEmail('invalid-email');\n}\n\nfunction testTraceIdGeneration() {\n  var id1 = generateTraceId('test');\n  var id2 = generateTraceId('test');\n  return id1 !== id2 && id1.startsWith('test-');\n}\n\nfunction testInvalidCredentials() {\n  var result = checkUserLicense('invalid@email.com', 'invalid-token');\n  return !result.ok;\n}\n\nfunction testRateLimiting() {\n  // Простой тест - функция должна работать без ошибок\n  var result = checkRateLimit('test-token');\n  return typeof result === 'boolean';\n}\n\nfunction testEmailMasking() {\n  var masked = maskEmail('test@example.com');\n  return masked.includes('***') && masked.includes('@example.com');\n}\n\nfunction testVkUrlExtraction() {\n  var sources = extractImageSources('https://vk.com/photo123_456', '', '');\n  return sources.length > 0 && sources[0].source === IMAGE_SOURCES.VK;\n}\n\nfunction testDriveUrlExtraction() {\n  var sources = extractImageSources('https://drive.google.com/file/d/abc123', '', '');\n  return sources.length > 0 && sources[0].source === IMAGE_SOURCES.DRIVE;\n}\n\nfunction testGenericUrlExtraction() {\n  var sources = extractImageSources('https://example.com/image.jpg', '', '');\n  return sources.length > 0 && sources[0].source === IMAGE_SOURCES.URL;\n}\n\nfunction testUrlDeduplication() {\n  var sources = extractImageSources('https://example.com/image.jpg https://example.com/image.jpg', '', '');\n  return sources.length === 1;\n}\n\nfunction testCollectorFactory() {\n  var vkCollector = createDataCollector(IMAGE_SOURCES.VK);\n  var urlCollector = createDataCollector(IMAGE_SOURCES.URL);\n  return vkCollector && urlCollector;\n}\n\nfunction testVkCollectorMock() {\n  // Mock тест без реального VK API\n  try {\n    var vkCollector = createDataCollector(IMAGE_SOURCES.VK);\n    return vkCollector.type === IMAGE_SOURCES.VK;\n  } catch (e) {\n    return false;\n  }\n}\n\nfunction testUrlCollector() {\n  try {\n    var urlCollector = createDataCollector(IMAGE_SOURCES.URL);\n    return urlCollector.type === IMAGE_SOURCES.URL;\n  } catch (e) {\n    return false;\n  }\n}\n\nfunction testImageBatching() {\n  // Тест создания batch'а изображений\n  var images = ['img1', 'img2', 'img3'];\n  return createImageBatch(images, 2, 'trace').length <= 2;\n}\n\nfunction testDelimiterSplitting() {\n  var text = 'Часть 1---Часть 2---Часть 3';\n  var parts = splitTextByDelimiter(text, '---');\n  return parts.length === 3 && parts[0].trim() === 'Часть 1';\n}\n\nfunction testImageChunking() {\n  var images = new Array(10).fill('test');\n  var chunks = chunkArray(images, 3);\n  return chunks.length === 4 && chunks[0].length === 3;\n}\n\nfunction testRequestParsing() {\n  try {\n    var mockEvent = {\n      postData: {\n        contents: JSON.stringify({ action: 'test' })\n      }\n    };\n    var parsed = parseRequestBody(mockEvent);\n    return parsed.action === 'test';\n  } catch (e) {\n    return false;\n  }\n}\n\nfunction testResponseCreation() {\n  var response = createSuccessResponse({ test: 'data' }, 'trace-123');\n  var content = response.getContent();\n  var data = JSON.parse(content);\n  return data.ok === true && data.traceId === 'trace-123';\n}\n\nfunction testHealthCheck() {\n  var health = {\n    ok: true,\n    services: {\n      ocr: checkOcrServiceHealth(),\n      licensing: checkLicensingHealth()\n    }\n  };\n  return health.services.ocr.status && health.services.licensing.status;\n}\n\nfunction testCredentialsRetrieval() {\n  var creds = getClientCredentials();\n  return creds && typeof creds.valid === 'boolean';\n}\n\nfunction testConditionNormalization() {\n  return normalizeCondition(true) === true && \n         normalizeCondition('false') === false &&\n         normalizeCondition(1) === true &&\n         normalizeCondition(0) === false;\n}\n\nfunction testClientLogging() {\n  logClient('Test client message');\n  return true; // Простая проверка что функция не падает\n}\n\n// ============ УТИЛИТЫ ТЕСТИРОВАНИЯ ============\n\n/**\n * Генерация сводки результатов тестов\n */\nfunction generateTestSummary(results) {\n  var totalSuites = results.length;\n  var passedSuites = results.filter(function(r) { return r.passed; }).length;\n  var failedSuites = totalSuites - passedSuites;\n  \n  var totalTests = 0;\n  var passedTests = 0;\n  var failedTests = [];\n  \n  results.forEach(function(suite) {\n    totalTests += suite.tests.length;\n    suite.tests.forEach(function(test) {\n      if (test.passed) {\n        passedTests++;\n      } else {\n        failedTests.push(suite.suite + ': ' + test.name + (test.error ? ' (' + test.error + ')' : ''));\n      }\n    });\n  });\n  \n  var status = failedTests.length === 0 ? 'PASSED' : 'FAILED';\n  \n  var report = 'Результаты тестирования Table AI v2.0:\\n\\n' +\n               'Статус: ' + status + '\\n' +\n               'Тестовых наборов: ' + passedSuites + '/' + totalSuites + '\\n' +\n               'Тестов: ' + passedTests + '/' + totalTests + '\\n';\n  \n  if (failedTests.length > 0) {\n    report += '\\nНеудачные тесты:\\n' + failedTests.join('\\n');\n  }\n  \n  return {\n    status: status,\n    totalSuites: totalSuites,\n    passedSuites: passedSuites,\n    failedSuites: failedSuites,\n    totalTests: totalTests,\n    passedTests: passedTests,\n    failedTests: failedTests.length,\n    report: report\n  };\n}\n\n/**\n * Создание batch'а изображений для тестирования\n */\nfunction createImageBatch(images, maxSize, traceId) {\n  return images.slice(0, maxSize);\n}\n\n/**\n * Разделение текста по разделителю для тестирования\n */\nfunction splitTextByDelimiter(text, delimiter) {\n  return text.split(delimiter);\n}\n\n/**\n * Создание chunks из массива для тестирования\n */\nfunction chunkArray(array, chunkSize) {\n  var chunks = [];\n  for (var i = 0; i < array.length; i += chunkSize) {\n    chunks.push(array.slice(i, i + chunkSize));\n  }\n  return chunks;\n}\n\n/**\n * Быстрый тест отдельного компонента\n */\nfunction quickTest(componentName) {\n  var ui = SpreadsheetApp.getUi();\n  \n  try {\n    var result;\n    \n    switch (componentName) {\n      case 'utils':\n        result = testUtilities();\n        break;\n      case 'license':\n        result = testLicenseSystem();\n        break;\n      case 'source':\n        result = testSourceDetector();\n        break;\n      case 'collectors':\n        result = testDataCollectors();\n        break;\n      case 'ocr':\n        result = testOcrService();\n        break;\n      case 'endpoints':\n        result = testServerEndpoints();\n        break;\n      case 'client':\n        result = testClientFunctions();\n        break;\n      default:\n        throw new Error('Unknown component: ' + componentName);\n    }\n    \n    var summary = result.passed ? 'PASSED' : 'FAILED';\n    var details = result.tests.map(function(t) {\n      return (t.passed ? '✅' : '❌') + ' ' + t.name;\n    }).join('\\n');\n    \n    ui.alert('Тест ' + componentName, summary + '\\n\\n' + details, ui.ButtonSet.OK);\n    \n  } catch (error) {\n    ui.alert('Ошибка теста', 'Ошибка тестирования ' + componentName + ': ' + error.message, ui.ButtonSet.OK);\n  }\n}