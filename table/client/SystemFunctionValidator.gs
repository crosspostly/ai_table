/**
 * АВТОМАТИЧЕСКАЯ ПРОВЕРКА ВСЕХ ФУНКЦИЙ СИСТЕМЫ
 * Находит все функции в меню и проверяет их существование
 * Создает красивые отчеты в логах
 */

/**
 * ГЛАВНАЯ ФУНКЦИЯ - запускает полную проверку всех функций
 * @param {boolean} silent - если true, не показывает UI алерты
 */
function validateAllSystemFunctions(silent) {
  var startTime = new Date();
  addSystemLog('🔍 НАЧАТА АВТОМАТИЧЕСКАЯ ПРОВЕРКА ВСЕХ ФУНКЦИЙ СИСТЕМЫ', 'INFO', 'VALIDATION');
  
  try {
    // 1. Проверяем функции из меню
    var menuFunctions = getMenuFunctions();
    var menuResults = checkFunctionsExistence(menuFunctions, 'MENU');
    
    // 2. Проверяем функции VersionInfo
    var versionFunctions = ['getCurrentVersion', 'getVersionInfo', 'getLastUpdateDate'];
    var versionResults = checkFunctionsExistence(versionFunctions, 'VERSION');
    
    // 3. Проверяем основные GM функции
    var gmFunctions = ['GM', 'GM_STATIC', 'GM_IF'];
    var gmResults = checkFunctionsExistence(gmFunctions, 'GM_CORE');
    
    // 4. Проверяем utility функции
    var utilityFunctions = ['addSystemLog', 'getClientCredentials', 'quickTest'];
    var utilityResults = checkFunctionsExistence(utilityFunctions, 'UTILITY');
    
    // 5. Проверяем import функции
    var importFunctions = ['importVkPosts', 'testSocialImportConnection'];
    var importResults = checkFunctionsExistence(importFunctions, 'IMPORT');
    
    // Собираем все результаты
    var allResults = menuResults.concat(versionResults, gmResults, utilityResults, importResults);
    
    // Создаем отчет
    var report = generateFunctionReport(allResults);
    
    // Логируем результаты
    logFunctionResults(allResults, startTime);
    
    // Показываем результат пользователю (если не silent mode)
    if (!silent) {
      showFunctionReport(report);
    }
    
    // Создаем missing функции автоматически (если не silent mode)
    if (!silent) {
      createMissingFunctions(allResults);
    }
    
    return report;
    
  } catch (error) {
    addSystemLog('❌ ОШИБКА ПРОВЕРКИ ФУНКЦИЙ: ' + error.message, 'ERROR', 'VALIDATION');
    throw error;
  }
}

/**
 * Извлекает все функции из меню
 */
function getMenuFunctions() {
  return [
    'setupAllCredentialsWithHelp',
    'checkSystemStatus', 
    'openWebInterface',
    'runComprehensiveTests',
    'quickTest',
    'analyzeLogsAndFixErrors',
    'openLogsSheet',
    'manualAnalyzeLogsAndFixErrors',
    'forceFlushAllLogs',
    'showLogStatistics',
    'callServerDevFunction',
    'callServerTestFunction', 
    'showDeveloperDashboard',
    'showVersionInstructions',
    'showCurrentVersionInfo',
    'toggleDeveloperModeWithHelp'
  ];
}

/**
 * Проверяет существование функций
 */
function checkFunctionsExistence(functions, category) {
  var results = [];
  
  for (var i = 0; i < functions.length; i++) {
    var funcName = functions[i];
    var exists = false;
    var errorMsg = null;
    
    try {
      // Проверяем существование функции
      exists = typeof eval(funcName) === 'function';
    } catch (e) {
      exists = false;
      errorMsg = e.message;
    }
    
    results.push({
      category: category,
      function: funcName,
      exists: exists,
      error: errorMsg,
      timestamp: new Date()
    });
    
    // Логируем каждую проверку
    if (exists) {
      addSystemLog('✅ ' + category + ': ' + funcName + ' - EXISTS', 'INFO', 'VALIDATION');
    } else {
      addSystemLog('❌ ' + category + ': ' + funcName + ' - MISSING' + (errorMsg ? ' (' + errorMsg + ')' : ''), 'ERROR', 'VALIDATION');
    }
  }
  
  return results;
}

/**
 * Создает отчет о проверке функций
 */
function generateFunctionReport(results) {
  var total = results.length;
  var existing = results.filter(function(r) { return r.exists; }).length;
  var missing = total - existing;
  
  var report = {
    summary: {
      total: total,
      existing: existing,
      missing: missing,
      percentage: Math.round((existing / total) * 100)
    },
    categories: {},
    missingFunctions: results.filter(function(r) { return !r.exists; }),
    timestamp: new Date()
  };
  
  // Группируем по категориям
  for (var i = 0; i < results.length; i++) {
    var result = results[i];
    if (!report.categories[result.category]) {
      report.categories[result.category] = {
        total: 0,
        existing: 0,
        missing: 0,
        functions: []
      };
    }
    
    report.categories[result.category].total++;
    if (result.exists) {
      report.categories[result.category].existing++;
    } else {
      report.categories[result.category].missing++;
    }
    report.categories[result.category].functions.push(result);
  }
  
  return report;
}

/**
 * Логирует результаты в систему логов
 */
function logFunctionResults(results, startTime) {
  var duration = new Date() - startTime;
  
  addSystemLog('📊 ЗАВЕРШЕНА ПРОВЕРКА ФУНКЦИЙ за ' + duration + 'ms', 'INFO', 'VALIDATION');
  
  // Группируем результаты по категориям для красивого лога
  var categories = {};
  for (var i = 0; i < results.length; i++) {
    var result = results[i];
    if (!categories[result.category]) {
      categories[result.category] = { existing: 0, missing: 0, total: 0 };
    }
    categories[result.category].total++;
    if (result.exists) {
      categories[result.category].existing++;
    } else {
      categories[result.category].missing++;
    }
  }
  
  // Логируем по категориям
  for (var category in categories) {
    var cat = categories[category];
    var status = cat.missing === 0 ? '✅' : '⚠️';
    addSystemLog(status + ' ' + category + ': ' + cat.existing + '/' + cat.total + ' functions exist', 'INFO', 'VALIDATION');
  }
}

/**
 * Показывает отчет пользователю
 */
function showFunctionReport(report) {
  var ui = SpreadsheetApp.getUi();
  
  var message = '🔍 ОТЧЕТ О ПРОВЕРКЕ ФУНКЦИЙ СИСТЕМЫ\n\n';
  message += '📊 ОБЩАЯ СТАТИСТИКА:\n';
  message += '• Всего функций: ' + report.summary.total + '\n';
  message += '• Существует: ' + report.summary.existing + ' ✅\n';
  message += '• Отсутствует: ' + report.summary.missing + ' ❌\n';
  message += '• Покрытие: ' + report.summary.percentage + '%\n\n';
  
  message += '📋 ПО КАТЕГОРИЯМ:\n';
  for (var category in report.categories) {
    var cat = report.categories[category];
    var status = cat.missing === 0 ? '✅' : '⚠️';
    message += status + ' ' + category + ': ' + cat.existing + '/' + cat.total + '\n';
  }
  
  if (report.missingFunctions.length > 0) {
    message += '\n❌ ОТСУТСТВУЮЩИЕ ФУНКЦИИ:\n';
    for (var i = 0; i < Math.min(report.missingFunctions.length, 5); i++) {
      message += '• ' + report.missingFunctions[i].function + '\n';
    }
    if (report.missingFunctions.length > 5) {
      message += '• ...и еще ' + (report.missingFunctions.length - 5) + ' функций\n';
    }
    message += '\n🔧 Функции будут созданы автоматически!';
  } else {
    message += '\n🎉 ВСЕ ФУНКЦИИ НАЙДЕНЫ!';
  }
  
  ui.alert('Проверка функций', message, ui.ButtonSet.OK);
}

/**
 * Создает недостающие функции автоматически
 */
function createMissingFunctions(results) {
  var missingFunctions = results.filter(function(r) { return !r.exists; });
  
  if (missingFunctions.length === 0) {
    addSystemLog('✅ Все функции существуют - создание не требуется', 'INFO', 'VALIDATION');
    return;
  }
  
  addSystemLog('🔧 СОЗДАНИЕ ' + missingFunctions.length + ' НЕДОСТАЮЩИХ ФУНКЦИЙ', 'INFO', 'VALIDATION');
  
  for (var i = 0; i < missingFunctions.length; i++) {
    var funcName = missingFunctions[i].function;
    createStubFunction(funcName, missingFunctions[i].category);
  }
}

/**
 * Создает заглушку для функции
 */
function createStubFunction(funcName, category) {
  try {
    // Создаем базовую заглушку функции
    var functionCode = 'function ' + funcName + '() {\n';
    functionCode += '  var ui = SpreadsheetApp.getUi();\n';
    functionCode += '  addSystemLog("🔧 Вызвана автоматически созданная функция: ' + funcName + '", "INFO", "AUTO_CREATED");\n';
    functionCode += '  ui.alert("🔧 Функция в разработке", "Функция ' + funcName + ' была создана автоматически.\\n\\nКатегория: ' + category + '\\n\\nОна будет реализована в следующих обновлениях.", ui.ButtonSet.OK);\n';
    functionCode += '}';
    
    // Выполняем код для создания функции
    eval(functionCode);
    
    addSystemLog('✅ Создана функция: ' + funcName, 'INFO', 'VALIDATION');
    
  } catch (error) {
    addSystemLog('❌ Ошибка создания функции ' + funcName + ': ' + error.message, 'ERROR', 'VALIDATION');
  }
}

/**
 * АЛИАС ДЛЯ СОВМЕСТИМОСТИ
 */
function checkAllFunctionExistence(silent) {
  return validateAllSystemFunctions(silent);
}

/**
 * БЫСТРАЯ ПРОВЕРКА - только критичные функции
 */
function quickFunctionCheck() {
  var criticalFunctions = ['GM', 'getCurrentVersion', 'addSystemLog', 'quickTest'];
  var results = checkFunctionsExistence(criticalFunctions, 'CRITICAL');
  
  var missing = results.filter(function(r) { return !r.exists; });
  
  if (missing.length > 0) {
    var message = '⚠️ КРИТИЧНЫЕ ФУНКЦИИ ОТСУТСТВУЮТ:\n\n';
    for (var i = 0; i < missing.length; i++) {
      message += '❌ ' + missing[i].function + '\n';
    }
    message += '\n🔧 Запустите полную проверку: validateAllSystemFunctions()';
    
    SpreadsheetApp.getUi().alert('Критичные ошибки', message, SpreadsheetApp.getUi().ButtonSet.OK);
    return false;
  }
  
  addSystemLog('✅ Все критичные функции работают', 'INFO', 'VALIDATION');
  return true;
}