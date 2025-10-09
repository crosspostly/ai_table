# 🔄 Автосинхронизация кода в таблицы на Google Drive

## 🎯 **ЗАДАЧА**

**Требование:**
> Автоматически синхронизировать Apps Script код во все Google Sheets таблицы,  
> находящиеся в определённой папке Google Drive

**Зачем это нужно:**
- ✅ Пользователи создают таблицы из шаблона
- ✅ Все таблицы автоматически получают обновления кода
- ✅ Не нужно вручную обновлять каждую таблицу
- ✅ Централизованное управление версиями

---

## 💡 **ВАРИАНТЫ РЕШЕНИЯ**

### **Вариант 1: Apps Script Library (РЕКОМЕНДУЮ!)**

**Как работает:**
```
1. Публикуешь основной код как Apps Script Library
2. Все таблицы подключают эту библиотеку
3. При обновлении библиотеки - все таблицы получают обновления
4. Пользователи не замечают процесс обновления
```

**Плюсы:**
- ✅ **Google native solution** - официальный способ
- ✅ **Версионирование** - можно откатиться на старую версию
- ✅ **Автоматические обновления** - пользователи получают новый код автоматически
- ✅ **Безопасность** - код остаётся в одном месте
- ✅ **Производительность** - библиотека кэшируется

**Минусы:**
- ⚠️ Немного медленнее (первый вызов ~200-300ms)
- ⚠️ Нужно префиксить вызовы: `MyLib.functionName()`
- ⚠️ Требует настройки во всех таблицах

**Как настроить:**

#### **Шаг 1: Создай Apps Script Library проект**

```javascript
// В отдельном Apps Script проекте (НЕ связанном с таблицей)
// Файл: ServerLibrary.gs

/**
 * @OnlyCurrentDoc
 */

// Экспортируемые функции
var ServerLib = {
  gmImage: serverGMImage_,
  processMarkdown: serverProcessMarkdown_,
  status: handleStatusRequest,
  // ... все серверные функции
};

/**
 * Обработка Gemini Image запроса
 */
function serverGMImage_(images, prompt, options) {
  // ... полная логика из ServerEndpoints.gs
  return result;
}

// ... остальные функции
```

#### **Шаг 2: Публикуй как Library**

1. В Apps Script проекте: **Deploy → New deployment**
2. Type: **Library**
3. Description: "Table AI Bot Server Library v1.0"
4. Access: **Anyone** (или **Anyone with link**)
5. Копируй **Script ID**: `1abc...xyz`

#### **Шаг 3: Подключи в каждую таблицу**

В Apps Script редакторе таблицы:

1. **Resources → Libraries** (или **+ иконка** в новом редакторе)
2. Вставь Script ID: `1abc...xyz`
3. Выбери версию: **Head** (всегда последняя) или конкретную версию
4. Identifier: `ServerLib`
5. Нажми **Add**

#### **Шаг 4: Используй в коде таблицы**

```javascript
// В ThinClient.gs таблицы

function serverGmOcrBatch_(images, prompt, options) {
  // Вместо прямого вызова - используй библиотеку
  return ServerLib.gmImage(images, prompt, options);
}

function serverStatus_() {
  return ServerLib.status();
}
```

#### **Шаг 5: Обновление библиотеки**

```
1. Редактируй код в Library проекте
2. Deploy → Manage deployments
3. Edit → Version: New version
4. Description: "v1.1 - Added feature X"
5. Deploy!

→ Все таблицы с версией "Head" получат обновление автоматически!
```

---

### **Вариант 2: GitHub Actions + Google Drive API**

**Как работает:**
```
1. GitHub Actions триггерится на push
2. Скрипт получает список всех таблиц в папке Drive
3. Для каждой таблицы - обновляет Apps Script код
4. Логирует результаты деплоя
```

**Плюсы:**
- ✅ **Полный контроль** - видно что и куда деплоится
- ✅ **Версионирование** - через Git
- ✅ **CI/CD pipeline** - автоматизация
- ✅ **Rollback** - откат через Git

**Минусы:**
- ⚠️ Сложная настройка
- ⚠️ Требует Google Drive API access
- ⚠️ Долгий деплой (если много таблиц)

**Как настроить:**

#### **Шаг 1: Получи список таблиц в папке**

```javascript
// deploy-to-folder.js

const { google } = require('googleapis');
const fs = require('fs');

const FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID'; // ID папки на Drive

async function getSpreadsheetIds(auth) {
  const drive = google.drive({ version: 'v3', auth });
  
  // Найти все таблицы в папке
  const res = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.spreadsheet'`,
    fields: 'files(id, name)',
    pageSize: 100
  });
  
  return res.data.files;
}

async function deployToAllSheets() {
  const auth = await authenticate();
  const sheets = await getSpreadsheetIds(auth);
  
  console.log(`Found ${sheets.length} spreadsheets in folder`);
  
  for (const sheet of sheets) {
    console.log(`Deploying to: ${sheet.name} (${sheet.id})`);
    await deployToSheet(auth, sheet.id);
  }
  
  console.log('✅ All deployments completed!');
}
```

#### **Шаг 2: Деплой в каждую таблицу**

```javascript
async function deployToSheet(auth, spreadsheetId) {
  const script = google.script({ version: 'v1', auth });
  
  // Получить Script ID из таблицы
  const scriptId = await getScriptIdFromSpreadsheet(auth, spreadsheetId);
  
  if (!scriptId) {
    console.warn(`No script found for ${spreadsheetId}, skipping`);
    return;
  }
  
  // Читаем файлы из репозитория
  const files = [
    { name: 'ThinClient', content: fs.readFileSync('table/client/ThinClient.gs', 'utf8') },
    { name: 'ClientUtilities', content: fs.readFileSync('table/client/ClientUtilities.gs', 'utf8') },
    // ... все клиентские файлы
  ];
  
  // Обновляем код в таблице
  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: files }
  });
  
  console.log(`✅ Deployed to ${spreadsheetId}`);
}
```

#### **Шаг 3: GitHub Actions workflow**

```yaml
# .github/workflows/deploy-to-drive-folder.yml

name: Deploy to Drive Folder

on:
  push:
    branches: [main]
    paths:
      - 'table/client/**'

jobs:
  deploy-folder:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install googleapis@latest
      
      - name: Deploy to all sheets in folder
        env:
          GOOGLE_CREDENTIALS: ${{ secrets.GOOGLE_CREDENTIALS }}
          DRIVE_FOLDER_ID: ${{ secrets.DRIVE_FOLDER_ID }}
        run: node deploy-to-folder.js
```

---

### **Вариант 3: Master Sheet + Installer**

**Как работает:**
```
1. Есть "Master таблица" с актуальным кодом
2. В каждой пользовательской таблице - кнопка "Update from Master"
3. При нажатии - копирует код из Master таблицы
4. Можно сделать автоматическую проверку обновлений
```

**Плюсы:**
- ✅ **Простая реализация** - чистый Apps Script
- ✅ **Контроль пользователя** - он решает когда обновляться
- ✅ **Не требует внешних сервисов**

**Минусы:**
- ⚠️ Нужно нажимать кнопку вручную
- ⚠️ Master таблица должна быть доступна всем

**Как настроить:**

```javascript
// В каждой пользовательской таблице: UpdateManager.gs

var MASTER_SHEET_ID = 'YOUR_MASTER_SHEET_ID';
var CURRENT_VERSION = '1.0.0'; // Хранить в Script Properties

/**
 * Проверка обновлений
 */
function checkForUpdates() {
  var masterSS = SpreadsheetApp.openById(MASTER_SHEET_ID);
  var masterVersion = masterSS.getRangeByName('VERSION').getValue();
  
  if (masterVersion > CURRENT_VERSION) {
    var ui = SpreadsheetApp.getUi();
    var result = ui.alert(
      'Доступна новая версия!',
      'Версия ' + masterVersion + ' доступна. Обновить сейчас?',
      ui.ButtonSet.YES_NO
    );
    
    if (result === ui.Button.YES) {
      installUpdate();
    }
  } else {
    SpreadsheetApp.getUi().alert('У вас последняя версия!');
  }
}

/**
 * Установка обновления
 */
function installUpdate() {
  try {
    // 1. Скачать код из Master таблицы
    var masterSS = SpreadsheetApp.openById(MASTER_SHEET_ID);
    var codeSheet = masterSS.getSheetByName('__CODE__');
    
    if (!codeSheet) {
      throw new Error('Master sheet не содержит лист __CODE__');
    }
    
    var codeData = codeSheet.getDataRange().getValues();
    
    // 2. Распарсить код файлов
    var files = parseCodeFiles(codeData);
    
    // 3. Применить обновления через Apps Script API
    // (Нужен доступ к ScriptApp.getScriptId())
    var scriptId = ScriptApp.getScriptId();
    
    // ... использовать Google Apps Script API для обновления
    
    // 4. Обновить версию
    PropertiesService.getScriptProperties().setProperty('VERSION', 
      masterSS.getRangeByName('VERSION').getValue());
    
    SpreadsheetApp.getUi().alert('✅ Обновление установлено успешно!');
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ошибка обновления: ' + e.message);
  }
}

/**
 * Автоматическая проверка при открытии
 */
function onOpen(e) {
  // Проверять обновления раз в день
  var lastCheck = PropertiesService.getUserProperties().getProperty('LAST_UPDATE_CHECK');
  var now = new Date().getTime();
  
  if (!lastCheck || now - parseInt(lastCheck) > 24 * 60 * 60 * 1000) {
    checkForUpdates();
    PropertiesService.getUserProperties().setProperty('LAST_UPDATE_CHECK', now.toString());
  }
}
```

---

### **Вариант 4: Template + Add-on**

**Как работает:**
```
1. Создаёшь Google Workspace Add-on
2. Пользователи устанавливают Add-on
3. Add-on автоматически обновляется через Google Workspace Marketplace
4. Код всегда актуальный
```

**Плюсы:**
- ✅ **Официальный путь** - как профессиональные продукты
- ✅ **Автоматические обновления** - через Marketplace
- ✅ **OAuth scopes** - правильное управление разрешениями
- ✅ **Монетизация** - можно продавать

**Минусы:**
- ⚠️ Сложная разработка
- ⚠️ Требует публикации в Marketplace
- ⚠️ Процесс review от Google

---

## 🎯 **РЕКОМЕНДАЦИЯ**

### **Для твоего проекта я рекомендую: Вариант 1 (Apps Script Library)**

**Почему:**
1. ✅ **Быстрая реализация** - 1-2 часа работы
2. ✅ **Google native** - официальный способ
3. ✅ **Автообновления** - пользователи получают новый код
4. ✅ **Версионирование** - можно откатить если что-то сломалось
5. ✅ **Совместим с текущим workflow** - GitHub → Library → Tables

### **План внедрения:**

**Фаза 1: Создать Library (1 час)**
1. Создать отдельный Apps Script проект
2. Скопировать серверный код
3. Обернуть в экспортируемый объект
4. Опубликовать как Library

**Фаза 2: Обновить клиентский код (30 мин)**
1. Подключить Library во все таблицы
2. Заменить прямые вызовы на `ServerLib.function()`
3. Тестирование

**Фаза 3: Автоматизация (1 час)**
1. GitHub Actions обновляет Library при push
2. Все таблицы получают обновление автоматически

---

## 📝 **ПРИМЕР АРХИТЕКТУРЫ**

```
GitHub Repository (ai_table)
    ↓ push to main
GitHub Actions (deploy.yml)
    ↓ deploy
Apps Script Library Project (Server Library)
    ↓ version: "Head"
    ↓ подключены как библиотека
Google Sheets Tables (в папке Drive)
    ↓ используют
ServerLib.gmImage()
ServerLib.status()
ServerLib.processMarkdown()
    ...
```

**Преимущества:**
- Single source of truth (Library)
- Автоматические обновления
- Версионирование
- Откат если нужно

---

## 🚀 **ХОЧЕШЬ РЕАЛИЗОВАТЬ?**

**Я могу:**
1. ✅ Создать структуру Apps Script Library
2. ✅ Обернуть существующий серверный код
3. ✅ Обновить GitHub Actions для деплоя в Library
4. ✅ Создать инструкцию по подключению в таблицы
5. ✅ Написать тесты для Library

**Что выбираешь:**
- **A) Apps Script Library** (рекомендую!)
- **B) GitHub Actions + Drive API** (сложнее но гибче)
- **C) Master Sheet + Installer** (проще но ручной процесс)
- **D) Что-то другое?**

**Начинаем? 🚀**
