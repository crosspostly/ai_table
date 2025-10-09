/**
 * Comprehensive Testing Suite - All Functions
 * Тестирование ВСЕХ функций системы
 */

/**
 * Main test runner - запуск всех тестов
 */
function runAllTests() {
  Logger.log('='.repeat(60));
  Logger.log('🧪 COMPREHENSIVE TESTING START');
  Logger.log('='.repeat(60));
  
  var results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };
  
  // 1. Test Core Functions
  Logger.log('\n📦 Testing Core Functions...');
  testCoreFunction(results, 'getClientCredentials', testGetClientCredentials);
  testCoreFunction(results, 'callServer', testCallServer);
  testCoreFunction(results, 'logClient', testLogClient);
  
  // 2. Test Menu Functions
  Logger.log('\n📋 Testing Menu Functions...');
  testCoreFunction(results, 'createMenu', testCreateMenu);
  
  // 3. Test OCR Functions
  Logger.log('\n🔍 Testing OCR Functions...');
  testCoreFunction(results, 'extractCellMetadata', testExtractCellMetadata);
  testCoreFunction(results, 'writeOcrResults', testWriteOcrResults);
  
  // 4. Test Utilities
  Logger.log('\n🛠️ Testing Utilities...');
  testCoreFunction(results, 'getOcrOverwriteFlag', testGetOcrOverwriteFlag);
  testCoreFunction(results, 'addSystemLog', testAddSystemLog);
  
  // 5. Test Web Interface
  Logger.log('\n🌐 Testing Web Interface...');
  testCoreFunction(results, 'getSystemStatusData', testGetSystemStatusData);
  
  // Final report
  Logger.log('\n' + '='.repeat(60));
  Logger.log('📊 TEST RESULTS:');
  Logger.log('   Total: ' + results.total);
  Logger.log('   ✅ Passed: ' + results.passed);
  Logger.log('   ❌ Failed: ' + results.failed);
  
  if (results.errors.length > 0) {
    Logger.log('\n❌ FAILED TESTS:');
    results.errors.forEach(function(err) {
      Logger.log('   • ' + err);
    });
  }
  
  Logger.log('='.repeat(60));
  
  // Show UI alert
  var ui = SpreadsheetApp.getUi();
  var message = 'Total: ' + results.total + '\\n' +
                'Passed: ' + results.passed + '\\n' +
                'Failed: ' + results.failed;
  
  if (results.failed === 0) {
    ui.alert('✅ All Tests Passed!', message, ui.ButtonSet.OK);
  } else {
    ui.alert('❌ Tests Failed!', message + '\\n\\nCheck logs for details.', ui.ButtonSet.OK);
  }
  
  return results;
}

/**
 * Test a single function
 */
function testCoreFunction(results, name, testFunc) {
  results.total++;
  
  try {
    testFunc();
    results.passed++;
    Logger.log('   ✅ ' + name + ' - PASSED');
    return true;
  } catch (e) {
    results.failed++;
    var error = name + ': ' + e.message;
    results.errors.push(error);
    Logger.log('   ❌ ' + name + ' - FAILED: ' + e.message);
    return false;
  }
}

// ========== INDIVIDUAL TESTS ==========

/**
 * Test: getClientCredentials
 */
function testGetClientCredentials() {
  // Check function exists
  if (typeof getClientCredentials !== 'function') {
    throw new Error('Function getClientCredentials not defined!');
  }
  
  // Call function
  var result = getClientCredentials();
  
  // Check structure
  if (!result || typeof result !== 'object') {
    throw new Error('Result is not an object');
  }
  
  if (!result.hasOwnProperty('ok')) {
    throw new Error('Result missing "ok" property');
  }
  
  // If ok=false, should have error
  if (!result.ok && !result.error) {
    throw new Error('Result has ok=false but no error message');
  }
  
  // If ok=true, should have credentials
  if (result.ok) {
    if (!result.email || !result.token) {
      throw new Error('Result has ok=true but missing credentials');
    }
  }
  
  Logger.log('      → Result: ok=' + result.ok + ', email=' + (result.email || 'N/A'));
}

/**
 * Test: callServer
 */
function testCallServer() {
  // Check function exists
  if (typeof callServer !== 'function') {
    throw new Error('Function callServer not defined!');
  }
  
  // We can't actually call server without credentials
  // Just check it's defined
  Logger.log('      → Function defined');
}

/**
 * Test: logClient
 */
function testLogClient() {
  // Check function exists
  if (typeof logClient !== 'function') {
    throw new Error('Function logClient not defined!');
  }
  
  // Try to log a test message
  try {
    logClient('Test message from comprehensive test');
    Logger.log('      → Log successful');
  } catch (e) {
    throw new Error('Failed to log: ' + e.message);
  }
}

/**
 * Test: createMenu
 */
function testCreateMenu() {
  // Check function exists
  if (typeof onOpen !== 'function') {
    throw new Error('Function onOpen not defined!');
  }
  
  // Try to create menu
  try {
    onOpen();
    Logger.log('      → Menu created');
  } catch (e) {
    throw new Error('Failed to create menu: ' + e.message);
  }
}

/**
 * Test: extractCellMetadata
 */
function testExtractCellMetadata() {
  // Check function exists
  if (typeof extractCellMetadata !== 'function') {
    throw new Error('Function extractCellMetadata not defined!');
  }
  
  // Get a test cell
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var cell = sheet.getRange('A1');
  
  // Extract metadata
  var meta = extractCellMetadata(cell);
  
  // Check structure
  if (!meta || typeof meta !== 'object') {
    throw new Error('Result is not an object');
  }
  
  Logger.log('      → Metadata extracted');
}

/**
 * Test: writeOcrResults
 */
function testWriteOcrResults() {
  // Check function exists
  if (typeof writeOcrResults !== 'function') {
    throw new Error('Function writeOcrResults not defined!');
  }
  
  Logger.log('      → Function defined');
}

/**
 * Test: getOcrOverwriteFlag
 */
function testGetOcrOverwriteFlag() {
  // Check function exists
  if (typeof getOcrOverwriteFlag !== 'function') {
    throw new Error('Function getOcrOverwriteFlag not defined!');
  }
  
  // Call function
  var flag = getOcrOverwriteFlag();
  
  // Should return boolean
  if (typeof flag !== 'boolean') {
    throw new Error('Result is not a boolean: ' + typeof flag);
  }
  
  Logger.log('      → Flag: ' + flag);
}

/**
 * Test: addSystemLog
 */
function testAddSystemLog() {
  // Check function exists
  if (typeof addSystemLog !== 'function') {
    throw new Error('Function addSystemLog not defined!');
  }
  
  // Try to log
  try {
    addSystemLog('Test log message', 'INFO', 'TEST');
    Logger.log('      → Log added');
  } catch (e) {
    throw new Error('Failed to add log: ' + e.message);
  }
}

/**
 * Test: getSystemStatusData
 */
function testGetSystemStatusData() {
  // Check function exists
  if (typeof getSystemStatusData !== 'function') {
    throw new Error('Function getSystemStatusData not defined!');
  }
  
  // Call function
  var status = getSystemStatusData();
  
  // Check structure
  if (!status || typeof status !== 'object') {
    throw new Error('Result is not an object');
  }
  
  // Should have credentialsOk property
  if (!status.hasOwnProperty('credentialsOk')) {
    throw new Error('Missing credentialsOk property');
  }
  
  Logger.log('      → Status: credentials=' + status.credentialsOk);
}

// ========== FUNCTION EXISTENCE CHECKER ==========

/**
 * Check all required functions exist
 */
function checkAllFunctionsExist() {
  Logger.log('\n🔍 Checking function existence...\n');
  
  var requiredFunctions = [
    // Core
    'getClientCredentials',
    'callServer',
    'logClient',
    'addSystemLog',
    
    // Menu
    'onOpen',
    'createMenu',
    
    // OCR
    'ocrReviews',
    'extractCellMetadata',
    'writeOcrResults',
    'getOcrOverwriteFlag',
    
    // Social
    'importSocialPosts',
    
    // Web
    'openWebInterface',
    'getSystemStatusData',
    
    // License
    'checkLicenseStatusUI',
    'setLicenseCredentialsUI'
  ];
  
  var missing = [];
  var found = [];
  
  requiredFunctions.forEach(function(funcName) {
    try {
      var func = eval(funcName);
      if (typeof func === 'function') {
        found.push(funcName);
        Logger.log('   ✅ ' + funcName);
      } else {
        missing.push(funcName);
        Logger.log('   ❌ ' + funcName + ' (not a function)');
      }
    } catch (e) {
      missing.push(funcName);
      Logger.log('   ❌ ' + funcName + ' (not defined)');
    }
  });
  
  Logger.log('\n📊 SUMMARY:');
  Logger.log('   Found: ' + found.length + '/' + requiredFunctions.length);
  Logger.log('   Missing: ' + missing.length);
  
  if (missing.length > 0) {
    Logger.log('\n❌ MISSING FUNCTIONS:');
    missing.forEach(function(name) {
      Logger.log('   • ' + name);
    });
  }
  
  var ui = SpreadsheetApp.getUi();
  if (missing.length === 0) {
    ui.alert('✅ All Functions Exist!', 'Found: ' + found.length + '/' + requiredFunctions.length, ui.ButtonSet.OK);
  } else {
    ui.alert('❌ Missing Functions!', 'Found: ' + found.length + '\\nMissing: ' + missing.length + '\\n\\nCheck logs for details.', ui.ButtonSet.OK);
  }
  
  return {
    found: found,
    missing: missing,
    total: requiredFunctions.length
  };
}

/**
 * Quick test - just check if main functions work
 */
function quickTest() {
  Logger.log('⚡ Quick Test Start...\n');
  
  var tests = [
    { name: 'getClientCredentials', test: function() { return getClientCredentials(); } },
    { name: 'Menu creation', test: function() { onOpen(); return true; } },
    { name: 'System status', test: function() { return getSystemStatusData(); } }
  ];
  
  var passed = 0;
  var failed = 0;
  
  tests.forEach(function(t) {
    try {
      var result = t.test();
      Logger.log('✅ ' + t.name + ' - OK');
      passed++;
    } catch (e) {
      Logger.log('❌ ' + t.name + ' - FAILED: ' + e.message);
      failed++;
    }
  });
  
  Logger.log('\n⚡ Quick Test Complete: ' + passed + '/' + tests.length + ' passed');
  
  SpreadsheetApp.getUi().alert('Quick Test', passed + '/' + tests.length + ' tests passed', SpreadsheetApp.getUi().ButtonSet.OK);
}
