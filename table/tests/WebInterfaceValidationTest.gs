/**
 * Validation tests for Web Interface v1.0
 * Проверка веб-интерфейса перед релизом
 */

function testWebInterfaceValidation() {
  var results = [];
  
  try {
    // Тест 1: Проверка функции openWebInterface
    results.push(testOpenWebInterface());
    
    // Тест 2: Проверка API функций
    results.push(testWebApiSocialImport());
    results.push(testWebApiOcrAnalysis());
    results.push(testWebApiSaveSettings());
    results.push(testWebApiTestConnection());
    
    // Тест 3: Проверка интеграции с существующими функциями
    results.push(testExistingFunctionIntegration());
    
    // Тест 4: Проверка HTML файлов
    results.push(testHtmlFileStructure());
    
    // Сводный отчет
    var passed = results.filter(r => r.status === 'PASS').length;
    var total = results.length;
    
    console.log('=== WEB INTERFACE VALIDATION RESULTS ===');
    console.log('Passed: ' + passed + '/' + total + ' tests');
    
    results.forEach(function(result) {
      console.log(result.status + ': ' + result.test + ' - ' + result.message);
    });
    
    return {
      success: passed === total,
      passed: passed,
      total: total,
      results: results
    };
    
  } catch (error) {
    console.error('Test suite error: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

function testOpenWebInterface() {
  try {
    // Проверяем что функция существует
    if (typeof openWebInterface !== 'function') {
      return {test: 'openWebInterface', status: 'FAIL', message: 'Function not found'};
    }
    
    // Проверяем базовую структуру (не запускаем UI)
    var testCode = openWebInterface.toString();
    if (testCode.indexOf('HtmlService') === -1) {
      return {test: 'openWebInterface', status: 'FAIL', message: 'HtmlService not used'};
    }
    
    if (testCode.indexOf('RealisticWebApp') === -1) {
      return {test: 'openWebInterface', status: 'FAIL', message: 'RealisticWebApp not referenced'};
    }
    
    return {test: 'openWebInterface', status: 'PASS', message: 'Function structure valid'};
    
  } catch (error) {
    return {test: 'openWebInterface', status: 'FAIL', message: error.message};
  }
}

function testWebApiSocialImport() {
  try {
    if (typeof webApiSocialImport !== 'function') {
      return {test: 'webApiSocialImport', status: 'FAIL', message: 'Function not found'};
    }
    
    // Тест с недостающими параметрами
    var result = webApiSocialImport({});
    if (!result || result.success !== false) {
      return {test: 'webApiSocialImport', status: 'FAIL', message: 'Validation not working'};
    }
    
    return {test: 'webApiSocialImport', status: 'PASS', message: 'Parameter validation works'};
    
  } catch (error) {
    return {test: 'webApiSocialImport', status: 'FAIL', message: error.message};
  }
}

function testWebApiOcrAnalysis() {
  try {
    if (typeof webApiOcrAnalysis !== 'function') {
      return {test: 'webApiOcrAnalysis', status: 'FAIL', message: 'Function not found'};
    }
    
    // Базовый тест структуры
    var testCode = webApiOcrAnalysis.toString();
    if (testCode.indexOf('PropertiesService') === -1) {
      return {test: 'webApiOcrAnalysis', status: 'FAIL', message: 'PropertiesService not used'};
    }
    
    return {test: 'webApiOcrAnalysis', status: 'PASS', message: 'Function structure valid'};
    
  } catch (error) {
    return {test: 'webApiOcrAnalysis', status: 'FAIL', message: error.message};
  }
}

function testWebApiSaveSettings() {
  try {
    if (typeof webApiSaveSettings !== 'function') {
      return {test: 'webApiSaveSettings', status: 'FAIL', message: 'Function not found'};
    }
    
    // Тест сохранения пустых настроек
    var result = webApiSaveSettings({});
    if (!result || result.success !== true) {
      return {test: 'webApiSaveSettings', status: 'FAIL', message: 'Empty settings should succeed'};
    }
    
    return {test: 'webApiSaveSettings', status: 'PASS', message: 'Settings API works'};
    
  } catch (error) {
    return {test: 'webApiSaveSettings', status: 'FAIL', message: error.message};
  }
}

function testWebApiTestConnection() {
  try {
    if (typeof webApiTestConnection !== 'function') {
      return {test: 'webApiTestConnection', status: 'FAIL', message: 'Function not found'};
    }
    
    // Базовый тест - функция должна возвращать объект
    var result = webApiTestConnection();
    if (!result || typeof result !== 'object') {
      return {test: 'webApiTestConnection', status: 'FAIL', message: 'Invalid return type'};
    }
    
    return {test: 'webApiTestConnection', status: 'PASS', message: 'Connection test API works'};
    
  } catch (error) {
    return {test: 'webApiTestConnection', status: 'FAIL', message: error.message};
  }
}

function testExistingFunctionIntegration() {
  try {
    var missing = [];
    
    // Проверяем ключевые интеграционные функции
    if (typeof getClientCredentials !== 'function') missing.push('getClientCredentials');
    if (typeof getSystemStatusData !== 'function') missing.push('getSystemStatusData');
    if (typeof getRecentResults !== 'function') missing.push('getRecentResults');
    
    if (missing.length > 0) {
      return {test: 'existingFunctionIntegration', status: 'FAIL', message: 'Missing: ' + missing.join(', ')};
    }
    
    return {test: 'existingFunctionIntegration', status: 'PASS', message: 'All integration functions available'};
    
  } catch (error) {
    return {test: 'existingFunctionIntegration', status: 'FAIL', message: error.message};
  }
}

function testHtmlFileStructure() {
  try {
    // Проверяем что HTML файл может быть создан (косвенный тест)
    try {
      var testHtml = HtmlService.createHtmlOutputFromFile('RealisticWebApp');
      if (!testHtml) {
        return {test: 'htmlFileStructure', status: 'FAIL', message: 'Cannot create HTML from RealisticWebApp'};
      }
    } catch (e) {
      return {test: 'htmlFileStructure', status: 'FAIL', message: 'RealisticWebApp.html not found or invalid'};
    }
    
    return {test: 'htmlFileStructure', status: 'PASS', message: 'HTML file structure valid'};
    
  } catch (error) {
    return {test: 'htmlFileStructure', status: 'FAIL', message: error.message};
  }
}

/**
 * Быстрый smoke test для pre-deploy валидации
 */
function quickWebInterfaceSmokeTest() {
  console.log('Running quick web interface smoke test...');
  
  var criticalTests = [
    'openWebInterface function exists',
    'webApiSocialImport function exists', 
    'webApiTestConnection function exists',
    'HTML file accessibility'
  ];
  
  var results = [];
  
  // Критические проверки
  results.push(typeof openWebInterface === 'function' ? 'PASS' : 'FAIL');
  results.push(typeof webApiSocialImport === 'function' ? 'PASS' : 'FAIL');
  results.push(typeof webApiTestConnection === 'function' ? 'PASS' : 'FAIL');
  
  try {
    HtmlService.createHtmlOutputFromFile('RealisticWebApp');
    results.push('PASS');
  } catch (e) {
    results.push('FAIL');
  }
  
  var passed = results.filter(r => r === 'PASS').length;
  console.log('Quick smoke test: ' + passed + '/' + results.length + ' passed');
  
  return passed === results.length;
}