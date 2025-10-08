# ⚡ Быстрый старт: Автодеплой в Apps Script

> **TL;DR:** GitHub автоматически загружает код в Apps Script после каждого push

## 🎯 Что нужно сделать (3 шага)

### 1️⃣ Получить Script IDs

**Server Project** (веб-приложение):
- Откройте https://script.google.com
- Создайте новый проект или используйте существующий
- ⚙️ Project Settings → скопируйте **Script ID**
- Вставьте в `.clasp-server.json` вместо `YOUR_SERVER_SCRIPT_ID_HERE`

**Client Project** (Google Таблица):
- Откройте вашу Google Таблицу
- Extensions → Apps Script
- ⚙️ Project Settings → скопируйте **Script ID**  
- Вставьте в `.clasp-client.json` вместо `YOUR_CLIENT_SCRIPT_ID_HERE`

### 2️⃣ Получить credentials (один раз на любом компьютере)

```bash
npm install -g @google/clasp
clasp login
```

Откроется браузер → нажмите "Разрешить"

Найдите файл:
- **Windows:** `C:\Users\ВашеИмя\.clasprc.json`
- **Mac/Linux:** `~/.clasprc.json`

Скопируйте **всё содержимое** файла.

### 3️⃣ Добавить Secret в GitHub

1. Откройте ваш репозиторий на GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret**
4. Name: `CLASPRC_JSON`
5. Secret: вставьте содержимое `.clasprc.json`
6. **Add secret**

## ✅ Готово!

Теперь при каждом push в ветку `web-interface-with-design`:
- 📦 Весь код (server + client + shared + web) → Apps Script Project
- 📋 Script ID: `15tMLr3G3kbBKjMVi7r2XqPR3kBSWO0jCDYHijIhy9ko2rsIceG8tLoYa`

Проверить: вкладка **Actions** в GitHub

---

📖 Подробная инструкция: [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md)
