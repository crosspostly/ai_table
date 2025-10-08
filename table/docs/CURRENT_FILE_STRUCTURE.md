# 📁 АКТУАЛЬНАЯ СТРУКТУРА ФАЙЛОВ - 2025-10-08

## ⚠️ ВАЖНО: Это АКТУАЛЬНАЯ структура после всех изменений!

---

## 🎯 **АРХИТЕКТУРА: Клиент-Сервер**

```
┌─────────────────────────────────────┐
│      💻 CLIENT PROJECT              │
│  (Google Sheets + Apps Script)     │
│                                     │
│  📂 table/client/  (9 файлов)     │
│  📂 table/shared/  (3 файла)      │
│  📂 table/web/     (1 файл)       │
│                                     │
│  Script ID: 1DdlYfvo0EfEA1O1...    │
└─────────────────────────────────────┘
                 ↕ HTTP
┌─────────────────────────────────────┐
│      🖥️ SERVER PROJECT              │
│    (Apps Script Web Application)   │
│                                     │
│  📂 table/server/  (22 файла)     │
│  📂 table/shared/  (3 файла)      │
│                                     │
│  Script ID: 1ncX8FGqT7QP-Lxqr...   │
└─────────────────────────────────────┘
```

---

## 💻 **CLIENT FILES (9 файлов)**

### ✅ Активные файлы:

| Файл | Назначение | Функций | Статус |
|------|-----------|---------|--------|
| **ButtonFunctions.gs** | Функции для кнопок на листах | 7 | ✅ НОВЫЙ |
| **ChatMode.gs** | Интерактивный чат с AI | 10 | ✅ |
| **ClientUtilities.gs** | Вспомогательные функции | 25+ | ✅ |
| **GeminiClient.gs** | GM функции в ячейках | 10 | ✅ |
| **Menu.gs** | Меню "🤖 Table AI" | 1 | ✅ |
| **SmartPromptProcessor.gs** | Умные промпты | 8 | ✅ |
| **SocialImportClient.gs** | Клиент импорта соцсетей | 5 | ✅ |
| **ThinClient.gs** | HTTP клиент к серверу | 15 | ✅ |

### ⚠️ Резервные файлы:
- `ThinClient_clean.gs` - backup (не деплоится)

### 📋 Основные функции CLIENT:

#### **Меню "🤖 Table AI":**
```
🌐 Веб-интерфейс                    → openWebInterface()
🚀 Запустить анализ                  → prepareChainSmartWithHelp()
🔄 Обновить данные в ячейке         → refreshCurrentGMCellWithHelp()
📱 Получить VK посты                 → importVkPostsWithHelp()
💬 Анализ отзывов                    → ocrReviewsWithHelp()
🧠 Режим чата                        → initializeChatModeWithHelp()
⚡ Активировать умные промпты        → setupSmartPromptTriggerWithHelp()
```

#### **Подменю "⚙️ Настройки":**
```
🔑 API ключ Gemini                   → initGeminiKeyWithHelp()
📝 Фраза готовности                  → setCompletionPhraseUIWithHelp()
🧹 Очистить формулы B3..G3           → clearChainForA3WithHelp()
🔐 Лицензия: Email + Токен           → setLicenseCredentialsUIWithHelp()
📊 Проверить статус лицензии         → checkLicenseStatusUIWithHelp()
🔧 Очистить старые триггеры          → cleanupOldTriggersWithHelp()
👀 Показать активные триггеры        → showActiveTriggersDialogWithHelp()
📊 Статус системы                    → showSystemStatusWithHelp()
```

#### **Меню "🧰 DEV" (если DEV_MODE=true):**
```
📝 Логи системы                      → callServerDevFunction()
🧪 Тесты                             → callServerTestFunction()
```

#### **Функции для кнопок:**
```javascript
btnVzhuh()              // Кнопка "Вжух" - импорт VK
btnRaspakovatsa()       // Кнопка "Распаковаться"
btnProcessReviews()     // Обработка отзывов (OCR)
btnProcessData()        // Универсальная обработка
btnRunAnalysis()        // Запуск анализа
btnClearFormulas()      // Очистка формул
btnTest()               // Тестовая кнопка
```

#### **Custom Functions (формулы в ячейках):**
```javascript
=GM(prompt, [maxTokens], [temperature])              // Gemini AI
=GM_STATIC(prompt, [maxTokens], [temperature])      // Статичный
=GM_IF(condition, prompt, [maxTokens], [temp])      // Условный
=GM_IF_STATIC(condition, prompt, [max], [temp])     // Условный статичный
```

---

## 🖥️ **SERVER FILES (22 файла)**

### ✅ Активные серверные модули:

| Файл | Назначение | Функций | Статус |
|------|-----------|---------|--------|
| **ServerEndpoints.gs** | API endpoints (doGet, doPost) | 5 | ✅ |
| **SocialImportService.gs** | Импорт из соцсетей | 10 | ✅ |
| **ValidationService.gs** | Валидация данных | 8 | ✅ |
| **RetryService.gs** | Retry логика | 3 | ✅ |
| **ErrorHandlingService.gs** | Обработка ошибок | 5 | ✅ |
| **TableLicenseService.gs** | Лицензирование | 6 | ✅ |
| **TelegramImportService.gs** | Telegram импорт | 8 | ✅ |
| **VkImportService.gs** | VK импорт | 12 | ✅ |
| **OcrService.gs** | OCR обработка | 5 | ✅ |
| **SourceDetector.gs** | Определение платформ | 4 | ✅ |
| **SmartChainService.gs** | Умные цепочки | 8 | ✅ |
| **TriggerManager.gs** | Триггеры | 6 | ✅ |
| **CompletionPhraseService.gs** | Фразы готовности | 3 | ✅ |
| **ConditionalGemini.gs** | GM_IF функции | 4 | ✅ |

### ⚙️ Дополнительные модули:
- **ContextManager.gs** - управление контекстом (4 функции)
- **RulesEngine.gs** - движок правил (5 функций)
- **SimpleLicenseService.gs** - упрощенная лицензия (3 функции)
- **LicenseService.gs** - старая версия лицензии (5 функций)
- **DataCollectors.gs** - сборщики данных (6 функций)

### ⚠️ Резервные/Backup файлы:
- `ConditionalGemini_backup.gs` - backup
- `ConditionalGemini_old.gs` - старая версия
- `OcrService_clean.gs` - backup

### 📋 API Endpoints:

#### **POST /exec** - Основной endpoint
```javascript
{
  "action": "importSocialPosts",
  "platform": "vk" | "telegram" | "instagram",
  "url": "https://...",
  "tableId": "your-table-id",
  "email": "user@example.com",
  "token": "license-token"
}
```

**Доступные actions:**
- `importSocialPosts` - импорт из соцсетей
- `processOcr` - OCR обработка
- `validateLicense` - проверка лицензии
- `smartChain` - умная цепочка
- `getLogs` - получить логи

---

## 🔗 **SHARED FILES (3 файла)**

Эти файлы копируются **И** в client **И** в server при деплое:

| Файл | Назначение | Используется |
|------|-----------|--------------|
| **Constants.gs** | Константы системы | Client + Server |
| **LoggingService.gs** | Логирование | Client + Server |
| **Utils.gs** | Утилиты (markdown, A1, etc) | Client + Server |

### 📋 Константы (Constants.gs):
```javascript
DEV_MODE = true                    // Режим отладки
GEMINI_API_URL = "..."            // Gemini API
COMPLETION_PHRASE = "Отчёт готов" // Фраза готовности
SERVER_API_URL = "..."            // URL сервера
MAX_REQUESTS_PER_HOUR = 100       // Rate limit
```

---

## 🌐 **WEB FILES (1 файл)**

| Файл | Назначение | Статус |
|------|-----------|--------|
| **WebInterface.gs** | Веб-интерфейс (HTML/JS) | ✅ |

### 📋 Web Functions:
```javascript
doGet(e)              // Отдает HTML
openWebInterface()    // Открывает модальное окно
```

---

## 📊 **DEPLOYMENT FLOW**

### GitHub Actions Workflow:

#### **1. Deploy SERVER:**
```bash
# Копирует:
- table/server/*.gs       (22 файла)
- table/shared/*.gs       (3 файла)
→ Script ID: 1ncX8FGqT7QP-LxqrRJu0_z_FmUTGsbqmbWDCRePLfHgW8x85bX_Yu9uP
```

#### **2. Deploy CLIENT:**
```bash
# Копирует:
- table/client/*.gs       (9 файлов)
- table/shared/*.gs       (3 файла)
- table/web/*.gs          (1 файл)
- table/appsscript.json   (OAuth scopes)
→ Script ID: 1DdlYfvo0EfEA1O1nb5DRI0o-WJoIivtfIPNSE1C1bt3IvvWC91sGE6Xs
```

### ⚠️ Security Check:
- ❌ Server файлы **НЕ ДОЛЖНЫ** попадать в client!
- ✅ Workflow проверяет отсутствие `server/*` в client

---

## 🔐 **OAuth Scopes (appsscript.json)**

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/script.scriptapp"
  ]
}
```

**Что дают scopes:**
- `spreadsheets` - доступ к Google Sheets
- `external_request` - HTTP запросы к внешним API
- `container.ui` - модальные окна (Web Interface)
- `scriptapp` - управление триггерами

---

## 📋 **ИТОГО:**

### Client Project:
- ✅ 9 активных файлов
- ✅ 3 shared файла
- ✅ 1 web файл
- ✅ 1 appsscript.json
- **ИТОГО: 14 файлов**

### Server Project:
- ✅ 22 активных файла
- ✅ 3 shared файла
- ✅ 1 appsscript.json (server версия)
- **ИТОГО: 26 файлов**

### Всего функций:
- **Client:** 97 функций
- **Server:** 80+ функций
- **Shared:** 30+ функций
- **ИТОГО: 200+ функций**

---

## 🚀 **АКТУАЛЬНЫЕ SCRIPT IDs:**

| Проект | Script ID | URL |
|--------|-----------|-----|
| **CLIENT** | `1DdlYfvo0EfEA1O1nb5DRI0o-WJoIivtfIPNSE1C1bt3IvvWC91sGE6Xs` | [Открыть](https://script.google.com/home/projects/1DdlYfvo0EfEA1O1nb5DRI0o-WJoIivtfIPNSE1C1bt3IvvWC91sGE6Xs/edit) |
| **SERVER** | `1ncX8FGqT7QP-LxqrRJu0_z_FmUTGsbqmbWDCRePLfHgW8x85bX_Yu9uP` | [Открыть](https://script.google.com/home/projects/1ncX8FGqT7QP-LxqrRJu0_z_FmUTGsbqmbWDCRePLfHgW8x85bX_Yu9uP/edit) |

---

**Дата создания:** 2025-10-08  
**Статус:** ✅ АКТУАЛЬНО  
**Последнее обновление:** После добавления ButtonFunctions.gs и security fixes
