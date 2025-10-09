# 🧪 МЕТОДИЧКА ТЕСТИРОВАНИЯ AI_TABLE ДЛЯ ИИ-АГЕНТОВ

## 📋 **ОБЯЗАТЕЛЬНАЯ ИНФОРМАЦИЯ ПЕРЕД ТЕСТИРОВАНИЕМ**

### ⚠️ **КРИТИЧЕСКИ ВАЖНО - АРХИТЕКТУРА CREDENTIALS:**

#### 🔐 **VK TOKENS - ТОЛЬКО СЕРВЕР!**
```
❌ НЕПРАВИЛЬНО: Запрашивать VK токен у пользователя-клиента  
✅ ПРАВИЛЬНО: VK токен хранится в server properties, пользователь НЕ вводит его

🏗️ Архитектура:
• VK_ACCESS_TOKEN хранится в серверном PropertiesService
• Пользователь вводит только: EMAIL + LICENSE_TOKEN  
• VK импорт: Client → Server API → Server использует свой VK токен
```

#### 🤖 **GEMINI API KEY - ТОЛЬКО КЛИЕНТ!**
```
✅ ПРАВИЛЬНО: Gemini API ключ запрашивается у пользователя-клиента
❌ НЕПРАВИЛЬНО: Использовать серверный Gemini токен

🏗️ Архитектура:  
• GEMINI_API_KEY хранится в клиентском PropertiesService
• Пользователь вводит через меню: 🔑 API ключ Gemini
• GM функции: Client использует свой Gemini ключ напрямую
```

#### 📊 **ПОЛНАЯ СХЕМА CREDENTIALS:**
```
👤 ПОЛЬЗОВАТЕЛЬ НАСТРАИВАЕТ:
┌─ LICENSE_EMAIL     (для доступа к серверу)
├─ LICENSE_TOKEN     (для авторизации на сервере) 
└─ GEMINI_API_KEY    (для прямых запросов к Gemini)

🖥️ СЕРВЕР ИМЕЕТ ВСТРОЕННЫЕ:
┌─ VK_ACCESS_TOKEN   (серверный, пользователь НЕ вводит)
├─ TELEGRAM_TOKEN    (серверный, пользователь НЕ вводит)
└─ INSTAGRAM_TOKEN   (серверный, пользователь НЕ вводит)
```

---

## 🏗️ **АРХИТЕКТУРА СИСТЕМЫ AI_TABLE**

### **3-УРОВНЕВАЯ АРХИТЕКТУРА:**

#### 📱 **CLIENT (Google Sheets Script)**
```
table/client/ - Container-bound script в Google Sheets
├── Credentials: LICENSE_EMAIL, LICENSE_TOKEN, GEMINI_API_KEY
├── Функции: GM(), Menu, TestSuite, Chat mode, Smart prompts
├── Деплой: .clasp-client.json → отдельный Apps Script проект
└── Доступ: Только владелец Google Sheets
```

#### 🌐 **SERVER (Standalone Web App)**  
```
table/server/ - Отдельный Apps Script Web App
├── Credentials: VK_ACCESS_TOKEN, TELEGRAM_TOKEN, INSTAGRAM_TOKEN
├── Функции: Social import, License validation, OCR service  
├── Деплой: .clasp-server.json → отдельный Apps Script проект
└── Доступ: Public API для authenticated клиентов
```

#### 🖥️ **WEB INTERFACE**
```
table/web/ - HTML интерфейс через Google Apps Script Web App
├── Files: RealisticWebApp.html, WebInterface.gs, WebApp.html
├── Функции: GUI для всех операций, real-time status
├── Интеграция: Вызывает client и server функции
└── Доступ: Через URL Web App
```

#### 🔗 **SHARED**
```
table/shared/ - Общие модули
├── Constants.gs, Utils.gs, LoggingService.gs  
├── SecurityValidator.gs (новое!)
├── Копируется в client и server при деплое
└── Единая точка конфигурации
```

---

## 🧪 **ФАЗЫ ТЕСТИРОВАНИЯ**

### **🔒 ФАЗА 1: CRITICAL SECURITY TESTS (ПЕРВООЧЕРЕДНО!)**

#### **1.1 Input Validation Tests**
```javascript
// ✅ ТЕСТ: GM функции - XSS Protection
GM('<script>alert("XSS")</script>Hello')
→ Ожидаем: Санитизированный промпт без <script> тегов

// ✅ ТЕСТ: GM функции - SQL Injection Protection  
GM("'; DROP TABLE users; --")
→ Ожидаем: Обнаружение dangerous pattern, логирование предупреждения

// ✅ ТЕСТ: VK URLs - Dangerous Protocol Blocking
importSocialPosts('javascript:alert("hack")', 20)
→ Ожидаем: VALIDATION_ERROR, URL отклонён

// ✅ ТЕСТ: GM Parameters - Boundary Values
GM("test", -100, -1)           // Негативные значения
GM("test", 999999999, 5)       // Слишком большие  
GM("test", "invalid", true)    // Неверные типы
→ Ожидаем: VALIDATION_ERROR для всех случаев
```

#### **1.2 Credentials Leakage Prevention Tests**
```javascript
// ✅ ТЕСТ: Безопасное логирование credentials
SecurityValidator.sanitizeForLogging('email: user@test.com, token: abc123def456ghi789')
→ Ожидаем: 'email: ***@***.***, token: abc1***i789'

// ✅ ТЕСТ: Error handling без утечки secrets
var error = createStandardError(ErrorTypes.API_ERROR, 'Failed with token=secret123', {key: 'hidden'});  
var userMessage = handleSecureError(error, {context: 'test'});
→ Ожидаем: В userMessage НЕТ 'secret123' и 'hidden'

// ❌ АНТИ-ТЕСТ: Проверяем что credentials НЕ попадают в UI alerts
// При ошибке GM() пользователь НЕ должен видеть полный Gemini API ключ
```

#### **1.3 Server-Client Credential Architecture Tests**
```javascript
// ✅ ТЕСТ: VK Import - Server-side token usage
importVkPosts('https://vk.com/testgroup', 10)  
→ Проверяем: Запрос идёт на server, server использует свой VK_ACCESS_TOKEN
→ Ожидаем: Пользователь НЕ вводит VK токен

// ✅ ТЕСТ: Gemini - Client-side key usage  
GM('Test prompt', 1000, 0.5)
→ Проверяем: Клиент использует свой GEMINI_API_KEY из properties
→ Ожидаем: Запрос Gemini идёт напрямую с клиента

// ✅ ТЕСТ: License validation - Server interaction
validateLicenseForGM()
→ Проверяем: Отправляется EMAIL + TOKEN на server для проверки
→ Ожидаем: Server возвращает валидность лицензии
```

### **⚡ ФАЗА 2: UNIT TESTS (КАЖДАЯ ФУНКЦИЯ ОТДЕЛЬНО)**

#### **2.1 GM Functions - Comprehensive Testing**
```javascript
// ✅ Нормальные случаи
GM("Analyze this data", 1000, 0.5)  
GM("", 100, 0.1)                     // Минимальные значения
GM("x".repeat(1000), 250000, 1.5)    // Большие значения

// ✅ Граничные случаи
GM("x", 1, 0)                        // Минимум
GM("x".repeat(500000), 1000000, 2)   // Максимум
GM("test", null, undefined)          // Null/undefined параметры

// ✅ Ошибочные случаи  
GM(null, 1000, 0.5)                  // Null prompt
GM(123, 1000, 0.5)                   // Число вместо строки
GM("test", "invalid", 0.5)           // Строка вместо числа
GM("test", 1000, -1)                 // Отрицательная temperature
```

#### **2.2 VK Import Functions - Architecture-Aware Testing**
```javascript
// ✅ Валидные VK URLs
importVkPosts('https://vk.com/publicpage', 20)
importVkPosts('vk.com/group', 10)  
importVkPosts('-123456', 5)                    // Group ID

// ✅ Невалидные URLs (должны быть отклонены)  
importVkPosts('https://facebook.com/page', 20) // Не VK
importVkPosts('javascript:alert(1)', 20)       // Dangerous protocol
importVkPosts('', 20)                          // Пустая строка

// ✅ Граничные значения count  
importVkPosts('https://vk.com/test', 1)        // Минимум
importVkPosts('https://vk.com/test', 100)      // Максимум  
importVkPosts('https://vk.com/test', -5)       // Отрицательное
importVkPosts('https://vk.com/test', 999)      // Слишком много

// ⚠️ ВАЖНО: Проверяем что VK_ACCESS_TOKEN НЕ запрашивается у пользователя!
```

#### **2.3 OCR Functions - Image Processing Tests**
```javascript
// ✅ Валидные изображения
ocrSingleImage('https://vk.com/photo123_456.jpg')
ocrSingleImage('https://drive.google.com/image.png')  

// ✅ Невалидные URLs
ocrSingleImage('javascript:alert(1)')          // Dangerous protocol
ocrSingleImage('https://example.com/text.txt') // Не изображение
ocrSingleImage('')                             // Пустая строка

// ✅ Batch OCR
ocrReviews() // При пустом листе "Отзывы"
ocrReviews() // При битых ссылках на изображения
ocrReviews() // При уже заполненных результатах (пропуск)
```

#### **2.4 Menu & UI Functions**  
```javascript
// ✅ Credentials setup
setupAllCredentialsUI()    // Проверка 3-этапного процесса
getClientCredentials()     // Валидация возвращаемых данных

// ✅ Testing menu
runAllTests()              // Полный набор тестов
quickTest()                // Быстрая проверка критичных функций  
runSecurityTestsMenu()     // Security тесты

// ✅ Web interface
openWebInterface()         // Открытие HTML интерфейса
getSystemStatusData()      // Системная информация
```

### **🔗 ФАЗА 3: INTEGRATION TESTS (МЕЖКОМПОНЕНТНОЕ ВЗАИМОДЕЙСТВИЕ)**

#### **3.1 Client-Server Communication**
```javascript
// ✅ License validation flow
1. Client: Получает EMAIL + TOKEN от пользователя
2. Client: Отправляет на server для валидации  
3. Server: Проверяет credentials против базы лицензий
4. Server: Возвращает статус + оставшиеся лимиты
5. Client: Показывает результат пользователю

// ✅ VK Import full flow  
1. Client: Получает VK URL от пользователя (БЕЗ VK токена!)
2. Client: Валидирует URL через SecurityValidator
3. Client: Отправляет запрос на server с URL + count
4. Server: Использует свой VK_ACCESS_TOKEN для импорта
5. Server: Возвращает данные постов
6. Client: Записывает в лист "Посты" с формулами

// ✅ Error propagation
1. Server недоступен → Client показывает NETWORK_ERROR
2. VK API недоступно → Server возвращает API_ERROR → Client обрабатывает
3. Лицензия истекла → Server возвращает PERMISSION_ERROR → Client блокирует
```

#### **3.2 Web Interface Integration**
```javascript
// ✅ Web ↔ Client integration
webGM(prompt, tokens, temp)           // Вызов GM через веб-интерфейс
importSocialPosts(url, count, platform) // VK импорт через веб-форму
getSystemStatusData()                 // Статус системы для веб-панели

// ✅ Shared modules consistency  
Constants.gs одинаковые в client и server
Utils.gs функции доступны везде
SecurityValidator.gs работает во всех модулях
```

### **🎯 ФАЗА 4: END-TO-END TESTS (ПОЛНЫЕ ПОЛЬЗОВАТЕЛЬСКИЕ СЦЕНАРИИ)**

#### **4.1 Полный цикл нового пользователя**
```
1. Открыли Google Sheets с установленным AI_TABLE
2. Меню: 🤖 Table AI → ⚙️ Настройки → 🔐 Настроить все credentials
3. Ввели: EMAIL лицензии, TOKEN лицензии, GEMINI_API_KEY  
4. Меню: 🧪 Тестирование → ⚡ Быстрый тест
5. Все тесты прошли → система готова к работе
6. Написали в A3: "Текст для анализа"
7. В B3: =GM("Проанализируй " & A3, 1000, 0.5)
8. Получили результат анализа
```

#### **4.2 Полный цикл VK импорта с анализом**
```
1. Создали лист "Параметры"
2. В B1: https://vk.com/testgroup
3. В B2: 20  
4. Меню: 📱 Получить VK посты
5. Создался лист "Посты" с данными и фильтрами
6. В E2-E10: добавили стоп-слова  
7. В H2-H10: добавили позитивные слова
8. Формулы автоматически отфильтровали посты
9. Скопировали отфильтрованные в лист "Анализ"
10. Применили GM анализ ко всем постам
```

#### **4.3 Полный цикл OCR с анализом отзывов**  
```
1. Создали лист "Отзывы"
2. В A2-A20: добавили ссылки на изображения отзывов
3. Меню: 💬 Анализ отзывов  
4. Система извлекла текст из всех изображений (OCR)
5. В B2-B20: появились результаты OCR
6. Создали сводный анализ через GM функции
7. Получили структурированные инсайты по отзывам
```

### **⚖️ ФАЗА 5: BOUNDARY & STRESS TESTS (ПОГРАНИЧНЫЕ СЛУЧАИ)**

#### **5.1 Large Data Tests**
```javascript
// ✅ Большие промпты
GM("x".repeat(100000), 250000, 0.5)   // 100K символов в промпте
GM("x".repeat(500000), 1000000, 1.0)  // 500K символов (максимум)

// ✅ Массовые операции  
VK импорт 100 постов подряд
OCR обработка 50+ изображений  
GM обработка 100 ячеек через Smart Chains

// ✅ Concurrent operations
Несколько пользователей одновременно:
- Импорт VK постов  
- GM анализ
- OCR обработка
```

#### **5.2 Network & API Failure Tests**
```javascript
// ✅ Gemini API недоступно
GM() при HTTP 500 от Gemini → Показать API_ERROR пользователю

// ✅ Server недоступен  
importVkPosts() при недоступном server → Показать NETWORK_ERROR

// ✅ VK API rate limiting
Массовый импорт → VK возвращает HTTP 429 → Retry с backoff

// ✅ Timeout handling
Очень медленный Gemini response → Timeout → Graceful degradation
```

#### **5.3 Data Corruption Tests**
```javascript
// ✅ Malformed JSON responses
Server возвращает битый JSON → Client обрабатывает gracefully

// ✅ Broken image URLs in OCR
ocrReviews() с битыми ссылками → Пропускает, логирует ошибку

// ✅ Corrupted Google Sheets
Удалён лист "Параметры" → importVkPosts() создаёт новый
Битые формулы в Smart Chains → Система восстанавливает
```

### **🚀 ФАЗА 6: PERFORMANCE TESTS (ПРОИЗВОДИТЕЛЬНОСТЬ)**

#### **6.1 Response Time Benchmarks**  
```javascript
// ✅ GM Functions timing
console.time('GM-small');  
GM("Analyze", 100, 0.5);  
console.timeEnd('GM-small');  
// Ожидаем: < 5 секунд

console.time('GM-large');
GM("x".repeat(10000), 10000, 0.5);
console.timeEnd('GM-large');  
// Ожидаем: < 30 секунд

// ✅ VK Import timing
console.time('VK-import-20');
importVkPosts('https://vk.com/test', 20);  
console.timeEnd('VK-import-20');
// Ожидаем: < 15 секунд

// ✅ OCR Batch timing  
console.time('OCR-10-images');
ocrReviews(); // 10 изображений
console.timeEnd('OCR-10-images');
// Ожидаем: < 60 секунд
```

#### **6.2 Memory Usage Tests**
```javascript
// ✅ Memory leaks detection
Запустить 100 GM операций подряд → Память не должна расти линейно
Smart Chains 24/7 → Нет утечек в triggers
Cache управление → Старые entries автоматически удаляются
```

#### **6.3 Concurrent Load Tests**
```javascript
// ✅ Multiple users simulation
5 пользователей одновременно делают GM запросы
3 пользователя импортируют VK посты  
2 пользователя запускают OCR
→ Все операции завершаются успешно без ошибок
```

---

## ✅ **КРИТЕРИИ УСПЕШНОГО ТЕСТИРОВАНИЯ**

### **🔒 SECURITY TESTS - MUST PASS:**
- [ ] Все XSS атаки блокированы
- [ ] SQL injection patterns обнаружены
- [ ] Dangerous URLs отклонены  
- [ ] Credentials замаскированы в логах
- [ ] Error messages не содержат secrets
- [ ] VK токен НЕ запрашивается у пользователя
- [ ] Gemini ключ остается на клиенте

### **⚡ UNIT TESTS - >70% КРИТИЧНЫХ ФУНКЦИЙ:**
- [ ] GM() функции работают со всеми типами входных данных
- [ ] importVkPosts() корректно валидирует URLs  
- [ ] ocrReviews() обрабатывает различные форматы изображений
- [ ] Menu функции отрабатывают без exceptions
- [ ] SecurityValidator блокирует все dangerous inputs

### **🔗 INTEGRATION TESTS - ОСНОВНЫЕ API РАБОТАЮТ:**
- [ ] Client ↔ Server communication стабильно
- [ ] License validation проходит полный цикл
- [ ] VK import использует server-side токен
- [ ] Gemini requests используют client-side ключ
- [ ] Web interface интегрируется с обеими частями

### **🎯 E2E TESTS - ГЛАВНЫЕ USER JOURNEYS:**
- [ ] Новый пользователь может настроить credentials и начать работу
- [ ] VK импорт → фильтрация → анализ работает end-to-end  
- [ ] OCR → анализ отзывов работает полностью
- [ ] Smart Chains автоматизация выполняется корректно

### **⚖️ BOUNDARY TESTS - ГРАНИЧНЫЕ СЛУЧАИ:**
- [ ] Очень большие промпты обрабатываются gracefully
- [ ] Network failures не ломают систему
- [ ] Malformed data не вызывает crashes
- [ ] Concurrent operations не конфликтуют

### **🚀 PERFORMANCE TESTS - В ПРЕДЕЛАХ SLA:**
- [ ] GM responses < 30 секунд для больших промптов
- [ ] VK import < 60 секунд для 50 постов
- [ ] OCR batch < 120 секунд для 20 изображений  
- [ ] Memory usage стабильно при длительной работе

---

## 🚨 **ANTIPATTERNS - ЧЕГО НЕ ДЕЛАТЬ:**

### **❌ НЕПРАВИЛЬНОЕ ПОНИМАНИЕ АРХИТЕКТУРЫ:**
- НЕ просить VK токен у пользователя (он на сервере!)
- НЕ использовать серверный Gemini ключ (он у клиента!)
- НЕ смешивать client и server credentials

### **❌ НЕПРАВИЛЬНОЕ ТЕСТИРОВАНИЕ:**
- НЕ тестировать только existence функций  
- НЕ игнорировать boundary cases
- НЕ пропускать security тесты
- НЕ тестировать только happy path

### **❌ НЕПРАВИЛЬНАЯ ОБРАБОТКА ОШИБОК:**
- НЕ показывать technical details пользователю
- НЕ логировать credentials в открытом виде
- НЕ пропускать validation ошибки без обработки

---

## 📊 **ОТЧЁТ О ТЕСТИРОВАНИИ - ОБЯЗАТЕЛЬНЫЙ ФОРМАТ:**

```markdown
# 🧪 ОТЧЁТ О ТЕСТИРОВАНИИ AI_TABLE

## 📊 SUMMARY
- **Дата тестирования:** YYYY-MM-DD
- **Версия системы:** v2.x  
- **Тестировщик:** ИИ-агент [название]
- **Общий результат:** ✅ PASSED / ❌ FAILED

## 🔒 SECURITY TESTS
- XSS Protection: ✅ PASSED - скрипты санитизированы
- SQL Injection: ✅ PASSED - dangerous patterns обнаружены  
- URL Validation: ✅ PASSED - опасные URL заблокированы
- Log Sanitization: ✅ PASSED - credentials замаскированы
- Error Handling: ✅ PASSED - secrets не утекают
- **Архитектура Credentials:** ✅ VERIFIED - VK сервер, Gemini клиент

## ⚡ UNIT TESTS  
- GM Functions: ✅ 15/15 PASSED
- VK Import: ✅ 12/12 PASSED  
- OCR Functions: ✅ 8/8 PASSED
- Menu Functions: ✅ 10/10 PASSED
- **Coverage:** 85% критичных функций

## 🔗 INTEGRATION TESTS
- Client-Server: ✅ PASSED - коммуникация стабильна
- License Flow: ✅ PASSED - полный цикл работает
- Web Interface: ✅ PASSED - интеграция работает
- **API Calls:** 12/12 успешных

## 🎯 E2E TESTS
- New User Journey: ✅ PASSED - от настройки до результата
- VK Import Flow: ✅ PASSED - полный цикл работает
- OCR Analysis Flow: ✅ PASSED - от изображений до инсайтов
- **User Scenarios:** 3/3 успешных

## ⚖️ BOUNDARY TESTS  
- Large Data: ✅ PASSED - 500K промпт обработан
- Network Failures: ✅ PASSED - graceful degradation
- Malformed Data: ✅ PASSED - нет crashes
- **Edge Cases:** 18/18 обработаны корректно

## 🚀 PERFORMANCE TESTS
- GM Response Time: ✅ PASSED - 8.5 sec (< 30 sec SLA)
- VK Import Time: ✅ PASSED - 23 sec (< 60 sec SLA)  
- OCR Batch Time: ✅ PASSED - 45 sec (< 120 sec SLA)
- **Performance:** Все метрики в пределах SLA

## 🎯 CONCLUSION
**✅ СИСТЕМА ГОТОВА К PRODUCTION**  
Все критичные тесты пройдены, security требования выполнены, 
архитектура credentials соблюдена корректно.

## 📋 RECOMMENDATIONS
1. Мониторинг performance в production
2. Еженедельные security тесты  
3. Расширение E2E coverage для новых фич
```

---

## 💡 **ИСПОЛЬЗОВАНИЕ МЕТОДИЧКИ:**

### **Для ИИ-агентов:**
1. **Прочитать полностью** перед началом тестирования
2. **Проверить архитектуру credentials** - VK сервер, Gemini клиент  
3. **Следовать фазам** по порядку: Security → Unit → Integration → E2E → Boundary → Performance
4. **Создать отчёт** по обязательному формату
5. **Проверить antipatterns** - избегать частых ошибок

### **Для команды разработки:**
1. Ссылка на методичку при запросе тестирования
2. Обновление методички при изменении архитектуры  
3. Использование как стандарт качества
4. Автоматизация части тестов на основе методички

---

*Последнее обновление: 2024-12-19*  
*Версия методички: 1.0*  
*Статус: ✅ Production Ready*