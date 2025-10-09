# Server Script Properties Required

## 🔐 **ОБЯЗАТЕЛЬНЫЕ ПАРАМЕТРЫ (Script Properties на СЕРВЕРЕ)**

### **1. VK_TOKEN**
- **Тип**: String
- **Источник**: VK API Access Token
- **Права**: `wall`, `groups`, `photos`, `board` (wall.get, photos.get, board.getComments, board.getTopics)
- **Где получить**: https://vk.com/dev (создать Standalone приложение → получить токен с правами)
- **Используется в**:
  - `table/server/VkImportService.gs` → `getVkToken_()`
  - `handleWallGet_()` - импорт постов
  - `handleParseAlbum_()` - парсинг фотоальбомов
  - `handleParseDiscussion_()` - парсинг обсуждений
  - `handleParseReviews_()` - парсинг отзывов

### **2. VK_REVIEWS_REGEX** (опционально)
- **Тип**: String (regex pattern)
- **Default**: `/(отзыв|reviews?|feedback|рейтинг|оценк|звезд)/i`
- **Используется**: для фильтрации тем обсуждений при парсинге отзывов VK

---

## ℹ️ **ПАРАМЕТРЫ БЕЗ ТОКЕНОВ**

### **Instagram**
- **НЕТ токена!** ✅
- Использует **хардкод** `X-IG-App-ID: '936619743392459'`
- Публичный Web App ID от Instagram
- **Файл**: `table/server/SocialImportService.gs` → `importInstagramPosts()`

### **Telegram**
- **НЕТ токена!** ✅
- Использует публичные RSS фиды через `https://rsshub.app/telegram/channel/`
- **Файл**: `table/server/SocialImportService.gs` → `importTelegramPosts()`

---

## 📝 **КАК НАСТРОИТЬ**

1. Откройте Google Apps Script сервера
2. Project Settings → Script Properties
3. Добавьте:
   ```
   VK_TOKEN = ваш_vk_access_token_с_правами
   ```
4. Опционально:
   ```
   VK_REVIEWS_REGEX = ваш_regex_для_фильтрации
   ```

---

## 🔍 **ПРОВЕРКА**

Запустите в server project:
```javascript
function testVkToken() {
  var token = PropertiesService.getScriptProperties().getProperty('VK_TOKEN');
  Logger.log('VK_TOKEN exists: ' + !!token);
  Logger.log('VK_TOKEN preview: ' + (token ? token.substring(0, 10) + '...' : 'NOT SET'));
}
```
