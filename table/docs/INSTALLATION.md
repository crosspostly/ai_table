# 🚀 Полная Инструкция по Установке AI Table Bot

## 📋 **ОБЗОР**

Эта инструкция поможет вам установить и запустить **AI Table Bot** - систему для автоматического импорта постов из социальных сетей (Instagram, VK, Telegram) в Google Sheets с последующим анализом через AI.

**Время установки:** 15-30 минут  
**Сложность:** Средняя  
**Требования:** Google аккаунт, базовые навыки работы с Google Sheets

---

## ✅ **ШАГ 1: ПОДГОТОВКА GOOGLE SHEETS**

### 1.1 Создайте новую таблицу
1. Откройте [Google Sheets](https://sheets.google.com)
2. Нажмите **"Создать"** (пустая таблица)
3. Назовите таблицу: `"AI Table Bot"` или любое другое имя

### 1.2 Создайте лист "Параметры"
1. В нижней части экрана нажмите **"+"** для создания нового листа
2. Переименуйте лист в `"Параметры"`
3. Заполните лист следующим образом:

| A | B | C |
|---|---|---|
| **Источник:** | https://instagram.com/nasa | instagram |
| **Количество:** | 20 |  |
| **Анализ:** | да |  |

**Где:**
- **B1** - URL или username источника
- **B2** - количество постов для импорта (1-100)
- **C1** - платформа (instagram/vk/telegram) - необязательно для полных ссылок

---

## ⚙️ **ШАГ 2: НАСТРОЙКА GOOGLE APPS SCRIPT**

### 2.1 Откройте редактор кода
1. В вашей Google Sheets таблице нажмите **Extensions** → **Apps Script**
2. Откроется редактор Google Apps Script
3. Удалите код по умолчанию (`function myFunction() {...}`)

### 2.2 Структура проекта
Вам нужно будет создать следующие файлы:

```
📁 Apps Script Project
├── 📄 SocialImportService.gs     (ГЛАВНЫЙ)
├── 📄 ValidationService.gs       (БЕЗОПАСНОСТЬ)
├── 📄 RetryService.gs            (НАДЁЖНОСТЬ)  
├── 📄 ErrorHandlingService.gs    (ОШИБКИ)
├── 📄 TableLicenseService.gs     (ЛИЦЕНЗИРОВАНИЕ)
├── 📄 TelegramImportService.gs   (TELEGRAM)
├── 📄 SystemCheck.gs             (ТЕСТИРОВАНИЕ)
└── 📄 Menu.gs                    (МЕНЮ)
```

---

## 📂 **ШАГ 3: КОПИРОВАНИЕ ФАЙЛОВ**

### 3.1 Основные серверные файлы

**Создайте файл: `SocialImportService.gs`**
1. В Apps Script нажмите **"+"** → **"Script"**
2. Назовите файл `SocialImportService`
3. Скопируйте содержимое из `table/server/SocialImportService.gs`

**Создайте файл: `ValidationService.gs`**
1. Создайте новый скрипт: `ValidationService`
2. Скопируйте содержимое из `table/server/ValidationService.gs`

**Создайте файл: `RetryService.gs`**
1. Создайте новый скрипт: `RetryService`  
2. Скопируйте содержимое из `table/server/RetryService.gs`

**Создайте файл: `ErrorHandlingService.gs`**
1. Создайте новый скрипт: `ErrorHandlingService`
2. Скопируйте содержимое из `table/server/ErrorHandlingService.gs`

### 3.2 Дополнительные сервисы

**Создайте файл: `TableLicenseService.gs`**
1. Создайте новый скрипт: `TableLicenseService`
2. Скопируйте содержимое из `table/server/TableLicenseService.gs`

**Создайте файл: `TelegramImportService.gs`**  
1. Создайте новый скрипт: `TelegramImportService`
2. Скопируйте содержимое из `table/server/TelegramImportService.gs`

### 3.3 Тестирование и интерфейс

**Создайте файл: `SystemCheck.gs`**
1. Создайте новый скрипт: `SystemCheck`
2. Скопируйте содержимое из `table/tests/SystemCheck.gs`

**Создайте файл: `Menu.gs` (опционально)**
1. Создайте новый скрипт: `Menu`
2. Скопируйте содержимое из подходящего Menu файла

### 3.4 Сохранение проекта
1. Нажмите **Ctrl+S** или **File** → **Save**
2. Дайте проекту имя: `"AI Table Bot"`
3. Подождите пока все файлы сохранятся

---

## 🧪 **ШАГ 4: ТЕСТИРОВАНИЕ УСТАНОВКИ**

### 4.1 Базовая проверка системы
1. В Apps Script выберите файл `SystemCheck.gs`
2. В выпадающем списке функций выберите `runSystemDiagnostic`
3. Нажмите кнопку **▶ Run**
4. При первом запуске появится запрос разрешений - нажмите **"Review permissions"**
5. Выберите ваш Google аккаунт → **"Allow"**

### 4.2 Просмотр результатов
1. Нажмите **View** → **Logs** (или Ctrl+Enter)
2. Вы должны увидеть:

```
⚡ Starting System Diagnostic...

--- Critical Functions ---
✅ importSocialPosts - OK
✅ validateAndSanitizeInputs - OK  
✅ parseSource - OK
✅ createUserFriendlyError - OK

--- URL Parsing ---
✅ https://www.instagram.com/nasa → instagram
✅ https://t.me/durov → telegram
✅ https://vk.com/durov → vk

--- Input Validation ---  
✅ Valid input accepted
✅ XSS properly blocked

--- Error Handling ---
✅ User-friendly errors work

🎯 VERDICT: ✅ ALL SYSTEMS OPERATIONAL
   System ready for full testing!
```

### 4.3 Если есть ошибки
- **"Function not found"** → проверьте, что все файлы скопированы
- **"Permission denied"** → предоставьте разрешения приложению
- **"Syntax error"** → проверьте, что код скопирован полностью

---

## 🎯 **ШАГ 5: ПЕРВЫЙ ТЕСТ ИМПОРТА**

### 5.1 Настройте параметры
В листе "Параметры" установите:
- **B1**: `https://instagram.com/nasa` (публичный аккаунт)
- **B2**: `5` (небольшое количество для теста)
- **C1**: `instagram` (опционально)

### 5.2 Запустите импорт
1. В Apps Script выберите файл `SocialImportService.gs`
2. Выберите функцию `importSocialPosts`  
3. Нажмите **▶ Run**
4. Дождитесь завершения (может занять 30-60 секунд)

### 5.3 Проверьте результаты
1. Вернитесь в Google Sheets
2. Должен появиться новый лист `"посты"`
3. В нем должны быть импортированные посты:
   - Колонка A: Платформа (INSTAGRAM)
   - Колонка B: Дата
   - Колонка C: Ссылка на пост
   - Колонка D: Текст поста
   - И т.д.

---

## 🎨 **ШАГ 6: НАСТРОЙКА МЕНЮ (ОПЦИОНАЛЬНО)**

### 6.1 Добавьте пользовательское меню
Если вы создали файл `Menu.gs`, добавьте в него:

```javascript
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🤖 AI Table Bot')
    .addItem('📥 Импорт постов', 'importSocialPosts')
    .addItem('🔍 Диагностика системы', 'runSystemDiagnostic')
    .addItem('🧪 Быстрый тест', 'quickHealthCheck')
    .addSeparator()
    .addItem('📚 Справка', 'showHelp')
    .addToUi();
}

function showHelp() {
  var html = HtmlService.createHtmlOutput(`
    <h2>🤖 AI Table Bot - Справка</h2>
    <h3>Поддерживаемые форматы:</h3>
    <ul>
      <li><strong>Instagram:</strong> https://instagram.com/username</li>
      <li><strong>Telegram:</strong> https://t.me/channel</li>
      <li><strong>VK:</strong> https://vk.com/username</li>
    </ul>
    <h3>Параметры в листе "Параметры":</h3>
    <ul>
      <li><strong>B1:</strong> URL или username</li>
      <li><strong>B2:</strong> Количество постов (1-100)</li>
      <li><strong>C1:</strong> Платформа (опционально)</li>
    </ul>
  `).setWidth(400).setHeight(300);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Справка AI Table Bot');
}
```

### 6.2 Перезагрузите таблицу
1. Сохраните проект в Apps Script
2. Вернитесь в Google Sheets
3. Обновите страницу (F5)
4. В меню должен появиться пункт **"🤖 AI Table Bot"**

---

## 🔧 **ШАГ 7: ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ**

### 7.1 Настройка VK (опционально)
Для импорта VK постов нужен внешний парсер. В файле `SocialImportService.gs` найдите:
```javascript
var VK_PARSER_URL = 'YOUR_VK_PARSER_URL';
```
И замените на URL вашего VK парсера.

### 7.2 Настройка лимитов
В файлах сервисов можете изменить:
- Количество повторных попыток
- Задержки между запросами  
- Максимальное количество постов

### 7.3 Настройка логирования
Для отслеживания работы системы добавьте:
```javascript
// В любой функции
addSystemLog('Ваше сообщение', 'INFO', 'TAG');
```

---

## ⚠️ **TROUBLESHOOTING - РЕШЕНИЕ ПРОБЛЕМ**

### 🚨 **Частые ошибки и решения**

**❌ "Function importSocialPosts not found"**
- **Причина:** Не скопирован файл `SocialImportService.gs`
- **Решение:** Создайте файл и скопируйте весь код

**❌ "Лист 'Параметры' не найден"**
- **Причина:** Не создан лист с параметрами  
- **Решение:** Создайте лист "Параметры" с правильными данными

**❌ "Instagram API недоступен"**
- **Причина:** Instagram блокирует частые запросы
- **Решение:** Подождите 1-2 часа или используйте другой аккаунт

**❌ "Permission denied"**  
- **Причина:** Не предоставлены разрешения приложению
- **Решение:** При запуске нажмите "Review permissions" → "Allow"

**❌ "Syntax error"**
- **Причина:** Код скопирован не полностью
- **Решение:** Убедитесь, что скопирован весь файл от начала до конца

### 🔍 **Диагностические команды**

```javascript
// Проверка основных функций
runSystemDiagnostic()

// Быстрая проверка
quickHealthCheck()

// Тест URL парсинга
testUrlParsingOnly()

// Тест базовых функций
testBasicFunctionsOnly()
```

### 📞 **Поддержка**

Если проблема не решается:
1. Запустите `runSystemDiagnostic()` и сохраните логи
2. Проверьте, что все файлы созданы правильно
3. Убедитесь, что лист "Параметры" заполнен корректно

---

## 🎉 **ПОЗДРАВЛЯЕМ!**

Если всё прошло успешно, у вас теперь есть:
- ✅ Рабочий AI Table Bot
- ✅ Автоматический импорт из Instagram, VK, Telegram  
- ✅ Система валидации и безопасности
- ✅ Обработка ошибок и повторные попытки
- ✅ Лицензирование по table_id
- ✅ Комплексная система тестирования

**Следующие шаги:**
1. Протестируйте с разными источниками
2. Настройте анализ постов через AI
3. Изучите дополнительные возможности в документации

**Приятного использования! 🚀**