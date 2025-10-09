# 🤖 AI_TABLE - Enterprise AI Assistant для Google Sheets

**Комплексная система анализа данных с интеграцией социальных сетей, OCR и ИИ-анализом.**

[![License](https://img.shields.io/badge/License-Enterprise-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0-green.svg)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/Status-Production--Ready-success.svg)](TESTING_METHODOLOGY_FOR_AI_AGENTS.md)

---

## 🏗️ **АРХИТЕКТУРА СИСТЕМЫ**

### **3-УРОВНЕВАЯ АРХИТЕКТУРА:**

```
📱 CLIENT LAYER (Google Sheets Script)
├── GM() функции с Gemini API
├── Menu система и пользовательский интерфейс
├── TestSuite и Security validation  
├── Smart Chains automation
└── 🔑 GEMINI_API_KEY (пользователь вводит)

🌐 SERVER LAYER (Standalone Web Application)  
├── VK/Instagram/Telegram импорт
├── License validation service
├── OCR processing backend
├── User management
└── 🔑 VK_ACCESS_TOKEN, SERVER_TOKENS (admin configures)

🖥️ WEB INTERFACE LAYER (HTML/JS GUI)
├── Responsive UI для всех функций
├── Real-time progress tracking
├── Advanced analytics dashboard
└── Integration с CLIENT + SERVER
```

---

## 🔐 **КРИТИЧЕСКИ ВАЖНО: АРХИТЕКТУРА CREDENTIALS**

### **❌ ЧАСТЫЕ ОШИБКИ:**
- **НЕПРАВИЛЬНО:** Запрашивать VK токен у пользователя-клиента
- **НЕПРАВИЛЬНО:** Использовать серверный Gemini токен  
- **НЕПРАВИЛЬНО:** Смешивать client и server credentials

### **✅ ПРАВИЛЬНАЯ АРХИТЕКТУРА:**

#### **🔐 VK/СОЦИАЛЬНЫЕ СЕТИ ТОКЕНЫ = СЕРВЕР**
```javascript
// ✅ ПРАВИЛЬНО: VK токен на сервере
VK_ACCESS_TOKEN: хранится в серверном PropertiesService
Instagram/Telegram: admin configures на сервере  
Пользователь: НЕ ВВОДИТ социальные токены!

// Поток данных:
Client: вызывает importVkPosts(url, count)
     ↓
Server: получает запрос + использует свой VK_ACCESS_TOKEN
     ↓  
Result: возвращает обработанные посты клиенту
```

#### **🤖 GEMINI API KEY = КЛИЕНТ**
```javascript
// ✅ ПРАВИЛЬНО: Gemini ключ у клиента
GEMINI_API_KEY: хранится в клиентском PropertiesService
Пользователь: вводит через меню "🔑 API ключ Gemini"

// Поток данных:
Client: GM(prompt) → прямой запрос к Gemini API
Server: НЕ ИМЕЕТ доступа к Gemini ключу
```

#### **📧 LICENSE СИСТЕМА**
```javascript
// ✅ ПРАВИЛЬНО: License клиент → сервер
LICENSE_EMAIL: пользователь вводит на клиенте
LICENSE_TOKEN: пользователь вводит на клиенте
Validation: клиент отправляет на сервер для проверки
```

---

## 🛠️ **УСТАНОВКА И НАСТРОЙКА**

### **PHASE 1: Базовая настройка**

1. **Откройте Google Sheets** и создайте новую таблицу
2. **Extensions → Apps Script** → вставьте код из `table/client/`
3. **Сохраните проект** как "AI_TABLE_Client"

### **PHASE 2: Единый ввод Credentials**

**Все credentials вводятся через единое окно:**

```javascript
// Меню: AI Table → 🔧 Настроить все ключи
setupAllCredentialsWithHelp()
```

**Форма ввода:**
```
┌─────────────────────────────────────────────┐
│  🔧 НАСТРОЙКА AI_TABLE - Все ключи          │
├─────────────────────────────────────────────┤
│                                             │
│  📧 LICENSE (обязательно):                  │
│  Email: [________________]                  │
│  Token: [________________]                  │
│                                             │
│  🤖 GEMINI API (обязательно):               │
│  API Key: [_________________________]      │
│  📎 Получить: https://aistudio.google.com   │
│                                             │
│  ⚠️ VK/Instagram токены НЕ НУЖНЫ            │
│  (они уже настроены на сервере)             │
│                                             │
│  [✅ Сохранить все]  [❌ Отмена]            │
└─────────────────────────────────────────────┘
```

### **PHASE 3: Проверка статуса**

```javascript
// Меню: AI Table → 📊 Проверить статус системы
checkSystemStatus()
```

**Статус показывает:**
- ✅ License: активна до 2024-12-31
- ✅ Gemini API: подключен, quota: 85%  
- ✅ Server: online, VK импорт доступен
- ⚠️ OCR: ограниченный режим
- ❌ Instagram: недоступен (server maintenance)

---

## 🧪 **СИСТЕМА ТЕСТИРОВАНИЯ**

### **⚠️ ВАЖНО: ТЕСТЫ ЗАПУСКАЮТСЯ НА КЛИЕНТЕ!**

```javascript
// Тесты физически выполняются в Google Sheets Script
// НЕ на сервере, НЕ в веб-интерфейсе!

// Меню: AI Table → 🧪 Запустить тесты
runAllTests()

// Результаты отображаются в листе "Test Results"
```

### **Типы тестов:**

1. **🔒 Security Tests** (КРИТИЧНЫЕ):
   - XSS protection validation
   - SQL injection blocking  
   - Credential architecture verification
   - Server data exposure prevention

2. **⚡ Unit Tests** (Основные функции):
   - GM() с различными параметрами
   - VK import через server API
   - OCR processing
   - Menu functions

3. **🔗 Integration Tests** (Межкомпонентные):
   - Client ↔ Server communication
   - License validation flow
   - Web interface integration

4. **🎯 E2E Tests** (Пользовательские сценарии):
   - Новый пользователь: setup → работа
   - VK импорт → фильтрация → анализ
   - OCR → ИИ-анализ отзывов

### **Режим разработчика:**

```javascript
// ⚠️ БЕЗОПАСНЫЙ режим разработчика
// Меню: AI Table → 🔧 Режим разработчика

// ✅ Что доступно:
- Детальные логи операций (БЕЗ credentials)
- Performance metrics
- Cache statistics  
- API response timing
- Error stack traces (sanitized)

// ❌ Что НЕ доступно:
- Server credentials
- Другие users данные
- Production server access
- Admin functions
```

---

## 📝 **ОСНОВНЫЕ ФУНКЦИИ**

### **🤖 ИИ-анализ (GM функции):**

```javascript
=GM("Проанализируй этот отзыв", 1000, 0.7)
=GM("Создай краткое резюме", 500, 0.3)  
=GM("Переведи на английский", 800, 0.1)
```

**⚠️ ВАЖНО: GM функции требуют Gemini API ключ!**
- Без API ключа GM функции НЕ РАБОТАЮТ  
- Настройка: AI Table → 🔧 Настроить все ключи
- Получить ключ: https://aistudio.google.com/app/apikey

**Параметры:**
- `prompt`: текст запроса (обязательно)
- `maxTokens`: лимит ответа, по умолчанию 250000
- `temperature`: творческость 0.0-1.0, по умолчанию 0.7

### **📱 Импорт из социальных сетей:**

```javascript
// VK посты (через server API)
importVkPosts("https://vk.com/wall-12345", 20)

// Instagram (через server API)  
importInstagramPosts("username", 15)

// ⚠️ ВАЖНО: Токены социальных сетей НЕ нужны!
// Они уже настроены на сервере
```

### **🔍 OCR и анализ изображений:**

```javascript
// OCR изображения в ячейке
=OCR(A1)  // A1 содержит URL изображения

// OCR + ИИ анализ  
=GM("Проанализируй отзыв: " & OCR(A1))
```

### **⚡ Smart Chains (автоматизация):**

```javascript
// B3: =GM("Анализ: " & A3)  
// C3: =GM("Выводы: " & B3)
// D3: =GM("Рекомендации: " & C3)

// Запускается автоматически при изменении A3
```

---

## 🔒 **БЕЗОПАСНОСТЬ**

### **🛡️ Системы защиты:**

1. **Input Validation:**
   - XSS protection для всех пользовательских данных
   - SQL injection blocking
   - Dangerous URL filtering
   - Safe HTML sanitization

2. **Credential Security:**
   - ✅ VK токены: только на сервере (НЕ ДОСТУПНЫ клиенту)
   - ✅ Gemini API: только у клиента (НЕ ПЕРЕДАЕТСЯ на сервер)  
   - ✅ License: encrypted transmission
   - ✅ Secure logging (без утечки sensitive данных)

3. **Error Handling:**
   - Structured error responses
   - Safe error messages (без internal details)
   - Automatic retry для network failures
   - Graceful degradation при API недоступности

### **🔍 Security Tests:**

```javascript
// Автоматическая проверка security boundary
// Меню: AI Table → 🛡️ Проверить безопасность

// Тесты включают:
- Credential architecture verification
- XSS injection attempts  
- SQL injection blocking
- Server data exposure checks
- Safe error handling validation
```

---

## 📊 **МОНИТОРИНГ И ЛОГИ**

### **System Logs:**

```javascript
// Просмотр логов: AI Table → 📋 Системные логи

// Типы событий:
INFO:   ✅ Успешные операции
WARN:   ⚠️ Предупреждения (не критичные)
ERROR:  ❌ Ошибки (требуют внимания)  
DEBUG:  🔍 Детальная информация (только dev mode)
```

### **Performance Metrics:**

- **GM функции:** среднее время ответа, success rate
- **Cache:** hit ratio, память использования
- **API Calls:** quota usage, error rate
- **Network:** latency, retry attempts

---

## 🚀 **ПРОИЗВОДИТЕЛЬНОСТЬ**

### **Оптимизации:**

1. **Smart Caching:**
   - GM ответы кэшируются на 5 минут
   - Automatic cache cleanup при 80% заполнении
   - Distributed locks для предотвращения race conditions

2. **Network Efficiency:**
   - Automatic retry для failed requests  
   - Circuit breaker pattern для unreliable APIs
   - Request batching для массовых операций

3. **Memory Management:**
   - Trigger debouncing (500ms)
   - Automatic cleanup старых triggers
   - Memory usage monitoring

### **Лимиты и квоты:**

- **Google Apps Script:** 6 минут execution time
- **UrlFetch:** 20,000 requests/день
- **Cache:** 10MB максимум
- **Triggers:** 20 максимум на project

---

## 🔧 **TROUBLESHOOTING**

### **Частые проблемы:**

**❌ "GM функции не работают"**
```
Решение:
1. AI Table → 🔧 Настроить все ключи
2. Проверить Gemini API key
3. AI Table → 📊 Проверить статус системы
```

**❌ "VK импорт недоступен"**
```
Решение:
1. Проверить server status
2. VK токены настроены на сервере (НЕ у пользователя!)
3. Связаться с admin если server offline
```

**❌ "Превышен лимит quota"**
```
Решение:
1. Подождать до следующего дня (reset в 00:00 UTC)
2. Оптимизировать запросы (использовать кэш)
3. Обратиться за увеличением лимитов
```

**❌ "Ошибки в тестах"**
```
Решение:
1. AI Table → 🛡️ Проверить безопасность
2. Обновить credentials если нужно
3. Проверить internet connectivity
4. См. TESTING_METHODOLOGY_FOR_AI_AGENTS.md
```

---

## 📚 **ДОКУМЕНТАЦИЯ ДЛЯ РАЗРАБОТЧИКОВ**

### **Для ИИ-агентов:**

**📖 [TESTING_METHODOLOGY_FOR_AI_AGENTS.md](TESTING_METHODOLOGY_FOR_AI_AGENTS.md)**
- Полная методичка тестирования
- 6-фазный план testing
- Конкретные тесты для каждого компонента
- Criteria успеха и antipatterns

**🏗️ [ARCHITECTURE_CREDENTIALS_CORRECTION.md](ARCHITECTURE_CREDENTIALS_CORRECTION.md)**
- Правильное понимание архитектуры
- Исправления частых ошибок
- Security boundary tests

**🔥 [CRITICAL_CODE_AUDIT_BY_GOD_PROGRAMMER.md](CRITICAL_CODE_AUDIT_BY_GOD_PROGRAMMER.md)**
- Обнаруженные критические проблемы
- 10 категорий багов и их решения
- Roadmap исправлений

### **Code Structure:**

```
table/
├── client/          # Google Sheets Script код
│   ├── GeminiClient.gs      # GM функции + Gemini API
│   ├── Menu.gs              # Пользовательское меню
│   ├── TestSuite.gs         # Система тестирования
│   ├── SmartPromptProcessor.gs  # Smart Chains
│   └── ChatMode.gs          # Чат интерфейс
├── server/          # Server-side код (отдельное приложение)
│   ├── VkImportService.gs   # VK импорт с server tokens
│   ├── LicenseValidator.gs  # License проверка
│   └── OcrProcessor.gs      # OCR backend
├── shared/          # Общие утилиты
│   ├── SecurityValidator.gs # Security validation
│   ├── Utils.gs            # Вспомогательные функции
│   └── Constants.gs        # Константы и настройки
├── web/            # Web интерфейс (HTML/JS)
│   ├── WebApp.html         # Основной интерфейс
│   └── WebInterfaceExtensions.gs  # Web integration
└── tests/          # Дополнительные тесты
    ├── ManualTestRunner.gs  # Ручные тесты
    └── RealDataTester.gs    # Тесты на реальных данных
```

---

## 🤝 **ПОДДЕРЖКА**

### **Техническая поддержка:**
- 📧 Email: [support@aitables.com](mailto:support@aitables.com)
- 💬 Telegram: [@aitables_support](https://t.me/aitables_support)
- 📋 Issues: [GitHub Issues](https://github.com/crosspostly/ai_table/issues)

### **Enterprise support:**
- 🏢 Dedicated support manager
- 📞 Phone support (24/7)
- 🎯 Custom integrations
- 📈 Analytics & reporting

---

## 📜 **ЛИЦЕНЗИЯ**

**Enterprise License** - см. [LICENSE](LICENSE) файл для деталей.

**Краткое описание:**
- ✅ Использование в коммерческих проектах
- ✅ Модификация под свои нужды  
- ✅ Enterprise support включен
- ❌ Redistribution без разрешения

---

## 🔄 **CHANGELOG**

### **v2.0.0** (Current)
- ✅ Comprehensive security system
- ✅ Complete testing methodology  
- ✅ Unified credentials management
- ✅ Critical bugs audit
- ✅ Production-ready architecture

### **v1.0.0** 
- ✅ Базовые GM функции
- ✅ VK импорт через server
- ✅ OCR integration
- ✅ Smart Chains automation

---

**🚀 AI_TABLE - Making AI accessible for everyone through Google Sheets!**