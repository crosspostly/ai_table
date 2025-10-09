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
    .addSubMenu(ui.createMenu('🧰 DEV')
      .addItem('🔍 Диагностика системы', 'callServerDevFunction')
      .addItem('🧪 Локальные тесты', 'callServerTestFunction')
      .addItem('📊 Dashboard разработчика', 'showDeveloperDashboard')
      .addItem('🔧 Режим разработчика', 'toggleDeveloperModeWithHelp'))
    .addToUi();
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