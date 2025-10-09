// New/client/Menu.gs
// Separation of Concerns: отдельный файл для UI логики

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  
  // Главное меню - часто используемые функции
  ui.createMenu('🤖 Table AI')
    .addItem('🌐 Веб-интерфейс', 'openWebInterface')
    .addSeparator()
    .addItem('🚀 Запустить анализ', 'prepareChainSmartWithHelp')
    .addItem('🔄 Обновить данные в ячейке', 'refreshCurrentGMCellWithHelp') 
    .addItem('📱 Получить VK посты', 'importVkPostsWithHelp')
    .addItem('💬 Анализ отзывов', 'ocrReviewsWithHelp')
    .addSeparator()
    .addItem('🧠 Режим чата', 'initializeChatModeWithHelp')
    .addItem('⚡ Активировать умные промпты', 'setupSmartPromptTriggerWithHelp')
    .addSeparator()
    .addSubMenu(ui.createMenu('⚙️ Настройки')
      .addItem('🔑 API ключ Gemini', 'initGeminiKeyWithHelp')
      .addItem('📝 Фраза готовности', 'setCompletionPhraseUIWithHelp')
      .addItem('🧹 Очистить формулы B3..G3', 'clearChainForA3WithHelp')
      .addSeparator()
      .addItem('🔐 Лицензия: Email + Токен', 'setLicenseCredentialsUIWithHelp')
      .addItem('📊 Проверить статус лицензии', 'checkLicenseStatusUIWithHelp')
      .addSeparator()
      .addItem('🔧 Очистить старые триггеры', 'cleanupOldTriggersWithHelp')
      .addItem('👀 Показать активные триггеры', 'showActiveTriggersDialogWithHelp')
      .addSeparator()
      .addItem('📊 Статус системы', 'showSystemStatusWithHelp')
    )
    .addToUi();

  // DEV меню только вызов серверных функций
  if (typeof DEV_MODE !== 'undefined' && DEV_MODE) {
    ui.createMenu('🧰 DEV')
      .addItem('📝 Логи системы', 'callServerDevFunction')
      .addItem('🧪 Тесты', 'callServerTestFunction')
      .addToUi();
  }
}

/**
 * UI для настройки credentials
 */
function setupCredentialsUI() {
  var ui = SpreadsheetApp.getUi();
  
  // Получаем текущие значения
  var props = PropertiesService.getScriptProperties();
  var currentEmail = props.getProperty('LICENSE_EMAIL') || '';
  var currentToken = props.getProperty('LICENSE_TOKEN') || '';
  var currentGeminiKey = props.getProperty('GEMINI_API_KEY') || '';
  
  // Маскируем существующие значения
  var maskedEmail = currentEmail ? currentEmail.replace(/(.{3}).*@/, '$1***@') : '';
  var maskedToken = currentToken ? '***' + currentToken.slice(-4) : '';
  var maskedGeminiKey = currentGeminiKey ? '***' + currentGeminiKey.slice(-4) : '';
  
  var html = `
    <div>
      <h3>Настройка credentials</h3>
      
      <p><strong>Email лицензии:</strong><br>
      Текущий: ${maskedEmail}<br>
      <input type="text" id="email" placeholder="Введите email лицензии" style="width: 100%; margin: 5px 0;">
      </p>
      
      <p><strong>Токен лицензии:</strong><br>
      Текущий: ${maskedToken}<br>
      <input type="text" id="token" placeholder="Введите токен лицензии" style="width: 100%; margin: 5px 0;">
      </p>
      
      <p><strong>Gemini API Key:</strong><br>
      Текущий: ${maskedGeminiKey}<br>
      <input type="text" id="geminiKey" placeholder="Введите Gemini API ключ" style="width: 100%; margin: 5px 0;">
      </p>
      
      <p><button onclick="saveCredentials()" style="background: #1a73e8; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Сохранить</button></p>
      
      <script>
        function saveCredentials() {
          var email = document.getElementById('email').value.trim();
          var token = document.getElementById('token').value.trim();
          var geminiKey = document.getElementById('geminiKey').value.trim();
          
          if (!email && !token && !geminiKey) {
            alert('Введите хотя бы один параметр для обновления');
            return;
          }
          
          google.script.run
            .withSuccessHandler(function() {
              alert('Credentials сохранены успешно!');
              google.script.host.close();
            })
            .withFailureHandler(function(error) {
              alert('Ошибка сохранения: ' + error.message);
            })
            .saveCredentialsData(email, token, geminiKey);
        }
      </script>
    </div>
  `;
  
  var htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(400)
    .setHeight(350);
  
  ui.showModalDialog(htmlOutput, 'Настройка credentials');
}

/**
 * Сохранение credentials от UI
 */
function saveCredentialsData(email, token, geminiKey) {
  var props = PropertiesService.getScriptProperties();
  
  if (email) {
    props.setProperty('LICENSE_EMAIL', email);
  }
  
  if (token) {
    props.setProperty('LICENSE_TOKEN', token);
  }
  
  if (geminiKey) {
    props.setProperty('GEMINI_API_KEY', geminiKey);
  }
  
  logClient('Credentials updated: email=' + !!email + ', token=' + !!token + ', geminiKey=' + !!geminiKey);
}

/**
 * UI для настройки OCR
 */
function setupOcrUI() {
  var ui = SpreadsheetApp.getUi();
  
  // Получаем текущие настройки
  var props = PropertiesService.getScriptProperties();
  var currentOverwrite = props.getProperty('OCR_OVERWRITE') || 'false';
  
  var html = `
    <div>
      <h3>Настройка OCR</h3>
      
      <p><strong>Перезаписывать существующие результаты:</strong><br>
      <input type="checkbox" id="overwrite" ${currentOverwrite === 'true' ? 'checked' : ''}> 
      Да, перезаписывать
      </p>
      
      <p><em>Если флаг выключен, OCR будет пропускать ячейки, в которых уже есть результат в колонке B.</em></p>
      
      <p><button onclick="saveOcrSettings()" style="background: #1a73e8; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Сохранить</button></p>
      
      <script>
        function saveOcrSettings() {
          var overwrite = document.getElementById('overwrite').checked;
          
          google.script.run
            .withSuccessHandler(function() {
              alert('Настройки OCR сохранены!');
              google.script.host.close();
            })
            .withFailureHandler(function(error) {
              alert('Ошибка сохранения: ' + error.message);
            })
            .saveOcrSettingsData(overwrite);
        }
      </script>
    </div>
  `;
  
  var htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(400)
    .setHeight(250);
  
  ui.showModalDialog(htmlOutput, 'Настройка OCR');
}

/**
 * Сохранение настроек OCR от UI
 */
function saveOcrSettingsData(overwrite) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('OCR_OVERWRITE', overwrite ? 'true' : 'false');
  
  logClient('OCR settings updated: overwrite=' + overwrite);
}

// ===== ФУНКЦИИ С ИНСТРУКЦИЯМИ =====

/**
 * Запустить анализ - с инструкцией
 */
function prepareChainSmartWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = `🚀 ЗАПУСТИТЬ АНАЛИЗ

Эта функция автоматически настраивает последовательную обработку данных:

📋 Что делает:
• Проверяет есть ли настройки в листе "Prompt_box"
• Если есть - использует их для создания цепочки формул
• Если нет - создает стандартную цепочку B3→C3→D3→E3→F3→G3

📝 Инструкция:
1. Убедитесь что данные есть в колонке A (строка 3 или другие)
2. Если нужна custom логика - настройте лист "Prompt_box"
3. Нажмите "Продолжить" для запуска

⚡ Результат: Формулы будут выполняться последовательно по мере готовности предыдущих`;

  var result = ui.alert('Инструкция', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    prepareChainSmart();
  }
}

/**
 * Обновить данные в ячейке - с инструкцией  
 */
function refreshCurrentGMCellWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = `🔄 ОБНОВИТЬ ДАННЫЕ В ЯЧЕЙКЕ

Принудительно пересчитывает GM функцию в выбранной ячейке:

📋 Что делает:
• Находит активную ячейку с GM формулой
• Очищает ее содержимое
• Заново вставляет формулу для пересчета

📝 Инструкция:
1. Выберите ячейку с формулой GM(), GM_STATIC() или GM_IF()
2. Нажмите "Продолжить"
3. Дождитесь обновления результата

⚡ Полезно когда результат "завис" или нужен свежий ответ`;

  var result = ui.alert('Инструкция', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    refreshCurrentGMCell();
  }
}

/**
 * Получить посты из соцсетей - с инструкцией
 */
function importVkPostsWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = `📱 ПОЛУЧИТЬ ПОСТЫ ИЗ СОЦСЕТЕЙ

Импортирует посты из VK, Instagram и Telegram с автоматической фильтрацией.

📋 Что делает:
• Загружает посты из VK, Instagram или Telegram
• Создает лист "посты" с данными и формулами
• Добавляет фильтры по стоп-словам и позитивным словам
• Создает нумерацию отфильтрованных постов

🔧 Подготовка (обязательно!):
1. Настройте лицензию: 🤖 Table AI → ⚙️ Настройки → 🔐 Лицензия
2. Создайте лист "Параметры" (если нет)
3. В ячейку B1: ссылка, username или ID
   • VK: https://vk.com/group или group_name или -123456
   • Instagram: https://instagram.com/username или username
   • Telegram: https://t.me/channel или @channel
4. В ячейку B2: количество постов (1-100, по умолчанию 20)
5. [Опционально] В C1: платформа ("вк", "инста", "тг" или пусто для auto-detect)

📊 Что создается в листе "посты":
• Колонка A: Платформа (VK/Instagram/Telegram)
• Колонка B: Дата поста
• Колонка C: Ссылка на пост
• Колонка D: Текст поста
• Колонки E-F: Стоп-слова и фильтр (через формулы)
• Колонки H-I: Позитивные слова и фильтр

💡 Использование фильтров:
• В колонку E добавьте стоп-слова (каждое в отдельной ячейке)
• В колонку H добавьте позитивные слова
• Формулы автоматически скроют/выделят нужные посты

🔐 VK Access Token:
Настраивается администратором на сервере (НЕ требуется от пользователя)`;

  var result = ui.alert('Инструкция', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    importVkPosts();
  }
}

/**
 * Анализ отзывов - с инструкцией
 */
function ocrReviewsWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = `💬 АНАЛИЗ ОТЗЫВОВ

Извлекает и анализирует текст из изображений отзывов:

📋 Что делает:
• Находит изображения в колонке A листа "Отзывы"
• Извлекает текст через OCR
• Анализирует отзыв через Gemini AI
• Результат записывает в колонку B

📝 Подготовка:
1. Создайте лист "Отзывы" (если нет)
2. В колонку A добавьте:
   • Ссылки на изображения
   • Формулы IMAGE()
   • Rich text с изображениями

📝 Поддерживаемые источники:
• VK фотографии
• Google Drive файлы  
• Yandex.Disk
• Dropbox
• Прямые ссылки на изображения

⚡ Пропускает ячейки где уже есть результат в колонке B`;

  var result = ui.alert('Инструкция', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    ocrReviews();
  }
}

// ===== ФУНКЦИИ НАСТРОЕК С ИНСТРУКЦИЯМИ =====

function initGeminiKeyWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = `🔑 API КЛЮЧ GEMINI

Настройка ключа для работы с Gemini AI:

📝 Как получить ключ:
1. Откройте: https://aistudio.google.com/app/apikey
2. Нажмите "Create API key"  
3. Скопируйте полученный ключ

💡 Ключ нужен для всех AI функций: GM(), GM_STATIC(), анализ отзывов`;

  var result = ui.alert('Инструкция', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    initGeminiKey();
  }
}

function setCompletionPhraseUIWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = `📝 ФРАЗА ГОТОВНОСТИ

Настройка фразы для автоматических цепочек:

📋 Что это:
Фраза с которой должен начинаться готовый ответ от AI

📝 Примеры:
• "Отчёт готов"
• "Анализ завершен"  
• "Готово:"

💡 Цепочки ждут эту фразу чтобы перейти к следующему шагу`;

  var result = ui.alert('Инструкция', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    setCompletionPhraseUI();
  }
}

function clearChainForA3WithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = `🧹 ОЧИСТИТЬ ФОРМУЛЫ B3..G3

Удаляет все формулы из стандартной цепочки:

📋 Что делает:
• Очищает ячейки B3, C3, D3, E3, F3, G3
• Останавливает активные цепочки обработки

💡 Используйте когда нужно начать заново или цепочка "зависла"`;

  var result = ui.alert('Инструкция', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    clearChainForA3();
  }
}

function setLicenseCredentialsUIWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = `🔐 ЛИЦЕНЗИЯ: EMAIL + ТОКЕН

Настройка доступа к серверу Table AI:

📋 Для чего нужно:
• Доступ к серверным функциям
• Rate limiting (ограничение запросов)
• Персональная статистика

📝 Где взять:
Обратитесь к администратору системы за:
• Email лицензии
• Токен доступа

💡 Без лицензии работают только локальные GM функции`;

  var result = ui.alert('Инструкция', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    setLicenseCredentialsUI();
  }
}

function checkLicenseStatusUIWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = `📊 ПРОВЕРИТЬ СТАТУС ЛИЦЕНЗИИ

Показывает информацию о вашей лицензии:

📋 Что проверяет:
• Валидность email и токена
• Оставшиеся запросы
• Дату истечения лицензии
• Статистику использования

💡 Запускайте периодически для контроля лимитов`;

  var result = ui.alert('Инструкция', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    checkLicenseStatusUI();
  }
}

function cleanupOldTriggersWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = `🔧 ОЧИСТИТЬ СТАРЫЕ ТРИГГЕРЫ

Удаляет устаревшие автоматические триггеры:

📋 Что делает:
• Находит триггеры checkStepCompletion
• Удаляет их для освобождения ресурсов
• Оставляет onEdit и onOpen

💡 Используйте если цепочки работают некорректно`;

  var result = ui.alert('Инструкция', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    cleanupOldTriggers();
  }
}

function showActiveTriggersDialogWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = `👀 ПОКАЗАТЬ АКТИВНЫЕ ТРИГГЕРЫ

Отображает список всех активных триггеров проекта:

📋 Что показывает:
• Названия функций триггеров
• Типы событий
• Общее количество

💡 Полезно для диагностики проблем с автоматизацией`;

  var result = ui.alert('Инструкция', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    showActiveTriggersDialog();
  }
}

function showSystemStatusWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = `📊 СТАТУС СИСТЕМЫ

Комплексная диагностика Table AI:

📋 Что проверяет:
• Настройки credentials (email, token, API key)
• Подключение к серверу
• Наличие необходимых листов
• Настройки OCR

💡 Первое что нужно проверить при проблемах`;

  var result = ui.alert('Инструкция', instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    showSystemStatus();
  }
}

// ===== DEV ФУНКЦИИ (только вызов сервера) =====

function callServerDevFunction() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('DEV функции доступны только на сервере');
  // TODO: Вызов серверной DEV функции через API
}

function callServerTestFunction() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('Тесты запускаются на сервере');
  // TODO: Вызов серверных тестов через API
}

/**
 * Показ статуса системы
 */
function showSystemStatus() {
  var ui = SpreadsheetApp.getUi();
  
  // Проверяем credentials
  var credentials = getClientCredentials();
  
  // Проверяем настройки OCR
  var props = PropertiesService.getScriptProperties();
  var ocrOverwrite = props.getProperty('OCR_OVERWRITE') || 'false';
  
  // Проверяем подключение к серверу
  var serverStatus = 'Не проверен';
  try {
    var serverUrl = getServerUrl();
    var response = UrlFetchApp.fetch(serverUrl + '/health', {
      method: 'GET',
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      serverStatus = '✅ Подключен';
    } else {
      serverStatus = '❌ Ошибка HTTP ' + response.getResponseCode();
    }
  } catch (e) {
    serverStatus = '❌ ' + e.message;
  }
  
  // Проверяем листы
  var ss = SpreadsheetApp.getActive();
  var reviewsSheet = ss.getSheetByName('Отзывы') ? '✅' : '❌';
  var paramsSheet = ss.getSheetByName('Параметры') ? '✅' : '❌';
  
  var status = `
📊 Статус системы Table AI v2.0

🔐 Credentials:
• Email лицензии: ${credentials.ok ? '✅ Настроен' : '❌ ' + credentials.error}
• Токен лицензии: ${credentials.ok ? '✅ Настроен' : '❌ Не настроен'}
• Gemini API: ${credentials.ok && credentials.apiKey ? '✅ Настроен' : '❌ Не настроен'}

⚙️ Настройки:
• Перезапись OCR: ${ocrOverwrite === 'true' ? '✅ Включена' : '❌ Выключена'}

🌐 Сервер:
• Подключение: ${serverStatus}

📋 Листы:
• Лист "Отзывы": ${reviewsSheet}
• Лист "Параметры": ${paramsSheet}

💡 Рекомендации:
${credentials.ok ? '' : '• Настройте credentials через меню'}
${reviewsSheet === '✅' ? '' : '• Создайте лист "Отзывы" для OCR обработки'}
${paramsSheet === '✅' ? '' : '• Создайте лист "Параметры" для VK импорта'}
  `.trim();
  
  ui.alert('Статус системы', status, ui.ButtonSet.OK);
}

// ===== НОВЫЕ ФУНКЦИИ С ИНСТРУКЦИЯМИ =====

/**
 * Режим чата - с инструкцией
 */
function initializeChatModeWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = `🧠 РЕЖИМ ЧАТА

Интерактивное общение с Gemini прямо в таблице:

📋 Что создается:
• Лист "Чат" с ячейками для общения
• A2 - ваши сообщения
• B2 - ответы ассистента  
• Автоматические триггеры

✨ Возможности:
• Умные промпты ("Промпт: текст")
• Сохранение контекста разговора
• Автоматические ответы
• Экспорт истории общения

📝 Использование:
1. Нажмите "Продолжить" для создания
2. Перейдите на лист "Чат"
3. Напишите вопрос в A2 и нажмите Enter
4. Получите ответ в B2

💡 Контекст включается через Параметры!C1 (поставьте "✓")`;

  var result = ui.alert("Инструкция", instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    initializeChatMode();
  }
}

/**
 * Умные промпты - с инструкцией
 */
function setupSmartPromptTriggerWithHelp() {
  var ui = SpreadsheetApp.getUi();
  var instruction = `⚡ УМНЫЕ ПРОМПТЫ

Автоматическое преобразование естественного языка в формулы:

📋 Как работает:
• Пишете "Промпт: текст" в любую ячейку
• Система автоматически создает формулу GM()
• Применяются правила замены слов на ссылки

📝 Примеры:
"Промпт: Проанализируй наша ниша и анализ отзывов"
→ =GM("Проанализируй " & Распаковка!A3 & " и " & Отзывы!C2)

🎯 Правила (лист "Правила"):
• "наша ниша" → Распаковка!A3
• "анализ отзывов" → Отзывы!C2
• "анализ постов" → Посты!K2

✨ Дополнительно:
• Статичные промпты: "Промпт статичный: текст"
• Автоматическая активация при вводе
• Создание листа правил с примерами

📝 Использование:
1. Нажмите "Продолжить" для активации
2. В любой ячейке напишите "Промпт: ваш текст"
3. Нажмите Enter - получите готовую формулу

💡 Настройте свои правила в листе "Правила"`;

  var result = ui.alert("Инструкция", instruction, ui.ButtonSet.OK_CANCEL);
  if (result === ui.Button.OK) {
    setupSmartPromptTrigger();
  }
}
