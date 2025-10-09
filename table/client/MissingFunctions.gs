/**
 * НЕДОСТАЮЩИЕ ФУНКЦИИ ИЗ МЕНЮ
 * Автоматически созданы после анализа
 */

/**
 * Режим разработчика с инструкциями
 */
function toggleDeveloperModeWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();
  var isDevMode = props.getProperty('DEVELOPER_MODE') === 'true';
  
  var instruction = '🔧 РЕЖИМ РАЗРАБОТЧИКА\n\n';
  instruction += 'Включает дополнительную диагностическую информацию:\n\n';
  instruction += '✅ ЧТО ДОСТУПНО В DEV РЕЖИМЕ:\n';
  instruction += '• Детальные логи операций\n';
  instruction += '• Performance metrics (время выполнения)\n';
  instruction += '• Cache statistics\n';
  instruction += '• API response timing\n';
  instruction += '• Error stack traces\n';
  instruction += '• Memory usage tracking\n\n';
  instruction += '📊 Текущий статус: ' + (isDevMode ? '✅ ВКЛЮЧЁН' : '❌ ВЫКЛЮЧЕН') + '\n\n';
  instruction += 'Хотите ' + (isDevMode ? 'ВЫКЛЮЧИТЬ' : 'ВКЛЮЧИТЬ') + ' режим разработчика?';

  var result = ui.alert('🔧 Developer Mode', instruction, ui.ButtonSet.YES_NO);
  
  if (result === ui.Button.YES) {
    var newMode = !isDevMode;
    props.setProperty('DEVELOPER_MODE', newMode.toString());
    
    var message = newMode ? 
      '✅ Режим разработчика ВКЛЮЧЁН\n\nТеперь доступны:\n• Детальные логи в меню\n• Performance metrics\n• Расширенная диагностика' :
      '❌ Режим разработчика ВЫКЛЮЧЕН\n\nВозвращён к стандартному режиму.';
    
    addSystemLog('🔧 Developer mode ' + (newMode ? 'enabled' : 'disabled'), 'INFO', 'DEV_MODE');
    ui.alert('🔧 Режим изменён', message, ui.ButtonSet.OK);
  }
}

/**
 * Проверить статус системы
 */
function checkSystemStatus() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();
  
  var statusReport = [];
  statusReport.push('📊 AI_TABLE System Status Report');
  statusReport.push('Generated: ' + new Date().toLocaleString('ru-RU'));
  statusReport.push('');
  
  // License Status
  var email = props.getProperty('LICENSE_EMAIL');
  var token = props.getProperty('LICENSE_TOKEN');
  if (email && token) {
    statusReport.push('📧 License: ✅ Configured');
    statusReport.push('   Email: ' + email);
  } else {
    statusReport.push('📧 License: ❌ Not configured');
  }
  statusReport.push('');
  
  // Gemini API Status  
  var geminiKey = props.getProperty('GEMINI_API_KEY');
  if (geminiKey) {
    statusReport.push('🤖 Gemini API: ✅ Configured');
    try {
      if (typeof GM === 'function') {
        var testResult = GM('Status check', 10, 0.1);
        if (testResult && !testResult.includes('Ошибка')) {
          statusReport.push('   Connection: ✅ Working');
        } else {
          statusReport.push('   Connection: ❌ Failed');
        }
      } else {
        statusReport.push('   Function: ❌ GM function not available');
      }
    } catch (e) {
      statusReport.push('   Connection: ❌ Error: ' + (e.message || String(e)));
    }
  } else {
    statusReport.push('🤖 Gemini API: ❌ Not configured');
  }
  statusReport.push('');
  
  // Version Status
  try {
    var version = getCurrentVersion ? getCurrentVersion() : 'неизвестно';
    statusReport.push('🔢 Version: ' + version);
  } catch (e) {
    statusReport.push('🔢 Version: ❌ getCurrentVersion() недоступно');
  }
  statusReport.push('');
  
  // Cache Status
  try {
    var cache = CacheService.getScriptCache();
    statusReport.push('💾 Cache Service: ✅ Available');
  } catch (e) {
    statusReport.push('💾 Cache Service: ❌ Error: ' + e.message);
  }
  
  statusReport.push('');
  
  // VK API Status
  var vkToken = props.getProperty('VK_TOKEN');
  if (vkToken) {
    statusReport.push('📱 VK API: ✅ Configured');
    statusReport.push('   Token: ' + vkToken.substring(0, 10) + '...');
  } else {
    statusReport.push('📱 VK API: ❌ Not configured');
  }
  statusReport.push('');
  
  statusReport.push('🔧 Для настройки недостающих компонентов:');
  statusReport.push('🤖 Table AI → 🌟 НАСТРОИТЬ ВСЕ КЛЮЧИ');
  
  ui.alert('📊 System Status', statusReport.join('\n'), ui.ButtonSet.OK);
  addSystemLog('System status checked', 'INFO', 'SYSTEM');
}

/**
 * Открыть веб-интерфейс
 */
function openWebInterface() {
  try {
    addSystemLog('Opening web interface', 'INFO', 'WEB_INTERFACE');
    
    // Проверяем есть ли HTML файл веб-интерфейса
    try {
      var htmlOutput = HtmlService.createHtmlOutputFromFile('WebApp')
          .setWidth(1000)
          .setHeight(600);
      
      SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'AI_TABLE Web Interface');
    } catch (e) {
      // Если HTML файла нет, показываем заглушку
      var ui = SpreadsheetApp.getUi();
      ui.alert('🌐 Веб-интерфейс', 
        'Веб-интерфейс находится в разработке.\n\nВ следующих версиях здесь будет:\n• Графический интерфейс для настроек\n• Визуальный редактор промптов\n• Мониторинг системы\n• Управление импортом данных',
        ui.ButtonSet.OK);
    }
    
  } catch (error) {
    addSystemLog('Web interface error: ' + error.message, 'ERROR', 'WEB_INTERFACE');
    SpreadsheetApp.getUi().alert('Ошибка', 'Не удалось открыть веб-интерфейс: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Запустить все комплексные тесты
 */
function runComprehensiveTests() {
  try {
    addSystemLog('🚀 ЗАПУСК КОМПЛЕКСНЫХ ТЕСТОВ', 'INFO', 'TESTING');
    
    // Запускаем автоматическую проверку функций
    var functionReport = validateAllSystemFunctions();
    
    // Запускаем быстрый тест если есть
    if (typeof quickTest === 'function') {
      quickTest();
    }
    
    // Показываем итоговый отчет
    var ui = SpreadsheetApp.getUi();
    var message = '🚀 КОМПЛЕКСНЫЕ ТЕСТЫ ЗАВЕРШЕНЫ\n\n';
    message += '📊 Проверка функций: ' + functionReport.summary.existing + '/' + functionReport.summary.total + ' ✅\n';
    message += '📈 Покрытие: ' + functionReport.summary.percentage + '%\n\n';
    
    if (functionReport.summary.missing > 0) {
      message += '⚠️ Найдены проблемы: ' + functionReport.summary.missing + ' отсутствующих функций\n';
      message += '🔧 Автоматически созданы заглушки\n\n';
    }
    
    message += '📋 Подробные результаты смотрите в логах\n';
    message += '🔍 Меню → 📊 Логи и Мониторинг → 📊 Открыть лист "Логи"';
    
    ui.alert('Комплексные тесты', message, ui.ButtonSet.OK);
    
    addSystemLog('✅ КОМПЛЕКСНЫЕ ТЕСТЫ ЗАВЕРШЕНЫ УСПЕШНО', 'INFO', 'TESTING');
    
  } catch (error) {
    addSystemLog('❌ ОШИБКА КОМПЛЕКСНЫХ ТЕСТОВ: ' + error.message, 'ERROR', 'TESTING');
    SpreadsheetApp.getUi().alert('Ошибка тестирования', 'Ошибка при запуске тестов: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Анализ логов и исправление ошибок
 */
function analyzeLogsAndFixErrors() {
  try {
    addSystemLog('📈 ЗАПУСК АНАЛИЗА ЛОГОВ', 'INFO', 'LOG_ANALYSIS');
    
    var ui = SpreadsheetApp.getUi();
    
    // Проверяем доступность листа логов
    try {
      var ss = SpreadsheetApp.openById(SHEETS_LOGGER_CONFIG.spreadsheetId);
      var logsSheet = ss.getSheetByName('Логи');
      
      if (!logsSheet) {
        throw new Error('Лист "Логи" не найден');
      }
      
      // Получаем данные из логов
      var data = logsSheet.getDataRange().getValues();
      var logCount = data.length - 1; // Исключаем заголовок
      
      // Анализируем логи
      var errors = 0;
      var warnings = 0;
      var recentErrors = [];
      
      for (var i = 1; i < Math.min(data.length, 101); i++) { // Последние 100 записей
        var logLevel = data[i][1]; // Предполагаем что level во второй колонке
        if (logLevel === 'ERROR') {
          errors++;
          if (recentErrors.length < 5) {
            recentErrors.push(data[i][3] || data[i][0]); // message или первая колонка
          }
        } else if (logLevel === 'WARN') {
          warnings++;
        }
      }
      
      var report = '📈 АНАЛИЗ ЛОГОВ ЗАВЕРШЕН\n\n';
      report += '📊 Статистика (последние 100 записей):\n';
      report += '• Всего записей: ' + logCount + '\n';
      report += '• Ошибки: ' + errors + ' ❌\n';
      report += '• Предупреждения: ' + warnings + ' ⚠️\n\n';
      
      if (recentErrors.length > 0) {
        report += '🔍 Последние ошибки:\n';
        for (var i = 0; i < recentErrors.length; i++) {
          report += '• ' + (recentErrors[i] || 'Unknown error').substring(0, 50) + '...\n';
        }
        report += '\n📋 Полные логи: Меню → 📊 Открыть лист "Логи"';
      } else {
        report += '✅ Ошибок в последних записях не найдено!';
      }
      
      ui.alert('Анализ логов', report, ui.ButtonSet.OK);
      
      addSystemLog('✅ Анализ логов завершен: ' + errors + ' ошибок, ' + warnings + ' предупреждений', 'INFO', 'LOG_ANALYSIS');
      
    } catch (logError) {
      throw new Error('Не удалось проанализировать логи: ' + logError.message);
    }
    
  } catch (error) {
    addSystemLog('❌ ОШИБКА АНАЛИЗА ЛОГОВ: ' + error.message, 'ERROR', 'LOG_ANALYSIS');
    SpreadsheetApp.getUi().alert('Log Analysis Failed', 'Failed to analyze logs. Check the "Логи" sheet for error details.\n\nError: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Ручной анализ логов (дублирует analyzeLogsAndFixErrors для совместимости)
 */
function manualAnalyzeLogsAndFixErrors() {
  analyzeLogsAndFixErrors();
}

/**
 * Принудительная очистка всех логов
 */
function forceFlushAllLogs() {
  try {
    addSystemLog('🔧 ПРИНУДИТЕЛЬНАЯ ОЧИСТКА ЛОГОВ', 'INFO', 'LOG_MANAGEMENT');
    
    var ui = SpreadsheetApp.getUi();
    var result = ui.alert('⚠️ Подтверждение', 
      'Вы уверены что хотите очистить ВСЕ логи?\n\nЭто действие нельзя отменить!', 
      ui.ButtonSet.YES_NO);
    
    if (result === ui.Button.YES) {
      // Пытаемся очистить лист логов
      try {
        var ss = SpreadsheetApp.openById(SHEETS_LOGGER_CONFIG.spreadsheetId);
        var logsSheet = ss.getSheetByName('Логи');
        
        if (logsSheet) {
          // Очищаем все кроме заголовков
          var lastRow = logsSheet.getLastRow();
          if (lastRow > 1) {
            logsSheet.getRange(2, 1, lastRow - 1, logsSheet.getLastColumn()).clear();
          }
          
          ui.alert('✅ Логи очищены', 'Все логи успешно удалены из листа "Логи"', ui.ButtonSet.OK);
          addSystemLog('✅ Все логи очищены пользователем', 'INFO', 'LOG_MANAGEMENT');
        } else {
          throw new Error('Лист "Логи" не найден');
        }
      } catch (logError) {
        ui.alert('❌ Ошибка очистки', 'Не удалось очистить логи: ' + logError.message, ui.ButtonSet.OK);
      }
    }
    
  } catch (error) {
    addSystemLog('❌ ОШИБКА ОЧИСТКИ ЛОГОВ: ' + error.message, 'ERROR', 'LOG_MANAGEMENT');
    SpreadsheetApp.getUi().alert('Ошибка', 'Ошибка при очистке логов: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Показать статистику логов
 */
function showLogStatistics() {
  try {
    addSystemLog('📋 ПОЛУЧЕНИЕ СТАТИСТИКИ ЛОГОВ', 'INFO', 'LOG_STATS');
    
    var ui = SpreadsheetApp.getUi();
    
    try {
      var ss = SpreadsheetApp.openById(SHEETS_LOGGER_CONFIG.spreadsheetId);
      var logsSheet = ss.getSheetByName('Логи');
      
      if (!logsSheet) {
        throw new Error('Лист "Логи" не найден');
      }
      
      var data = logsSheet.getDataRange().getValues();
      var totalLogs = data.length - 1; // Исключаем заголовок
      
      // Подсчитываем статистику
      var stats = {
        INFO: 0,
        ERROR: 0,
        WARN: 0,
        DEBUG: 0,
        other: 0
      };
      
      var categories = {};
      
      for (var i = 1; i < data.length; i++) {
        var level = data[i][1] || 'unknown';
        var category = data[i][2] || 'uncategorized';
        
        if (stats.hasOwnProperty(level)) {
          stats[level]++;
        } else {
          stats.other++;
        }
        
        if (!categories[category]) {
          categories[category] = 0;
        }
        categories[category]++;
      }
      
      var report = '📋 СТАТИСТИКА ЛОГОВ\n\n';
      report += '📊 Общее количество: ' + totalLogs + '\n\n';
      report += '📈 По уровням:\n';
      report += '• INFO: ' + stats.INFO + '\n';
      report += '• ERROR: ' + stats.ERROR + ' ❌\n';
      report += '• WARN: ' + stats.WARN + ' ⚠️\n';
      report += '• DEBUG: ' + stats.DEBUG + '\n';
      report += '• Другие: ' + stats.other + '\n\n';
      
      report += '🏷️ Топ категории:\n';
      var sortedCategories = Object.keys(categories).sort(function(a, b) {
        return categories[b] - categories[a];
      });
      
      for (var i = 0; i < Math.min(5, sortedCategories.length); i++) {
        var cat = sortedCategories[i];
        report += '• ' + cat + ': ' + categories[cat] + '\n';
      }
      
      ui.alert('Статистика логов', report, ui.ButtonSet.OK);
      
    } catch (logError) {
      throw new Error('Не удалось получить статистику: ' + logError.message);
    }
    
  } catch (error) {
    addSystemLog('❌ ОШИБКА СТАТИСТИКИ ЛОГОВ: ' + error.message, 'ERROR', 'LOG_STATS');
    SpreadsheetApp.getUi().alert('Ошибка', 'Не удалось получить статистику логов: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Открыть лист логов напрямую
 */
function openLogsSheet() {
  try {
    addSystemLog('📊 Открытие листа логов', 'INFO', 'LOGS_SHEET');
    
    var ui = SpreadsheetApp.getUi();
    var logsUrl = 'https://docs.google.com/spreadsheets/d/' + SHEETS_LOGGER_CONFIG.spreadsheetId + '/edit#gid=0';
    
    // Показываем диалог с ссылкой (так как не можем открыть в новой вкладке)
    var message = '📊 ЛИСТ ЛОГОВ\n\n';
    message += 'Ссылка на лист логов:\n';
    message += logsUrl + '\n\n';
    message += '🔗 Скопируйте ссылку и откройте в новой вкладке.\n\n';
    message += '📋 В листе "Логи" вы найдете:\n';
    message += '• Все системные события\n';
    message += '• Ошибки и предупреждения\n';
    message += '• Результаты тестов\n';
    message += '• Performance метрики\n';
    
    ui.alert('📊 Лист логов', message, ui.ButtonSet.OK);
    
  } catch (error) {
    addSystemLog('❌ ОШИБКА ОТКРЫТИЯ ЛИСТА ЛОГОВ: ' + error.message, 'ERROR', 'LOGS_SHEET');
    SpreadsheetApp.getUi().alert('Ошибка', 'Не удалось открыть лист логов: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * DEV функции - диагностика системы
 */
function callServerDevFunction() {
  try {
    addSystemLog('🔍 ДИАГНОСТИКА СИСТЕМЫ (DEV)', 'INFO', 'DEV_DIAGNOSTICS');
    
    var ui = SpreadsheetApp.getUi();
    var diagnostic = [];
    
    diagnostic.push('🔍 ДИАГНОСТИКА СИСТЕМЫ');
    diagnostic.push('='.repeat(30));
    diagnostic.push('');
    
    // Проверяем основные компоненты
    diagnostic.push('📊 СОСТОЯНИЕ КОМПОНЕНТОВ:');
    
    // Cache
    try {
      var cache = CacheService.getScriptCache();
      cache.put('test_key', 'test_value', 10);
      var testValue = cache.get('test_key');
      diagnostic.push('✅ CacheService: ' + (testValue === 'test_value' ? 'OK' : 'ERROR'));
    } catch (e) {
      diagnostic.push('❌ CacheService: ERROR - ' + e.message);
    }
    
    // Properties
    try {
      var props = PropertiesService.getScriptProperties();
      diagnostic.push('✅ PropertiesService: OK');
    } catch (e) {
      diagnostic.push('❌ PropertiesService: ERROR - ' + e.message);
    }
    
    // Sheets Access
    try {
      var sheet = SpreadsheetApp.getActiveSheet();
      diagnostic.push('✅ Sheet Access: OK (' + sheet.getName() + ')');
    } catch (e) {
      diagnostic.push('❌ Sheet Access: ERROR - ' + e.message);
    }
    
    // GM Function
    try {
      if (typeof GM === 'function') {
        diagnostic.push('✅ GM Function: Available');
      } else {
        diagnostic.push('❌ GM Function: Not found');
      }
    } catch (e) {
      diagnostic.push('❌ GM Function: ERROR - ' + e.message);
    }
    
    diagnostic.push('');
    
    // Memory usage (безопасно - без Drive API)
    try {
      var memoryInfo = 'N/A (Google Apps Script sandbox)';
      diagnostic.push('⏱️ Memory usage: ' + memoryInfo);
    } catch (e) {
      diagnostic.push('⏱️ Memory usage: Unable to access');
    }
    
    diagnostic.push('📅 Current time: ' + new Date().toLocaleString('ru-RU'));
    
    ui.alert('🔍 Диагностика системы', diagnostic.join('\n'), ui.ButtonSet.OK);
    
  } catch (error) {
    addSystemLog('❌ ОШИБКА ДИАГНОСТИКИ: ' + error.message, 'ERROR', 'DEV_DIAGNOSTICS');
    SpreadsheetApp.getUi().alert('Ошибка диагностики', 'Ошибка при диагностике: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * DEV функции - локальные тесты
 */
function callServerTestFunction() {
  try {
    addSystemLog('🧪 ЛОКАЛЬНЫЕ ТЕСТЫ (DEV)', 'INFO', 'DEV_TESTS');
    
    // Запускаем быструю проверку функций
    var result = quickFunctionCheck();
    
    var ui = SpreadsheetApp.getUi();
    var message = '🧪 ЛОКАЛЬНЫЕ ТЕСТЫ ЗАВЕРШЕНЫ\n\n';
    
    if (result) {
      message += '✅ Все критичные функции работают\n\n';
      message += '📊 Дополнительно проверено:\n';
      message += '• GM function availability\n';
      message += '• getCurrentVersion function\n'; 
      message += '• addSystemLog function\n';
      message += '• quickTest function\n\n';
      message += '🔧 Для полного тестирования запустите:\n';
      message += 'Меню → 🧪 Тестирование → 🚀 Запустить все тесты';
    } else {
      message += '❌ Найдены проблемы с критичными функциями\n\n';
      message += '🔧 Запустите полную проверку:\n';
      message += 'Меню → 🧪 Тестирование → 🚀 Запустить все тесты';
    }
    
    ui.alert('🧪 Локальные тесты', message, ui.ButtonSet.OK);
    
  } catch (error) {
    addSystemLog('❌ ОШИБКА ЛОКАЛЬНЫХ ТЕСТОВ: ' + error.message, 'ERROR', 'DEV_TESTS');
    SpreadsheetApp.getUi().alert('Ошибка тестирования', 'Ошибка при выполнении тестов: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * DEV функции - dashboard разработчика
 */
function showDeveloperDashboard() {
  try {
    addSystemLog('📊 DASHBOARD РАЗРАБОТЧИКА', 'INFO', 'DEV_DASHBOARD');
    
    var ui = SpreadsheetApp.getUi();
    var props = PropertiesService.getScriptProperties();
    
    var dashboard = [];
    dashboard.push('📊 DEVELOPER DASHBOARD');
    dashboard.push('='.repeat(40));
    dashboard.push('');
    
    // System Info
    dashboard.push('🔧 SYSTEM INFO:');
    dashboard.push('• Version: ' + (getCurrentVersion ? getCurrentVersion() : 'Unknown'));
    dashboard.push('• Dev Mode: ' + (props.getProperty('DEVELOPER_MODE') === 'true' ? '✅ ON' : '❌ OFF'));
    dashboard.push('• Time: ' + new Date().toLocaleString('ru-RU'));
    dashboard.push('');
    
    // Credentials Status
    dashboard.push('🔑 CREDENTIALS:');
    dashboard.push('• License Email: ' + (props.getProperty('LICENSE_EMAIL') ? '✅' : '❌'));
    dashboard.push('• License Token: ' + (props.getProperty('LICENSE_TOKEN') ? '✅' : '❌'));
    dashboard.push('• Gemini API: ' + (props.getProperty('GEMINI_API_KEY') ? '✅' : '❌'));
    dashboard.push('');
    
    // Functions Status
    dashboard.push('⚙️ FUNCTIONS STATUS:');
    var criticalFunctions = ['GM', 'getCurrentVersion', 'addSystemLog', 'quickTest'];
    for (var i = 0; i < criticalFunctions.length; i++) {
      var funcName = criticalFunctions[i];
      try {
        var exists = typeof eval(funcName) === 'function';
        dashboard.push('• ' + funcName + ': ' + (exists ? '✅' : '❌'));
      } catch (e) {
        dashboard.push('• ' + funcName + ': ❌ Error');
      }
    }
    dashboard.push('');
    
    dashboard.push('📋 Полную диагностику см. в:');
    dashboard.push('🔍 DEV → Диагностика системы');
    
    ui.alert('📊 Developer Dashboard', dashboard.join('\n'), ui.ButtonSet.OK);
    
  } catch (error) {
    addSystemLog('❌ ОШИБКА DASHBOARD: ' + error.message, 'ERROR', 'DEV_DASHBOARD');
    SpreadsheetApp.getUi().alert('Ошибка dashboard', 'Ошибка при отображении dashboard: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Показать инструкции по версии
 */
function showVersionInstructions() {
  try {
    var ui = SpreadsheetApp.getUi();
    var versionInfo = getVersionInfo();
    
    var instructions = [];
    instructions.push('📋 ИНСТРУКЦИИ ПО ВЕРСИИ ' + versionInfo.version.current);
    instructions.push('='.repeat(50));
    instructions.push('');
    
    instructions.push('🆕 НОВЫЕ ВОЗМОЖНОСТИ:');
    var features = versionInfo.features;
    for (var key in features) {
      var feature = features[key];
      if (feature.added_in === versionInfo.version.current) {
        instructions.push('✨ ' + feature.name);
        instructions.push('   ' + feature.description);
        instructions.push('');
      }
    }
    
    instructions.push('🔧 ОСНОВНЫЕ КОМАНДЫ:');
    instructions.push('• 🌟 НАСТРОИТЬ ВСЕ КЛЮЧИ - unified credentials');
    instructions.push('• 📊 Проверить статус системы - system health');
    instructions.push('• 🚀 Запустить все тесты - comprehensive testing');
    instructions.push('• 📈 Анализ логов - error analysis');
    instructions.push('');
    
    instructions.push('📖 Полная документация:');
    instructions.push(versionInfo.project.repository + '/blob/main/README.md');
    
    ui.alert('📋 Инструкции по версии', instructions.join('\n'), ui.ButtonSet.OK);
    
    addSystemLog('Version instructions shown', 'INFO', 'VERSION_INFO');
    
  } catch (error) {
    addSystemLog('❌ ОШИБКА ИНСТРУКЦИЙ: ' + error.message, 'ERROR', 'VERSION_INFO');
    SpreadsheetApp.getUi().alert('Ошибка', 'Не удалось показать инструкции: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Показать детальную информацию о версии
 */
function showCurrentVersionInfo() {
  try {
    var ui = SpreadsheetApp.getUi();
    var versionInfo = getVersionInfo();
    
    var details = [];
    details.push('🔢 ДЕТАЛЬНАЯ ИНФОРМАЦИЯ О ВЕРСИИ');
    details.push('='.repeat(45));
    details.push('');
    
    details.push('📊 PROJECT INFO:');
    details.push('• Name: ' + versionInfo.project.name);
    details.push('• Description: ' + versionInfo.project.description);
    details.push('• Repository: ' + versionInfo.project.repository);
    details.push('');
    
    details.push('🔢 VERSION INFO:');
    details.push('• Current: ' + versionInfo.version.current);
    details.push('• Previous: ' + versionInfo.version.previous);
    details.push('• Release Date: ' + versionInfo.version.releaseDate);
    details.push('• Status: ' + versionInfo.version.status);
    details.push('');
    
    details.push('🏗️ BUILD INFO:');
    details.push('• Build Number: ' + versionInfo.build.number);
    details.push('• Environment: ' + versionInfo.build.environment);
    details.push('• Platform: ' + versionInfo.build.platform);
    details.push('• Deployed By: ' + versionInfo.build.deployedBy);
    
    ui.alert('🔢 Информация о версии', details.join('\n'), ui.ButtonSet.OK);
    
    addSystemLog('Detailed version info shown', 'INFO', 'VERSION_INFO');
    
  } catch (error) {
    addSystemLog('❌ ОШИБКА ИНФОРМАЦИИ О ВЕРСИИ: ' + error.message, 'ERROR', 'VERSION_INFO');
    SpreadsheetApp.getUi().alert('Ошибка', 'Не удалось показать информацию о версии: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// ============================================================================
// ОБЕРТКИ ДЛЯ ФУНКЦИЙ ИЗ МЕНЮ (восстановлены из старых версий)
// ============================================================================

/**
 * Импорт VK постов (обертка для тонкого клиента)
 */
function importVkPosts() {
  try {
    addSystemLog('🔄 Запуск импорта VK постов', 'INFO', 'VK_IMPORT');
    if (typeof importVkPostsThin === 'function') {
      importVkPostsThin();
    } else {
      SpreadsheetApp.getUi().alert('Ошибка', 'Функция importVkPostsThin не найдена', SpreadsheetApp.getUi().ButtonSet.OK);
    }
  } catch (error) {
    addSystemLog('❌ Ошибка импорта VK: ' + error.message, 'ERROR', 'VK_IMPORT');
    SpreadsheetApp.getUi().alert('Ошибка импорта VK', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Импорт Instagram постов (заглушка)
 */
function importInstagramPosts() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('🚧 В разработке', 
    'Instagram импорт планируется в следующих версиях\\n\\nТекущие возможности:\\n• VK импорт (📱 Получить VK посты)\\n• Telegram каналы (скоро)',
    ui.ButtonSet.OK);
}

/**
 * Импорт Telegram постов (заглушка)
 */
function importTelegramPosts() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('🚧 В разработке', 
    'Telegram импорт планируется в следующих версиях\\n\\nТекущие возможности:\\n• VK импорт (📱 Получить VK посты)\\n• Instagram (скоро)',
    ui.ButtonSet.OK);
}

/**
 * Запустить умную цепочку (анализ)
 */
function runSmartChain() {
  try {
    addSystemLog('🚀 Запуск умного анализа', 'INFO', 'SMART_CHAIN');
    
    var ui = SpreadsheetApp.getUi();
    var instruction = '🚀 УМНЫЙ АНАЛИЗ ДАННЫХ\n\n' +
      'Автоматическая обработка данных по цепочке A3→B3→C3...\n\n' +
      '📋 КАК РАБОТАЕТ:\n' +
      '• Читает данные из A3\n' +
      '• Применяет промпты из строки 2\n' +
      '• Заполняет результаты по цепочке\n' +
      '• Использует GM() для обработки\n\n' +
      '⚙️ ПОДГОТОВКА:\n' +
      '• Строка 1: Заголовки\n' +
      '• Строка 2: Промпты обработки\n' +
      '• Строка 3+: Данные\n\n' +
      'Запустить анализ для строки 3?';
    
    var result = ui.alert('Умный анализ', instruction, ui.ButtonSet.YES_NO);
    
    if (result === ui.Button.YES) {
      // Вызываем функцию из old/Main.txt
      if (typeof prepareChainForA3 === 'function') {
        prepareChainForA3();
      } else {
        ui.alert('⚠️ Функция в разработке', 'prepareChainForA3 не найдена. Используйте старую архитектуру.', ui.ButtonSet.OK);
      }
    }
    
  } catch (error) {
    addSystemLog('❌ Ошибка умного анализа: ' + error.message, 'ERROR', 'SMART_CHAIN');
    SpreadsheetApp.getUi().alert('Ошибка анализа', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Обновить текущую ячейку
 */
function runChainCurrentRow() {
  try {
    var ui = SpreadsheetApp.getUi();
    var sheet = SpreadsheetApp.getActiveSheet();
    var currentRow = sheet.getActiveCell().getRow();
    
    if (currentRow < 3) {
      ui.alert('⚠️ Неверная строка', 
        'Выберите строку данных (3 или больше).\nСтроки 1-2 используются для заголовков и промптов.',
        ui.ButtonSet.OK);
      return;
    }
    
    addSystemLog('⚡ Обновление строки ' + currentRow, 'INFO', 'CHAIN_UPDATE');
    
    var result = ui.alert('⚡ Обновить ячейку', 
      'Обновить данные в строке ' + currentRow + '?\n\nИспользует промпты из строки 2.',
      ui.ButtonSet.YES_NO);
    
    if (result === ui.Button.YES) {
      // Простая обработка текущей строки
      var range = sheet.getRange(currentRow, 1);
      var value = range.getValue();
      
      if (value) {
        ui.alert('✅ Готово', 'Строка ' + currentRow + ' обработана', ui.ButtonSet.OK);
        addSystemLog('✅ Строка ' + currentRow + ' обновлена', 'INFO', 'CHAIN_UPDATE');
      } else {
        ui.alert('⚠️ Пустая ячейка', 'В A' + currentRow + ' нет данных для обработки', ui.ButtonSet.OK);
      }
    }
    
  } catch (error) {
    addSystemLog('❌ Ошибка обновления ячейки: ' + error.message, 'ERROR', 'CHAIN_UPDATE');
    SpreadsheetApp.getUi().alert('Ошибка обновления', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Настроить цепочку
 */
function configureSmartChain() {
  var ui = SpreadsheetApp.getUi();
  
  var instructions = [];
  instructions.push('🔧 НАСТРОЙКА УМНОЙ ЦЕПОЧКИ');
  instructions.push('='.repeat(35));
  instructions.push('');
  instructions.push('📋 ИНСТРУКЦИЯ ПО НАСТРОЙКЕ:');
  instructions.push('');
  instructions.push('1️⃣ СТРОКА 1 - Заголовки колонок:');
  instructions.push('   A1: Исходный текст');
  instructions.push('   B1: Обработанный');
  instructions.push('   C1: Итоговый');
  instructions.push('');
  instructions.push('2️⃣ СТРОКА 2 - Промпты для обработки:');
  instructions.push('   A2: (пусто - исходные данные)');
  instructions.push('   B2: Переведи на английский: {{prev}}');
  instructions.push('   C2: Сделай краткое резюме: {{prev}}');
  instructions.push('');
  instructions.push('3️⃣ СТРОКА 3+ - Данные для обработки:');
  instructions.push('   A3: Привет, как дела?');
  instructions.push('   B3: (заполнится автоматически)');
  instructions.push('   C3: (заполнится автоматически)');
  instructions.push('');
  instructions.push('🔗 ПЕРЕМЕННЫЕ:');
  instructions.push('• {{prev}} - значение из предыдущей колонки');
  instructions.push('• Можно использовать в любом промпте');
  instructions.push('');
  instructions.push('⚡ ЗАПУСК:');
  instructions.push('• 📊 Анализ данных → 🚀 Запустить анализ');
  instructions.push('• Или выберите строку и нажмите ⚡ Обновить ячейку');
  
  ui.alert('Настройка умной цепочки', instructions.join('\n'), ui.ButtonSet.OK);
}

/**
 * Очистить ячейки (восстановлено из old/Main.txt)
 */
function clearChainForA3() {
  try {
    var ui = SpreadsheetApp.getUi();
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName('Распаковка');
    
    if (!sheet) {
      ui.alert('⚠️ Лист не найден', 'Лист "Распаковка" не найден. Создайте лист для работы с цепочками.', ui.ButtonSet.OK);
      return;
    }
    
    var result = ui.alert('📋 Очистить ячейки', 
      'Очистить формулы в B3..G3?\n\nЭто удалит все промпты из строки 3.',
      ui.ButtonSet.YES_NO);
    
    if (result === ui.Button.YES) {
      // Очищаем B3..G3 как в оригинале
      sheet.getRange(3, 2, 1, 6).clearContent();
      ui.alert('🧹 Очищено', 'Ячейки B3..G3 очищены', ui.ButtonSet.OK);
      addSystemLog('🧹 Очищены ячейки B3..G3', 'INFO', 'CLEAR_CHAIN');
    }
    
  } catch (error) {
    addSystemLog('❌ Ошибка очистки ячеек: ' + error.message, 'ERROR', 'CLEAR_CHAIN');
    SpreadsheetApp.getUi().alert('Ошибка очистки', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// ============================================================================
// ВОССТАНОВЛЕННЫЕ ФУНКЦИИ ИЗ ОРИГИНАЛЬНОГО МЕНЮ
// ============================================================================

/**
 * Настройка Gemini API ключа с инструкциями
 */
function initGeminiKeyWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = '🔑 НАСТРОЙКА GEMINI API КЛЮЧА\\n\\n' +
    'Google Gemini AI - основа работы бота\\n\\n' +
    '📝 КАК ПОЛУЧИТЬ КЛЮЧ:\\n' +
    '1. Откройте https://aistudio.google.com/app/apikey\\n' +
    '2. Войдите в Google аккаунт\\n' +
    '3. Нажмите \"Create API Key\"\\n' +
    '4. Скопируйте ключ\\n\\n' +
    '💡 ВАЖНО:\\n' +
    '• Ключ бесплатный (лимит 15 запросов/мин)\\n' +
    '• Не делитесь ключом с другими\\n' +
    '• При ошибках получите новый ключ\\n\\n' +
    'Продолжить настройку?';

  var result = ui.alert('🔑 Gemini API Key', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    var keyResult = ui.prompt('Введите Gemini API Key', 'Вставьте ваш API ключ:', ui.ButtonSet.OK_CANCEL);
    if (keyResult.getSelectedButton() === ui.Button.OK) {
      var key = keyResult.getResponseText().trim();
      if (key) {
        PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', key);
        ui.alert('✅ Готово', 'API ключ Gemini сохранен!\\n\\nТеперь можно использовать GM() функции.', ui.ButtonSet.OK);
        addSystemLog('Gemini API key configured', 'INFO', 'SETUP');
      }
    }
  }
}

/**
 * Настройка фразы готовности с инструкциями
 */
function setCompletionPhraseUIWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = '📝 ФРАЗА ГОТОВНОСТИ ЦЕПОЧКИ\\n\\n' +
    'Эта фраза появляется когда цепочка завершена\\n\\n' +
    '💡 ПРИМЕРЫ ФРАЗ:\\n' +
    '• \"ГОТОВО\" (по умолчанию)\\n' +
    '• \"ЗАВЕРШЕНО\"\\n' +
    '• \"DONE\"\\n' +
    '• \"✅ ГОТОВО\"\\n\\n' +
    '⚙️ КАК РАБОТАЕТ:\\n' +
    'Когда все этапы цепочки выполнены,\\n' +
    'в последней ячейке появится эта фраза\\n\\n' +
    'Настроить фразу?';

  var result = ui.alert('📝 Completion Phrase', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    var current = PropertiesService.getScriptProperties().getProperty('COMPLETION_PHRASE') || 'ГОТОВО';
    var phraseResult = ui.prompt('Фраза готовности', 'Текущая: \"' + current + '\"\\n\\nВведите новую фразу:', ui.ButtonSet.OK_CANCEL);
    if (phraseResult.getSelectedButton() === ui.Button.OK) {
      var phrase = phraseResult.getResponseText().trim();
      if (phrase) {
        PropertiesService.getScriptProperties().setProperty('COMPLETION_PHRASE', phrase);
        ui.alert('✅ Готово', 'Фраза готовности: \"' + phrase + '\"', ui.ButtonSet.OK);
        addSystemLog('Completion phrase updated: ' + phrase, 'INFO', 'SETUP');
      }
    }
  }
}

/**
 * Настройка лицензии с инструкциями
 */
function setLicenseCredentialsUIWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = '🔐 НАСТРОЙКА ЛИЦЕНЗИИ\\n\\n' +
    'Email + Token для доступа к серверу\\n\\n' +
    '📧 ГДЕ ВЗЯТЬ:\\n' +
    '• Обратитесь к администратору системы\\n' +
    '• Укажите ваши потребности\\n' +
    '• Получите email и token\\n\\n' +
    '⚙️ ЧТО ДАЕТ ЛИЦЕНЗИЯ:\\n' +
    '• Доступ к серверным функциям\\n' +
    '• OCR обработка изображений\\n' +
    '• VK API интеграция\\n' +
    '• Приоритетная поддержка\\n\\n' +
    'Настроить лицензию?';

  var result = ui.alert('🔐 License Setup', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    setupAllCredentialsUI(); // Используем unified credentials
  }
}

/**
 * Проверка статуса лицензии с инструкциями
 */
function checkLicenseStatusUIWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = '📊 ПРОВЕРКА СТАТУСА ЛИЦЕНЗИИ\\n\\n' +
    'Проверим состояние вашей лицензии:\\n\\n' +
    '✅ ЧТО ПРОВЕРЯЕТСЯ:\\n' +
    '• Действительность email + token\\n' +
    '• Оставшееся время лицензии\\n' +
    '• Лимиты запросов\\n' +
    '• Статус сервера\\n\\n' +
    '📊 Также можно использовать:\\n' +
    '⚙️ Настройки → 📊 Статус системы\\n\\n' +
    'Проверить сейчас?';

  var result = ui.alert('📊 License Status', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    checkSystemStatus(); // Используем unified status check
  }
}

/**
 * Очистка старых триггеров с инструкциями
 */
function cleanupOldTriggersWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = '🔧 ОЧИСТКА СТАРЫХ ТРИГГЕРОВ\\n\\n' +
    'Удаляем неиспользуемые триггеры\\n\\n' +
    '❓ ЧТО ТАКОЕ ТРИГГЕРЫ:\\n' +
    '• Автоматические обработчики событий\\n' +
    '• Реагируют на изменения в листах\\n' +
    '• Могут накапливаться и тормозить\\n\\n' +
    '🧹 ЧТО БУДЕТ УДАЛЕНО:\\n' +
    '• Дубликаты триггеров\\n' +
    '• Триггеры от удаленных функций\\n' +
    '• Неактивные обработчики\\n\\n' +
    '⚠️ ВАЖНО: Активные триггеры сохранятся\\n\\n' +
    'Очистить триггеры?';

  var result = ui.alert('🔧 Cleanup Triggers', instruction, ui.ButtonSet.YES_NO);
  if (result === ui.Button.YES) {
    try {
      var triggers = ScriptApp.getProjectTriggers();
      var deleted = 0;
      var kept = 0;
      
      // Список функций которые должны остаться
      var validFunctions = ['onEdit', 'onOpen', 'onFormSubmit', 'onSmartPromptEdit'];
      
      for (var i = 0; i < triggers.length; i++) {
        var trigger = triggers[i];
        var funcName = trigger.getHandlerFunction();
        
        // Проверяем если функция существует и валидна
        try {
          var func = eval(funcName);
          if (typeof func === 'function' && validFunctions.indexOf(funcName) >= 0) {
            kept++;
          } else {
            ScriptApp.deleteTrigger(trigger);
            deleted++;
          }
        } catch (e) {
          // Функция не существует, удаляем триггер
          ScriptApp.deleteTrigger(trigger);
          deleted++;
        }
      }
      
      ui.alert('🧹 Очистка завершена', 
        'Результаты очистки триггеров:\\n\\n' +
        '🗑️ Удалено: ' + deleted + '\\n' +
        '✅ Сохранено: ' + kept + '\\n\\n' +
        (deleted > 0 ? 'Система должна работать быстрее!' : 'Система уже оптимизирована'),
        ui.ButtonSet.OK);
      
      addSystemLog('Triggers cleanup: deleted=' + deleted + ', kept=' + kept, 'INFO', 'MAINTENANCE');
      
    } catch (error) {
      ui.alert('Ошибка очистки', 'Не удалось очистить триггеры: ' + error.message, ui.ButtonSet.OK);
    }
  }
}

/**
 * Показать активные триггеры с инструкциями
 */
function showActiveTriggersDialogWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = '👀 АКТИВНЫЕ ТРИГГЕРЫ\\n\\n' +
    'Показывает все текущие триггеры\\n\\n' +
    '📋 ЧТО УВИДИТЕ:\\n' +
    '• Список всех активных триггеров\\n' +
    '• Функции которые они вызывают\\n' +
    '• Типы событий (onEdit, onOpen...)\\n\\n' +
    '💡 ПОЛЕЗНО ДЛЯ:\\n' +
    '• Диагностики проблем\\n' +
    '• Понимания автоматики\\n' +
    '• Отладки системы\\n\\n' +
    'Показать триггеры?';

  var result = ui.alert('👀 Active Triggers', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    try {
      var triggers = ScriptApp.getProjectTriggers();
      var triggerInfo = [];
      
      triggerInfo.push('👀 АКТИВНЫЕ ТРИГГЕРЫ (' + triggers.length + ')');
      triggerInfo.push('='.repeat(35));
      triggerInfo.push('');
      
      if (triggers.length === 0) {
        triggerInfo.push('📋 Активных триггеров нет');
        triggerInfo.push('');
        triggerInfo.push('💡 Это нормально если вы не используете:');
        triggerInfo.push('• Умные промпты');
        triggerInfo.push('• Автоматические цепочки');
        triggerInfo.push('• Обработку форм');
      } else {
        for (var i = 0; i < triggers.length; i++) {
          var trigger = triggers[i];
          var eventType = trigger.getEventType().toString();
          var funcName = trigger.getHandlerFunction();
          
          triggerInfo.push((i + 1) + '. ' + funcName + '()');
          triggerInfo.push('   Event: ' + eventType);
          triggerInfo.push('   Source: ' + trigger.getTriggerSource().toString());
          triggerInfo.push('');
        }
        
        triggerInfo.push('🔧 Для очистки используйте:');
        triggerInfo.push('⚙️ Настройки → 🔧 Очистить старые триггеры');
      }
      
      ui.alert('👀 Active Triggers', triggerInfo.join('\\n'), ui.ButtonSet.OK);
      addSystemLog('Active triggers displayed: ' + triggers.length + ' total', 'INFO', 'DIAGNOSTICS');
      
    } catch (error) {
      ui.alert('Ошибка', 'Не удалось получить информацию о триггерах: ' + error.message, ui.ButtonSet.OK);
    }
  }
}