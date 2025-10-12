# 🔥 ПОЛНОЕ РЕШЕНИЕ ПРОБЛЕМЫ ИМПОРТА VK

## 📋 АНАЛИЗ ПРОБЛЕМЫ

### Цепочка вызовов:
```
1. МЕНЮ/КНОПКА
   ↓
2. importVkPosts() → importSocialPostsClient()
   ↓
3. callServer({ action: 'social_import', source, count, email, token })
   ↓
4. SERVER: doPost() → handleSocialImport()
   ↓
5. importVkPostsAdvanced() 
   ↓
6. handleWallGet_()
   ↓
7. getVkToken_() → PropertiesService.getScriptProperties().getProperty('VK_TOKEN')
   ↓
8. ❌ ОШИБКА: VK_TOKEN не настроен на сервере!
```

## 🎯 ГЛАВНАЯ ПРОБЛЕМА

**VK_TOKEN должен быть настроен в Script Properties СЕРВЕРНОГО скрипта!**

Сервер по адресу:
```
https://script.google.com/macros/s/AKfycbyyUlB5YWP4bwv3gHHniTv_12cAHlqjYfra7fQ3m3Vri5XvZTQ_uUZZovCYeTo2_u6gQw/exec
```

## ✅ РЕШЕНИЕ №1: ПЕРЕДАВАТЬ VK_TOKEN С КЛИЕНТА

Изменить код чтобы передавать VK_TOKEN с клиента на сервер в каждом запросе.

### ШАГ 1: Добавить VK_TOKEN в credentials клиента

**table/client/CredentialsManager.gs** (строка ~50):
```javascript
function getClientCredentials() {
  // ... существующий код ...
  
  // ДОБАВИТЬ:
  var vkToken = props.getProperty('VK_TOKEN');
  
  return {
    ok: hasEmail && hasToken,
    valid: hasEmail && hasToken,
    email: email || '',
    token: token || '',
    geminiApiKey: geminiApiKey || '',
    vkToken: vkToken || '',  // ← ДОБАВЛЕНО
    // ...
  };
}
```

### ШАГ 2: Передавать VK_TOKEN в запросе

**table/client/SocialImportClient.gs** (строка ~70):
```javascript
var serverRequest = {
  action: 'social_import',
  email: credentials.email,
  token: credentials.token,
  vkToken: credentials.vkToken,  // ← ДОБАВЛЕНО
  source: source,
  count: count,
  platform: platform || ''
};
```

### ШАГ 3: Использовать переданный токен на сервере

**table/server/VkImportService.gs** (строка 11):
```javascript
function getVkToken_(requestData) {  // ← ДОБАВЛЕН ПАРАМЕТР
  // Сначала пытаемся использовать токен из запроса
  if (requestData && requestData.vkToken) {
    return requestData.vkToken;
  }
  
  // Fallback на Script Properties
  var token = PropertiesService.getScriptProperties().getProperty('VK_TOKEN');
  if (!token) {
    throw new Error('VK_TOKEN не настроен. Добавьте через меню: 🤖 Table AI → 🌟 НАСТРОИТЬ ВСЕ КЛЮЧИ');
  }
  return token;
}
```

**table/server/SocialImportService.gs** (строка ~225):
```javascript
function importVkPostsAdvanced(source, count, requestData) {  // ← ДОБАВЛЕН ПАРАМЕТР
  try {
    addSystemLog('→ Импорт VK постов через прямой VK API: ' + source, 'INFO', 'VK_IMPORT');
    
    // Передаем requestData в handleWallGet_
    var posts = handleWallGet_(source, count, requestData);  // ← ПЕРЕДАЕМ
    // ...
  }
}
```

**table/server/VkImportService.gs** (строка 25):
```javascript
function handleWallGet_(owner, count, requestData) {  // ← ДОБАВЛЕН ПАРАМЕТР
  var token = getVkToken_(requestData);  // ← ПЕРЕДАЕМ
  // ...
}
```

**table/server/ServerEndpoints.gs** (строка ~180):
```javascript
case 'vk':
  posts = importVkPostsAdvanced(sourceInfo.value, validatedInput.count, data);  // ← ПЕРЕДАЕМ data
  break;
```

---

## ✅ РЕШЕНИЕ №2: НАСТРОИТЬ VK_TOKEN НА СЕРВЕРЕ (проще!)

### ШАГ 1: Откройте серверный скрипт
1. Перейдите по ID скрипта из SERVER_URL
2. Или найдите его в Google Drive

### ШАГ 2: Добавьте VK_TOKEN в Script Properties
1. В редакторе скрипта: Настройки проекта → Script Properties
2. Добавьте свойство:
   - Имя: `VK_TOKEN`
   - Значение: ваш VK токен

### ШАГ 3: Сохраните и задеплойте сервер

---

## ✅ РЕШЕНИЕ №3: ИСПОЛЬЗОВАТЬ VK_PARSER_URL (альтернативное)

Если основной сервер не поддерживает VK, можно использовать VK_PARSER_URL напрямую:

**table/client/SocialImportClient.gs** - добавить альтернативный путь:
```javascript
// Если платформа VK и есть VK_PARSER_URL - используем его
if (platform === 'vk' && typeof VK_PARSER_URL !== 'undefined') {
  var vkRequest = {
    action: 'wall.get',
    owner: source,
    count: count
  };
  
  var vkResponse = UrlFetchApp.fetch(VK_PARSER_URL, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(vkRequest),
    muteHttpExceptions: true
  });
  
  // Обрабатываем ответ...
}
```

---

## 🎯 РЕКОМЕНДУЕМОЕ РЕШЕНИЕ

**Используйте РЕШЕНИЕ №1** - передавать VK_TOKEN с клиента на сервер. Это:
- ✅ Не требует доступа к серверному скрипту
- ✅ Токен хранится локально в клиенте
- ✅ Безопасно - токен передается только на ваш сервер
- ✅ Работает сразу после деплоя

---

## 📝 ТЕСТИРОВАНИЕ

После применения решения:

1. Убедитесь что VK_TOKEN настроен:
   ```
   Меню → 🤖 Table AI → 🌟 НАСТРОИТЬ ВСЕ КЛЮЧИ
   ```

2. Запустите импорт:
   ```
   Меню → 📱 Социальные сети → 📱 Импорт постов
   ```

3. Проверьте SuperMasterCheck:
   ```
   Меню → DEV TOOLS → 🎯 СУПЕР МАСТЕР ПРОВЕРКА
   ```

---

## 🔧 DEBUG: Как найти точную ошибку

Если все равно не работает, добавьте логирование:

**table/client/SocialImportClient.gs** (после строки 80):
```javascript
console.log('Server response:', result);
if (result && result.error) {
  console.log('Server error details:', result);
  ui.alert('DEBUG', JSON.stringify(result), ui.ButtonSet.OK);
}
```

Это покажет точную ошибку с сервера!