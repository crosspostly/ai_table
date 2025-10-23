# 🔐 Руководство по системе авторизации

Полное руководство по работе с системой автоматического управления авторизацией в AI_TABLE.

## 📋 Содержание

1. [Обзор](#обзор)
2. [Быстрый старт](#быстрый-старт)
3. [Функции для пользователей](#функции-для-пользователей)
4. [Функции для разработчиков](#функции-для-разработчиков)
5. [Решение проблем](#решение-проблем)

---

## Обзор

Система авторизации автоматически:
- ✅ Проверяет все необходимые OAuth разрешения
- 🚀 Запускает процесс авторизации при ошибках
- 🎨 Предоставляет красивый UI для управления
- 📊 Показывает детальный статус разрешений
- 🧪 Тестирует все компоненты авторизации

### Необходимые OAuth Scopes

```javascript
- https://www.googleapis.com/auth/spreadsheets
- https://www.googleapis.com/auth/script.external_request
- https://www.googleapis.com/auth/script.container.ui
- https://www.googleapis.com/auth/script.scriptapp
- https://www.googleapis.com/auth/userinfo.email
```

---

## Быстрый старт

### Для пользователей

1. **При первой ошибке "insufficient permissions":**
   - Откройте меню: `🤖 Table AI` → `⚙️ Настройки` → `🔐 Управление авторизацией`
   - Нажмите кнопку `🚀 Авторизовать`
   - Следуйте инструкциям на экране

2. **Проверка статуса:**
   ```
   Меню → ⚙️ Настройки → 🔐 Управление авторизацией
   ```

3. **Тестирование:**
   ```
   Меню → ⚙️ Настройки → 🧪 Тест авторизации
   ```

### Автоматический процесс авторизации

При возникновении ошибки авторизации:

1. **Нажмите "Просмотреть разрешения"**
2. **Выберите "Дополнительные настройки"**
3. **Нажмите "Перейти на страницу (небезопасно)"**
   - ⚠️ Это безопасно! Скрипт работает только с вашими данными
4. **Нажмите "Разрешить"**

---

## Функции для пользователей

### 🔐 Управление авторизацией

Открывает красивый HTML интерфейс с:
- Текущим статусом всех разрешений
- Кнопкой запуска авторизации
- Встроенным тестированием
- Детальной инструкцией

```
Меню → ⚙️ Настройки → 🔐 Управление авторизацией
```

### 🚀 Запустить авторизацию

Немедленно запускает процесс авторизации с пошаговыми инструкциями.

```
Меню → ⚙️ Настройки → 🚀 Запустить авторизацию
```

### 🧪 Тест авторизации

Проверяет все компоненты:
- Email пользователя
- Доступ к таблице
- Script App разрешения
- Properties доступ

```
Меню → ⚙️ Настройки → 🧪 Тест авторизации
```

---

## Функции для разработчиков

### checkAuthorizationStatus()

Проверяет текущий статус всех разрешений.

```javascript
var status = checkAuthorizationStatus();

// Возвращает объект:
{
  authorized: true/false,           // Общий статус
  needsAuthorization: true/false,   // Требуется ли авторизация
  userEmail: "user@example.com",    // Email пользователя
  spreadsheetAccess: true/false,    // Доступ к таблицам
  urlFetchAccess: true/false,       // Доступ к внешним запросам
  errors: [],                       // Список ошибок
  missingScopes: [],                // Отсутствующие разрешения
  availableScopes: []               // Доступные разрешения
}
```

### initiateAuthorizationFlow()

Запускает процесс авторизации с UI инструкциями.

```javascript
var success = initiateAuthorizationFlow();
if (success) {
  Logger.log('Авторизация успешна!');
} else {
  Logger.log('Требуется ручная авторизация');
}
```

### autoCheckAndAuthorize()

Автоматически проверяет и авторизует при необходимости.

```javascript
if (autoCheckAndAuthorize()) {
  // Авторизация в порядке, продолжаем работу
  var email = Session.getActiveUser().getEmail();
} else {
  // Требуется ручное вмешательство
  Logger.log('Не удалось автоматически авторизовать');
}
```

### withAuthorization(func, context, args)

Wrapper для функций, требующих авторизацию. Автоматически обрабатывает ошибки.

```javascript
// Пример 1: Простая функция
var email = withAuthorization(function() {
  return Session.getActiveUser().getEmail();
});

// Пример 2: Функция с аргументами
var result = withAuthorization(
  function(arg1, arg2) {
    return someProtectedFunction(arg1, arg2);
  },
  this,
  ['value1', 'value2']
);

// Пример 3: С контекстом
var obj = {
  data: 'test',
  getData: function() {
    return this.data;
  }
};

var data = withAuthorization(obj.getData, obj);
```

### safeExecute(func, defaultValue)

Безопасное выполнение с автообработкой ошибок и значением по умолчанию.

```javascript
// Возвращает email или 'unknown' при ошибке
var email = safeExecute(
  function() {
    return Session.getActiveUser().getEmail();
  },
  'unknown'
);

// Использование в логировании
var userId = safeExecute(
  function() {
    return Session.getActiveUser().getEmail();
  },
  'anonymous'
);

Logger.log('User: ' + userId);
```

### isAuthorizationError(error)

Проверяет, является ли ошибка проблемой авторизации.

```javascript
try {
  var email = Session.getActiveUser().getEmail();
} catch (error) {
  if (isAuthorizationError(error)) {
    // Это ошибка авторизации
    initiateAuthorizationFlow();
  } else {
    // Другая ошибка
    Logger.log('Unexpected error: ' + error.message);
  }
}
```

### testAuthorization()

Выполняет полный тест всех компонентов авторизации.

```javascript
var passed = testAuthorization();
if (passed) {
  Logger.log('Все тесты пройдены!');
} else {
  Logger.log('Некоторые тесты не прошли');
}
```

---

## Примеры использования

### Пример 1: Защита функции логирования

```javascript
function logUserAction(action) {
  var email = safeExecute(
    function() {
      return Session.getActiveUser().getEmail();
    },
    'unknown'
  );
  
  Logger.log('[' + email + '] ' + action);
}
```

### Пример 2: Безопасный доступ к данным

```javascript
function getSheetData() {
  return withAuthorization(function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    return sheet.getDataRange().getValues();
  });
}
```

### Пример 3: Обработка ошибок авторизации

```javascript
function processData() {
  try {
    var data = getProtectedData();
    // Обработка данных
  } catch (error) {
    if (isAuthorizationError(error)) {
      Logger.log('Требуется авторизация');
      var success = initiateAuthorizationFlow();
      if (success) {
        // Повторяем попытку
        return processData();
      }
    } else {
      throw error;
    }
  }
}
```

### Пример 4: Проверка перед выполнением

```javascript
function criticalOperation() {
  var status = checkAuthorizationStatus();
  
  if (!status.authorized) {
    Logger.log('Ошибки авторизации: ' + status.errors.join(', '));
    initiateAuthorizationFlow();
    return;
  }
  
  // Выполняем критичную операцию
  var email = Session.getActiveUser().getEmail();
  Logger.log('Операция выполнена от имени: ' + email);
}
```

---

## Решение проблем

### Ошибка: "insufficient permissions"

**Решение:**
1. Откройте `⚙️ Настройки` → `🔐 Управление авторизацией`
2. Нажмите `🚀 Авторизовать`
3. Следуйте инструкциям

### Диалог авторизации не появляется

**Решение:**
1. Проверьте, разрешены ли всплывающие окна
2. Попробуйте выполнить любую функцию из меню
3. Используйте `🧪 Тест авторизации` для диагностики

### Email пользователя возвращает "unknown"

**Причина:** Отсутствует OAuth scope `userinfo.email`

**Решение:**
1. Проверьте `appsscript.json` - должен содержать:
   ```json
   "https://www.googleapis.com/auth/userinfo.email"
   ```
2. Пересоздайте авторизацию через меню

### Ошибка при открытии HTML диалога

**Решение:**
1. Убедитесь, что файл `table/web/AuthorizationDialog.html` существует
2. Проверьте права на выполнение скриптов
3. Используйте текстовый вариант: `🚀 Запустить авторизацию`

---

## Интеграция в существующий код

### Глобальная обработка ошибок

```javascript
// В начале вашего скрипта
function globalErrorHandler(error) {
  if (isAuthorizationError(error)) {
    autoCheckAndAuthorize();
    return true; // Ошибка обработана
  }
  return false; // Другая ошибка
}

// Использование
try {
  // Ваш код
} catch (error) {
  if (!globalErrorHandler(error)) {
    throw error;
  }
}
```

### Автоматическая проверка при старте

```javascript
function onOpen() {
  // Тихая проверка авторизации
  if (typeof checkAuthorizationStatus === 'function') {
    var status = checkAuthorizationStatus();
    if (!status.authorized) {
      Logger.log('⚠️ Требуется авторизация: ' + status.errors.join(', '));
    }
  }
  
  // Создание меню и т.д.
}
```

---

## API Reference

### Основные функции

| Функция | Описание | Возвращает |
|---------|----------|------------|
| `checkAuthorizationStatus()` | Проверка статуса | Object |
| `initiateAuthorizationFlow()` | Запуск авторизации | Boolean |
| `autoCheckAndAuthorize()` | Авто-проверка и авторизация | Boolean |
| `testAuthorization()` | Тест всех компонентов | Boolean |
| `showAuthorizationStatus()` | Показать UI статуса | void |
| `openAuthorizationDialog()` | Открыть HTML диалог | void |

### Вспомогательные функции

| Функция | Описание | Возвращает |
|---------|----------|------------|
| `withAuthorization(func, context, args)` | Wrapper с авто-авторизацией | Any |
| `safeExecute(func, defaultValue)` | Безопасное выполнение | Any |
| `isAuthorizationError(error)` | Проверка типа ошибки | Boolean |
| `triggerAuthorizationDialog_()` | Триггер диалога (internal) | Boolean |

---

## Логирование

Все операции авторизации логируются в систему:

```javascript
// Успешная авторизация
addSystemLog('Authorization successful', 'INFO', 'AUTH');

// Ошибка авторизации
addSystemLog('Authorization error: ' + error.message, 'ERROR', 'AUTH');

// Предупреждение
addSystemLog('Auto-detected authorization issue', 'WARN', 'AUTH');
```

Просмотр логов:
```
Меню → 🧰 DEV → 📋 Показать все логи
```

---

## Безопасность

### Какие данные доступны скрипту?

Скрипт работает **только с вашими данными**:
- ✅ Email текущего пользователя
- ✅ Данные в текущей таблице
- ✅ Настройки скрипта (PropertiesService)
- ❌ Никакие другие данные Google аккаунта

### Почему Google показывает "небезопасно"?

Google показывает это предупреждение для **всех** непроверенных скриптов. Это не означает, что скрипт опасен - это означает, что он не прошел официальную проверку Google (которая стоит $75,000+ в год).

### Можно ли доверять?

- ✅ Весь код открыт - вы можете его проверить
- ✅ Скрипт работает в вашем Google Apps Script окружении
- ✅ Никакие данные не отправляются на сторонние серверы
- ✅ Вы полностью контролируете код

---

## Поддержка

Если у вас возникли проблемы:

1. **Проверьте логи:**
   ```
   Меню → 🧰 DEV → 📋 Показать все логи
   ```

2. **Запустите тест:**
   ```
   Меню → ⚙️ Настройки → 🧪 Тест авторизации
   ```

3. **Посмотрите статус:**
   ```
   Меню → ⚙️ Настройки → 🔐 Управление авторизацией
   ```

4. **Документация:**
   - [INSTALLATION.md](./INSTALLATION.md)
   - [QUICK_START.md](./QUICK_START.md)

---

**Версия:** 2.1.0  
**Последнее обновление:** 2025-10-23
