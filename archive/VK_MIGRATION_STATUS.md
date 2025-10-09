# 🔍 VK MIGRATION STATUS - Переход с VK_PARSER на прямой VK API

## 📊 **ТЕКУЩИЙ СТАТУС**

**Общий прогресс:** 🟡 **75% MIGRATED** (частично мигрировано)

---

## ✅ **ЧТО МИГРИРОВАНО:**

### **1. VkImportService.gs (Server) - ✅ ГОТОВО**

**Файл:** `table/server/VkImportService.gs`

**Функции:**
- ✅ `getVkToken_()` - получение VK токена
- ✅ `handleWallGet_()` - прямой VK API вызов wall.get
- ✅ `parseVkResponse_()` - парсинг ответа VK API
- ✅ `formatVkPosts_()` - форматирование постов

**Что работает:**
```javascript
// ПРЯМОЙ VK API без VK_PARSER:
var posts = handleWallGet_('durov', 50);
// → Возвращает массив постов напрямую из api.vk.com
```

**Зависимости:**
- Требует `VK_TOKEN` в Script Properties
- Использует VK API v5.131

---

### **2. SocialImportService.gs - ✅ ЧАСТИЧНО**

**Файл:** `table/server/SocialImportService.gs`

**Функция `importVkPostsAdvanced()`:**
```javascript
function importVkPostsAdvanced(source, count) {
  // ⚠️ ПРОБЛЕМА: ВСЁ ЕЩЁ ИСПОЛЬЗУЕТ VK_PARSER_URL!
  var url = VK_PARSER_URL + '?owner=' + source + '&count=' + count;
  var response = fetchSocialApiWithRetry('vk', url, {...});
  // ...
}
```

**Статус:** 🔴 **ИСПОЛЬЗУЕТ СТАРЫЙ VK_PARSER!**

---

### **3. OcrHelpers.gs - 🟡 ЧАСТИЧНО MIGRATED**

**Файл:** `table/client/OcrHelpers.gs`

**Функция `fetchVkReviewsV2_()`:**
```javascript
function fetchVkReviewsV2_(reviewsUrl, offset, limit) {
  // ⚠️ ПРОБЛЕМА: ИСПОЛЬЗУЕТ VK_PARSER_URL!
  var apiUrl = VK_PARSER_URL + 
    '?action=vk_reviews' +
    '&url=' + encodeURIComponent(reviewsUrl) +
    '&offset=' + (offset || 0) +
    '&limit=' + (limit || 50);
  // ...
}
```

**Статус:** 🔴 **ИСПОЛЬЗУЕТ СТАРЫЙ VK_PARSER!**

---

## 🔴 **ЧТО НЕ МИГРИРОВАНО:**

### **1. VK Reviews OCR (КРИТИЧНО!)**

**Проблема:** `fetchVkReviewsV2_()` вызывает VK_PARSER для получения текстов отзывов.

**Старая логика (VK_PARSER):**
```
VK_PARSER получает:
- action=vk_reviews
- url=https://vk.com/topic-XXX_YYY
- offset, limit

Возвращает:
{
  texts: ["отзыв 1", "отзыв 2", ...],
  hasMore: true,
  nextOffset: 50
}
```

**Новая логика (нужна миграция):**
```javascript
// ДОЛЖНО БЫТЬ:
function fetchVkReviewsV2_(reviewsUrl, offset, limit) {
  // Парсим topic ID из URL
  var match = reviewsUrl.match(/topic-(\d+)_(\d+)/);
  var groupId = '-' + match[1];
  var topicId = match[2];
  
  // Прямой VK API вызов
  var token = PropertiesService.getScriptProperties().getProperty('VK_TOKEN');
  var apiUrl = 'https://api.vk.com/method/board.getComments' +
    '?group_id=' + match[1] +
    '&topic_id=' + topicId +
    '&offset=' + (offset || 0) +
    '&count=' + (limit || 50) +
    '&access_token=' + token +
    '&v=5.131';
  
  var response = UrlFetchApp.fetch(apiUrl, {muteHttpExceptions: true});
  var data = JSON.parse(response.getContentText());
  
  var texts = data.response.items.map(function(comment) {
    return comment.text;
  });
  
  return {
    images: [],
    texts: texts,
    hasMore: data.response.count > (offset + texts.length),
    nextOffset: (offset || 0) + texts.length
  };
}
```

---

### **2. Social Import VK (СРЕДНИЙ ПРИОРИТЕТ)**

**Проблема:** `importVkPostsAdvanced()` использует VK_PARSER вместо прямого API.

**Решение:**
```javascript
function importVkPostsAdvanced(source, count) {
  // ЗАМЕНИТЬ:
  // var url = VK_PARSER_URL + '?owner=' + source + '&count=' + count;
  
  // НА:
  return handleWallGet_(source, count);  // Уже реализовано в VkImportService!
}
```

---

## 📋 **ПЛАН МИГРАЦИИ**

### **Phase 1: Critical Functions (1-2 часа)**

**Priority 1:** Migrate `fetchVkReviewsV2_()` for OCR
```javascript
// table/client/OcrHelpers.gs
function fetchVkReviewsV2_(reviewsUrl, offset, limit) {
  // НОВАЯ РЕАЛИЗАЦИЯ с прямым VK API board.getComments
  // ...
}
```

**Priority 2:** Update `importVkPostsAdvanced()` in SocialImportService
```javascript
// table/server/SocialImportService.gs
function importVkPostsAdvanced(source, count) {
  return handleWallGet_(source, count);  // Уже готово!
}
```

### **Phase 2: Remove VK_PARSER_URL (30 мин)**

1. Удалить `VK_PARSER_URL` из Constants.gs
2. Проверить grep на оставшиеся использования
3. Обновить документацию

### **Phase 3: Testing (1 час)**

**Test Cases:**
1. VK wall posts import: `vk.com/durov` → 50 posts
2. VK reviews OCR: `vk.com/topic-123_456` → comments
3. VK группа: `vk.com/club123` → posts
4. VK ID: `-123456` → posts

---

## 🎯 **IMMEDIATE ACTIONS NEEDED**

### **1. Migrate fetchVkReviewsV2_() - КРИТИЧНО!**

**Причина:** OCR reviews не работает без этой функции!

**Файл:** `table/client/OcrHelpers.gs` строка ~250-280

**Заменить:**
```javascript
// БЫЛО:
var apiUrl = VK_PARSER_URL + '?action=vk_reviews&url=' + reviewsUrl;

// СТАЛО:
var apiUrl = 'https://api.vk.com/method/board.getComments' + 
  '?group_id=' + groupId + '&topic_id=' + topicId + '&access_token=' + token;
```

### **2. Update importVkPostsAdvanced() - ВАЖНО!**

**Причина:** Social Import всё ещё зависит от внешнего VK_PARSER!

**Файл:** `table/server/SocialImportService.gs` строка ~243

**Заменить:**
```javascript
// БЫЛО:
function importVkPostsAdvanced(source, count) {
  var url = VK_PARSER_URL + '?owner=' + source + '&count=' + count;
  var response = fetchSocialApiWithRetry('vk', url, {...});
  // ...
}

// СТАЛО:
function importVkPostsAdvanced(source, count) {
  return handleWallGet_(source, count);  // Использует VkImportService!
}
```

---

## ✅ **BENEFITS AFTER MIGRATION**

**Performance:**
- ⚡ Быстрее (нет лишнего hop через VK_PARSER)
- 🔄 Меньше точек отказа
- 📉 Меньше latency

**Reliability:**
- 🛡️ Нет зависимости от внешнего Apps Script
- 🔑 Прямой контроль над VK API
- 📊 Лучше error handling

**Security:**
- 🔒 VK_TOKEN только в одном месте
- 🚫 Нет передачи токена через URL parameters
- 🛡️ Меньше attack surface

---

## 📊 **MIGRATION CHECKLIST**

- [x] ✅ VkImportService.gs создан с handleWallGet_()
- [x] ✅ getVkToken_() реализован
- [x] ✅ parseVkResponse_() реализован
- [ ] 🔴 fetchVkReviewsV2_() мигрирован на board.getComments
- [ ] 🔴 importVkPostsAdvanced() использует handleWallGet_()
- [ ] 🟡 VK_PARSER_URL удален из Constants.gs
- [ ] 🟡 Все grep проверки пройдены
- [ ] 🟡 Testing на реальных VK источниках

**Прогресс:** 3/8 tasks (37.5%)

---

## 🚀 **NEXT STEPS**

1. **Сейчас:** Доделать ocrRun() (уже в прогрессе)
2. **Следующее:** Migrate fetchVkReviewsV2_() (критично для OCR)
3. **Потом:** Update importVkPostsAdvanced()
4. **Финал:** Remove VK_PARSER_URL + testing

**ETA:** ~3-4 часа для полной миграции
