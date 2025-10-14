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
    .addSubMenu(ui.createMenu('📝 Текст → AI Формула')
      .addItem('🔄 GM() - Обновляемая', 'convertTextToGMFormula')
      .addItem('🔒 GM_STATIC() - Одноразовая', 'convertTextToGMStaticFormula')
      .addSeparator()
      .addItem('🧠 С умными правилами', 'applySmartRulesToSelection')
      .addSeparator()
      .addItem('❓ Справка', 'showTextToFormulaHelp'))
    .addSeparator()
    .addSubMenu(ui.createMenu('🎯 AI Конструктор (без лимитов)')
      .addItem('🎯 Настроить запрос', 'openCollectConfigUI')
      .addItem('🔄 Обновить ячейку', 'refreshCellWithConfig')
      .addSeparator()
      .addItem('❓ Что это?', 'showCollectConfigHelp'))
    .addSubMenu(ui.createMenu('⚙️ Настройки')
      .addItem('🌟 НАСТРОИТЬ ВСЕ КЛЮЧИ', 'setupAllCredentialsWithHelp')
      .addItem('📊 Проверить статус системы', 'checkSystemStatus')
      .addItem('📋 Очистить ячейки', 'clearChainForA3'))
    .addSubMenu(ui.createMenu('🧠 Управление правилами')
      .addItem('📖 Открыть лист "Правила"', 'openRulesSheet')
      .addItem('🔧 Создать лист правил', 'initializeSmartRules')
      .addItem('❓ Справка по правилам', 'showSmartRulesHelp'))
    .addSubMenu(ui.createMenu('🧰 DEV ' + versionInfo)
      .addItem('🚀 Супер проверка системы', 'superMasterCheck')
      .addItem('🔬 Диагностика VK импорта', 'diagnoseVkImport')
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

// ========================================
// COLLECT CONFIG UI FUNCTIONS
// Integrated from table/web/CollectConfigUI.gs to fix file count issue
// ========================================

/**
 * Открыть интерфейс настройки для текущей ячейки
 */
function openCollectConfigUI() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('CollectConfigUI')
      .setWidth(650)
      .setHeight(600)
      .setTitle('🎯 Настройка AI запроса');
    
    SpreadsheetApp.getUi().showModalDialog(html, 'Настройка запроса');
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Ошибка открытия интерфейса: ' + error.message);
  }
}

/**
 * Получить данные для инициализации интерфейса
 * @return {Object} {sheetName, cellAddress, sheets}
 */
function getCollectConfigInitData() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var range = sheet.getActiveRange();
    
    if (!range) {
      throw new Error('Выделите ячейку!');
    }
    
    var sheetName = sheet.getName();
    var cellAddress = range.getA1Notation();
    var sheets = getAllSheetNames();
    
    return {
      sheetName: sheetName,
      cellAddress: cellAddress,
      sheets: sheets
    };
    
  } catch (error) {
    throw new Error('Ошибка инициализации: ' + error.message);
  }
}

/**
 * Обновить текущую ячейку по сохранённой конфигурации
 * Вызывается из меню "🔄 Обновить ячейку"
 */
function refreshCellWithConfig() {
  try {
    var ui = SpreadsheetApp.getUi();
    var sheet = SpreadsheetApp.getActiveSheet();
    var range = sheet.getActiveRange();
    
    if (!range) {
      ui.alert('⚠️ Внимание', 'Выделите ячейку!', ui.ButtonSet.OK);
      return;
    }
    
    var sheetName = sheet.getName();
    var cellAddress = range.getA1Notation();
    
    // Проверяем есть ли сохранённая конфигурация
    var config = loadCollectConfig(sheetName, cellAddress);
    
    if (!config) {
      var response = ui.alert(
        '⚠️ Конфигурация не найдена',
        'Для ячейки ' + sheetName + '!' + cellAddress + ' нет сохранённой конфигурации.\n\n' +
        'Хотите создать новую?',
        ui.ButtonSet.YES_NO
      );
      
      if (response == ui.Button.YES) {
        openCollectConfigUI();
      }
      return;
    }
    
    // Показываем информацию о запуске
    ui.alert(
      '🚀 Запуск обновления',
      'Конфигурация найдена!\n\n' +
      'System Prompt: ' + (config.systemPrompt ? 
        config.systemPrompt.sheet + '!' + config.systemPrompt.cell : 'не задан') + '\n' +
      'User Data: ' + config.userData.length + ' источник(ов)\n\n' +
      'Запускаю обработку...',
      ui.ButtonSet.OK
    );
    
    // Выполняем запрос
    var result = executeCollectConfig(sheetName, cellAddress);
    
    if (result.success) {
      // Записываем результат в ячейку
      range.setValue(result.result);
      
      ui.alert(
        '✅ Готово!',
        'Результат записан в ячейку ' + cellAddress,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        '❌ Ошибка',
        'Не удалось выполнить запрос:\n' + result.error,
        ui.ButtonSet.OK
      );
    }
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Ошибка: ' + error.message);
  }
}

/**
 * Проверить есть ли конфигурация для текущей ячейки
 * @return {boolean}
 */
function hasConfigForCurrentCell() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var range = sheet.getActiveRange();
    
    if (!range) {
      return false;
    }
    
    var sheetName = sheet.getName();
    var cellAddress = range.getA1Notation();
    var config = loadCollectConfig(sheetName, cellAddress);
    
    return config !== null;
    
  } catch (error) {
    return false;
  }
}

/**
 * Справка по AI Конструктору
 */
function showCollectConfigHelp() {
  var ui = SpreadsheetApp.getUi();
  
  var helpText = '🎯 AI КОНСТРУКТОР - ЧТО ЭТО?\n\n';
  helpText += '💡 ПРОБЛЕМА:\n';
  helpText += 'Google Sheets ограничивает формулу 50,000 символами.\n';
  helpText += 'Если вы собираете данные из многих ячеек:\n';
  helpText += '=GM("Промпт: " & A1 & A2 & ... & A1000)\n';
  helpText += '❌ Формула слишком длинная = ОШИБКА!\n\n';
  
  helpText += '✅ РЕШЕНИЕ:\n';
  helpText += 'AI Конструктор собирает данные НА СЕРВЕРЕ!\n';
  helpText += '1. Выбираете ячейку (например B3)\n';
  helpText += '2. Настраиваете:\n';
  helpText += '   • System Prompt - инструкция для AI\n';
  helpText += '   • User Data - листы и ячейки с данными\n';
  helpText += '3. Нажимаете "Запустить"\n';
  helpText += '4. Результат появляется в B3\n\n';
  
  helpText += '🎯 КАК ИСПОЛЬЗОВАТЬ:\n';
  helpText += '1. Выделите ячейку где нужен результат\n';
  helpText += '2. Меню → 🎯 AI Конструктор → 🎯 Настроить запрос\n';
  helpText += '3. Выберите лист и ячейку для System Prompt\n';
  helpText += '4. Добавьте источники данных (+ Добавить данные)\n';
  helpText += '5. Нажмите "Запустить"\n\n';
  
  helpText += '💾 НАСТРОЙКИ СОХРАНЯЮТСЯ!\n';
  helpText += 'При повторном открытии - все поля заполнены.\n';
  helpText += 'Можно быстро обновить: 🔄 Обновить ячейку\n\n';
  
  helpText += '📊 ДАННЫЕ В JSON:\n';
  helpText += 'Все данные отправляются в AI в структурированном\n';
  helpText += 'JSON формате - нейросеть лучше понимает!\n\n';
  
  helpText += '🔒 ХРАНЕНИЕ:\n';
  helpText += 'Конфигурации сохраняются в скрытом листе\n';
  helpText += '"ConfigData" - нет лимитов, легко экспортировать!';
  
  ui.alert('🎯 AI Конструктор', helpText, ui.ButtonSet.OK);
}