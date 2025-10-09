/**
 * Comprehensive Test Suite for AI_TABLE
 * Тестирует все основные компоненты системы
 */

// Глобальные переменные для результатов тестов
var testResults = {
  passed: 0,
  failed: 0,
  errors: 0,
  details: []
};

/**
 * Запуск всех тестов
 */
function runAllTests() {
  // Сброс результатов
  testResults = {
    passed: 0,
    failed: 0,
    errors: 0,
    details: []
  };
  
  addSystemLog('INFO: Starting comprehensive test suite');
  
  // Запуск тестов по категориям
  runCriticalTests();
  runClientTests();
  runServerTests();
  runWebInterfaceTests();
  runIntegrationTests();
  
  // Показать результаты
  showTestResults();
  
  return testResults;
}

/**
 * Критические тесты - основные функции
 */
function runCriticalTests() {
  // 1. Проверка credentials functions
  addTestResult('getClientCredentials', function() {
    return typeof getClientCredentials === 'function';
  });
  
  // 2. Проверка license validation
  addTestResult('validateLicenseForGM', function() {
    return typeof validateLicenseForGM === 'function';
  });
  
  // 3. Проверка SERVER_API_URL
  addTestResult('SERVER_API_URL config', function() {
    return typeof SERVER_API_URL === 'string' && SERVER_API_URL.length > 0;
  });
  
  // 4. Проверка logging system
  addTestResult('addSystemLog', function() {
    addSystemLog('Test log entry', 'INFO', 'TEST');
    return true;
  });
}

/**
 * Клиентские тесты
 */
function runClientTests() {
  // 1. GM function availability
  addTestResult('GM function', function() {
    return typeof GM === 'function';
  });
  
  // 2. Menu creation
  addTestResult('Menu creation', function() {
    return typeof onOpen === 'function';
  });
  
  // 3. Credentials UI
  addTestResult('setupAllCredentialsUI', function() {
    return typeof setupAllCredentialsUI === 'function';
  });
  
  // 4. Chat mode functions
  addTestResult('Chat mode functions', function() {
    return typeof enterChatMode === 'function';
  });
  
  // 5. Smart prompts
  addTestResult('Smart prompts', function() {
    return typeof processSmartPrompt === 'function';
  });
}

/**
 * Серверные тесты
 */
function runServerTests() {
  // 1. Server ping
  addTestResult('Server ping', function() {
    try {
      var response = UrlFetchApp.fetch(SERVER_API_URL + '/ping', {
        method: 'GET',
        muteHttpExceptions: true
      });
      return response.getResponseCode() === 200;
    } catch (e) {
      return false;
    }
  });
  
  // 2. License validation endpoint
  addTestResult('Server license validation', function() {
    return typeof validateServerLicense === 'function';
  });
  
  // 3. VK import API
  addTestResult('VK import API', function() {
    return typeof importVkPosts === 'function';
  });
  
  // 4. OCR service
  addTestResult('OCR service', function() {
    return typeof processOCRRequest === 'function';
  });
}

/**
 * Web Interface тесты
 */
function runWebInterfaceTests() {
  // 1. Web interface opening
  addTestResult('openWebInterface', function() {
    return typeof openWebInterface === 'function';
  });
  
  // 2. System status
  addTestResult('getSystemStatusData', function() {
    return typeof getSystemStatusData === 'function';
  });
  
  // 3. Social import
  addTestResult('importSocialPosts', function() {
    return typeof importSocialPosts === 'function';
  });
  
  // 4. Gemini connection test
  addTestResult('testGeminiConnection', function() {
    return typeof testGeminiConnection === 'function';
  });
}

/**
 * Интеграционные тесты
 */
function runIntegrationTests() {
  // 1. Client-Server communication
  addTestResult('Client-Server communication', function() {
    return typeof callServerFunction === 'function';
  });
  
  // 2. Sheet operations
  addTestResult('Sheet operations', function() {
    var sheet = SpreadsheetApp.getActiveSheet();
    return sheet !== null;
  });
  
  // 3. Properties management
  addTestResult('Properties management', function() {
    var props = PropertiesService.getScriptProperties();
    return props !== null;
  });
  
  // 4. Error handling
  addTestResult('Error handling', function() {
    return typeof handleGMError === 'function';
  });
}

/**
 * Добавление результата теста
 */
function addTestResult(testName, testFunction) {
  try {
    var result = testFunction();
    if (result) {
      testResults.passed++;
      testResults.details.push(`✅ ${testName}`);
    } else {
      testResults.failed++;
      testResults.details.push(`❌ ${testName}: Failed`);
    }
  } catch (error) {
    testResults.errors++;
    testResults.details.push(`💥 ${testName}: ${error.message}`);
  }
}

/**
 * Показать результаты тестов
 */
function showTestResults() {
  var total = testResults.passed + testResults.failed + testResults.errors;
  var successRate = total > 0 ? Math.round((testResults.passed / total) * 100) : 0;
  
  var message = `🧪 TEST RESULTS\n\n`;
  message += `📊 Summary:\n`;
  message += `✅ Passed: ${testResults.passed}\n`;
  message += `❌ Failed: ${testResults.failed}\n`;
  message += `💥 Errors: ${testResults.errors}\n`;
  message += `📈 Success Rate: ${successRate}%\n\n`;
  
  if (testResults.details.length > 0) {
    message += `Details:\n`;
    testResults.details.slice(0, 10).forEach(detail => {
      message += `${detail}\n`;
    });
    
    if (testResults.details.length > 10) {
      message += `... and ${testResults.details.length - 10} more\n`;
    }
  }
  
  SpreadsheetApp.getUi().alert('Test Results', message, SpreadsheetApp.getUi().ButtonSet.OK);
  
  addSystemLog(`Test completed: ${successRate}% success rate`, 'INFO', 'TEST');
}

/**
 * Быстрый тест критических функций
 */
function quickTest() {
  testResults = {
    passed: 0,
    failed: 0,
    errors: 0,
    details: []
  };
  
  runCriticalTests();
  showTestResults();
  
  return testResults;
}

/**
 * Проверка существования всех необходимых функций
 */
function checkAllFunctionsExist() {
  var requiredFunctions = [
    'GM',
    'onOpen',
    'setupAllCredentialsUI',
    'getClientCredentials',
    'validateLicenseForGM',
    'addSystemLog',
    'handleGMError'
  ];
  
  var missing = [];
  
  requiredFunctions.forEach(function(funcName) {
    if (typeof this[funcName] !== 'function') {
      missing.push(funcName);
    }
  });
  
  if (missing.length > 0) {
    var message = `❌ Missing functions:\n${missing.join('\n')}`;
    SpreadsheetApp.getUi().alert('Function Check', message, SpreadsheetApp.getUi().ButtonSet.OK);
    return false;
  } else {
    SpreadsheetApp.getUi().alert('Function Check', '✅ All required functions are present', SpreadsheetApp.getUi().ButtonSet.OK);
    return true;
  }
}