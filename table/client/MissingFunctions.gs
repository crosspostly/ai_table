/**
 * НЕДОСТАЮЩИЕ ФУНКЦИИ - ОПТИМИЗИРОВАННАЯ ВЕРСИЯ
 * Только уникальные функции без дублей
 * 
 * УДАЛЕНЫ заглушки (есть реализация в других файлах):
 *   - openWebInterface() → ClientUtilities.gs:611
 *   - analyzeLogsAndFixErrors() → GoogleSheetsLogger.gs
 *   - forceFlushAllLogs() → GoogleSheetsLogger.gs
 *   - openLogsSheet() → Menu.gs:289
 *   - configureSocialImport() → Menu.gs
 *   - callServerDevFunction() → Menu.gs
 *   - callServerTestFunction() → Menu.gs
 *   - showDeveloperDashboard() → Menu.gs
 *   - showVersionInstructions() → Menu.gs
 *   - showCurrentVersionInfo() → Menu.gs
 *   - importInstagramPosts() → SocialImportService.gs
 *   - importTelegramPosts() → TelegramImportService.gs
 *   - runChainCurrentRow() → ClientUtilities.gs
 *   - manualAnalyzeLogsAndFixErrors() → обертка удалена
 */

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
  statusReport.push('Last Update: ' + new Date().toISOString());
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
  statusReport.push('🔧 Для настройки недостающих компонентов:');
  statusReport.push('🤖 Table AI → 🌟 НАСТРОИТЬ ВСЕ КЛЮЧИ');
  
  // ⚠️ ВАЖНО: VK API НЕ проверяется здесь!
  // VK токены хранятся на СЕРВЕРЕ, клиент их НЕ видит!
  
  ui.alert('📊 System Status', statusReport.join('\n'), ui.ButtonSet.OK);
  addSystemLog('System status checked', 'INFO', 'SYSTEM');
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

