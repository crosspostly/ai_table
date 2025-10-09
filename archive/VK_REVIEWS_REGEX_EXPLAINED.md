# 🔍 VK_REVIEWS_REGEX - ПОДРОБНОЕ ОБЪЯСНЕНИЕ

## ❓ **ТЫ СПРОСИЛ: "Почему в Script Properties? Я думал это метод запроса VK?"**

**КОРОТКИЙ ОТВЕТ:**  
`getReviewsRegex_()` - это НЕ запрос к VK API!  
Это **regex для ФИЛЬТРАЦИИ** тем обсуждений.

---

## 🎯 **ЧТО ЭТО ТАКОЕ?**

### **Проблема:**
В VK группах есть **обсуждения** (темы на форуме группы).  
Некоторые темы - это **отзывы**, другие - обычные темы.

**Примеры тем:**
- ✅ "Отзывы о работе" - ЭТО отзыв
- ✅ "Reviews and feedback" - ЭТО отзыв
- ✅ "Рейтинг наших услуг" - ЭТО отзыв
- ❌ "Новости компании" - НЕ отзыв
- ❌ "Вопросы и ответы" - НЕ отзыв

**Как отличить?**  
→ По **названию темы**! Ищем ключевые слова.

---

## 📋 **КАК ЭТО РАБОТАЕТ?**

### **Шаг 1: VK API запрос - получаем ВСЕ темы**

```javascript
// Запрос к VK API: board.getTopics
var topicsApi = 'https://api.vk.com/method/board.getTopics'
  + '?group_id=' + groupId
  + '&order=2&count=200'
  + '&access_token=' + token
  + '&v=5.131';

var response = UrlFetchApp.fetch(topicsApi);
var topics = JSON.parse(response).response.items;
```

**Результат:**
```javascript
[
  { id: 123, title: "Отзывы о работе", comments: 45 },
  { id: 124, title: "Новости компании", comments: 12 },
  { id: 125, title: "Reviews and feedback", comments: 67 },
  { id: 126, title: "Вопросы и ответы", comments: 23 }
]
```

### **Шаг 2: getReviewsRegex_() - получаем regex для фильтрации**

```javascript
function getReviewsRegex_() {
  // Пытаемся прочитать из Script Properties
  var customRegex = PropertiesService.getScriptProperties().getProperty('VK_REVIEWS_REGEX');
  
  if (customRegex && customRegex.trim()) {
    return new RegExp(customRegex, 'i'); // Используем кастомный
  }
  
  // Если не задан - используем default
  return /(отзыв|reviews?|feedback|рейтинг|оценк|звезд)/i;
}
```

**Что это значит:**
- Regex: `/(отзыв|reviews?|feedback|рейтинг|оценк|звезд)/i`
- `/` - начало regex
- `(...)` - группа вариантов
- `|` - ИЛИ
- `reviews?` - "review" или "reviews" (? = опционально)
- `i` - регистронезависимо (case-insensitive)

### **Шаг 3: Фильтрация тем по regex**

```javascript
var regex = getReviewsRegex_(); // Получили regex

// Фильтруем только темы с отзывами
topics = topics.filter(function(topic) {
  return regex.test(topic.title); // Проверяем название темы
});
```

**После фильтрации:**
```javascript
[
  { id: 123, title: "Отзывы о работе", comments: 45 },      // ✅ Подходит
  { id: 125, title: "Reviews and feedback", comments: 67 }  // ✅ Подходит
  // "Новости" и "Вопросы" отброшены ❌
]
```

### **Шаг 4: Парсим комментарии ТОЛЬКО из отфильтрованных тем**

```javascript
// Для каждой темы с отзывами - получаем комментарии
for (var i = 0; i < topics.length; i++) {
  var topicId = topics[i].id;
  
  // Запрос комментариев из ЭТОЙ темы
  var commentsApi = 'https://api.vk.com/method/board.getComments'
    + '?group_id=' + groupId
    + '&topic_id=' + topicId
    + '&access_token=' + token;
  
  var comments = UrlFetchApp.fetch(commentsApi);
  // ... собираем тексты отзывов
}
```

---

## 🎯 **ЗАЧЕМ В SCRIPT PROPERTIES?**

### **Причина 1: Настраиваемость**

Разные группы используют **разные названия** для тем с отзывами:
- "Отзывы"
- "Книга жалоб"
- "Обратная связь"
- "Customer feedback"
- "Testimonials"

**Админ может настроить regex под свою группу:**
```javascript
// В Script Properties на сервере:
VK_REVIEWS_REGEX = "(отзыв|book of complaints|обратная связь)"
```

### **Причина 2: Без изменения кода**

Можно менять фильтр **БЕЗ переделывания** кода:
- Добавили новую тему "Благодарности" → обновили regex
- Изменили название темы → обновили regex
- НЕ нужен редеплой!

### **Причина 3: Безопасность**

Regex хранится на **сервере** (не в клиенте):
- Только администратор может менять
- Пользователи не видят логику фильтрации

---

## 📝 **ГДЕ ЭТО ИСПОЛЬЗУЕТСЯ?**

**Файл:** `old/VK_PARSER.txt` (из старой версии)

**Функция:** `handleParseReviews_(e)`

```javascript
function handleParseReviews_(e) {
  var url = e.parameter.url;
  var limit = parseInt(e.parameter.limit || '100', 10);
  var offset = parseInt(e.parameter.offset || '0', 10);
  
  if (!url) return json_({ error: 'Не указан url reviews-страницы' });
  
  var token = getVkToken_();
  var v = '5.131';
  
  // Извлекаем group_id из URL
  var m = String(url).match(/vk\\.com\\/reviews-([0-9]+)/i);
  if (!m) return json_({ error: 'Неверный формат URL reviews-страницы' });
  
  var groupId = parseInt(m[1], 10);

  // ====== ВОТ ЗДЕСЬ ИСПОЛЬЗУЕТСЯ! ======
  var regex = getReviewsRegex_(); // Получаем regex
  
  // 1) Получаем темы обсуждений
  var topicsApi = 'https://api.vk.com/method/board.getTopics'
    + '?group_id=' + groupId
    + '&order=2&count=200'
    + '&access_token=' + token
    + '&v=' + v;
    
  var tRes = UrlFetchApp.fetch(topicsApi);
  var topics = JSON.parse(tRes.getContentText()).response.items;
  
  // 2) ФИЛЬТРУЕМ по regex!
  topics = topics.filter(function(tp) { 
    return regex.test(String(tp.title || '')); // ← ЗДЕСЬ!
  });
  
  if (!topics.length) {
    return json_({ texts: [], hasMore: false, total: 0 });
  }

  // 3) Парсим комментарии только из отфильтрованных тем
  // ...
}
```

---

## 🔧 **КАК НАСТРОИТЬ?**

### **Вариант 1: Использовать default (уже работает)**

Ничего делать не нужно! Default regex покрывает большинство случаев:
```
/(отзыв|reviews?|feedback|рейтинг|оценк|звезд)/i
```

### **Вариант 2: Настроить кастомный regex**

1. Открой Google Apps Script **сервера**
2. Project Settings → Script Properties
3. Добавь:
   ```
   Ключ: VK_REVIEWS_REGEX
   Значение: (отзыв|книга жалоб|благодарности)
   ```

4. Теперь будут фильтроваться темы с этими словами!

---

## 🎯 **ИТОГ**

### **getReviewsRegex_() - это:**
- ✅ **НЕ запрос к VK API**
- ✅ Функция для получения regex
- ✅ Читает из Script Properties (настраиваемо)
- ✅ Возвращает default если не настроено
- ✅ Используется для **ФИЛЬТРАЦИИ** тем обсуждений
- ✅ Помогает найти **ТОЛЬКО темы с отзывами**

### **Полный процесс:**
```
1. VK API: board.getTopics → Все темы группы
2. getReviewsRegex_() → Получили regex
3. topics.filter(regex.test) → Оставили только темы с отзывами
4. VK API: board.getComments → Комментарии из отфильтрованных тем
5. Результат: Тексты отзывов
```

### **Где хранится:**
- ✅ Script Properties **на сервере**
- ✅ НЕ в клиенте
- ✅ Администратор настраивает один раз

---

## 💡 **ПРИМЕРЫ REGEX**

### **Default (русский + английский):**
```regex
/(отзыв|reviews?|feedback|рейтинг|оценк|звезд)/i
```

### **Только русский:**
```regex
/(отзыв|книга жалоб|обратная связь|рейтинг)/i
```

### **Только английский:**
```regex
/(review|feedback|testimonial|rating)/i
```

### **Кастомный (с номерами):**
```regex
/(отзыв|review|тема.*[0-9]+.*отзыв)/i
```

---

**Теперь понятно? 🎯✨**
