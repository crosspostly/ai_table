# 🎯 ДЕТАЛЬНЫЙ ПЛАН ИНТЕГРАЦИИ СТАРОГО РАБОЧЕГО КОДА

## 📊 АНАЛИЗ СТАРОГО КОДА (ЗАВЕРШЕН)

### 1. **server.txt** - Серверная логика
```javascript
// КЛЮЧЕВАЯ ФУНКЦИЯ: gm_image action
case 'gm_image': {
  var images = data.images || [];
  var lang = (data.lang || 'ru').toString();
  var apiKey2 = (data.apiKey || '').toString();
  var delimiter = (data.delimiter && String(data.delimiter).trim()) ? String(data.delimiter).trim() : null;
  
  // ВАЖНО: Gemini 2.0 Flash (НЕ 2.5!!!)
  S_GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  
  // Транскрибирует РЕАЛЬНО, а не придумывает!
  text2 = serverGMImage_(images, lang, apiKey2, delimiter);
}
```

**ЧТО ДЕЛАЕТ:**
- Принимает массив изображений в формате `{mimeType, data(base64)}`
- Использует Gemini 2.0 Flash для транскрибации
- Возвращает чистый текст БЕЗ markdown галлюцинаций
- Rate limiting: 3 req/sec

### 2. **ocrRunV2_client.txt** - OCR клиент
```javascript
// КЛЮЧЕВАЯ ФУНКЦИЯ: serverGmOcrBatchV2_
function serverGmOcrBatchV2_(images, lang) {
  // Вызов СЕРВЕРА с action='gm_image'
  var payload = {
    action: 'gm_image',
    email: getEmailFromProps_(),
    token: getTokenFromProps_(),
    apiKey: getApiKeyFromProps_(),
    images: images,
    lang: lang,
    delimiter: '____'
  };
  
  var response = UrlFetchApp.fetch(SERVER_URL, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
  
  var data = JSON.parse(response.getContentText());
  if (!data.ok) throw new Error(data.error);
  return data.data; // Транскрибированный текст
}
```

**ЧТО ДЕЛАЕТ:**
- Собирает images из разных источников (VK, GDrive, Yandex, URL)
- Пакетная обработка: 8 изображений на запрос
- Лимит: 50 изображений за прогон
- Fallback: если batch не сработал, обрабатывает по 1

### 3. **review_client.txt** - Обработка отзывов
```javascript
// КЛЮЧЕВАЯ ФУНКЦИЯ: extractSourcesV2_
function extractSourcesV2_(textVal, formula, richUrl) {
  // Парсит:
  // 1. Rich text links
  // 2. =IMAGE() формулы
  // 3. =HYPERLINK() формулы
  // 4. URL в тексте (vk.com, drive.google.com, yadi.sk, dropbox.com)
  
  return [
    { kind: 'vk-album', url: '...' },
    { kind: 'gdrive-folder', id: '...' },
    { kind: 'yandex-disk', url: '...' },
    { kind: 'image-url', url: '...' }
  ];
}
```

**ЧТО ДЕЛАЕТ:**
- Парсит ВСЕ возможные источники изображений
- VK albums, VK reviews, VK discussions
- Google Drive folders
- Yandex Disk folders
- Прямые URL изображений
- Очереди с offset для больших альбомов

### 4. **Main.txt** - Главная логика
```javascript
// КЛЮЧЕВЫЕ КОНСТАНТЫ:
const VK_PARSER_URL = 'https://script.google.com/macros/s/AKfycbzttbqz16EmmcXbEYCuYhNlXkCxAnCG77phspFL1_rTCi4xVqoorByJAPa4dI4iwT8/exec';
const SERVER_URL = 'https://script.google.com/macros/s/AKfycbyyUlB5YWP4bwv3gHHniTv_12cAHlqjYfra7fQ3m3Vri5XvZTQ_uUZZovCYeTo2_u6gQw/exec';

// CREDENTIALS из Script Properties:
function getEmailFromProps_() {
  return PropertiesService.getScriptProperties().getProperty('USER_EMAIL') || '';
}
function getTokenFromProps_() {
  return PropertiesService.getScriptProperties().getProperty('USER_TOKEN') || '';
}
function getApiKeyFromProps_() {
  return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '';
}
```

### 5. **VK_PARSER.txt** - VK парсер
```javascript
// Отдельное веб-приложение для VK API
// Actions:
// - parseAlbum: возвращает массив {url, w, h}
// - parseDiscussion: возвращает массив comments
// - parseReviews: возвращает reviews
```

---

## 🔧 ПЛАН ИНТЕГРАЦИИ (ПО ПРИОРИТЕТАМ)

### 🔴 КРИТИЧНО (делаем ПЕРВЫМ):

#### 1. **Восстановить SERVER gm_image action**
**Файл:** `table/server/ServerApi.gs`
**Что добавить:**
```javascript
case 'gm_image': {
  // Логика из old/server.txt
  var images = data.images || [];
  var lang = (data.lang || 'ru').toString();
  var apiKey = (data.apiKey || '').toString();
  var delimiter = (data.delimiter && String(data.delimiter).trim()) ? String(data.delimiter).trim() : null;
  
  if (!apiKey) return jsonResponse_({ ok: false, error: 'NO_CLIENT_KEY' }, 400);
  if (!Array.isArray(images) || images.length === 0) return jsonResponse_({ ok: false, error: 'NO_IMAGES' }, 400);
  
  var text = serverGMImage_(images, lang, apiKey, delimiter);
  return jsonResponse_({ ok: true, data: text });
}

function serverGMImage_(images, lang, apiKey, delimiter) {
  // Полная логика из old/server.txt строки 178-210
}
```

#### 2. **Восстановить CLIENT вызов сервера для OCR**
**Файл:** `table/client/ClientUtilities.gs`
**Что добавить:**
```javascript
function serverGmOcrBatch_(images, lang) {
  var creds = getClientCredentials();
  if (!creds.ok) throw new Error('Credentials error: ' + creds.error);
  
  var payload = {
    action: 'gm_image',
    email: creds.email,
    token: creds.token,
    apiKey: creds.apiKey,
    images: images,
    lang: lang || 'ru',
    delimiter: '____'
  };
  
  var response = UrlFetchApp.fetch(SERVER_URL, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  
  var code = response.getResponseCode();
  var data = JSON.parse(response.getContentText());
  
  if (code !== 200 || !data.ok) {
    throw new Error(data.error || 'Server error: ' + code);
  }
  
  return data.data;
}
```

#### 3. **Исправить getClientCredentials()**
**Файл:** `table/client/ClientUtilities.gs`
**Текущая проблема:** Возвращает `{ok: false, error: "Не настроены credentials: undefined"}`
**Исправление:**
```javascript
function getClientCredentials() {
  try {
    var props = PropertiesService.getScriptProperties();
    
    var email = props.getProperty('USER_EMAIL');
    var token = props.getProperty('USER_TOKEN');
    var apiKey = props.getProperty('GEMINI_API_KEY');
    
    // Проверяем что ВСЕ заполнены
    if (!email || !String(email).trim()) {
      return { ok: false, error: 'Email не настроен в Script Properties (USER_EMAIL)' };
    }
    
    if (!token || !String(token).trim()) {
      return { ok: false, error: 'Token не настроен в Script Properties (USER_TOKEN)' };
    }
    
    if (!apiKey || !String(apiKey).trim()) {
      return { ok: false, error: 'Gemini API Key не настроен в Script Properties (GEMINI_API_KEY)' };
    }
    
    return {
      ok: true,
      email: String(email).trim(),
      token: String(token).trim(),
      apiKey: String(apiKey).trim()
    };
    
  } catch (e) {
    return { ok: false, error: 'Ошибка чтения credentials: ' + e.message };
  }
}
```

#### 4. **Восстановить extractSourcesV2_ и collectFromSourceV2_**
**Файл:** `table/client/ClientUtilities.gs`
**Что добавить:**
- `extractSourcesV2_(textVal, formula, richUrl)` - парсинг ВСЕХ источников
- `classifyV2_(url)` - классификация типа источника
- `normalizeUrlV2_(url)` - нормализация URL
- `collectFromSourceV2_(source, limit)` - сбор изображений из источника
- Поддержка VK, GDrive, Yandex, прямых URL

#### 5. **Добавить SERVER_URL и VK_PARSER_URL**
**Файл:** `table/shared/Constants.gs`
```javascript
// Реальные URL серверов
const SERVER_URL = 'https://script.google.com/macros/s/AKfycbyyUlB5YWP4bwv3gHHniTv_12cAHlqjYfra7fQ3m3Vri5XvZTQ_uUZZovCYeTo2_u6gQw/exec';
const VK_PARSER_URL = 'https://script.google.com/macros/s/AKfycbzttbqz16EmmcXbEYCuYhNlXkCxAnCG77phspFL1_rTCi4xVqoorByJAPa4dI4iwT8/exec';
```

---

### 🟡 ВАЖНО (делаем ВТОРЫМ):

#### 6. **Восстановить полную ocrRun() логику**
**Файл:** `table/client/ThinClient.gs` ИЛИ новый `table/client/OcrRunner.gs`
**Что добавить:**
- Полная логика из `old/ocrRunV2_client.txt`
- Batch processing: 8 images per request
- Fallback: per-image if batch fails
- Queue management с offset
- Insert rows for multiple reviews

#### 7. **Восстановить serverStatus_() для лицензий**
**Файл:** `table/client/ClientUtilities.gs`
```javascript
function serverStatus_() {
  var creds = getClientCredentials();
  if (!creds.ok) return { ok: false, error: creds.error };
  
  try {
    var response = UrlFetchApp.fetch(SERVER_URL, {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify({
        action: 'status',
        email: creds.email,
        token: creds.token
      }),
      muteHttpExceptions: true
    });
    
    return JSON.parse(response.getContentText());
  } catch (e) {
    return { ok: false, error: 'Server error: ' + e.message };
  }
}
```

#### 8. **Добавить getOcrOverwrite_() для флага перезаписи**
**Файл:** `table/client/ClientUtilities.gs`
```javascript
function getOcrOverwrite_() {
  try {
    var ss = SpreadsheetApp.getActive();
    var params = ss.getSheetByName('Параметры');
    if (params) {
      var val = params.getRange('B7').getDisplayValue(); // OCR Overwrite флаг
      return String(val).toLowerCase() === 'да' || String(val).toLowerCase() === 'yes';
    }
  } catch (e) {}
  return false;
}
```

---

### 🟢 СРЕДНИЙ ПРИОРИТЕТ (делаем ТРЕТЬИМ):

#### 9. **Восстановить Chat Mode (A2→B2)**
**Файл:** `table/client/ChatMode.gs` (НОВЫЙ)
**Что добавить:**
- onEdit trigger для столбца A
- Автоматический ответ в столбец B
- Контекст из D1 или C1

#### 10. **Восстановить Smart Prompts Setup**
**Файл:** `table/client/SmartPrompts.gs` (уже есть)
**Что проверить:**
- Чтение промптов из листа "Промпты"
- Запись в Script Properties

#### 11. **Исправить Web Interface**
**Файл:** `table/web/script.html`
**Что исправить:**
- НЕ вызывать сервер при открытии (только при submit)
- Убрать автоматические проверки лицензии

---

## ✅ КРИТЕРИИ УСПЕХА

### OCR должен:
1. ✅ Вызывать СЕРВЕР с action='gm_image'
2. ✅ Использовать Gemini 2.0 Flash
3. ✅ Транскрибировать РЕАЛЬНО (не придумывать)
4. ✅ Обрабатывать VK albums, GDrive folders, Yandex Disk
5. ✅ Batch processing: 8 images per request
6. ✅ Fallback: per-image если batch fail

### Credentials должны:
1. ✅ Читаться из Script Properties
2. ✅ Проверяться перед каждым запросом
3. ✅ Возвращать понятные ошибки

### Server должен:
1. ✅ Иметь action 'gm_image'
2. ✅ Проверять лицензии
3. ✅ Rate limiting: 3 req/sec
4. ✅ Логировать в админ таблицу

---

## 🧪 ПЛАН ТЕСТИРОВАНИЯ

### После каждого изменения:
1. `validate-syntax.js` - проверка синтаксиса
2. `check-functions.js` - проверка функций
3. Manual test в Google Sheets

### После всех изменений:
1. ✅ OCR с реальными изображениями
2. ✅ VK album parsing
3. ✅ GDrive folder parsing
4. ✅ Credentials checking
5. ✅ License validation
6. ✅ Chat mode
7. ✅ Smart prompts
8. ✅ Web interface

---

## 📦 DEPLOYMENT

1. Commit каждого критичного изменения отдельно
2. Push после группы связанных изменений
3. GitHub Actions deploy автоматически
4. Создать PR после ВСЕХ изменений
5. Тестировать в production

---

## ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ

1. **НЕ УДАЛЯТЬ НОВЫЕ ФАЙЛЫ!** Только ДОБАВЛЯЕМ логику в существующие
2. **НЕ МЕНЯТЬ СТРУКТУРУ!** Встраиваем старое в новое
3. **ОСТОРОЖНО С КОНСТАНТАМИ!** Проверяем что не сломали другие функции
4. **ТЕСТИРУЕМ ПОСЛЕ КАЖДОГО ШАГА!** Не делаем 10 изменений подряд
5. **ЛОГИРУЕМ ВСЁ!** addSystemLog() для отладки

---

## 🎯 ТЕКУЩИЙ СТАТУС

- [x] Анализ старого кода завершен
- [ ] Интеграция server gm_image action
- [ ] Исправление credentials logic
- [ ] Восстановление OCR логики
- [ ] Тестирование
- [ ] Deployment
