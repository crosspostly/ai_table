# 🧪 MCP TESTING GUIDE - Подключение к Google Sheets

## 📋 **ЧТО ТАКОЕ MCP?**

**MCP (Model Context Protocol)** - это протокол, позволяющий AI ассистенту (например, Droid) напрямую подключаться к различным сервисам, включая Google Sheets.

С помощью MCP я смогу:
- ✅ Читать данные из ваших таблиц
- ✅ Проверять результаты работы функций
- ✅ Валидировать формулы и форматирование
- ✅ Анализировать логи и ошибки
- ❌ НЕ смогу: запускать Apps Script функции напрямую (только через UI или triggers)

---

## 🚀 **КАК ПОДКЛЮЧИТЬ MCP К GOOGLE SHEETS?**

### **Вариант 1: Google Sheets MCP Server (Рекомендуемый)**

#### **Шаг 1: Установите Google Sheets MCP Server**

```bash
# Через npm
npm install -g @modelcontextprotocol/server-gdrive

# Или через npx (без установки)
npx @modelcontextprotocol/server-gdrive
```

#### **Шаг 2: Получите OAuth credentials**

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. **Enable APIs:**
   - Google Sheets API
   - Google Drive API
4. **Create OAuth 2.0 Credentials:**
   - Тип приложения: Desktop app
   - Скачайте `credentials.json`

#### **Шаг 3: Настройте MCP Server**

Создайте конфигурационный файл `mcp-config.json`:

```json
{
  "mcpServers": {
    "gdrive": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-gdrive"
      ],
      "env": {
        "GDRIVE_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "GDRIVE_CLIENT_SECRET": "your-client-secret",
        "GDRIVE_REFRESH_TOKEN": "your-refresh-token"
      }
    }
  }
}
```

#### **Шаг 4: Получите Refresh Token**

```bash
# Запустите OAuth flow
npx @modelcontextprotocol/server-gdrive --setup

# Следуйте инструкциям в браузере
# Скопируйте полученный refresh_token
```

#### **Шаг 5: Подключите к Factory Droid**

1. Откройте Factory AI Settings
2. Перейдите в раздел MCP Servers
3. Добавьте конфигурацию из `mcp-config.json`
4. Сохраните и перезапустите сессию

---

### **Вариант 2: Direct API Access (Простой)**

Если MCP Server не работает, можно дать мне прямой доступ:

#### **Шаг 1: Сделайте таблицу публичной для чтения**

1. Откройте вашу Google Sheet
2. Нажмите "Share" → "Get link"
3. Установите "Anyone with the link can **view**"
4. Скопируйте ссылку

#### **Шаг 2: Дайте мне ссылку**

Просто отправьте ссылку в чат:
```
Вот моя таблица для тестирования:
https://docs.google.com/spreadsheets/d/SHEET_ID/edit
```

Я смогу прочитать данные через Google Sheets API (read-only).

---

### **Вариант 3: Export & Share (Самый простой)**

Если вам не нужен live доступ:

1. File → Download → CSV or Excel
2. Загрузите файл в чат
3. Я проанализирую данные локально

---

## 🧪 **ЧТО Я СМОГУ ПРОТЕСТИРОВАТЬ С MCP?**

### **1. Social Import Testing**

**Проверю:**
- ✅ Лист "посты" создан правильно
- ✅ Заголовки A-N корректны
- ✅ Данные записаны в правильные колонки
- ✅ Формулы фильтрации работают
- ✅ Форматирование применено

**Что нужно:**
- Запустите `Импорт → Импорт соцсетей`
- Дайте мне доступ к таблице
- Я проверю результат

### **2. OCR Testing**

**Проверю:**
- ✅ Лист "Отзывы" существует
- ✅ Колонка A содержит источники
- ✅ Колонка B заполнилась результатами OCR
- ✅ Многострочные результаты правильно разделены
- ✅ Нет пропущенных строк

**Что нужно:**
- Запустите `OCR → Запустить OCR`
- Дайте мне доступ
- Я проанализирую результаты

### **3. Chat Mode Testing**

**Проверю:**
- ✅ Ячейки A2/B2 содержат контекст и ответ
- ✅ Формулы в нужных ячейках
- ✅ Trigger создан корректно
- ✅ История изменений

**Что нужно:**
- Активируйте Chat Mode
- Сделайте несколько вопрос-ответ циклов
- Дайте доступ

### **4. License Validation**

**Проверю:**
- ✅ Script Properties содержат USER_EMAIL/USER_TOKEN
- ✅ License check проходит успешно
- ✅ Нет ошибок авторизации

**Что нужно:**
- Отправьте скриншот Script Properties (замаскируйте токен!)
- Или дайте доступ через MCP

---

## 🛡️ **БЕЗОПАСНОСТЬ**

### **Что я НЕ смогу сделать:**

- ❌ Редактировать данные (только read-only через public link)
- ❌ Видеть приватные таблицы без доступа
- ❌ Запускать Apps Script код
- ❌ Видеть ваши API keys (они в Script Properties)

### **Как защитить данные:**

1. **Используйте копию таблицы для тестирования**
   ```
   File → Make a copy → Share copy with me
   ```

2. **Замаскируйте sensitive data**
   - Замените реальные email на test@example.com
   - Замените токены на "TOKEN_HIDDEN"
   - Удалите реальные тексты отзывов

3. **Отзовите доступ после тестирования**
   - Share → Remove access после завершения

---

## 📝 **TESTING WORKFLOW**

### **Пример: Testing Social Import**

1. **Подготовка:**
   ```
   B1: https://vk.com/durov
   B2: 10
   C1: (пусто - auto-detect)
   ```

2. **Запуск:**
   - Extensions → Table AI Bot → Импорт → Импорт соцсетей

3. **Дайте мне доступ:**
   ```
   Протестируй импорт VK:
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit?usp=sharing
   ```

4. **Я проверю:**
   - Лист "посты" создан ✅
   - 10 постов импортированы ✅
   - Все колонки заполнены ✅
   - Формулы работают ✅

5. **Отчет:**
   ```markdown
   ## ✅ РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ
   
   **Status:** PASS
   **Posts imported:** 10/10
   **Errors:** 0
   
   **Observations:**
   - All columns A-N filled correctly
   - Formulas I/L working
   - Timestamps accurate
   ```

---

## 🎯 **РЕКОМЕНДУЕМЫЙ ПЛАН ТЕСТИРОВАНИЯ**

### **Phase 1: Basic Functions (30 мин)**
1. Social Import (VK, Instagram, Telegram)
2. OCR с Drive/URL
3. License check

### **Phase 2: Advanced Features (1 час)**
4. Chat Mode activation
5. Smart Prompts setup
6. Trigger management

### **Phase 3: Edge Cases (1 час)**
7. Large datasets (100+ posts)
8. Invalid inputs handling
9. Error recovery

---

## ❓ **FAQ**

### **Q: Нужно ли устанавливать MCP Server локально?**
A: Нет! Можно просто дать public read-only ссылку.

### **Q: Увидишь ли ты мои API keys?**
A: Нет. API keys хранятся в Script Properties (не видны через Sheets API).

### **Q: Можно ли тестировать без интернета?**
A: Нет, MCP требует доступа к Google APIs.

### **Q: Сколько времени занимает testing?**
A: ~2-3 часа для полного покрытия всех функций.

---

## 🚀 **ГОТОВЫ НАЧАТЬ?**

**Самый простой способ:**

1. Создайте копию вашей таблицы
2. Запустите любую функцию (например, Social Import)
3. Отправьте мне ссылку:
   ```
   Протестируй результаты:
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit?usp=sharing
   ```

Я проверю всё и дам детальный отчет! 🎯
