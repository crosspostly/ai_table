# 🔥 КРИТИЧЕСКАЯ ИНСТРУКЦИЯ: ИСПРАВЛЕНИЕ ОШИБКИ "NULL" ПРИ ИМПОРТЕ

**Дата:** 2024-10-09  
**Ветка:** web-interface-with-design  
**Проблема:** Импорт постов выдаёт ошибку "null"  

---

## 🎯 ПРОВЕРОЧНЫЙ СПИСОК

### **1. SCRIPT PROPERTIES (Google Apps Script)**

**КРИТИЧНО!** Проверьте что настроены:

```
Project Settings → Script Properties:

✅ VK_TOKEN = ваш_VK_токен
✅ LICENSE_EMAIL = ваш_email
✅ LICENSE_TOKEN = токен_лицензии
```

**Как получить VK TOKEN:**
1. Перейдите на https://vk.com/dev
2. Создайте Standalone приложение
3. Получите токен с правами: `wall, offline`

---

### **2. ЛИСТ "Параметры" (Google Sheets)**

**КРИТИЧНО!** Проверьте структуру листа:

```
Параметры:
├─ F1: ваш Gemini API ключ (AIza...)
├─ G1: ваш Email
├─ H1: ваш VK Token
├─ B1: источник постов (https://vk.com/durov)
├─ B2: количество постов (20)
└─ C1: платформа (вк / тг / инста) [опционально]
```

---

### **3. ПРОВЕРКА КОД��** (web-interface-with-design)

**Убедитесь что актуальные файлы:**

#### **Constants.gs - ДОЛЖНА БЫТЬ строка 27:**
```javascript
const SYSTEM_LOGS_NAME = 'SYSTEM_LOGS'; // Алиас для совместимости с Utils.gs
```

#### **SocialImportService.gs - строка 227:**
```javascript
function importVkPostsAdvanced(source, count) {
  try {
    addSystemLog('→ Импорт VK постов через прямой VK API: ' + source, 'INFO', 'VK_IMPORT');
    
    // 🔥 ИСПРАВЛЕНИЕ: Используем прямой VK API вместо VK_PARSER_URL
    var posts = handleWallGet_(source, count);
```

#### **VkImportService.gs - строка 25:**
```javascript
function handleWallGet_(owner, count) {
  var token = getVkToken_();
  var version = '5.131';
  
  if (!owner) {
    throw new Error('Не указан параметр owner');
  }
  
  // Определяем тип параметра (ID или domain)
  var paramName = /^[-\\d]+$/.test(String(owner)) ? 'owner_id' : 'domain';
  
  var apiUrl = 'https://api.vk.com/method/wall.get'
```

---

## 🔍 ДИАГНОСТИКА ПРОБЛЕМЫ

### **Шаг 1: Проверка через Apps Script Editor**

1. Откройте Google Sheets с проектом
2. Extensions → Apps Script
3. Откройте консоль: View → Logs
4. Запустите импорт постов
5. Смотрите логи - там будет **ТОЧНАЯ ошибка**!

### **Шаг 2: Ручной тест VK API**

В Apps Script Editor выполните:

```javascript
function testVkApi() {
  try {
    var result = handleWallGet_('durov', 5);
    Logger.log('SUCCESS: ' + result.length + ' posts');
    Logger.log(JSON.stringify(result[0]));
  } catch (e) {
    Logger.log('ERROR: ' + e.message);
    Logger.log('STACK: ' + e.stack);
  }
}
```

Запустите функцию `testVkApi()` и посмотрите результат.

### **Шаг 3: Проверка credentials**

```javascript
function testCredentials() {
  try {
    // Проверка VK token
    var vkToken = PropertiesService.getScriptProperties().getProperty('VK_TOKEN');
    Logger.log('VK_TOKEN: ' + (vkToken ? 'есть (' + vkToken.length + ' символов)' : 'НЕТ!'));
    
    // Проверка листа Параметры
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var params = ss.getSheetByName('Параметры');
    if (!params) {
      Logger.log('ERROR: Лист "Параметры" не найден!');
      return;
    }
    
    Logger.log('Параметры F1 (API key): ' + (params.getRange('F1').getValue() ? 'есть' : 'НЕТ'));
    Logger.log('Параметры G1 (Email): ' + params.getRange('G1').getValue());
    Logger.log('Параметры H1 (VK Token): ' + (params.getRange('H1').getValue() ? 'есть' : 'НЕТ'));
    Logger.log('Параметры B1 (source): ' + params.getRange('B1').getValue());
    Logger.log('Параметры B2 (count): ' + params.getRange('B2').getValue());
    
  } catch (e) {
    Logger.log('CRITICAL ERROR: ' + e.message);
  }
}
```

---

## 🛠️ ВОЗМОЖНЫЕ ПРИЧИНЫ ОШИБКИ "NULL"

### **Причина 1: VK_TOKEN не настроен**
**Симптом:** `Error: VK_TOKEN не настроен в Script Properties`  
**Решение:** Добавьте VK_TOKEN в Project Settings → Script Properties

### **Причина 2: Невалидный VK TOKEN**
**Симптом:** `Error: Invalid access token`  
**Решение:** Получите новый токен на https://vk.com/dev

### **Причина 3: Лист "Параметры" отсутствует**
**Симптом:** `Лист "Параметры" не найден`  
**Решение:** Создайте лист с именем "Параметры"

### **Причина 4: Пустые параметры B1 или B2**
**Симптом:** `Не указаны параметры импорта`  
**Решение:** Заполните B1 (источник) и B2 (количество)

### **Причина 5: Невалидный источник**
**Симптом:** `Для "..." укажите платформу в ячейке C1`  
**Решение:** 
- Используйте полную ссылку: `https://vk.com/durov`
- ИЛИ укажите платформу в C1: `вк`

### **Причина 6: callServer возвращает null**
**Симптом:** Просто "null" без сообщения  
**Решение:** Проверьте что `SERVER_API_URL` правильный в Constants.gs

---

## 🚀 БЫСТРОЕ ИСПРАВЛЕНИЕ

### **Вариант A: Импорт из КЛИЕНТА (не через сервер)**

Если сервер не отвечает, используйте прямой импорт:

```javascript
function directVkImport() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var params = ss.getSheetByName('Параметры');
    
    if (!params) {
      throw new Error('Лист "Параметры" не найден');
    }
    
    var source = params.getRange('B1').getValue();
    var count = parseInt(params.getRange('B2').getValue()) || 20;
    
    // Прямой вызов VK API
    var posts = handleWallGet_(source, count);
    
    // Запись в лист "посты"
    var postsSheet = ss.getSheetByName('посты');
    if (!postsSheet) {
      postsSheet = ss.insertSheet('посты');
    }
    
    postsSheet.clear();
    
    var headers = ['Дата', 'Ссылка', 'Текст', 'Номер'];
    var data = [headers];
    
    posts.forEach(function(post, i) {
      data.push([
        post.date,
        post.link,
        post.text,
        i + 1
      ]);
    });
    
    postsSheet.getRange(1, 1, data.length, 4).setValues(data);
    
    SpreadsheetApp.getUi().alert('✅ Успех!', 'Импортировано ' + posts.length + ' постов', SpreadsheetApp.getUi().ButtonSet.OK);
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ошибка', e.message, SpreadsheetApp.getUi().ButtonSet.OK);
    Logger.log('ERROR: ' + e.message);
    Logger.log('STACK: ' + e.stack);
  }
}
```

Запустите функцию `directVkImport()` из Apps Script Editor.

### **Вариант B: Использовать старый VK_PARSER**

Если прямой VK API не работает, временно используйте VK_PARSER:

В `SocialImportService.gs` строка 227 замените:

```javascript
// БЫЛО:
var posts = handleWallGet_(source, count);

// СТАЛО (временно):
var parserUrl = VK_PARSER_URL + '?action=wall.get&owner=' + encodeURIComponent(source) + '&count=' + count;
var response = UrlFetchApp.fetch(parserUrl);
var posts = JSON.parse(response.getContentText());
```

---

## 📊 ПРОВЕРКА ВЕРСИИ ФАЙЛОВ

Убедитесь что у вас актуальная версия `web-interface-with-design`:

```bash
git checkout web-interface-with-design
git pull origin web-interface-with-design
git log --oneline -3
```

**Должны быть коммиты:**
```
f5e4d07 Merge feature/complete-social-import-fix: Полное исправление импорта постов + комплексное тестирование
2a4f3c5 test: Добавлена комплексная система тестирования
b588fa3 test: Добавлены мок-тесты для валидации исправлений
```

---

## 🎯 ИТОГОВЫЙ ЧЕКЛИСТ

- [ ] VK_TOKEN настроен в Script Properties
- [ ] LICENSE_EMAIL и LICENSE_TOKEN настроены
- [ ] Лист "Параметры" существует
- [ ] B1 содержит источник (https://vk.com/durov)
- [ ] B2 содержит количество (20)
- [ ] F1, G1, H1 заполнены
- [ ] Constants.gs содержит SYSTEM_LOGS_NAME
- [ ] SocialImportService.gs использует handleWallGet_()
- [ ] VkImportService.gs содержит handleWallGet_() функцию
- [ ] Проверены логи в Apps Script Editor

---

## 📞 ЕСЛИ ВСЁ ЕЩЁ НЕ РАБОТАЕТ

1. **Скопируйте ТОЧНУЮ ошибку из логов Apps Script**
2. **Запустите testCredentials() и testVkApi()**
3. **Отправьте результаты для детальной диагностики**

**Логи находятся:**
Apps Script Editor → View → Logs (Ctrl+Enter после выполнения функции)

---

**Подготовлено:** Droid AI Assistant  
**Дата:** 2024-10-09  
**Ветка:** web-interface-with-design  
