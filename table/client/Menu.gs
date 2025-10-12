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
  
  // АВТОМАТИЧЕСКИ СОЗДАЁМ КНОПКИ
  try {
    // Создаём кнопку импорта если есть лист "посты"
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var postsSheet = ss.getSheetByName('посты');
    if (postsSheet) {
      if (typeof createButtonInCell === 'function') {
        createButtonInCell(postsSheet, 'A1', 'VK Импорт', 'importVkPosts');
      }
    }
  } catch (e) {
    console.log('Не удалось создать кнопки: ' + e.message);
  }
  
  // Веб версия (пока заглушка)
  var webMenuItem = '🌐 Веб версия';
  
  ui.createMenu('🤖 Table AI')
    .addItem('🌐 Веб версия', 'openWebInterface')
    .addSeparator()
    .addSubMenu(ui.createMenu('📱 Социальные сети')
      .addItem('📱 Импорт постов', 'importVkPosts')
      .addItem('📊 Настройки соцсетей', 'configureSocialImport'))
    .addSubMenu(ui.createMenu('📊 Анализ данных')
      .addItem('🚀 Запустить анализ', 'runSmartChain')
      .addItem('⚡️ Обновить текущую ячейку', 'runChainCurrentRow') 
      .addItem('🔧 Настроить цепочку', 'configureSmartChain'))
    .addItem('📝 Транскрибировать отзывы', 'ocrRun')
    .addItem('💬 Режим чата', 'initializeChatMode')
    .addItem('🧠 Умные правила', 'setupSmartPromptTrigger')
    .addSubMenu(ui.createMenu('⚙️ Настройки')
      .addItem('🌟 НАСТРОИТЬ ВСЕ КЛЮЧИ', 'setupAllCredentialsWithHelp')
      .addItem('📊 Проверить статус системы', 'checkSystemStatus')
      .addItem('📋 Очистить ячейки', 'clearChainForA3'))
    .addSubMenu(ui.createMenu('🧰 DEV ' + versionInfo)
      .addItem('🚀 Супер проверка системы', 'superMasterCheck')
      .addItem('📊 Открыть логи', 'openLogsSheetWithCreation')
      .addItem('🔧 Диагностика системы', 'callServerDevFunction')
      .addItem('📋 Версия', 'showCurrentVersionInfo'))
    .addToUi();
}

/**
 * Настройка параметров импорта из социальных сетей
 * НОВАЯ ФУНКЦИЯ: Позволяет пользователю настроить параметры через UI
 */
function configureSocialImport() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  
  // Проверяем существование листа Параметры
  var paramsSheet = ss.getSheetByName('Параметры');
  if (!paramsSheet) {
    // Создаём лист с заголовками
    paramsSheet = ss.insertSheet('Параметры');
    paramsSheet.getRange('A1').setValue('Описание');
    paramsSheet.getRange('A2').setValue('Количество');
    paramsSheet.getRange('B1').setValue('Источник');
    paramsSheet.getRange('C1').setValue('Платформа (опционально)');
    
    // Форматирование
    paramsSheet.getRange('A1:C1').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
    paramsSheet.setColumnWidth(1, 150);
    paramsSheet.setColumnWidth(2, 300);
    paramsSheet.setColumnWidth(3, 200);
    
    addSystemLog('Created new Параметры sheet for social import', 'INFO', 'SOCIAL');
  }
  
  // Читаем текущие значения
  var currentSource = paramsSheet.getRange('B1').getValue() || '';
  var currentCount = paramsSheet.getRange('B2').getValue() || 20;
  var currentPlatform = paramsSheet.getRange('C1').getValue() || '';
  
  // Запрашиваем источник
  var sourcePrompt = 'Введите источник постов:\n\n' +
                    'Примеры:\n' +
                    '• https://vk.com/username\n' +
                    '• https://instagram.com/username\n' +
                    '• https://t.me/channel\n' +
                    '• @username (нужна платформа в следующем шаге)\n\n' +
                    'Текущее значение: ' + (currentSource || '(не задано)');
  
  var sourceResponse = ui.prompt('📱 Источник постов', sourcePrompt, ui.ButtonSet.OK_CANCEL);
  
  if (sourceResponse.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  
  var source = (sourceResponse.getResponseText() || '').trim();
  if (!source) {
    ui.alert('❌ Ошибка', 'Источник не может быть пустым', ui.ButtonSet.OK);
    return;
  }
  
  // Запрашиваем количество
  var countPrompt = 'Сколько постов импортировать?\n\n' +
                   'Минимум: 1\n' +
                   'Максимум: 100\n' +
                   'Рекомендуется: 20-50\n\n' +
                   'Текущее значение: ' + currentCount;
  
  var countResponse = ui.prompt('📊 Количество постов', countPrompt, ui.ButtonSet.OK_CANCEL);
  
  if (countResponse.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  
  var count = parseInt(countResponse.getResponseText()) || 20;
  if (count < 1) count = 1;
  if (count > 100) count = 100;
  
  // Запрашиваем платформу (опционально)
  var platformPrompt = 'Укажите платформу (опционально):\n\n' +
                      'Если источник - полная ссылка, платформа определится автоматически.\n' +
                      'Если простой username, укажите:\n' +
                      '• вк / vk\n' +
                      '• инста / instagram\n' +
                      '• тг / telegram\n\n' +
                      'Можно оставить пустым для автоопределения.\n\n' +
                      'Текущее значение: ' + (currentPlatform || '(автоопределение)');
  
  var platformResponse = ui.prompt('🌐 Платформа', platformPrompt, ui.ButtonSet.OK_CANCEL);
  
  var platform = '';
  if (platformResponse.getSelectedButton() === ui.Button.OK) {
    platform = (platformResponse.getResponseText() || '').trim();
  }
  
  // Сохраняем настройки
  try {
    paramsSheet.getRange('B1').setValue(source);
    paramsSheet.getRange('B2').setValue(count);
    paramsSheet.getRange('C1').setValue(platform);
    
    var summary = '✅ Настройки сохранены!\n\n' +
                 'Источник: ' + source + '\n' +
                 'Количество: ' + count + '\n' +
                 'Платформа: ' + (platform || '(автоопределение)') + '\n\n' +
                 'Теперь используйте:\n' +
                 '🤖 Table AI → 📱 Социальные сети → 📱 Импорт постов';
    
    addSystemLog('Social import configured: source=' + source + ', count=' + count + ', platform=' + platform, 'INFO', 'SOCIAL');
    ui.alert('✅ Готово!', summary, ui.ButtonSet.OK);
    
  } catch (e) {
    addSystemLog('Error saving social import config: ' + e.message, 'ERROR', 'SOCIAL');
    ui.alert('❌ Ошибка', 'Не удалось сохранить настройки: ' + e.message, ui.ButtonSet.OK);
  }
}

/**
 * Получение информации о версии для отображения в меню
 * АВТОМАТИЧЕСКИ обновляется при каждом деплое через GitHub Actions
 */
function getVersionDisplayInfo() {
  try {
    // Получаем версию
    var version = getCurrentVersion ? getCurrentVersion() : '2.1.0';
    
    // ДАТА И ВРЕМЯ ПОСЛЕДНЕГО ДЕПЛОЯ
    // Обновляется автоматически через GitHub Actions
    var deployTimestamp = 'DEPLOY_TIMESTAMP_PLACEHOLDER';
    
    // Форматируем дату и время
    var parts = deployTimestamp.split('T');
    var dateParts = parts[0].split('-');
    var timeParts = parts[1].split(':');
    
    var dateStr = dateParts[2] + '.' + dateParts[1];  // DD.MM формат
    var timeStr = timeParts[0] + ':' + timeParts[1];  // HH:MM формат
    
    return 'v' + version + ' от ' + dateStr + ' ' + timeStr;
    
  } catch (error) {
    // В случае ошибки возвращаем текущее время
    var now = new Date();
    var dateStr = now.getDate().toString().padStart(2, '0') + '.' + 
                  (now.getMonth() + 1).toString().padStart(2, '0');
    var timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                  now.getMinutes().toString().padStart(2, '0');
    return 'v' + version + ' от ' + dateStr + ' ' + timeStr;
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



/**
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (перенесены из MissingFunctions.gs)
 */

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