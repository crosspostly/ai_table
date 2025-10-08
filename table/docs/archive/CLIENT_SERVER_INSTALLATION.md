# 🚀 ПРАВИЛЬНАЯ Инструкция по Установке - AI Table Bot

## ⚡ **КЛИЕНТ-СЕРВЕРНАЯ АРХИТЕКТУРА**

**Нужны ДВА отдельных приложения:** сервер и клиент, которые общаются по HTTP.

---

## 🖥️ **ЭТАП 1: СОЗДАНИЕ СЕРВЕРА**

### 1.1 Создать Apps Script Web Application (СЕРВЕР)
1. Откройте [script.google.com](https://script.google.com)  
2. **"Новый проект"** → назовите: `"AI Table Bot Server"`
3. Удалите код по умолчанию (`function myFunction() {...}`)

### 1.2 Скопировать серверные файлы
Создайте следующие файлы в серверном проекте:

**ОБЯЗАТЕЛЬНЫЕ ФАЙЛЫ:**

**📄 Создать: `ServerEndpoints.gs`**
```javascript
// Главный API файл - обрабатывает HTTP запросы
[скопируйте содержимое из table/server/ServerEndpoints.gs]
```

**📄 Создать: `SocialImportService.gs`**
```javascript  
// Импорт постов из соцсетей
[скопируйте содержимое из table/server/SocialImportService.gs]
```

**📄 Создать: `ValidationService.gs`**
```javascript
// Валидация и безопасность  
[скопируйте содержимое из table/server/ValidationService.gs]
```

**📄 Создать: `RetryService.gs`**
```javascript
// HTTP retry логика
[скопируйте содержимое из table/server/RetryService.gs]  
```

**📄 Создать: `ErrorHandlingService.gs`**  
```javascript
// Обработка ошибок
[скопируйте содержимое из table/server/ErrorHandlingService.gs]
```

**📄 Создать: `TableLicenseService.gs`**
```javascript
// Система лицензирования
[скопируйте содержимое из table/server/TableLicenseService.gs]
```

### 1.3 Развернуть сервер как веб-приложение ⚡
1. В Apps Script нажмите **"Deploy"** → **"New deployment"**
2. **Type:** выберите **"Web app"**  
3. **Description:** `"AI Table Bot Server v1.0"`
4. **Execute as:** `"Me"` 
5. **Who has access:** `"Anyone"` (важно!)
6. Нажмите **"Deploy"**
7. **СКОПИРУЙТЕ И СОХРАНИТЕ URL!** 
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```

### 1.4 Проверить работу сервера
1. Откройте URL сервера в браузере
2. Должны увидеть JSON ответ:
   ```json
   {
     \"ok\": true,
     \"service\": \"Table AI v2.0\",
     \"timestamp\": \"...\",
     \"version\": \"...\"
   }
   ```

---

## 💻 **ЭТАП 2: СОЗДАНИЕ КЛИЕНТА**

### 2.1 Создать Google Sheets (КЛИЕНТ)
1. Откройте [sheets.google.com](https://sheets.google.com)
2. **"Создать"** → назовите: `"AI Table Bot Client"`

### 2.2 Создать лист параметров
1. Создайте лист: **"Параметры"**  
2. Заполните:

| A | B | C |
|---|---|---|  
| **Источник:** | https://instagram.com/nasa |  |
| **Количество:** | 20 | |

### 2.3 Настроить Apps Script клиента
1. **Extensions** → **Apps Script**
2. Удалите код по умолчанию  
3. Создайте клиентские файлы:

**📄 Создать: `Constants.gs`**  
```javascript
// ВАЖНО: Вставьте URL ВАШЕГО сервера!
var SERVER_URL = 'https://script.google.com/macros/s/[ВАШ_SERVER_ID]/exec';

// Версия API
var API_VERSION = '2.0';
```

**📄 Создать: `ThinClient.gs`**
```javascript
// HTTP клиент для связи с сервером
[скопируйте содержимое из table/client/ThinClient.gs]
```

**📄 Создать: `Menu.gs`**
```javascript  
// Пользовательское меню
[скопируйте содержимое из table/client/Menu.gs]
```

### 2.4 Настроить SERVER_URL
В файле `Constants.gs` замените `[ВАШ_SERVER_ID]` на реальный ID сервера:
```javascript
var SERVER_URL = 'https://script.google.com/macros/s/AKfycbz1234567890abcdef/exec';
```

### 2.5 Сохранить и обновить
1. **Ctrl+S** → сохранить проект
2. Вернуться в Google Sheets → **F5** (обновить)
3. В меню должен появиться **"🤖 AI Table Bot"**

---

## 🧪 **ЭТАП 3: ТЕСТИРОВАНИЕ СВЯЗИ**

### 3.1 Тест серверного подключения
В клиентском Apps Script создайте и запустите:
```javascript
function testServerConnection() {
  try {
    var response = UrlFetchApp.fetch(SERVER_URL, {
      method: 'GET'
    });
    
    Logger.log('Server response: ' + response.getContentText());
    
    if (response.getResponseCode() === 200) {
      Logger.log('✅ Server connection OK');
    } else {
      Logger.log('❌ Server error: ' + response.getResponseCode());
    }
  } catch (error) {
    Logger.log('❌ Connection failed: ' + error.message);
  }
}
```

### 3.2 Тест API запроса
```javascript  
function testApiRequest() {
  try {
    var testRequest = {
      action: 'test',
      email: 'test@example.com',
      token: 'test_token'
    };
    
    var result = callServer(testRequest);
    Logger.log('API result: ' + JSON.stringify(result));
    
  } catch (error) {
    Logger.log('❌ API test failed: ' + error.message);
  }
}
```

---

## 🎯 **ЭТАП 4: ПЕРВЫЙ ИМПОРТ**

### 4.1 Настроить лицензию (временно для тестов)
В серверном коде найдите функцию лицензирования и временно добавьте тестовый доступ.

### 4.2 Запустить импорт
1. В Google Sheets перейдите в меню **"🤖 AI Table Bot"**
2. Выберите **"📥 Импорт постов"**  
3. Дождитесь результата

### 4.3 Проверить результат
1. Должен появиться лист **"посты"**
2. В нем должны быть импортированные данные:
   - Колонка A: Платформа
   - Колонка B: Дата  
   - Колонка C: Ссылка
   - Колонка D: Текст поста

---

## 🔧 **НАСТРОЙКА И КОНФИГУРАЦИЯ**

### 🔑 Настройка лицензии
В клиентском Apps Script:
1. **File** → **Project properties** → **Script properties**
2. Добавить:
   - `LICENSE_EMAIL` = ваш email
   - `LICENSE_TOKEN` = токен лицензии  
   - `GEMINI_API_KEY` = ключ Gemini API

### ⚙️ VK Parser (опционально)  
В серверном коде установите:
```javascript
var VK_PARSER_URL = 'https://your-vk-parser.com/api';
```

### 🎨 Настройка меню
Можете изменить элементы меню в `Menu.gs`:
```javascript
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🤖 AI Table Bot')
    .addItem('📥 Импорт постов', 'importSocialPostsUI')
    .addItem('🔍 Диагностика', 'testServerConnection')  
    .addToUi();
}
```

---

## ⚠️ **TROUBLESHOOTING**

### 🚨 **Частые ошибки:**

**❌ "SERVER_URL not configured"**
- Проверьте файл `Constants.gs` в клиенте  
- URL должен быть без завершающего `/`

**❌ "Server error: HTTP 403"**  
- Проверьте настройки deployment сервера
- **"Who has access"** должно быть **"Anyone"**

**❌ "Function not found"**
- Проверьте, что все серверные файлы скопированы
- Особенно важен `ServerEndpoints.gs` с `doPost()`

**❌ "Invalid JSON response"**
- Проверьте логи сервера на наличие ошибок
- Возможно, серверный код содержит синтаксические ошибки

**❌ "License validation failed"**
- Настройте временный доступ для тестов
- Проверьте `LICENSE_EMAIL` и `LICENSE_TOKEN`

### 🔍 **Диагностика:**

**Проверить сервер:**
```javascript
// В клиенте
function debugServer() {
  Logger.log('SERVER_URL: ' + SERVER_URL);
  testServerConnection();
}
```

**Проверить клиента:**  
```javascript
// В клиенте  
function debugClient() {
  var credentials = getClientCredentials();
  Logger.log('Client credentials: ' + JSON.stringify(credentials));
}
```

---

## 🏆 **РЕЗУЛЬТАТ**

После успешной установки у вас будет:

✅ **Сервер** - принимает API запросы, выполняет бизнес-логику  
✅ **Клиент** - удобный интерфейс в Google Sheets  
✅ **Безопасная связь** - через HTTPS и валидацию  
✅ **Лицензирование** - контроль доступа на сервере  
✅ **Масштабируемость** - один сервер для многих клиентов

### **Преимущества архитектуры:**
- 🔒 **Безопасность** - вся логика на сервере
- 🚀 **Производительность** - клиент только UI
- 🔄 **Обновления** - обновляем сервер, все клиенты получают изменения  
- 📊 **Аналитика** - централизованное логирование на сервере

**Готово к продакшну! 🎉**