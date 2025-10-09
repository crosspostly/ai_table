# 🧪 КОМПЛЕКСНЫЙ ПЛАН ТЕСТИРОВАНИЯ TABLE AI

## 📋 ОГЛАВЛЕНИЕ
1. [Архитектура проекта](#архитектура-проекта)
2. [Структура тестирования](#структура-тестирования)
3. [План выполнения](#план-выполнения)
4. [Критерии успеха](#критерии-успеха)

---

## 🏗️ АРХИТЕКТУРА ПРОЕКТА

### **Структура кодовой базы:**

```
table/
├── client/          # Клиентский код (16 файлов)
│   ├── Menu.gs                    # Главное меню
│   ├── ClientUtilities.gs         # Утилиты клиента
│   ├── GeminiClient.gs            # Gemini API клиент
│   ├── SocialImportClient.gs      # Импорт соцсетей (клиент)
│   ├── ThinClient.gs              # Thin client для сервера
│   ├── OcrRunner.gs               # OCR функционал
│   ├── CredentialsManager.gs      # Управление credentials
│   ├── ChatMode.gs                # Чат режим
│   └── ...
│
├── server/          # Серверный код (17 файлов)
│   ├── SocialImportService.gs     # ⭐ Импорт соцсетей (сервер)
│   ├── VkImportService.gs         # ⭐ VK импорт
│   ├── TelegramImportService.gs   # Telegram импорт
│   ├── OcrService.gs              # OCR сервис
│   ├── LicenseService.gs          # Лицензирование
│   ├── ServerEndpoints.gs         # API endpoints
│   └── ...
│
├── shared/          # Общий код (8 файлов)
│   ├── Constants.gs               # ⭐ Константы
│   ├── Utils.gs                   # Утилиты
│   ├── LoggingService.gs          # Логирование
│   ├── SecurityValidator.gs       # Безопасность
│   └── ...
│
├── tests/           # Тесты (18 файлов)
│   ├── MockFixValidationTest.gs   # ⭐ Мок-тесты исправлений
│   ├── SocialImportTests.gs       # Тесты соц. импорта
│   ├── VkIntegrationTest.gs       # VK интеграция
│   ├── ComprehensiveTestRunner.gs # Комплексный раннер
│   ├── QuickSmokeTest.gs          # Быстрые smoke-тесты
│   └── ...
│
└── web/             # Веб-интерфейс (2 файла)
    ├── WebInterface.gs
    └── WebInterfaceExtensions.gs
```

**ВСЕГО:** 61 .gs файл

---

## 🎯 СТРУКТУРА ТЕСТИРОВАНИЯ

### **УРОВЕНЬ 1: СИНТАКСИС И СТАТИЧЕСКИЙ АНАЛИЗ** ⚡ (5 минут)

#### **1.1 Синтаксическая валидация**
- ✅ Проверка синтаксиса всех .gs файлов
- ✅ Отсутствие неопределённых переменных
- ✅ Правильность импортов/экспортов
- ✅ Согласованность имён функций

**Файлы:** `run-syntax-check.js`

**Команда:** `node run-syntax-check.js`

---

#### **1.2 Проверка зависимостей**
- ✅ Все используемые функции определены
- ✅ Нет циклических зависимостей
- ✅ Constants доступны везде
- ✅ Shared модули импортированы

**Файлы:** `run-dependency-check.js`

**Команда:** `node run-dependency-check.js`

---

### **УРОВЕНЬ 2: UNIT ТЕСТЫ** 🧩 (15 минут)

#### **2.1 Constants & Utils**
```javascript
✅ Constants.gs
  ├─ SYSTEM_LOGS_NAME определена
  ├─ SERVER_API_URL валидна
  ├─ VK_PARSER_URL существует
  └─ Все константы имеют значения

✅ Utils.gs
  ├─ addSystemLog() работает
  ├─ logMessage() корректен
  ├─ Утилиты парсинга строк
  └─ Утилиты дат
```

**Файлы:** `table/tests/MockFixValidationTest.gs`

---

#### **2.2 Client Functions**
```javascript
✅ ThinClient.gs
  ├─ getClientCredentials() возвращает {valid:}
  ├─ ocrReviewsThin() определена
  ├─ importVkPostsThin() определена
  └─ GM_STATIC() работает

✅ ClientUtilities.gs
  ├─ importVkPosts() работает
  ├─ importInstagramPosts() работает
  └─ importTelegramPosts() работает

✅ GeminiClient.gs
  ├─ processGeminiRequest() работает
  ├─ Retry логика корректна
  └─ Rate limiting применяется
```

**Файлы:** `table/client/TestSuite.gs`, `table/client/ComprehensiveTestSuite.gs`

---

#### **2.3 Server Functions**
```javascript
✅ SocialImportService.gs
  ├─ importSocialPosts() универсальный
  ├─ importVkPostsAdvanced() использует handleWallGet_
  ├─ writePostsToSheet() старая структура
  ├─ createStopWordsFormulas() SUMPRODUCT
  └─ applyUniformFormatting() применяется

✅ VkImportService.gs
  ├─ handleWallGet_() прямой VK API
  ├─ importVkPosts() работает
  ├─ getVkToken_() получает токен
  └─ createStopWordsFormulas() формулы

✅ TelegramImportService.gs
  ├─ importTelegramPosts() парсит
  └─ Scraping логика работает

✅ OcrService.gs
  ├─ processOcr() обрабатывает
  └─ Gemini Vision работает
```

**Файлы:** `table/tests/SocialImportTests.gs`, `table/tests/VkIntegrationTest.gs`

---

### **УРОВЕНЬ 3: ИНТЕГРАЦИОННЫЕ ТЕСТЫ** 🔗 (30 минут)

#### **3.1 Социальный импорт (End-to-End)**
```javascript
✅ VK Import Flow
  ├─ Параметры → parseSource() → VK
  ├─ importVkPostsAdvanced() → handleWallGet_()
  ├─ VK API → посты
  ├─ writePostsToSheet() → лист
  └─ createStopWordsFormulas() → формулы

✅ Instagram Import Flow
  ├─ Параметры → parseSource() → Instagram
  ├─ importInstagramPosts() → scraping
  └─ writePostsToSheet() → лист

✅ Telegram Import Flow
  ├─ Параметры → parseSource() → Telegram
  ├─ importTelegramPosts() → scraping
  └─ writePostsToSheet() → лист
```

**Файлы:** `table/tests/SocialImportTests.gs`

**Команда:** `runAllSocialImportTests()`

---

#### **3.2 OCR Flow**
```javascript
✅ OCR Processing
  ├─ Reviews лист → ocrReviewsThin()
  ├─ ThinClient → Server API
  ├─ OcrService.processOcr()
  ├─ Gemini Vision API
  └─ Результаты → лист
```

**Файлы:** `table/tests/RealDataTester.gs`

---

#### **3.3 Gemini Integration**
```javascript
✅ Gemini Client
  ├─ GM() формула
  ├─ GM_IF() условная
  ├─ GM_STATIC() статичная
  ├─ Retry логика
  └─ Rate limiting
```

---

### **УРОВЕНЬ 4: СИСТЕМНЫЕ ТЕСТЫ** 🖥️ (20 минут)

#### **4.1 Полный цикл работы**
```javascript
✅ Complete User Journey
  ├─ Открытие таблицы
  ├─ Меню загружается
  ├─ Credentials настроены
  ├─ Импорт VK постов
  ├─ Формулы созданы
  ├─ Стоп-слова фильтруют
  ├─ GM() формулы работают
  └─ Результаты корректны
```

**Файлы:** `table/tests/ComprehensiveTestRunner.gs`

**Команда:** `runComprehensiveTests()`

---

#### **4.2 Критические сценарии**
```javascript
✅ Edge Cases
  ├─ Пустые параметры
  ├─ Неверные credentials
  ├─ API недоступен
  ├─ Rate limiting срабатывает
  ├─ Большое количество постов
  └─ Специальные символы в тексте
```

**Файлы:** `table/tests/CriticalIssueTests.gs`

---

### **УРОВЕНЬ 5: SMOKE ТЕСТЫ** 🔥 (3 минуты)

```javascript
✅ Quick Smoke Test
  ├─ Все модули загружены
  ├─ Constants определены
  ├─ Главные функции доступны
  ├─ Меню создаётся
  └─ Нет критических ошибок
```

**Файлы:** `table/tests/QuickSmokeTest.gs`

**Команда:** `runQuickSmokeTests()`

---

## 🚀 ПЛАН ВЫПОЛНЕНИЯ

### **ЭТАП 1: Подготовка** (5 минут)

```bash
# 1.1 Создать test runners
node create-test-runners.js

# 1.2 Подготовить отчёты
mkdir -p test-results
```

---

### **ЭТАП 2: Локальное тестирование** (15 минут)

```bash
# 2.1 Синтаксис (БЫСТРО)
node run-syntax-check.js

# 2.2 Зависимости (БЫСТРО)
node run-dependency-check.js

# 2.3 Мок-тесты (БЫСТРО)
node run-mock-tests.js

# 2.4 Анализ структуры (БЫСТРО)
node run-structure-analysis.js
```

**Результат:** Отчёт о синтаксисе, зависимостях, структуре

---

### **ЭТАП 3: Google Apps Script тесты** (40 минут)

⚠️ **ТРЕБУЕТ ДОСТУПА К GOOGLE SHEETS**

```javascript
// 3.1 Quick Smoke Test (3 мин)
runQuickSmokeTests()

// 3.2 Mock Fix Validation (5 мин)
runAllValidationTests()

// 3.3 Social Import Tests (15 мин)
runAllSocialImportTests()

// 3.4 VK Integration Tests (10 мин)
runVkIntegrationTests()

// 3.5 Comprehensive Tests (7 мин)
runComprehensiveTests()
```

**Результат:** Полный отчёт о функциональности

---

### **ЭТАП 4: Реальные данные** (30 минут)

⚠️ **ТРЕБУЕТ VK_TOKEN, GEMINI_API_KEY**

```javascript
// 4.1 VK реальный импорт
testRealVkImport()

// 4.2 Instagram реальный импорт
testRealInstagramImport()

// 4.3 Telegram реальный импорт
testRealTelegramImport()

// 4.4 OCR реальные изображения
testRealOcr()

// 4.5 Gemini реальные запросы
testRealGemini()
```

**Результат:** Валидация на production данных

---

## ✅ КРИТЕРИИ УСПЕХА

### **МИНИМАЛЬНЫЕ ТРЕБОВАНИЯ (MUST PASS):**

1. ✅ **Синтаксис:** 0 ошибок
2. ✅ **Зависимости:** Все разрешены
3. ✅ **Мок-тесты:** 100% прошли (6/6)
4. ✅ **Quick Smoke:** Все основные функции работают
5. ✅ **Critical Issues:** 0 критических багов

### **ЖЕЛАТЕЛЬНЫЕ (SHOULD PASS):**

6. ✅ **Social Import:** 80%+ тестов прошли
7. ✅ **VK Integration:** handleWallGet_ работает
8. ✅ **Gemini Client:** Rate limiting + retry работают
9. ✅ **OCR Service:** Базовые сценарии работают

### **ОПТИМАЛЬНЫЕ (NICE TO HAVE):**

10. ✅ **Real Data:** Все реальные тесты прошли
11. ✅ **Edge Cases:** Обработка всех граничных случаев
12. ✅ **Performance:** Время выполнения < лимитов Google

---

## 📊 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

### **После ЭТАП 1-2 (Локально):**
```
📊 Статистика:
- Всего файлов: 61
- Проверено: 61
- Ошибок синтаксиса: 0
- Зависимости: Все разрешены
- Мок-тесты: 6/6 ✅
```

### **После ЭТАП 3 (Google Apps Script):**
```
📊 Статистика:
- Quick Smoke: ✅ PASSED
- Mock Validation: 6/6 ✅
- Social Import: ~20/25 ✅ (80%+)
- VK Integration: ✅ PASSED
- Comprehensive: ✅ PASSED
```

### **После ЭТАП 4 (Реальные данные):**
```
📊 Статистика:
- VK Import: ✅ 10 постов
- Instagram: ⚠️ Rate limit
- Telegram: ✅ 5 постов
- OCR: ✅ 3 изображения
- Gemini: ✅ 5 запросов
```

---

## 🛠️ ИНСТРУМЕНТЫ

### **Локальные:**
- `run-syntax-check.js` - Проверка синтаксиса
- `run-dependency-check.js` - Проверка зависимостей
- `run-mock-tests.js` - Мок-тесты (уже создан ✅)
- `run-structure-analysis.js` - Анализ структуры
- `run-all-local-tests.js` - Запуск всех локальных тестов

### **Google Apps Script:**
- `QuickSmokeTest.gs` - Быстрые smoke-тесты
- `MockFixValidationTest.gs` - Мок-тесты исправлений ✅
- `SocialImportTests.gs` - Тесты импорта соцсетей
- `VkIntegrationTest.gs` - VK интеграция
- `ComprehensiveTestRunner.gs` - Комплексные тесты
- `RealDataTester.gs` - Тесты на реальных данных

---

## 🎯 СЛЕДУЮЩИЕ ШАГИ

### **1. НЕМЕДЛЕННО (Локально, без API):**
```bash
# Создать недостающие test runners
node create-test-runners.js

# Запустить все локальные тесты
node run-all-local-tests.js
```

**Время:** 10 минут  
**Требования:** Node.js  
**Результат:** Полный отчёт о синтаксисе и структуре

### **2. ПОСЛЕ MERGE (Google Sheets):**
```javascript
// Запустить Quick Smoke Test
runQuickSmokeTests()

// Запустить Mock Validation
runAllValidationTests()
```

**Время:** 10 минут  
**Требования:** Google Sheets доступ  
**Результат:** Базовая функциональность работает

### **3. ПЕРЕД PRODUCTION (Полное тестирование):**
```javascript
// Запустить все тесты
runComprehensiveTests()
runAllSocialImportTests()
testRealData()
```

**Время:** 1 час  
**Требования:** API ключи, тестовые данные  
**Результат:** Production-ready код

---

## 📝 ОТЧЁТНОСТЬ

### **Автоматические отчёты:**
```
test-results/
├── syntax-report.json          # Синтаксис
├── dependency-report.json      # Зависимости
├── mock-tests-report.json      # Мок-тесты
├── structure-analysis.json     # Структура
├── smoke-test-results.json     # Smoke тесты
└── comprehensive-report.json   # Полный отчёт
```

### **Google Sheets отчёты:**
- Лист "TestResults_YYYY-MM-DD_HH-mm" создаётся автоматически
- Содержит детальные результаты всех тестов
- Цветовое кодирование (✅ зелёный, ❌ красный)

---

## 🎉 ЗАКЛЮЧЕНИЕ

**ПЛАН ТЕСТИРОВАНИЯ:** Комплексный, многоуровневый, покрывающий:
- ✅ 61 файл
- ✅ ~150+ функций
- ✅ 5 уровней тестирования
- ✅ Локальные + Google Apps Script тесты
- ✅ Мок-данные + реальные API

**ОЖИДАЕМОЕ ВРЕМЯ:**
- Локально: 15 минут
- Google Sheets: 40 минут
- Реальные данные: 30 минут
- **ВСЕГО:** ~1.5 часа

**ТЕКУЩИЙ СТАТУС:**
- ✅ Мок-тесты исправлений: 6/6 PASSED
- ⏳ Остальные тесты: Готовы к запуску

---

**ГОТОВ ЗАПУСТИТЬ ВСЕ ТЕСТЫ?** 🚀
