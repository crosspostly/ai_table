# 🤖 AGENT_READ_FIRST.md

**Полное руководство для AI-агентов работающих с репозиторием `ai_table`**

Версия: 1.0  
Дата: 2025-10-14  
Автор: Droid (Factory AI)

---

## 📖 ОГЛАВЛЕНИЕ

1. [Что это за приложение](#1-что-это-за-приложение)
2. [Архитектура Google Apps Script](#2-архитектура-google-apps-script)
3. [Client vs Server - ключевые различия](#3-client-vs-server---ключевые-различия)
4. [Структура репозитория](#4-структура-репозитория)
5. [Основные компоненты](#5-основные-компоненты)
6. [Процесс разработки](#6-процесс-разработки)
7. [Деплоймент](#7-деплоймент)
8. [Типичные задачи](#8-типичные-задачи)
9. [Troubleshooting](#9-troubleshooting)
10. [Чеклист для нового агента](#10-чеклист-для-нового-агента)

---

## 1. ЧТО ЭТО ЗА ПРИЛОЖЕНИЕ

### 🎯 Назначение

**AI_TABLE v2.1.0** - это enterprise-система для автоматизации работы с данными в Google Sheets через интеграцию с:
- 🧠 **Gemini AI** (Google) - для анализа и обработки текстов
- 📱 **Социальные сети** (VK, Instagram, Telegram) - для импорта контента
- 📷 **OCR** - для распознавания текста с изображений
- 🔗 **Smart Chain** - для последовательной обработки данных

### 🎭 Кто пользователи

1. **Маркетологи** - импорт постов из соцсетей, анализ конкурентов
2. **Аналитики** - обработка больших объёмов данных через AI
3. **Контент-менеджеры** - автоматическое создание описаний, переводы
4. **Бизнес-аналитики** - создание отчётов на основе данных

### 💼 Бизнес-модель

- **Лицензионная система** - проверка через LICENSE_EMAIL + LICENSE_TOKEN
- **API quota** - пользователь сам вводит GEMINI_API_KEY (его квота)
- **Серверная часть** - на отдельном Apps Script проекте (админы)

---

## 2. АРХИТЕКТУРА GOOGLE APPS SCRIPT

### 🏗️ Что такое Google Apps Script

**Google Apps Script** - это JavaScript платформа от Google для автоматизации Google Workspace (Sheets, Docs, Gmail и т.д.).

**Ключевые особенности:**
- Язык: JavaScript (стандарт ES6 с ограничениями)
- Runtime: V8 engine
- Выполнение: на серверах Google (не в браузере!)
- Доступ: к Google APIs без OAuth для владельца документа
- Квоты: 6 минут на выполнение, ограничения по вызовам API

### 📦 Два типа Apps Script проектов

#### 1. **Container-bound script** (наш CLIENT)

```
Google Sheets документ
  └── Apps Script привязан к ЭТОМУ документу
      ├── Menu.gs
      ├── GeminiClient.gs  
      └── ... (все client файлы)
```

**Характеристики:**
- ✅ Привязан к конкретному Google Sheets документу
- ✅ Имеет доступ к SpreadsheetApp (текущий документ)
- ✅ Может создавать UI (меню, диалоги, sidebar)
- ✅ Запускается в контексте ПОЛЬЗОВАТЕЛЯ документа
- ✅ onOpen() автоматически вызывается при открытии
- ❌ НЕ может быть standalone webapp
- ❌ НЕ может вызывать doPost() напрямую

**Script ID:** `1DdlYfvo0EfEA1O1nb5DRI0o-WJoIivtfIPNSE1C1bt3IvvWC91sGE6Xs`

#### 2. **Standalone script** (наш SERVER)

```
Apps Script проект (отдельно от любого документа)
  ├── ServerEndpoints.gs (с doPost())
  ├── GeminiService.gs
  └── ... (все server файлы)
  
Деплоится как:
  → Web App по URL
  → Можно вызывать через UrlFetchApp
```

**Характеристики:**
- ✅ Независимый проект (не привязан к документу)
- ✅ Может быть развёрнут как Web App (doGet/doPost)
- ✅ Имеет свой публичный URL для API вызовов
- ✅ Может хранить секреты в PropertiesService
- ✅ Централизованное управление для всех пользователей
- ❌ НЕ имеет прямого доступа к документам пользователей
- ❌ НЕ может создавать UI в чужих документах

**Script ID:** `1ncX8FGqT7QP-LxqrRJu0_z_FmUTGsbqmbWDCRePLfHgW8x85bX_Yu9uP`

### 🔄 Как они взаимодействуют

```
┌─────────────────────────────────────────────┐
│  ПОЛЬЗОВАТЕЛЬ открывает Google Sheets       │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  CLIENT (Container-bound script)            │
│  ├── Menu.gs - создаёт меню                 │
│  ├── GeminiClient.gs - GM() функции         │
│  ├── SocialImportClient.gs                  │
│  └── SuperMasterCheck.gs                    │
└─────────────────────────────────────────────┘
                    │
                    │ UrlFetchApp.fetch(SERVER_URL)
                    │ POST { action, email, token, data }
                    ▼
┌─────────────────────────────────────────────┐
│  SERVER (Standalone script)                 │
│  ├── ServerEndpoints.gs - doPost()          │
│  │   └── Проверка лицензии                 │
│  ├── GeminiService.gs - прокси к Gemini    │
│  ├── SocialImportService.gs                │
│  └── OcrService.gs                          │
└─────────────────────────────────────────────┘
                    │
                    │ для VK импорта
                    ▼
┌─────────────────────────────────────────────┐
│  VK_PARSER_SERVER (отдельный сервис)        │
│  └── VK API с VK_TOKEN                      │
└─────────────────────────────────────────────┘
```

---

## 3. CLIENT VS SERVER - КЛЮЧЕВЫЕ РАЗЛИЧИЯ

### 🎭 CLIENT (table/client/)

**Роль:** Интерфейс для пользователя, выполнение в контексте документа

**Что МОЖНО:**
- ✅ `SpreadsheetApp.getActiveSpreadsheet()` - доступ к текущему документу
- ✅ `SpreadsheetApp.getUi()` - создание меню, диалогов, alerts
- ✅ `onOpen()` - автотриггер при открытии документа
- ✅ `onEdit(e)` - автотриггер при редактировании ячейки
- ✅ `CacheService` - кэширование (5-6 часов)
- ✅ `PropertiesService.getUserProperties()` - личные настройки пользователя
- ✅ `UrlFetchApp.fetch()` - вызов внешних API (включая наш SERVER)

**Что НЕЛЬЗЯ:**
- ❌ `doPost()` / `doGet()` - не работает в container-bound
- ❌ Доступ к документам других пользователей
- ❌ Хранение глобальных секретов (только свои credentials)
- ❌ Централизованное управление для всех пользователей

**Типичные файлы:**
- `Menu.gs` - создание главного меню
- `GeminiClient.gs` - GM() функции для ячеек
- `SocialImportClient.gs` - клиентская часть импорта
- `SuperMasterCheck.gs` - тестирование системы
- `CredentialsManager.gs` - управление ключами пользователя

**Где хранятся credentials:**
```javascript
// В CLIENT - каждый пользователь вводит свои:
var props = PropertiesService.getUserProperties();
props.setProperty('GEMINI_API_KEY', userKey);
props.setProperty('LICENSE_EMAIL', userEmail);
props.setProperty('LICENSE_TOKEN', userToken);
```

---

### 🌐 SERVER (table/server/)

**Роль:** Централизованный backend, API эндпоинты, проверка лицензий

**Что МОЖНО:**
- ✅ `doPost(e)` - обработка HTTP POST запросов
- ✅ `doGet(e)` - обработка HTTP GET запросов (health check)
- ✅ `PropertiesService.getScriptProperties()` - глобальные секреты (для ВСЕХ пользователей)
- ✅ Централизованная валидация лицензий
- ✅ Прокси к внешним API (скрывая токены от пользователей)
- ✅ Логирование всех действий

**Что НЕЛЬЗЯ:**
- ❌ `SpreadsheetApp.getActiveSpreadsheet()` - нет контекста документа
- ❌ `SpreadsheetApp.getUi()` - нет UI
- ❌ `onOpen()` / `onEdit()` - нет триггеров
- ❌ Прямой доступ к документам пользователей

**Типичные файлы:**
- `ServerEndpoints.gs` - doPost() с маршрутизацией запросов
- `LicenseService.gs` - проверка лицензий
- `SocialImportService.gs` - серверная логика импорта
- `GeminiService.gs` - прокси для Gemini API
- `OcrService.gs` - обработка OCR запросов

**Где хранятся credentials:**
```javascript
// В SERVER - админы настраивают для ВСЕХ:
var props = PropertiesService.getScriptProperties();
props.setProperty('TELEGRAM_BOT_TOKEN', adminToken);
props.setProperty('INSTAGRAM_API_TOKEN', adminToken);
// НО НЕ VK_TOKEN! Он на VK_PARSER сервере
```

---

### 📋 Сравнительная таблица

| Характеристика | CLIENT | SERVER |
|----------------|--------|--------|
| **Тип проекта** | Container-bound | Standalone |
| **Привязка** | К конкретному Google Sheets | Независимый |
| **Доступ к документу** | ✅ Да (SpreadsheetApp) | ❌ Нет |
| **UI (меню, диалоги)** | ✅ Да | ❌ Нет |
| **Web App (doPost)** | ❌ Нет | ✅ Да |
| **Triggers (onOpen)** | ✅ Да | ❌ Нет |
| **Контекст выполнения** | Пользователь документа | Web App owner |
| **PropertiesService** | UserProperties (личные) | ScriptProperties (глобальные) |
| **Хранение секретов** | GEMINI_API_KEY пользователя | TELEGRAM_TOKEN админа |
| **Количество инстансов** | По инстансу на документ | Один для всех |

---

## 4. СТРУКТУРА РЕПОЗИТОРИЯ

### 📁 Полная карта проекта

```
ai_table/
│
├── .github/
│   └── workflows/
│       ├── deploy-apps-script.yml       # 🚀 Главный workflow деплоя
│       └── deploy-to-drive-folder.yml   # 📦 Деплой в Drive папку
│
├── table/                                # 📂 ГЛАВНАЯ ДИРЕКТОРИЯ КОДА
│   │
│   ├── client/                          # 🖥️ CLIENT (Container-bound)
│   │   ├── appsscript.json              # Манифест client проекта
│   │   ├── Menu.gs                      # Главное меню (onOpen)
│   │   ├── GeminiClient.gs              # GM() функции
│   │   ├── SocialImportClient.gs        # Импорт из соцсетей (клиент)
│   │   ├── SuperMasterCheck.gs          # 46 тестов системы
│   │   ├── CredentialsManager.gs        # Управление ключами
│   │   ├── ChatMode.gs                  # Режим чата
│   │   ├── OcrRunner.gs / OcrHelpers.gs # OCR клиент
│   │   ├── SmartPromptProcessor.gs      # Smart Chain
│   │   ├── Macros.gs                    # Макросы
│   │   ├── SmartRulesProcessor.gs       # Умные правила
│   │   ├── TextToFormulaConverter.gs    # Конвертер текст→формула
│   │   ├── AutoButton.gs                # Автокнопки
│   │   ├── ButtonFunctions.gs           # Функции кнопок
│   │   ├── LogsSheetManager.gs          # Логи в Sheet
│   │   └── LogViewer.gs                 # UI для просмотра логов
│   │
│   ├── server/                          # 🌐 SERVER (Standalone)
│   │   ├── appsscript.json              # Манифест server проекта
│   │   ├── ServerEndpoints.gs           # doPost() + маршрутизация
│   │   ├── LicenseService.gs            # Проверка лицензий
│   │   ├── SimpleLicenseService.gs      # Упрощённая версия
│   │   ├── TableLicenseService.gs       # Табличная лицензия
│   │   ├── SocialImportService.gs       # Импорт (сервер)
│   │   ├── VkImportService.gs           # VK импорт
│   │   ├── TelegramImportService.gs     # Telegram импорт
│   │   ├── OcrService.gs                # OCR обработка
│   │   ├── SmartChainService.gs         # Smart Chain сервис
│   │   ├── RulesEngine.gs               # Движок правил
│   │   ├── ConfigurationManager.gs      # Управление конфигами
│   │   ├── ConditionalGemini.gs         # GM_IF функции
│   │   ├── CompletionPhraseService.gs   # Автодополнение
│   │   ├── ContextManager.gs            # Контекст для AI
│   │   ├── DataCollectors.gs            # Сбор данных
│   │   ├── ErrorHandlingService.gs      # Обработка ошибок
│   │   ├── RetryService.gs              # Retry логика
│   │   ├── SourceDetector.gs            # Определение источника
│   │   ├── TriggerManager.gs            # Управление триггерами
│   │   ├── ValidationService.gs         # Валидация данных
│   │   └── VkTokenValidator.gs          # Валидация VK токенов
│   │
│   ├── shared/                          # 🔧 SHARED (общие утилиты)
│   │   ├── Utils.gs                     # Общие функции
│   │   ├── LoggingService.gs            # Логирование
│   │   └── Constants.gs                 # Константы (URLs, config)
│   │
│   ├── web/                             # 🎨 WEB (UI компоненты)
│   │   ├── CollectConfigUI.gs           # AI Конструктор (код)
│   │   ├── CollectConfigUI.html         # AI Конструктор (UI)
│   │   ├── LogViewer.gs                 # Просмотр логов (код)
│   │   ├── WebInterface.gs              # Веб интерфейс
│   │   ├── WebInterfaceExtensions.gs    # Расширения
│   │   ├── WebApp.html                  # Веб приложение
│   │   └── RealisticWebApp.html         # Реалистичный UI
│   │
│   ├── tests/                           # 🧪 TESTS
│   │   └── (тестовые файлы)
│   │
│   └── docs/                            # 📚 DOCS
│       └── (документация)
│
├── .clasp-client.json                   # 📋 Конфиг clasp для CLIENT
├── .clasp-server.json                   # 📋 Конфиг clasp для SERVER
│
├── version.json                         # 🔢 Версионирование
├── package.json                         # 📦 npm зависимости
│
├── README.md                            # 📖 Главная документация
├── FILE_STRUCTURE_RULES.md              # 📁 Правила структуры файлов
├── DEPLOYMENT_GUIDE.md                  # 🚀 (создать) Гайд по деплою
└── AGENT_READ_FIRST.md                  # 🤖 Этот документ
```

---

## 5. ОСНОВНЫЕ КОМПОНЕНТЫ

### 🧠 Gemini AI Integration

**Как работает:**

```javascript
// В ячейке Google Sheets:
=GM("Переведи на английский: " & A1)

// Что происходит:
1. Apps Script вызывает функцию GM()
2. GM() в GeminiClient.gs проверяет кэш
3. Если нет в кэше → вызывает callGeminiAPI()
4. callGeminiAPI() отправляет запрос к Gemini API
5. Ответ сохраняется в кэш (5 мин TTL)
6. Результат возвращается в ячейку
```

**Файлы:**
- `table/client/GeminiClient.gs` - основные функции GM(), GM_STATIC()
- `table/server/ConditionalGemini.gs` - GM_IF() для условной логики

**Credentials:**
- `GEMINI_API_KEY` - хранится у каждого ПОЛЬЗОВАТЕЛЯ (client)
- Каждый пользователь использует свою квоту

---

### 📱 Social Import (VK, Instagram, Telegram)

**Архитектура:**

```
CLIENT                    SERVER                   VK_PARSER
  │                         │                         │
  │ importVkPosts()         │                         │
  ├────────────────────────>│ doPost(action='vk')    │
  │                         ├────────────────────────>│
  │                         │                         │ VK API
  │                         │<────────────────────────┤
  │<────────────────────────┤ Response                │
  │                         │                         │
  │ Записывает в Sheet      │                         │
```

**Почему 3 уровня?**
1. **CLIENT** - UI, взаимодействие с пользователем
2. **SERVER** - валидация лицензии, маршрутизация
3. **VK_PARSER** - VK_TOKEN хранится ЗДЕСЬ (не у пользователей!)

**Файлы:**
- `table/client/SocialImportClient.gs` - UI и вызов сервера
- `table/server/SocialImportService.gs` - маршрутизация
- `table/server/VkImportService.gs` - логика VK
- `table/server/TelegramImportService.gs` - логика Telegram

---

### 🔗 Smart Chain (умные цепочки)

**Концепция:**

```
Строка 1: | Исходный текст | Перевод | Резюме |
Строка 2: | (пусто)        | Переведи: {{prev}} | Сократи: {{prev}} |
Строка 3: | Привет!        | Hello!  | Short greeting |
                             ↑         ↑
                             автоматически заполняется
```

**Как работает:**
1. Пользователь заполняет A3: "Привет!"
2. Trigger onEdit() срабатывает
3. SmartPromptProcessor.gs читает промпт из B2
4. Заменяет {{prev}} на значение A3
5. Вызывает GM() с промптом
6. Записывает результат в B3
7. Trigger срабатывает снова для C3

**Файлы:**
- `table/client/SmartPromptProcessor.gs` - клиентская обработка
- `table/server/SmartChainService.gs` - серверная логика

---

### 📷 OCR (Optical Character Recognition)

**Поддерживаемые источники:**
- Google Drive (drive.google.com/file/...)
- VK (vk.com/photo...)
- Yandex.Disk
- Dropbox
- Прямые URL изображений

**Процесс:**
1. Пользователь вставляет URL изображения в ячейку
2. `OcrRunner.gs` вызывается (вручную или триггер)
3. CLIENT → SERVER (action='ocr_process')
4. SERVER → Google Vision API (OCR)
5. Текст возвращается в ячейку
6. (Опционально) Текст анализируется через Gemini

**Файлы:**
- `table/client/OcrRunner.gs` + `OcrHelpers.gs` - клиент
- `table/server/OcrService.gs` - сервер + Vision API

---

### 🧪 SuperMasterCheck (тестирование)

**46 автоматических тестов:**

```
✅ Credentials (8 тестов)
   - Проверка GEMINI_API_KEY
   - Проверка LICENSE_EMAIL/TOKEN
   - Проверка SERVER_URL

✅ Функции (27 тестов)
   - GM() работает
   - GM_STATIC() работает
   - Импорт функции доступны
   - OCR функции доступны

✅ Параметры (6 тестов)
   - Лист "Параметры" существует
   - Формат правильный

✅ Боевые тесты (4 теста)
   - Реальный вызов Gemini
   - Реальный вызов сервера

✅ VK API (опционально)
   - Если VK_TOKEN настроен
```

**Файл:**
- `table/client/SuperMasterCheck.gs`

**Использование:**
```
🤖 Table AI → 🧰 DEV → 🎯 СУПЕР МАСТЕР ПРОВЕРКА
```

---

## 6. ПРОЦЕСС РАЗРАБОТКИ

### 🔄 Workflow для новой фичи

```
1. АНАЛИЗ
   ├── Определить: CLIENT или SERVER?
   ├── Если UI → CLIENT
   ├── Если API/лицензия → SERVER
   └── Если общее → SHARED

2. СОЗДАНИЕ ФАЙЛОВ
   ├── Создать в правильной директории:
   │   ├── table/client/  (для UI, меню, триггеров)
   │   ├── table/server/  (для API, backend)
   │   ├── table/shared/  (для общих утилит)
   │   └── table/web/     (для HTML UI)
   └── Следовать FILE_STRUCTURE_RULES.md

3. ЛОКАЛЬНАЯ РАЗРАБОТКА
   ├── Тестировать через Apps Script Editor
   ├── Использовать Logger.log() для отладки
   └── Проверить что нет конфликт-маркеров

4. КОММИТ
   ├── git add <files>
   ├── pre-commit hook проверит конфликты
   ├── git commit -m "feat: описание"
   └── git push origin <branch>

5. ДЕПЛОЙ
   ├── GitHub Actions автоматически:
   │   ├── Копирует shared/ → client/ + server/
   │   ├── Копирует web/ → client/
   │   ├── Обновляет timestamps
   │   ├── Валидирует файлы
   │   └── clasp push в Apps Script
   └── Проверить логи деплоя

6. ТЕСТИРОВАНИЕ
   ├── Ctrl+F5 в Google Sheets
   ├── Проверить меню/функции
   └── Запустить SuperMasterCheck
```

---

### 🌿 Стратегия веток

```
main
  ├── production код
  └── деплоится автоматически через GitHub Actions

web-interface-with-design
  ├── feature ветка для UI изменений
  └── тоже деплоится автоматически

feature/<название>
  ├── для новых фич
  └── PR в web-interface-with-design или main
```

---

### 📝 Соглашения о коде

**Именование:**
- Функции: `camelCase` (например: `importVkPosts`)
- Константы: `UPPER_SNAKE_CASE` (например: `SERVER_URL`)
- Файлы: `PascalCase.gs` (например: `GeminiClient.gs`)

**Комментарии:**
```javascript
/**
 * Описание функции
 * @param {string} param - описание параметра
 * @return {Object} описание возврата
 */
function myFunction(param) {
  // Комментарий к коду
}
```

**Логирование:**
```javascript
// CLIENT:
addSystemLog('Message', 'INFO', 'MODULE');

// SERVER:
logServer('Message', traceId);
```

---

## 7. ДЕПЛОЙМЕНТ

### 🚀 Автоматический деплой через GitHub Actions

**Триггеры:**
- Push в `main` ветку
- Push в `web-interface-with-design` ветку
- Изменения в `table/**` или `.github/workflows/`

**Процесс (deploy-apps-script.yml):**

```yaml
1. Checkout code
   └── git clone репозитория

2. Setup Node.js & clasp
   └── Установка @google/clasp

3. Refresh OAuth Token
   └── Обновление access_token для clasp

4. Update Deploy Timestamps
   ├── DEPLOY_TIMESTAMP=$(date)
   ├── sed в version.json
   └── sed в table/client/Menu.gs

5. Validate Files
   ├── Проверка на conflict markers (<<< ===  >>>)
   ├── Проверка JSON файлов
   └── Проверка местоположения файлов

6. Deploy Server Project
   ├── cd table/server/
   ├── cp ../shared/*.gs ./
   ├── clasp push
   └── Apps Script ID: 1ncX8FGqT7QP...

7. Deploy Client Project
   ├── cd table/client/
   ├── cp ../shared/*.gs ./
   ├── cp ../web/*.gs ./
   ├── cp ../web/*.html ./
   ├── clasp push
   └── Apps Script ID: 1DdlYfvo0EfEA1O1nb5...

8. Summary
   └── Отчёт о деплое
```

---

### 🔍 Как проверить успешность деплоя

**1. GitHub Actions:**
```
https://github.com/crosspostly/ai_table/actions
→ Ищем workflow "Deploy to Google Apps Script"
→ Статус должен быть ✅ зелёным
→ Время ~2-3 минуты
```

**2. Логи деплоя:**
```
Ищем в логах:
✅ Copied appsscript.json to table/client/
✅ Copied shared files to table/client/
'table/web/LogViewer.gs' -> 'table/client/LogViewer.gs'
✅ Client deployment complete!
```

**3. Apps Script Editor:**
```
https://script.google.com/home/projects/1DdlYfvo0EfEA1O1nb5...
→ Files слева - должны быть все файлы
→ Проверить timestamp в Menu.gs
```

**4. Google Sheets:**
```
1. Ctrl+F5 (жёсткое обновление)
2. 🤖 Table AI → 🧰 DEV
3. Проверить версию (должна быть актуальная)
4. Проверить что все пункты меню на месте
```

---

### ⚙️ Конфигурация clasp

**Два файла конфигурации:**

`.clasp-client.json`:
```json
{
  "scriptId": "1DdlYfvo0EfEA1O1nb5DRI0o-WJoIivtfIPNSE1C1bt3IvvWC91sGE6Xs",
  "rootDir": "./table/client"
}
```

`.clasp-server.json`:
```json
{
  "scriptId": "1ncX8FGqT7QP-LxqrRJu0_z_FmUTGsbqmbWDCRePLfHgW8x85bX_Yu9uP",
  "rootDir": "./table/server"
}
```

**ВАЖНО:**
- `scriptId` - это ID проекта в Apps Script
- `rootDir` - откуда clasp берёт файлы для push
- Workflow копирует файлы ИЗ shared/ и web/ В rootDir ПЕРЕД push

---

## 8. ТИПИЧНЫЕ ЗАДАЧИ

### 📝 ЗАДАЧА: Добавить новую GM функцию

**Шаги:**
1. Открыть `table/client/GeminiClient.gs`
2. Добавить новую функцию (например `GM_SUMMARIZE`)
3. Использовать паттерн кэширования
4. Закоммитить
5. Дождаться деплоя
6. Протестировать в Sheets

**Пример:**
```javascript
function GM_SUMMARIZE(text) {
  if (!text) return '';
  var prompt = 'Summarize in 3 sentences: ' + text;
  return GM(prompt);
}
```

---

### 🎨 ЗАДАЧА: Создать новый UI dialog

**Шаги:**
1. Создать `table/web/MyDialog.gs`:
```javascript
function openMyDialog() {
  var html = HtmlService.createHtmlOutputFromFile('MyDialog')
    .setWidth(600)
    .setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(html, 'My Dialog');
}
```

2. Создать `table/web/MyDialog.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
</head>
<body>
  <h1>My Dialog</h1>
  <button onclick="google.script.host.close()">Close</button>
</body>
</html>
```

3. Добавить в меню (`table/client/Menu.gs`):
```javascript
.addItem('🎯 My Feature', 'openMyDialog')
```

4. Закоммитить → деплой → тест

---

### 🌐 ЗАДАЧА: Добавить новый server endpoint

**Шаги:**
1. Открыть `table/server/ServerEndpoints.gs`
2. Добавить case в doPost():
```javascript
case 'my_action':
  return handleMyAction(requestData, traceId);
```

3. Создать `table/server/MyActionService.gs`:
```javascript
function handleMyAction(requestData, traceId) {
  try {
    // Логика
    var result = processMyData(requestData.data);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        result: result,
        traceId: traceId
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return createErrorResponse(e.message, 500, traceId);
  }
}
```

4. В CLIENT создать функцию вызова:
```javascript
function callMyAction(data) {
  var creds = getClientCredentials();
  var response = callServer('my_action', {
    email: creds.email,
    token: creds.token,
    data: data
  });
  return response.result;
}
```

---

### 🔧 ЗАДАЧА: Добавить общую утилиту

**Шаги:**
1. Создать функцию в `table/shared/Utils.gs`:
```javascript
function formatDate(date) {
  return Utilities.formatDate(date, 'UTC', 'yyyy-MM-dd HH:mm:ss');
}
```

2. Закоммитить
3. Деплой автоматически скопирует в client/ и server/
4. Использовать в любом месте:
```javascript
// В CLIENT:
var formatted = formatDate(new Date());

// В SERVER:
var formatted = formatDate(new Date());
```

---

## 9. TROUBLESHOOTING

### ❌ "Функция не найдена" в Google Sheets

**Причины:**
1. Функция не в CLIENT (должна быть в table/client/)
2. Деплой не завершился
3. Кэш браузера не обновился

**Решение:**
1. Проверить что функция в `table/client/`
2. Проверить GitHub Actions - деплой завершён?
3. Ctrl+F5 в Google Sheets
4. Extensions → Apps Script → проверить файл

---

### ❌ "SyntaxError: Unexpected token '<<'" при деплое

**Причина:** Конфликт-маркеры в коде!

```javascript
<<<<<<< HEAD
  var version = '2.0';
=======
  var version = '2.1';
>>>>>>> main
```

**Решение:**
1. Найти файл с конфликтом:
```bash
grep -r "<<<<<<< HEAD" table/
```

2. Разрешить конфликт ВРУЧНУЮ
3. Удалить маркеры
4. git add + commit
5. Проверить pre-commit hook установлен

---

### ❌ "LogViewer не появился в меню" после деплоя

**Причина:** Файл был создан в `table/client/` вместо `table/web/`

**Решение:**
1. Проверить: `ls table/web/LogViewer.gs`
2. Если нет → переместить:
```bash
mv table/client/LogViewer.gs table/web/LogViewer.gs
```
3. Закоммитить
4. Workflow скопирует в client/ автоматически

---

### ❌ Деплой прошёл успешно, но файлы старые

**Причины:**
1. Кэш Apps Script Editor
2. Кэш Google Sheets
3. Деплой был на другую ветку

**Решение:**
1. Проверить какой коммит задеплоился в GitHub Actions
2. Проверить что правильная ветка (main или web-interface-with-design)
3. Hard refresh: Ctrl+Shift+R в Apps Script Editor
4. Ctrl+F5 в Google Sheets
5. Проверить timestamp в Menu.gs

---

### ❌ "LICENSE_ERROR" при вызове сервера

**Причина:** Неправильные credentials

**Решение:**
1. Проверить: `🤖 Table AI → ⚙️ Настройки → 🌟 НАСТРОИТЬ ВСЕ КЛЮЧИ`
2. Ввести правильные LICENSE_EMAIL и LICENSE_TOKEN
3. Проверить что сервер доступен (ping SERVER_URL)
4. Запустить SuperMasterCheck

---

### ❌ VK импорт не работает

**Причины:**
1. VK_TOKEN не настроен на VK_PARSER сервере (не на клиенте!)
2. Неправильный формат параметров
3. VK API ограничения

**Решение:**
1. Проверить лист "Параметры":
   - B1 должен содержать: `owner` (не `source`!)
   - Пример: `durov` или `-123456`
2. VK_TOKEN настраивается АДМИНИСТРАТОРОМ на VK_PARSER сервере
3. Пользователь НЕ вводит VK_TOKEN!

---

## 10. ЧЕКЛИСТ ДЛЯ НОВОГО АГЕНТА

### ✅ Перед началом работы

- [ ] Прочитал этот документ полностью
- [ ] Понимаю разницу между CLIENT и SERVER
- [ ] Понимаю что такое Container-bound vs Standalone
- [ ] Знаю где хранятся credentials (CLIENT vs SERVER)
- [ ] Понимаю процесс деплоя через GitHub Actions
- [ ] Знаю как проверить успешность деплоя
- [ ] Установил pre-commit hook для проверки конфликтов
- [ ] Прочитал FILE_STRUCTURE_RULES.md

---

### ✅ Перед изменением кода

- [ ] Определил: CLIENT, SERVER, SHARED или WEB?
- [ ] Проверил существующий код на похожие функции
- [ ] Следую соглашениям об именовании
- [ ] Добавил комментарии к функциям
- [ ] Использую логирование (addSystemLog / logServer)
- [ ] Проверил что нет дубликатов кода

---

### ✅ Перед коммитом

- [ ] Запустил pre-commit hook (проверка конфликтов)
- [ ] Проверил что нет `<<<<<<< HEAD` маркеров
- [ ] Написал понятное commit message
- [ ] Файлы в правильных директориях
- [ ] JSON файлы валидны (appsscript.json)

---

### ✅ После деплоя

- [ ] Проверил GitHub Actions - статус ✅
- [ ] Просмотрел логи деплоя
- [ ] Сделал Ctrl+F5 в Google Sheets
- [ ] Проверил что изменения видны
- [ ] Запустил SuperMasterCheck (если возможно)
- [ ] Обновил документацию (если нужно)

---

### ✅ При возникновении проблем

- [ ] Проверил раздел Troubleshooting
- [ ] Просмотрел логи GitHub Actions
- [ ] Проверил Apps Script Editor → Execution log
- [ ] Использовал Logger.log() для отладки
- [ ] Спросил у других агентов/разработчиков

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

### Документация проекта

- `README.md` - главная документация проекта
- `FILE_STRUCTURE_RULES.md` - правила размещения файлов
- `DEPLOYMENT_GUIDE.md` - (создать) подробный гайд по деплою
- `CLEAN_CODE_REPORT.md` - отчёт о чистоте кода

### Внешние ресурсы

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [clasp Documentation](https://github.com/google/clasp)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Gemini API](https://ai.google.dev/tutorials/get_started)

### Полезные команды

```bash
# Проверка конфликтов
grep -r "<<<<<<< HEAD" table/

# Просмотр логов деплоя
gh run list --workflow="Deploy to Google Apps Script"
gh run view <run-id> --log

# Локальное тестирование clasp
clasp login
clasp push --force

# Git операции
git status
git log --oneline -10
git diff origin/main
```

---

## 🎓 ЗАКЛЮЧЕНИЕ

Теперь вы знаете:

✅ Что такое AI_TABLE и как оно работает  
✅ Разницу между CLIENT (Container-bound) и SERVER (Standalone)  
✅ Архитектуру Google Apps Script  
✅ Структуру репозитория  
✅ Процесс разработки и деплоя  
✅ Как решать типичные проблемы  

**Главное правило:** Всегда спрашивай себя:
1. Это CLIENT или SERVER?
2. Где должен быть файл?
3. Есть ли конфликт-маркеры?
4. Прошёл ли деплой успешно?

---

**Удачной разработки! 🚀**

*Этот документ поддерживается актуальным. Последнее обновление: 2025-10-14*
