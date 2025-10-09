# 🔌 MCP Testing Guide - Полное руководство

## 🎯 **ПРЯМОЙ ОТВЕТ: МОЖНО ЛИ ПОДЦЕПИТЬ MCP?**

### **КОРОТКИЙ ОТВЕТ: ДА, НО НЕ Я!**

**КТО настраивает:** **ТЫ** (пользователь) в настройках Factory.ai  
**КТО использует после настройки:** **Я** (AI assistant)  
**ЧТО это даёт:** Прямой доступ к Google Sheets для чтения/записи/тестирования

---

## ✅ **ЧТО ТАКОЕ MCP?**

**Model Context Protocol (MCP)** - протокол для подключения внешних источников данных к AI.

**Аналогия:**
```
БЕЗ MCP:
Ты → Копируешь данные из таблицы → Вставляешь мне → Я анализирую
                    ↓
           ДОЛГО И НЕУДОБНО

С MCP:
Ты → Даёшь ссылку на таблицу → Я сам открываю и читаю → Анализирую
                    ↓
         БЫСТРО И УДОБНО!
```

---

## 🔧 **КТО ЧТО ДЕЛАЕТ?**

### **ТЫ (пользователь) должен:**
1. ✅ Зайти в https://app.factory.ai/settings/session
2. ✅ Найти секцию MCP Servers или Integrations
3. ✅ Настроить MCP сервер (см. инструкции ниже)
4. ✅ Авторизовать доступ к Google Sheets

### **Я (AI) смогу после настройки:**
1. ✅ Открывать твои Google Sheets напрямую
2. ✅ Читать данные из любых листов
3. ✅ Писать данные в ячейки
4. ✅ Запускать формулы и видеть результаты
5. ✅ Тестировать код в реальном времени
6. ✅ Находить и исправлять ошибки

### **Я (AI) НЕ МОГУ:**
- ❌ Сам установить MCP (нет доступа к твоим настройкам)
- ❌ Настроить OAuth credentials (это твоя часть)
- ❌ Зайти в app.factory.ai под твоим аккаунтом

---

## ⚠️ **ПРОБЛЕМА: Google Sheets MCP сервера НЕТ!**

**Как я выяснил:**
```bash
npm search @modelcontextprotocol/server-google-sheets
# Результат: 404 Not Found ❌

# Официальные серверы:
- @modelcontextprotocol/server-memory
- @modelcontextprotocol/server-filesystem
- @modelcontextprotocol/server-git
- @modelcontextprotocol/server-fetch

# НЕТ server-google-sheets! ❌
```

**Это значит:**
- Официального MCP сервера для Google Sheets НЕ существует
- Нужны альтернативные подходы
- Возможно создать свой MCP сервер

---

## 🚀 **АЛЬТЕРНАТИВНЫЕ РЕШЕНИЯ**

### **Вариант 1: Apps Script Web App (РЕКОМЕНДУЮ!)**

**Что это:**
- Создаёшь свой API endpoint в Google Apps Script
- Публикуешь как Web App
- Даёшь мне URL
- Я работаю с таблицей через твой API

**Как настроить:**

1. Открой свою Google Sheets таблицу
2. Extensions → Apps Script
3. Создай новый файл `WebApi.gs`:

```javascript
/**
 * API endpoint для доступа к таблице
 */
function doGet(e) {
  try {
    var action = e.parameter.action;
    var auth = e.parameter.auth; // Простая авторизация
    
    // Проверка авторизации
    if (auth !== 'YOUR_SECRET_KEY') {
      return error_('Unauthorized');
    }
    
    // Роутинг действий
    if (action === 'read') return handleRead(e);
    if (action === 'write') return handleWrite(e);
    if (action === 'list') return handleList(e);
    if (action === 'test') return handleTest(e);
    
    return error_('Unknown action');
  } catch (err) {
    return error_(err.toString());
  }
}

/**
 * Чтение данных из листа
 */
function handleRead(e) {
  var sheetName = e.parameter.sheet || 'Sheet1';
  var range = e.parameter.range; // A1:B10 или null для всего листа
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return error_('Sheet not found: ' + sheetName);
  }
  
  var data;
  if (range) {
    data = sheet.getRange(range).getValues();
  } else {
    data = sheet.getDataRange().getValues();
  }
  
  return success_({ data: data, rows: data.length, cols: data[0].length });
}

/**
 * Запись данных в лист
 */
function handleWrite(e) {
  var sheetName = e.parameter.sheet || 'Sheet1';
  var cell = e.parameter.cell; // A1
  var value = e.parameter.value;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return error_('Sheet not found: ' + sheetName);
  }
  
  sheet.getRange(cell).setValue(value);
  
  return success_({ written: true, cell: cell, value: value });
}

/**
 * Список всех листов
 */
function handleList(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var names = sheets.map(function(s) { return s.getName(); });
  
  return success_({ sheets: names, count: names.length });
}

/**
 * Тестовый endpoint
 */
function handleTest(e) {
  return success_({ 
    ok: true, 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
}

/**
 * Успешный ответ
 */
function success_(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, result: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ошибка
 */
function error_(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Публикуй:
   - Deploy → New deployment
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone (или Anyone with Google account)
   - Deploy!

5. Скопируй Web App URL (выглядит как `https://script.google.com/macros/s/XXXXXXXX/exec`)

6. Сгенерируй секретный ключ:
   ```javascript
   // В коде замени YOUR_SECRET_KEY на случайную строку
   // Например: 'sk_' + Utilities.getUuid()
   ```

7. Дай мне:
   - URL Web App
   - Секретный ключ

**Теперь я могу:**
```bash
# Тест API
curl "https://script.google.com/macros/s/XXX/exec?action=test&auth=YOUR_KEY"

# Список листов
curl "https://script.google.com/macros/s/XXX/exec?action=list&auth=YOUR_KEY"

# Чтение данных
curl "https://script.google.com/macros/s/XXX/exec?action=read&sheet=Sheet1&auth=YOUR_KEY"

# Запись данных
curl "https://script.google.com/macros/s/XXX/exec?action=write&sheet=Sheet1&cell=A1&value=Test&auth=YOUR_KEY"
```

---

### **Вариант 2: FetchUrl (то что работает СЕЙЧАС)**

**Что я уже делаю:**
- Читаю твою таблицу через публичную ссылку
- Парсю HTML и извлекаю данные
- Вижу ошибки формул (#NAME?, #REF!)

**Плюсы:**
- ✅ Работает прямо сейчас
- ✅ Не требует настройки

**Минусы:**
- ❌ Только чтение (не могу писать)
- ❌ Не вижу формулы (только результаты)
- ❌ Ограниченная точность парсинга

---

### **Вариант 3: CSV Export**

**Самый простой для анализа:**
1. File → Download → CSV
2. Прикрепляешь к сообщению
3. Я анализирую полностью

**Плюсы:**
- ✅ Работает ВСЕГДА
- ✅ Полные данные
- ✅ Вижу точные значения

**Минусы:**
- ❌ Ручная работа
- ❌ Не real-time
- ❌ Не могу писать обратно

---

## 🎯 **МОИ РЕКОМЕНДАЦИИ**

### **Для твоей текущей таблицы с ошибками:**

**ЛУЧШИЙ вариант = CSV Export:**
- Быстро
- Точно
- Я увижу ВСЕ проблемы

### **Для постоянной работы:**

**ЛУЧШИЙ вариант = Apps Script Web App:**
- Полный контроль
- Работает через HTTP
- Я смогу читать и писать
- Ты управляешь доступом

---

## 📝 **ИТОГ**

### **Вопрос: Можно ли подцепить MCP к тебе?**

**Ответ:**
- ✅ **ДА**, но настраиваешь **ТЫ** (не я)
- ❌ **НО** официального Google Sheets MCP сервера **НЕТ**
- ✅ **АЛЬТЕРНАТИВА**: Apps Script Web App (лучшее решение!)
- ✅ **СЕЙЧАС**: FetchUrl работает для чтения

### **Что делать:**

**Если нужен быстрый анализ:**
→ Экспортируй CSV → Прикрепи → Я найду все проблемы

**Если нужна постоянная интеграция:**
→ Создай Apps Script Web App → Дай мне URL + ключ → Я буду работать напрямую!

---

**Я готов работать любым способом! Что выбираешь? 🚀**
