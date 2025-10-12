# 🔍 ДИАГНОСТИКА: Почему импорт не работает?

## Из отчета SuperMasterCheck:

```
1. ❌ CLIENT-SERVER Диагностика
   • Результат: 4/8 (50%)
   • ❌ Провалено: 4
```

## Что нашел:

### 1. ✅ Функции на месте:
- `ClientUtilities.gs:103` - `function importVkPosts()` ✅
- `ClientUtilities.gs:829` - `function importSocialPosts()` ✅
- `SocialImportClient.gs:11` - `function importSocialPostsClient()` ✅

### 2. ✅ Меню правильно настроено:
```javascript
Menu.gs:114: .addItem('📱 Импорт постов', 'importVkPosts')
```

### 3. ⚠️ ПОТЕНЦИАЛЬНАЯ ПРОБЛЕМА с кнопкой:
```javascript
AutoButton.gs:16: createButtonInCell(sheet, 'A1', 'Импорт постов', 'importSocialPosts');
// НО!
AutoButton.gs:80: // function importSocialPosts() { ... } ← ЗАКОММЕНТИРОВАНО!
```

## Возможные причины проблемы:

### Причина 1: Порядок загрузки файлов
Google Apps Script загружает файлы в алфавитном порядке:
1. AutoButton.gs - ПЕРВЫЙ
2. ClientUtilities.gs - после
3. ...остальные

Если AutoButton.gs загружается первым и там закомментирована функция, то может быть проблема.

### Причина 2: Проблема с credentials
Из SuperMasterCheck видно что credentials настроены:
```
[1/8] CLIENT credentials ✅ PASS
Email: Sheepoff@gmail.com, Token: есть
```

### Причина 3: Проблема с сервером
Нужно проверить что провалилось в тестах:
- [3/8] Соединение с сервером - ?
- [4/8] VK API - ?
- [5/8] Social Import - ?
- [6/8] Gemini API - ?

## ГЛАВНЫЙ ВОПРОС:
**Какая именно ошибка появляется при попытке импорта?**

## Что нужно проверить:

1. **Откройте Google Sheets**
2. **Попробуйте: Меню → 📱 Импорт постов**
3. **Какая ошибка появляется?**
   - "Функция не найдена"?
   - "Ошибка сервера"?
   - "Настройте credentials"?
   - Другая?

4. **Или попробуйте кнопку в A1 (если есть)**
5. **Какая ошибка?**

## Быстрое решение №1 - Восстановить функцию:

В `AutoButton.gs` раскомментировать:
```javascript
function importSocialPosts() {
  importSocialPostsClient();
}
```

## Быстрое решение №2 - Изменить кнопку:

В `AutoButton.gs` строка 16 изменить:
```javascript
// БЫЛО:
createButtonInCell(sheet, 'A1', 'Импорт постов', 'importSocialPosts');

// СТАЛО:
createButtonInCell(sheet, 'A1', 'Импорт постов', 'importVkPosts');
```

## Быстрое решение №3 - Добавить wrapper:

В начало `AutoButton.gs` добавить:
```javascript
function importSocialPosts() {
  // Wrapper для кнопки - вызывает основную функцию
  if (typeof importSocialPostsClient === 'function') {
    importSocialPostsClient();
  } else {
    SpreadsheetApp.getUi().alert('Ошибка', 'Функция importSocialPostsClient не найдена', SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
```