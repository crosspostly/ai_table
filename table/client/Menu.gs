// Client Menu System for AI_TABLE

/**
 * Настроить все credentials - с инструкцией
 */
function setupAllCredentialsWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = '🔐 НАСТРОИТЬ ВСЕ CREDENTIALS\n\nЕдиное окно для настройки всех ключей доступа:\n\n🔑 Что настраивается:\n• Email лицензии - для доступа к серверу\n• Токен лицензии - для авторизации\n• Gemini API Key - для AI функций\n\n📝 Где взять:\n• Лицензия: обратитесь к администратору\n• Gemini: https://aistudio.google.com/app/apikey\n\n💡 Можно обновить только нужные поля, оставив остальные пустыми';

  var result = ui.alert('Инструкция', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    setupAllCredentialsUI();
  }
}

/**
 * UI для настройки всех credentials одновременно
 */
function setupAllCredentialsUI() {
  var ui = SpreadsheetApp.getUi();
  
  // Получаем текущие значения
  var props = PropertiesService.getScriptProperties();
  var currentEmail = props.getProperty('LICENSE_EMAIL') || '';
  var currentToken = props.getProperty('LICENSE_TOKEN') || '';
  var currentGeminiKey = props.getProperty('GEMINI_API_KEY') || '';
  
  // Email лицензии
  var emailResult = ui.prompt(
    '🔐 Настройка credentials (1/3)', 
    'Email лицензии\n\nТекущий: ' + (currentEmail || 'не установлен') + '\n\nВведите новый email (или оставьте пустым для пропуска):', 
    ui.ButtonSet.OK_CANCEL
  );
  
  if (emailResult.getSelectedButton() !== ui.Button.OK) return;
  
  var newEmail = emailResult.getResponseText().trim();
  
  // Токен лицензии
  var tokenResult = ui.prompt(
    '🔐 Настройка credentials (2/3)', 
    'Токен лицензии\n\nТекущий: ' + (currentToken ? 'установлен (' + currentToken.substring(0, 10) + '...)' : 'не установлен') + '\n\nВведите новый токен (или оставьте пустым для пропуска):', 
    ui.ButtonSet.OK_CANCEL
  );
  
  if (tokenResult.getSelectedButton() !== ui.Button.OK) return;
  
  var newToken = tokenResult.getResponseText().trim();
  
  // Gemini API Key
  var geminiResult = ui.prompt(
    '🔐 Настройка credentials (3/3)', 
    'Gemini API Key\n\nТекущий: ' + (currentGeminiKey ? 'установлен (' + currentGeminiKey.substring(0, 15) + '...)' : 'не установлен') + '\n\nВведите новый ключ (или оставьте пустым для пропуска):', 
    ui.ButtonSet.OK_CANCEL
  );
  
  if (geminiResult.getSelectedButton() !== ui.Button.OK) return;
  
  var newGeminiKey = geminiResult.getResponseText().trim();
  
  // Сохраняем только новые значения
  var updated = [];
  
  if (newEmail) {
    props.setProperty('LICENSE_EMAIL', newEmail);
    updated.push('✅ Email: ' + newEmail);
  }
  
  if (newToken) {
    props.setProperty('LICENSE_TOKEN', newToken);
    updated.push('✅ Токен: ' + newToken.substring(0, 10) + '...');
  }
  
  if (newGeminiKey) {
    props.setProperty('GEMINI_API_KEY', newGeminiKey);
    updated.push('✅ Gemini: ' + newGeminiKey.substring(0, 15) + '...');
  }
  
  if (updated.length > 0) {
    ui.alert(
      '✅ Credentials обновлены', 
      updated.join('\n') + '\n\n🔄 Попробуйте использовать GM() функции для проверки.',
      ui.ButtonSet.OK
    );
    addSystemLog('All credentials updated successfully', 'INFO', 'SETUP');
  } else {
    ui.alert('ℹ️ Настройки не изменены', 'Ни одно поле не было обновлено.', ui.ButtonSet.OK);
  }
}

/**
 * Создание главного меню
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  
  // Получаем версию для отображения в меню
  var versionInfo = getVersionDisplayInfo();
  
  // Главное меню - часто используемые функции
  ui.createMenu('🤖 Table AI')
    .addItem('🌟 НАСТРОИТЬ ВСЕ КЛЮЧИ (Email+Token+API)', 'setupAllCredentialsWithHelp')
    .addSeparator()
    .addItem('📊 Проверить статус системы', 'checkSystemStatus')
    .addItem('🌐 Открыть веб-интерфейс', 'openWebInterface')
    .addSeparator()
    .addSubMenu(ui.createMenu('🧪 Тестирование')
      .addItem('🚀 Запустить все тесты', 'runComprehensiveTests')
      .addItem('⚡ Быстрый тест', 'quickTest')
      .addItem('🔍 Анализ логов', 'analyzeLogsAndFixErrors')
      .addItem('📋 Открыть лист логов', 'openLogsSheet'))
    .addSubMenu(ui.createMenu('📊 Логи и Мониторинг')
      .addItem('📈 Анализ логов', 'manualAnalyzeLogsAndFixErrors')
      .addItem('🔧 Принудительная очистка логов', 'forceFlushAllLogs')
      .addItem('📊 Открыть лист "Логи"', 'openLogsSheet')
      .addItem('📋 Статистика логов', 'showLogStatistics'))
    .addSubMenu(ui.createMenu('🧰 DEV ' + versionInfo)
      .addItem('🔍 Диагностика системы', 'callServerDevFunction')
      .addItem('🧪 Локальные тесты', 'callServerTestFunction')
      .addItem('📊 Dashboard разработчика', 'showDeveloperDashboard')
      .addSeparator()
      .addItem('📋 Инструкции по версии', 'showVersionInstructions')
      .addItem('🔢 Детальная информация', 'showCurrentVersionInfo')
      .addSeparator()
      .addItem('🔧 Режим разработчика', 'toggleDeveloperModeWithHelp'))
    .addToUi();
}

/**
 * Получение информации о версии для отображения в меню
 */
function getVersionDisplayInfo() {
  try {
    // Получаем версию
    var version = getCurrentVersion ? getCurrentVersion() : '2.0.1';
    
    // Получаем дату последнего обновления
    var updateDate = 'неизвестно';
    if (typeof getLastUpdateDate === 'function') {
      try {
        var rawDate = getLastUpdateDate();
        if (rawDate && rawDate !== 'Неизвестно') {
          var date = new Date(rawDate);
          updateDate = date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit'
          });
        }
      } catch (e) {
        // Если ошибка получения даты, используем текущую дату
        updateDate = new Date().toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit'
        });
      }
    } else {
      // Если функция недоступна, используем текущую дату
      updateDate = new Date().toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit'
      });
    }
    
    return 'v' + version + ' от ' + updateDate;
    
  } catch (error) {
    // В случае любой ошибки возвращаем базовую информацию
    return 'v2.0.1 от ' + new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    });
  }
}

/**
 * Открытие листа логов
 */
function openLogsSheet() {
  try {
    var ss = SpreadsheetApp.openById(SHEETS_LOGGER_CONFIG.spreadsheetId);
    var logsSheet = ss.getSheetByName('Логи');
    if (logsSheet) {
      // Показываем URL листа логов
      var url = ss.getUrl() + '#gid=' + logsSheet.getSheetId();
      var ui = SpreadsheetApp.getUi();
      ui.alert('📊 Лист логов', 
        'Откройте лист логов по ссылке:\n\n' + url + '\n\nЛоги обновляются в реальном времени.',
        ui.ButtonSet.OK);
    } else {
      SpreadsheetApp.getUi().alert('Ошибка', 'Лист "Логи" не найден', SpreadsheetApp.getUi().ButtonSet.OK);
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('Ошибка', 'Не удалось открыть лист логов: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * DEV функции - работают локально
 */
function callServerDevFunction() {
  // Локальная диагностика системы
  try {
    var diagnostics = {
      timestamp: new Date().toISOString(),
      version: getCurrentVersion ? getCurrentVersion() : '2.0.1',
      functions: {
        GM: typeof GM === 'function',
        addSystemLog: typeof addSystemLog === 'function',
        importVkPosts: typeof importVkPosts === 'function'
      },
      credentials: getClientCredentials(),
      cache: {
        scriptCache: CacheService.getScriptCache() !== null,
        userCache: CacheService.getUserCache() !== null
      },
      properties: {
        script: PropertiesService.getScriptProperties() !== null,
        user: PropertiesService.getUserProperties() !== null
      }
    };
    
    var message = '🔍 ДИАГНОСТИКА СИСТЕМЫ\n\n';
    message += '📅 Время: ' + new Date().toLocaleString('ru-RU') + '\n';
    message += '🔢 Версия: ' + diagnostics.version + '\n\n';
    message += '🔧 ФУНКЦИИ:\n';
    message += '• GM: ' + (diagnostics.functions.GM ? '✅' : '❌') + '\n';
    message += '• Логирование: ' + (diagnostics.functions.addSystemLog ? '✅' : '❌') + '\n';
    message += '• VK импорт: ' + (diagnostics.functions.importVkPosts ? '✅' : '❌') + '\n\n';
    message += '🔑 CREDENTIALS: ' + (diagnostics.credentials.ok ? '✅ Настроены' : '❌ Требуют настройки') + '\n';
    message += '💾 CACHE: ' + (diagnostics.cache.scriptCache ? '✅' : '❌') + '\n';
    message += '⚙️ PROPERTIES: ' + (diagnostics.properties.script ? '✅' : '❌');
    
    SpreadsheetApp.getUi().alert('Диагностика системы', message, SpreadsheetApp.getUi().ButtonSet.OK);
    addSystemLog('System diagnostics completed', 'INFO', 'DEV');
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('Ошибка диагностики', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function callServerTestFunction() {
  // Локальные тесты
  quickTest();
}

function showDeveloperDashboard() {
  // Dashboard разработчика (безопасный)
  try {
    var stats = {
      timestamp: new Date().toISOString(),
      memoryUsage: 'N/A (Google Apps Script)',
      activeSheet: SpreadsheetApp.getActiveSheet().getName(),
      totalSheets: SpreadsheetApp.getActiveSpreadsheet().getSheets().length,
      lastExecution: 'Local diagnostic run'
    };
    
    var message = '📊 DEVELOPER DASHBOARD\n\n';
    message += '⏰ Время: ' + new Date().toLocaleString('ru-RU') + '\n';
    message += '📋 Активный лист: ' + stats.activeSheet + '\n';
    message += '📄 Всего листов: ' + stats.totalSheets + '\n';
    message += '🔧 Последнее выполнение: ' + stats.lastExecution + '\n\n';
    message += '⚠️ Безопасный режим: личные данные скрыты';
    
    SpreadsheetApp.getUi().alert('Developer Dashboard', message, SpreadsheetApp.getUi().ButtonSet.OK);
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('Ошибка dashboard', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * 📋 Инструкции по работе с версией системы
 */
function showVersionInstructions() {
  var ui = SpreadsheetApp.getUi();
  
  var instructions = '📋 КАК УЗНАТЬ ВЕРСИЮ СИСТЕМЫ\n\n';
  instructions += '🎯 САМЫЕ ПРОСТЫЕ СПОСОБЫ:\n\n';
  instructions += '1️⃣ В любой ячейке Google Sheets:\n';
  instructions += '   =getCurrentVersion()\n';
  instructions += '   Результат: "2.0.1"\n\n';
  instructions += '2️⃣ Для полной информации:\n';
  instructions += '   =getVersionInfo()\n';
  instructions += '   Результат: объект с детальными данными\n\n';
  instructions += '3️⃣ В меню Apps Script:\n';
  instructions += '   • Extensions → Apps Script\n';
  instructions += '   • Введите: Logger.log(getCurrentVersion())\n';
  instructions += '   • Run → посмотрите Execution transcript\n\n';
  instructions += '4️⃣ В главном меню:\n';
  instructions += '   🤖 Table AI → 📊 Проверить статус системы\n\n';
  instructions += '🔧 ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ:\n';
  instructions += '• getLastUpdateDate() - дата последнего обновления\n';
  instructions += '• getVersionInfo().changelog - список изменений\n';
  instructions += '• getVersionInfo().features - список функций\n\n';
  instructions += '🌐 НА ВЕБ-СЕРВЕРЕ (если деплой настроен):\n';
  instructions += '• version.html - красивая страница с версией\n';
  instructions += '• version.json - JSON API для программистов\n\n';
  instructions += '💡 Все функции версий встроены в Apps Script!';
  
  ui.alert('Инструкции по версии', instructions, ui.ButtonSet.OK);
  addSystemLog('Version instructions shown', 'INFO', 'DEV');
}

/**
 * 🔢 Показать текущую версию системы
 */
function showCurrentVersionInfo() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    // Получаем информацию о версии
    var version = getCurrentVersion ? getCurrentVersion() : '2.0.1';
    var updateDate = getLastUpdateDate ? getLastUpdateDate() : 'Неизвестно';
    
    var versionInfo = '🔢 ИНФОРМАЦИЯ О ВЕРСИИ\n\n';
    versionInfo += '📊 Текущая версия: ' + version + '\n';
    versionInfo += '📅 Дата обновления: ' + (updateDate !== 'Неизвестно' ? new Date(updateDate).toLocaleString('ru-RU') : updateDate) + '\n\n';
    
    // Пробуем получить детальную информацию
    if (typeof getVersionInfo === 'function') {
      try {
        var fullInfo = getVersionInfo();
        versionInfo += '🎯 Фичи версии:\n';
        if (fullInfo.features && fullInfo.features.length > 0) {
          fullInfo.features.forEach(function(feature) {
            versionInfo += '• ' + feature + '\n';
          });
        } else {
          versionInfo += '• Единое окно credentials\n';
          versionInfo += '• Google Sheets логирование\n';
          versionInfo += '• Комплексное тестирование\n';
          versionInfo += '• Исправления безопасности\n';
        }
        
        versionInfo += '\n🏗️ Архитектура: ' + (fullInfo.architecture ? fullInfo.architecture.type : '3-tier (Client/Server/Shared)');
      } catch (e) {
        versionInfo += '⚠️ Детальная информация недоступна: ' + e.message;
      }
    } else {
      versionInfo += '⚠️ Функция getVersionInfo() недоступна\n';
      versionInfo += '💡 Возможно деплоймент не завершен';
    }
    
    versionInfo += '\n\n💡 Для проверки в ячейке введите: =getCurrentVersion()';
    
    ui.alert('Текущая версия системы', versionInfo, ui.ButtonSet.OK);
    addSystemLog('Current version info shown: ' + version, 'INFO', 'DEV');
    
  } catch (error) {
    ui.alert('Ошибка получения версии', 'Не удалось получить информацию о версии: ' + error.message, ui.ButtonSet.OK);
    addSystemLog('Version info error: ' + error.message, 'ERROR', 'DEV');
  }
}