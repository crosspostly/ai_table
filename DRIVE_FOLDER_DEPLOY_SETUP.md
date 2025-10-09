# 🚀 Setup Guide: Auto-Deploy to Drive Folder

## ✅ **ДОКАЗАТЕЛЬСТВО ЧТО ЭТО ПРОСТО!**

**Преимущества:**
- ✅ **БЕЗ переписывания кода** - клиентский код остаётся как есть!
- ✅ **Один ID папки** - указал один раз, работает всегда
- ✅ **Автоматический деплой** - push в main → все таблицы обновлены
- ✅ **Логи деплоя** - видно что и куда задеплоилось

---

## 📋 **ЧТО НУЖНО (настройка 10 минут)**

### **1. Google Service Account (один раз)**

#### Шаг 1: Создай Service Account

1. Открой https://console.cloud.google.com/
2. Выбери проект (или создай новый)
3. **APIs & Services → Credentials**
4. **Create Credentials → Service Account**
5. Name: `github-actions-deploy`
6. Role: **Editor** (или custom с Drive + Apps Script API)
7. **Done**

#### Шаг 2: Создай ключ

1. Кликни на созданный Service Account
2. **Keys → Add Key → Create new key**
3. Type: **JSON**
4. Download JSON файл

#### Шаг 3: Enable APIs

1. **APIs & Services → Library**
2. Найди и enable:
   - **Google Drive API** ✅
   - **Apps Script API** ✅

#### Шаг 4: Дай доступ к папке Drive

1. Открой JSON файл ключа
2. Найди `client_email`: `github-actions-deploy@...iam.gserviceaccount.com`
3. Открой свою папку в Google Drive
4. **Share → Add people**
5. Вставь `client_email`
6. Роль: **Editor**
7. **Send**

**Готово!** Service Account теперь имеет доступ к папке! ✅

---

### **2. GitHub Secrets (один раз)**

#### Шаг 1: Добавь Service Account в Secrets

1. Открой репозиторий на GitHub
2. **Settings → Secrets and variables → Actions**
3. **New repository secret**
4. Name: `GOOGLE_SERVICE_ACCOUNT`
5. Value: **Весь контент JSON файла** (скопируй как есть)
6. **Add secret**

#### Шаг 2: Добавь Folder ID

1. Открой папку в Google Drive
2. Скопируй ID из URL:
   ```
   https://drive.google.com/drive/folders/1ABC...XYZ
                                            ^^^^^^^^^ это ID
   ```
3. **New repository secret**
4. Name: `DRIVE_FOLDER_ID`
5. Value: `1ABC...XYZ` (только ID)
6. **Add secret**

**Готово!** GitHub теперь знает куда деплоить! ✅

---

## 🚀 **ИСПОЛЬЗОВАНИЕ**

### **Автоматический деплой:**

```bash
# 1. Изменяешь код в table/client/ или table/shared/
git add table/client/ThinClient.gs
git commit -m "feat: Update ThinClient"
git push origin main

# 2. GitHub Actions запускается автоматически
# 3. Все таблицы в папке получают обновление!
# 4. Смотри логи в Actions tab
```

### **Ручной деплой:**

1. **Actions → Deploy to Drive Folder**
2. **Run workflow**
3. (Опционально) укажи другой Folder ID
4. **Run workflow**

---

## 📊 **ЧТО ПРОИСХОДИТ ПРИ ДЕПЛОЕ**

```
GitHub Actions запускается
    ↓
Подключается к Google Drive API
    ↓
Находит все таблицы в папке (по DRIVE_FOLDER_ID)
    ↓
Для каждой таблицы:
    • Читает Apps Script project ID
    • Обновляет все .gs файлы
    • Обновляет appsscript.json
    ↓
Логирует результаты:
    ✅ table1: Success
    ✅ table2: Success
    ❌ table3: Failed (error message)
    ↓
Готово! Все таблицы обновлены!
```

---

## 🔍 **ПРИМЕР ЛОГОВ**

```
🚀 Starting deployment to Google Drive folder...

🔐 Authenticating...
   ✅ Authenticated as: github-actions-deploy@project.iam.gserviceaccount.com

🔍 Searching for spreadsheets in folder: 1ABC...XYZ

✅ Found 3 spreadsheet(s):

   1. Client Table - User 1 (1xyz...)
   2. Client Table - User 2 (2abc...)
   3. Test Table (3def...)

📂 Reading project files...

   ✅ ThinClient.gs (15234 chars)
   ✅ ClientUtilities.gs (8765 chars)
   ✅ Menu.gs (4321 chars)
   ...
   ✅ appsscript.json

📦 Total files: 12

🚀 Starting deployments...

[1/3]
📤 Deploying to: Client Table - User 1
   Sheet ID: 1xyz...
   ✅ SUCCESS: Deployed 12 files

[2/3]
📤 Deploying to: Client Table - User 2
   Sheet ID: 2abc...
   ✅ SUCCESS: Deployed 12 files

[3/3]
📤 Deploying to: Test Table
   Sheet ID: 3def...
   ✅ SUCCESS: Deployed 12 files

📊 DEPLOYMENT SUMMARY:

   ✅ Successful: 3
   ❌ Failed: 0
   📦 Total: 3

✅ Deployment completed!
```

---

## ⚙️ **НАСТРОЙКА ДЕПЛОЯ**

### **Деплоить только определённые файлы:**

Отредактируй `deploy-to-folder.js`:

```javascript
// Вместо всех файлов - только нужные
const files = [
  readFile('table/client/ThinClient.gs'),
  readFile('table/client/Menu.gs'),
  readFile('table/shared/Logger.gs'),
  // ... только те что нужны
];
```

### **Деплоить в несколько папок:**

```yaml
# .github/workflows/deploy-to-drive-folder.yml

strategy:
  matrix:
    folder:
      - id: '1ABC...XYZ'
        name: 'Production'
      - id: '2DEF...UVW'
        name: 'Staging'

env:
  DRIVE_FOLDER_ID: ${{ matrix.folder.id }}
```

### **Деплоить только при изменении определённых файлов:**

```yaml
on:
  push:
    paths:
      - 'table/client/ThinClient.gs'  # Только при изменении этого файла
      - 'table/client/Menu.gs'
```

---

## 🧪 **ТЕСТИРОВАНИЕ ЛОКАЛЬНО**

```bash
# 1. Установи dependencies
npm install googleapis

# 2. Экспортируй credentials
export GOOGLE_CREDENTIALS='{...JSON content...}'
export DRIVE_FOLDER_ID='1ABC...XYZ'

# 3. Запусти скрипт
node deploy-to-folder.js

# 4. Смотри результат
```

---

## ❓ **FAQ**

### **Q: Нужно ли что-то менять в клиентском коде?**
A: **НЕТ!** ❌ Код остаётся как есть. Деплой просто копирует файлы.

### **Q: Что если таблица не в папке?**
A: Не задеплоится. Только таблицы В ПАПКЕ обновляются.

### **Q: Можно ли деплоить вручную?**
A: **ДА!** ✅ Actions → Deploy to Drive Folder → Run workflow

### **Q: Что если деплой упал?**
A: Смотри логи в GitHub Actions. Там будет error message.

### **Q: Можно ли откатить версию?**
A: **ДА!** Сделай revert commit и push → автодеплой старой версии.

### **Q: Безопасно ли?**
A: **ДА!** Service Account имеет доступ ТОЛЬКО к папке, которую ты расшарил.

---

## 🎯 **ИТОГ**

### **Настройка (10 минут):**
1. ✅ Создать Service Account (3 мин)
2. ✅ Enable APIs (1 мин)
3. ✅ Расшарить папку (1 мин)
4. ✅ Добавить Secrets в GitHub (2 мин)
5. ✅ Push workflow файлы (3 мин)

### **Использование (0 минут!):**
```bash
git push origin main
# → Всё автоматически! ✅
```

### **Преимущества:**
- ✅ **Ноль изменений в коде** - работает как есть
- ✅ **Один ID папки** - управление из одного места
- ✅ **Автоматический деплой** - push → готово
- ✅ **Логи** - видно все результаты
- ✅ **Масштабируемость** - 1 таблица или 100 - без разницы

---

**ЭТО ПРОСТО! 🚀**
