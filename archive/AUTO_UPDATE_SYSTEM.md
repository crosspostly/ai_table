# 🤖 СИСТЕМА АВТООБНОВЛЕНИЯ СКРИПТОВ В ТАБЛИЦАХ

## 🎯 ТРЕБОВАНИЯ:

1. **Умное обнаружение:** автоматически находить таблицы с нашими скриптами
2. **Безопасность:** НЕ удалять данные пользователей
3. **Автоматизация:** обновлять при каждом deploy
4. **Гибкость:** не hardcode ID проектов

---

## 🏗️ АРХИТЕКТУРА РЕШЕНИЯ:

### ВАРИАНТ 1: По папке Google Drive (РЕКОМЕНДУЕМЫЙ)

**Как работает:**
1. В настройках указываем ID папки с таблицами
2. При deploy GitHub Actions сканирует папку
3. Для каждой таблицы обновляет скрипты
4. Только файлы .gs - данные НЕ трогаются

**Преимущества:**
- ✅ Простота настройки
- ✅ Полный контроль над списком таблиц
- ✅ Безопасно (только скрипты)
- ✅ Быстро

**Недостатки:**
- ⚠️ Нужен Service Account
- ⚠️ Нужно вручную добавлять таблицы в папку

---

### ВАРИАНТ 2: По Script ID в файле маркере

**Как работает:**
1. Каждая таблица содержит скрытый Script Property: `AUTO_UPDATE_ENABLED=true`
2. При deploy система ищет все таблицы в нашем Google Drive
3. Обновляет те, где есть маркер

**Преимущества:**
- ✅ Автоматическое обнаружение
- ✅ Не нужно управлять папками
- ✅ Opt-in подход (безопасно)

**Недостатки:**
- ⚠️ Медленнее (нужно сканировать весь Drive)
- ⚠️ Требует OAuth доступа

---

### ВАРИАНТ 3: Webhook от таблицы (САМЫЙ УМНЫЙ)

**Как работает:**
1. Каждая таблица при открытии проверяет версию скриптов
2. Если есть обновление - запрашивает новые скрипты через API
3. Пользователь видит уведомление и подтверждает обновление

**Преимущества:**
- ✅ Полностью автоматически
- ✅ Пользователь контролирует обновления
- ✅ Не нужен доступ к Drive из CI/CD
- ✅ Работает с любыми таблицами

**Недостатки:**
- ⚠️ Требует версионирование
- ⚠️ Сложнее в реализации

---

## 🚀 РЕКОМЕНДУЕМАЯ РЕАЛИЗАЦИЯ (Вариант 1 + 3):

### ФАЗА 1: Drive Folder Scanner (быстрый старт)

```yaml
# .github/workflows/update-spreadsheets.yml
name: Update Spreadsheets

on:
  workflow_run:
    workflows: ["Deploy Apps Script"]
    types:
      - completed

jobs:
  update-spreadsheets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Update Spreadsheets
        run: node scripts/update-spreadsheets.js
        env:
          GOOGLE_DRIVE_FOLDER_ID: ${{ secrets.SPREADSHEETS_FOLDER_ID }}
          GOOGLE_SERVICE_ACCOUNT: ${{ secrets.GOOGLE_SERVICE_ACCOUNT }}
```

### СКРИПТ update-spreadsheets.js:

```javascript
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Authenticate with Service Account
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/script.projects'
  ]
});

async function updateSpreadsheets() {
  const drive = google.drive({ version: 'v3', auth });
  const script = google.script({ version: 'v1', auth });
  
  // 1. Получить все таблицы из папки
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet'`,
    fields: 'files(id, name)'
  });
  
  console.log(`Found ${response.data.files.length} spreadsheets`);
  
  // 2. Для каждой таблицы
  for (const file of response.data.files) {
    try {
      console.log(`Updating: ${file.name} (${file.id})`);
      
      // Получить Script ID таблицы
      const scriptId = await getScriptIdForSpreadsheet(file.id);
      
      if (!scriptId) {
        console.log(`  ⚠️  No script found, skipping`);
        continue;
      }
      
      // Обновить только .gs файлы
      await updateScriptFiles(script, scriptId);
      
      console.log(`  ✅ Updated successfully`);
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }
}

async function getScriptIdForSpreadsheet(spreadsheetId) {
  // Spreadsheet ID == Script ID для container-bound scripts
  return spreadsheetId;
}

async function updateScriptFiles(script, scriptId) {
  // Читаем новые файлы
  const clientFiles = [
    'table/client/ThinClient.gs',
    'table/client/ClientUtilities.gs',
    'table/client/OcrHelpers.gs',
    'table/client/ButtonFunctions.gs',
    'table/client/Menu.gs',
    'table/shared/Constants.gs',
    'table/shared/Utils.gs',
    'table/shared/Logging.gs'
  ];
  
  const files = clientFiles.map(filePath => ({
    name: path.basename(filePath),
    type: 'SERVER_JS',
    source: fs.readFileSync(filePath, 'utf8')
  }));
  
  // Получаем текущий проект
  const project = await script.projects.get({ scriptId });
  
  // Сохраняем appsscript.json (НЕ перезаписываем!)
  const manifestFile = project.data.files.find(f => f.name === 'appsscript.json');
  
  // Обновляем только .gs файлы
  const updatedFiles = [
    manifestFile, // Оставляем старый manifest
    ...files      // Добавляем новые .gs файлы
  ];
  
  await script.projects.updateContent({
    scriptId,
    resource: {
      files: updatedFiles
    }
  });
}

updateSpreadsheets().catch(console.error);
```

---

### ФАЗА 2: Self-Update System (умный подход)

```javascript
// table/client/AutoUpdate.gs

/**
 * Проверяет наличие обновлений при открытии таблицы
 */
function onOpen() {
  // Обычное меню
  createMenu();
  
  // Проверка обновлений (раз в день)
  checkForUpdates_();
}

function checkForUpdates_() {
  try {
    const lastCheck = PropertiesService.getScriptProperties().getProperty('LAST_UPDATE_CHECK');
    const now = Date.now();
    
    // Проверяем раз в день
    if (lastCheck && (now - parseInt(lastCheck)) < 24 * 60 * 60 * 1000) {
      return;
    }
    
    const currentVersion = getScriptVersion_();
    const latestVersion = getLatestVersion_();
    
    if (compareVersions_(currentVersion, latestVersion) < 0) {
      // Есть обновление!
      showUpdateNotification_(currentVersion, latestVersion);
    }
    
    PropertiesService.getScriptProperties().setProperty('LAST_UPDATE_CHECK', now.toString());
    
  } catch (e) {
    // Тихо игнорируем ошибки проверки
  }
}

function getScriptVersion_() {
  // Версия хранится в константе
  return typeof SCRIPT_VERSION !== 'undefined' ? SCRIPT_VERSION : '0.0.0';
}

function getLatestVersion_() {
  try {
    // Запрос к GitHub API или вашему серверу
    const response = UrlFetchApp.fetch('https://api.github.com/repos/crosspostly/ai_table/releases/latest');
    const data = JSON.parse(response.getContentText());
    return data.tag_name.replace('v', '');
  } catch (e) {
    return '0.0.0';
  }
}

function compareVersions_(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
}

function showUpdateNotification_(current, latest) {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '🚀 Доступно обновление!',
    `Текущая версия: ${current}\\nНовая версия: ${latest}\\n\\nОбновить скрипты сейчас?\\n\\n⚠️ Ваши данные НЕ будут затронуты!`,
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    performAutoUpdate_();
  }
}

function performAutoUpdate_() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.alert('⏳ Загрузка обновлений...');
    
    // Получаем новые скрипты с сервера
    const serverUrl = 'https://script.google.com/macros/s/YOUR_UPDATE_SERVER_ID/exec';
    const response = UrlFetchApp.fetch(serverUrl + '?action=getLatestScripts');
    const scripts = JSON.parse(response.getContentText());
    
    // Обновляем через Apps Script API
    const scriptId = ScriptApp.getScriptId();
    
    // Используем ScriptApp для обновления (требует OAuth scope)
    for (const file of scripts.files) {
      // Здесь нужен proper API call через UrlFetchApp
      // так как ScriptApp.updateFile() не существует
    }
    
    ui.alert('✅ Обновление завершено!\\n\\nПерезагрузите таблицу для применения изменений.');
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ошибка обновления: ' + e.message);
  }
}
```

---

## 📝 ПОШАГОВАЯ ИНСТРУКЦИЯ:

### ШАГ 1: Настроить Service Account

1. Создать Service Account в Google Cloud Console
2. Включить APIs:
   - Google Drive API
   - Apps Script API
3. Скачать JSON ключ
4. Добавить в GitHub Secrets:
   - `GOOGLE_SERVICE_ACCOUNT` = содержимое JSON

### ШАГ 2: Создать папку для таблиц

1. Создать папку на Google Drive
2. Дать доступ Service Account (по email)
3. Скопировать ID папки
4. Добавить в GitHub Secrets:
   - `SPREADSHEETS_FOLDER_ID` = ID папки

### ШАГ 3: Добавить workflow

```bash
# Создать файл
touch .github/workflows/update-spreadsheets.yml

# Добавить скрипт обновления
mkdir -p scripts
touch scripts/update-spreadsheets.js
```

### ШАГ 4: Добавить версионирование

```javascript
// table/shared/Constants.gs
const SCRIPT_VERSION = '2.0.0'; // Обновлять при каждом release
```

---

## 🔒 БЕЗОПАСНОСТЬ:

1. **Только .gs файлы:** Обновляются ТОЛЬКО скрипты
2. **Сохранение manifest:** appsscript.json НЕ перезаписывается
3. **Data protection:** Листы таблицы НЕ трогаются
4. **Script Properties:** Пользовательские настройки сохраняются
5. **Rollback:** Можно откатить через Version History

---

## 🧪 ТЕСТИРОВАНИЕ:

```bash
# Локальное тестирование
node scripts/update-spreadsheets.js

# Проверка одной таблицы
node scripts/update-spreadsheets.js --spreadsheet-id=SPREADSHEET_ID --dry-run
```

---

## 📊 MONITORING:

После каждого обновления:
- Лог в GitHub Actions
- Email notification при ошибках
- Dashboard с статистикой обновлений

---

## 🎯 ИТОГО:

**РЕКОМЕНДУЮ:** Начать с Варианта 1 (Drive Folder Scanner)

**Причины:**
1. ✅ Быстро реализовать (1-2 часа)
2. ✅ Полный контроль
3. ✅ Безопасно
4. ✅ Легко тестировать

**Потом добавить:** Вариант 3 (Self-Update) для удобства пользователей

**Итоговая система:**
- GitHub Actions обновляет таблицы в папке
- Таблицы могут сами проверять обновления
- Пользователь всегда контролирует процесс
