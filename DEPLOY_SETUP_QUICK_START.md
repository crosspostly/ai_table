# ⚡ Быстрый старт: Автодеплой в Apps Script

## 🎯 Что нужно сделать (3 шага)

### 1️⃣ Получить .clasprc.json (на любом компьютере с Node.js)

```bash
npm install -g @google/clasp
clasp login
```

Откроется браузер → **Разрешить** → Найти файл:
- **Windows**: `C:\Users\ВашеИмя\.clasprc.json`
- **Mac/Linux**: `~/.clasprc.json`

**Скопировать ВСЁ содержимое файла.**

---

### 2️⃣ Добавить Secret в GitHub

1. GitHub → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. **Name**: `CLASPRC_JSON`
4. **Secret**: вставить содержимое `.clasprc.json`
5. **Add secret**

---

### 3️⃣ Получить Script ID и обновить конфигурацию

#### Для серверного проекта:
1. https://script.google.com → найти ваш Web App проект
2. **⚙️ Настройки проекта** → скопировать **Идентификатор скрипта**
3. Обновить `table/.clasp-server.json`:
```json
{
  "scriptId": "ВАШ_СЕРВЕРНЫЙ_SCRIPT_ID",
  "rootDir": "server"
}
```

#### Для клиентского проекта:
1. Открыть Google Таблицу → **Расширения** → **Apps Script**
2. **⚙️ Настройки проекта** → скопировать **Идентификатор скрипта**
3. Обновить `table/.clasp-client.json`:
```json
{
  "scriptId": "ВАШ_КЛИЕНТСКИЙ_SCRIPT_ID",
  "rootDir": "."
}
```

---

## ✅ Готово!

После этого:
- ✨ Push в ветку `web-interface-with-design` → автоматический деплой
- 🔍 Проверить статус: GitHub → **Actions** → **🚀 Auto Deploy to Google Apps Script**

---

## 📚 Подробная документация

См. [`table/docs/CLASP_SETUP.md`](table/docs/CLASP_SETUP.md) для:
- Детальные инструкции
- Troubleshooting
- Архитектура деплоя
- Что именно деплоится

---

## ⚠️ Важно

**У вас сейчас Deployment ID**, а нужен **Script ID**:
- ❌ Deployment ID: `AKfycbyyUlB5YWP4bwv3gHHniTv_12cAHlqjYfra7fQ3m3Vri5XvZTQ_uUZZovCYeTo2_u6gQw`
- ✅ Script ID: `1AbC...XyZ` (получить в ⚙️ Настройки проекта)

Script ID нужен для автодеплоя через clasp!

---

## 🚀 Структура деплоя

```
GitHub Push → GitHub Actions → clasp push
                                    ↓
                           ┌────────┴────────┐
                           ↓                 ↓
                    Server Project    Client Project
                    (Web App API)     (Google Sheets UI)
```
