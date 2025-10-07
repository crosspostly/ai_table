# 📁 Разделение файлов: Сервер vs Клиент

## 🏗️ Архитектура системы

```
┌─────────────────────┐    HTTP/HTTPS     ┌─────────────────────┐
│     🖥️ СЕРВЕР        │ ←──────────────→ │     💻 КЛИЕНТ        │
│ (Web Application)   │                  │ (Google Sheets)     │
│                     │                  │                     │
│ • Бизнес-логика     │                  │ • UI/UX             │
│ • API endpoints     │                  │ • Пользовательский  │
│ • Обработка данных  │                  │   интерфейс         │
│ • Валидация         │                  │ • HTTP клиент       │
│ • Лицензирование    │                  │                     │
└─────────────────────┘                  └─────────────────────┘
```

---

## 🖥️ **СЕРВЕР** (Google Apps Script Web Application)

### **📂 Основные серверные файлы:**

#### **🔥 ОБЯЗАТЕЛЬНЫЕ (критически важные):**
- **`ServerEndpoints.gs`** - Главный API роутер, обрабатывает HTTP запросы
- **`SocialImportService.gs`** - Импорт из социальных сетей
- **`ValidationService.gs`** - Проверка входных данных и безопасность
- **`RetryService.gs`** - HTTP retry логика с exponential backoff
- **`ErrorHandlingService.gs`** - Централизованная обработка ошибок

#### **🔧 Дополнительные сервисы:**
- **`TableLicenseService.gs`** - Система лицензирования по table_id
- **`SimpleLicenseService.gs`** - Упрощенная проверка лицензий  
- **`TelegramImportService.gs`** - Специализированный импорт Telegram
- **`OcrService.gs`** - OCR обработка изображений
- **`VkImportService.gs`** - Импорт из VKontakte

#### **⚙️ Служебные модули:**
- **`SourceDetector.gs`** - Автоматическое определение платформ
- **`SmartChainService.gs`** - Цепочки обработки данных
- **`TriggerManager.gs`** - Управление триггерами
- **`ContextManager.gs`** - Управление контекстом запросов
- **`RulesEngine.gs`** - Движок правил обработки

#### **🔄 Устаревшие (для совместимости):**
- `LicenseService.gs` - старая версия лицензирования
- `DataCollectors.gs` - устаревший сборщик данных
- `ConditionalGemini*.gs` - резервные копии Gemini интеграции

### **📋 Что делает сервер:**
- ✅ Принимает HTTP POST запросы от клиентов
- ✅ Валидирует входные данные и лицензии
- ✅ Выполняет импорт данных из соцсетей
- ✅ Обрабатывает данные через Gemini AI
- ✅ Возвращает результаты в JSON формате
- ✅ Логирует операции и ошибки

---

## 💻 **КЛИЕНТ** (Google Sheets с Apps Script)

### **📂 Основные клиентские файлы:**

#### **🎮 Пользовательский интерфейс:**
- **`Menu.gs`** - Меню в Google Sheets ("🤖 Table AI")
- **`GeminiClient.gs`** - Локальные Gemini функции (GM, GM_STATIC)
- **`ThinClient.gs`** - HTTP клиент для связи с сервером
- **`ChatMode.gs`** - Интерактивный режим чата с AI
- **`SmartPromptProcessor.gs`** - Обработка умных промптов

#### **🔌 Интеграция с сервером:**
- **`SocialImportClient.gs`** - Клиентская часть социального импорта

#### **🌐 Веб-интерфейс (опционально):**
- **`WebInterface.gs`** - Backend для веб-интерфейса 
- **`RealisticWebApp.html`** - HTML интерфейс (рабочая версия)
- **`WebApp.html`** - HTML интерфейс (концептуальная версия)

### **📋 Что делает клиент:**
- ✅ Предоставляет меню в Google Sheets
- ✅ Собирает параметры от пользователя (B1, B2, C1)
- ✅ Отправляет HTTP запросы на сервер
- ✅ Отображает результаты в листах Google Sheets
- ✅ Предоставляет локальные AI функции
- ✅ Опционально: показывает веб-интерфейс

---

## 🔗 **ОБЩИЕ ФАЙЛЫ** (копировать на обе стороны)

### **📂 Shared (общие модули):**
- **`Constants.gs`** - Общие константы и конфигурация
- **`Utils.gs`** - Вспомогательные функции  
- **`LoggingService.gs`** - Общий сервис логирования

**⚠️ Важно:** В клиенте `Constants.gs` должен содержать правильный `SERVER_URL`!

---

## 📋 **ПОШАГОВАЯ ИНСТРУКЦИЯ УСТАНОВКИ**

### **🖥️ ЭТАП 1: Настройка СЕРВЕРА**

#### **1.1 Создать новый Google Apps Script проект:**
1. Перейти на [script.google.com](https://script.google.com)
2. "Новый проект" → назвать "AI Table Bot Server"

#### **1.2 Скопировать серверные файлы:**
```
ОБЯЗАТЕЛЬНО скопировать:
✅ table/server/ServerEndpoints.gs
✅ table/server/SocialImportService.gs  
✅ table/server/ValidationService.gs
✅ table/server/RetryService.gs
✅ table/server/ErrorHandlingService.gs
✅ table/shared/Constants.gs
✅ table/shared/Utils.gs
✅ table/shared/LoggingService.gs

ОПЦИОНАЛЬНО (по потребностям):
⭕ table/server/TableLicenseService.gs
⭕ table/server/SimpleLicenseService.gs
⭕ table/server/TelegramImportService.gs
⭕ table/server/OcrService.gs
```

#### **1.3 Развернуть как Web Application:**
1. Deploy → New deployment
2. Type: "Web app"
3. Execute as: "Me"
4. Who has access: "Anyone"
5. **СОХРАНИТЬ URL!** `https://script.google.com/macros/s/[ID]/exec`

---

### **💻 ЭТАП 2: Настройка КЛИЕНТА**

#### **2.1 Создать новый Google Sheets:**
1. Перейти на [sheets.google.com](https://sheets.google.com)  
2. Создать → назвать "AI Table Bot Client"

#### **2.2 Настроить Apps Script клиента:**
1. Extensions → Apps Script
2. Удалить код по умолчанию

#### **2.3 Скопировать клиентские файлы:**
```
ОБЯЗАТЕЛЬНО скопировать:
✅ table/client/Menu.gs
✅ table/client/ThinClient.gs
✅ table/client/GeminiClient.gs
✅ table/shared/Constants.gs (+ указать SERVER_URL!)
✅ table/shared/Utils.gs
✅ table/shared/LoggingService.gs

ОПЦИОНАЛЬНО (для расширенного функционала):
⭕ table/client/SocialImportClient.gs
⭕ table/client/ChatMode.gs  
⭕ table/client/SmartPromptProcessor.gs
⭕ table/web/WebInterface.gs (для веб-интерфейса)
⭕ table/web/RealisticWebApp.html (для веб-интерфейса)
```

#### **2.4 ВАЖНО! Настроить SERVER_URL в Constants.gs:**
```javascript
// В клиенте изменить на ваш реальный URL сервера:
var SERVER_URL = 'https://script.google.com/macros/s/AKfycbz[ВАШ_ID]/exec';
```

---

## 🌟 **ОСОБЕННОСТИ ДЛЯ РАЗНЫХ ВЕТОК**

### **📊 Ветка: `sheets-only-interface`**
**БЕЗ веб-интерфейса, работа только через ячейки Google Sheets**

**Сервер:**
```
✅ table/server/ (все .gs файлы)
✅ table/shared/ (все .gs файлы)  
❌ table/web/ (не нужно)
```

**Клиент:** 
```
✅ table/client/Menu.gs
✅ table/client/ThinClient.gs
✅ table/client/GeminiClient.gs  
✅ table/client/SocialImportClient.gs
✅ table/shared/ (все .gs файлы)
❌ table/web/ (не нужно)
```

### **🌟 Ветка: `web-interface-with-design`**
**С современным веб-интерфейсом**

**Сервер:** (такой же как sheets-only)
```
✅ table/server/ (все .gs файлы)
✅ table/shared/ (все .gs файлы)
```

**Клиент:** (+ файлы веб-интерфейса)
```  
✅ table/client/ (все .gs файлы)
✅ table/shared/ (все .gs файлы)
✅ table/web/WebInterface.gs
✅ table/web/RealisticWebApp.html
⭕ table/web/WebApp.html (концептуальный демо)
```

---

## 🔍 **ДИАГНОСТИКА И ПРОВЕРКА**

### **🧪 Файлы тестирования (опционально):**
Можно скопировать в любое приложение для диагностики:
```
⭕ table/tests/QuickSmokeTest.gs
⭕ table/tests/ComprehensiveTestRunner.gs
⭕ table/tests/WebInterfaceValidationTest.gs (для веба)
```

### **📋 Проверочный чек-лист:**

**✅ Сервер готов если:**
- Содержит `ServerEndpoints.gs` с функцией `doPost()`
- При открытии URL показывает JSON ответ
- Можно вызвать POST запрос и получить ответ

**✅ Клиент готов если:**
- В Google Sheets появилось меню "🤖 Table AI"
- Можно заполнить B1/B2 и запустить импорт
- Результаты появляются в листе "посты"

---

## 💡 **ПОЛЕЗНЫЕ СОВЕТЫ**

### **🔧 Частые ошибки:**
- ❌ **Забыли указать SERVER_URL** в клиентском Constants.gs
- ❌ **Неправильные права доступа** на сервере (должно быть "Anyone")
- ❌ **Скопировали не все обязательные файлы**
- ❌ **Перепутали серверные и клиентские файлы**

### **⚡ Быстрая установка:**
1. **Сервер:** Копировать всю папку `table/server/` + `table/shared/`
2. **Клиент:** Копировать всю папку `table/client/` + `table/shared/` + настроить SERVER_URL
3. **Веб:** Дополнительно скопировать `table/web/` в клиент

### **🔄 Обновления:**
- **Обновить функционал:** Редактировать код на сервере → все клиенты получают изменения
- **Обновить интерфейс:** Редактировать клиентские файлы в конкретном Google Sheets

**🎯 Итог: Один мощный сервер + множество легких клиентов = масштабируемая архитектура!**