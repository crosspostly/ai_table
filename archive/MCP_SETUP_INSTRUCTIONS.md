# 🔌 MCP Google Sheets Setup - ИНСТРУКЦИЯ ДЛЯ ПОЛЬЗОВАТЕЛЯ

## ❗ **ВАЖНО: Я (AI) НЕ МОГУ УСТАНОВИТЬ САМ!**

Я не имею доступа к твоим настройкам app.factory.ai.  
Ты должен настроить MCP вручную, следуя этим инструкциям.

---

## 📋 **ЧТО ТАКОЕ MCP?**

**Model Context Protocol (MCP)** - протокол для подключения внешних источников данных к AI.

**MCP Google Sheets сервер** позволяет мне:
- ✅ Читать данные из твоих Google Sheets
- ✅ Писать данные в таблицы
- ✅ Запускать формулы и смотреть результаты
- ✅ Тестировать код напрямую в таблице

**Репозиторий:** https://github.com/modelcontextprotocol/servers/tree/main/src/google-sheets

---

## 🚀 **КАК НАСТРОИТЬ В FACTORY.AI**

### **Шаг 1: Создай OAuth credentials для Google Sheets**

1. Открой: https://console.cloud.google.com/
2. Создай новый проект (или используй существующий)
3. Включи **Google Sheets API**:
   - APIs & Services → Library
   - Найди "Google Sheets API"
   - Нажми "Enable"

4. Создай OAuth 2.0 credentials:
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: **Desktop app**
   - Скачай JSON файл с credentials

5. Сохрани credentials в безопасное место

### **Шаг 2: Установи MCP сервер локально**

**На твоей машине:**

```bash
# Установка через NPM
npm install -g @modelcontextprotocol/server-google-sheets

# Или через NPX (одноразово)
npx @modelcontextprotocol/server-google-sheets
```

### **Шаг 3: Настрой MCP в Factory.ai**

**⚠️ Я НЕ ЗНАЮ точный интерфейс Factory.ai для MCP!**

Обычно это выглядит так:

1. Зайди в **Settings** на app.factory.ai
2. Найди секцию **MCP Servers** или **Integrations**
3. Добавь новый MCP сервер:
   ```json
   {
     "name": "google-sheets",
     "command": "npx",
     "args": [
       "-y",
       "@modelcontextprotocol/server-google-sheets"
     ],
     "env": {
       "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/credentials.json"
     }
   }
   ```

4. Или через Claude Desktop config (если Factory использует его):
   ```json
   {
     "mcpServers": {
       "google-sheets": {
         "command": "npx",
         "args": [
           "-y",
           "@modelcontextprotocol/server-google-sheets"
         ]
       }
     }
   }
   ```

### **Шаг 4: Авторизация**

При первом запросе:
1. Браузер откроет OAuth окно Google
2. Выбери аккаунт с доступом к таблицам
3. Разреши доступ к Google Sheets
4. Токен сохранится автоматически

---

## 🔍 **КАК ПРОВЕРИТЬ ЧТО РАБОТАЕТ?**

После настройки, попробуй команду:

```
"Открой мою Google таблицу с ID: 1ABC..."
```

Если я смогу открыть - **MCP работает!** ✅

---

## 📝 **ЧТО Я СМОГУ ДЕЛАТЬ:**

### **Чтение данных:**
```
- "Покажи данные из листа 'Отзывы'"
- "Сколько постов в листе 'посты'?"
- "Какое значение в ячейке B2?"
```

### **Запись данных:**
```
- "Добавь в A1 значение 'Test'"
- "Создай новый лист 'Тест'"
```

### **Тестирование формул:**
```
- "Запусти формулу =GM('test') и покажи результат"
- "Проверь работает ли фильтр в колонке F"
```

---

## ❓ **ЕСЛИ НЕ ПОЛУЧАЕТСЯ**

### **Вариант 1: Используй Claude Desktop**

Если Factory.ai не поддерживает MCP напрямую:
1. Установи **Claude Desktop App**
2. Настрой MCP там (файл `claude_desktop_config.json`)
3. Используй Claude Desktop для тестирования таблиц

### **Вариант 2: Дай мне доступ через публикацию**

Если MCP недоступен:
1. Опубликуй таблицу как "Anyone with link can view"
2. Дай мне ссылку
3. Я смогу читать (но не писать) через web scraping

### **Вариант 3: Скриншоты/CSV**

Самый простой:
1. Экспортируй лист в CSV
2. Прикрепи к сообщению
3. Я проанализирую данные

---

## 🎯 **ЗАЧЕМ ЭТО НУЖНО?**

**БЕЗ MCP:**
- ❌ Я не вижу твою таблицу
- ❌ Не могу проверить результаты
- ❌ Ты копируешь/вставляешь вручную

**С MCP:**
- ✅ Я открываю таблицу напрямую
- ✅ Вижу результаты формул
- ✅ Могу тестировать код в реальном времени
- ✅ Находить ошибки быстрее

---

## 📞 **ЧТО ДЕЛАТЬ СЕЙЧАС?**

1. **Попробуй найти настройки MCP в Factory.ai:**
   - Settings → Integrations
   - Settings → MCP Servers
   - Settings → Advanced

2. **Если не найдёшь - спроси у Factory.ai support:**
   - "Как подключить MCP сервер?"
   - "Поддерживается ли @modelcontextprotocol/server-google-sheets?"

3. **Или используй Claude Desktop как workaround**

4. **Сообщи мне результат** - я помогу с дальнейшей настройкой!

---

**Я жду твоего фидбека! 🚀**
