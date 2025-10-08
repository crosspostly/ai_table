# 🚀 Автоматический деплой в Google Apps Script

Эта документация описывает как настроить автоматическую загрузку кода из GitHub в Google Apps Script после каждого push в ветку `web-interface-with-design`.

## 📋 Содержание

1. [Архитектура деплоя](#архитектура-деплоя)
2. [Первичная настройка](#первичная-настройка)
3. [Получение Script ID](#получение-script-id)
4. [Настройка GitHub Actions](#настройка-github-actions)
5. [Проверка работы](#проверка-работы)
6. [Troubleshooting](#troubleshooting)

---

## 🏗️ Архитектура деплоя

Проект разделен на **два независимых Apps Script проекта**:

### 1. **Server Project** (Web App)
- **Назначение**: API endpoints, тяжелые вычисления
- **Содержит**: `table/server/` + `table/shared/`
- **Deployment**: Web App (доступен через URL)
- **Ваш Deployment ID**: `AKfycbyyUlB5YWP4bwv3gHHniTv_12cAHlqjYfra7fQ3m3Vri5XvZTQ_uUZZovCYeTo2_u6gQw`
- **⚠️ Нужен Script ID** (см. инструкцию ниже)

### 2. **Client Project** (Container-bound)
- **Назначение**: UI, меню, взаимодействие с Google Sheets
- **Содержит**: `table/client/` + `table/shared/` + `table/web/`
- **Deployment**: Привязан к конкретной Google Таблице
- **⚠️ Нужен Script ID** (см. инструкцию ниже)

---

## 🔧 Первичная настройка

### Шаг 1: Установка clasp (выполняется ОДИН РАЗ на любом компьютере)

Если у вас есть доступ к компьютеру с Node.js:

```bash
# Установить clasp глобально
npm install -g @google/clasp

# Авторизоваться в Google
clasp login
```

Откроется браузер → **нажмите "Разрешить"**.

### Шаг 2: Найти файл с credentials

После успешной авторизации clasp создаст файл `.clasprc.json`:

**На Windows:**
```
C:\Users\ВашеИмя\.clasprc.json
```

**На Mac/Linux:**
```
~/.clasprc.json
```

**Откройте этот файл** блокнотом/текстовым редактором и **скопируйте ВСЁ содержимое**.

Файл будет содержать JSON объект с OAuth2 credentials для Google Apps Script API.

**Важно:** 
- Копируйте весь JSON объект как есть из файла `.clasprc.json` после `clasp login`
- Это приватные данные для авторизации - не публикуйте их
- Файл будет использоваться только в GitHub Secrets (безопасное хранилище)

---

## 🔑 Получение Script ID

**ВАЖНО:** У вас есть Deployment ID (`AKfycbyyUlB5YWP4bwv3gHHniTv_12cAHlqjYfra7fQ3m3Vri5XvZTQ_uUZZovCYeTo2_u6gQw`), но для clasp нужен **Script ID**.

### Для Server Project (Web App):

1. Перейдите на https://script.google.com
2. Найдите ваш серверный проект (который развернут как Web App)
3. Нажмите на значок **⚙️ Настройки проекта** (слева)
4. Скопируйте **"Идентификатор скрипта"** (Script ID)
   - Формат: `1AbC...XyZ` (обычно 44-57 символов)

### Для Client Project (привязан к таблице):

1. Откройте вашу Google Таблицу
2. Меню: **Расширения** → **Apps Script**
3. Нажмите на значок **⚙️ Настройки проекта**
4. Скопируйте **"Идентификатор скрипта"**

### Обновление конфигурации в репозитории:

После получения Script ID нужно обновить файлы:

**`table/.clasp-server.json`:**
```json
{
  "scriptId": "ВАШ_СЕРВЕРНЫЙ_SCRIPT_ID",
  "rootDir": "server"
}
```

**`table/.clasp-client.json`:**
```json
{
  "scriptId": "ВАШ_КЛИЕНТСКИЙ_SCRIPT_ID",
  "rootDir": "."
}
```

---

## ⚙️ Настройка GitHub Actions

### Шаг 1: Добавить Secret в GitHub

1. Перейдите в ваш репозиторий на GitHub
2. **Settings** (вверху справа)
3. Слева: **Secrets and variables** → **Actions**
4. **New repository secret**
5. **Name**: `CLASPRC_JSON`
6. **Secret**: Вставьте содержимое файла `.clasprc.json` (из Шага 2 выше)
7. **Add secret**

### Шаг 2: Проверка workflow файла

Файл `.github/workflows/deploy-apps-script.yml` уже создан в репозитории.

**Триггеры деплоя:**
- Автоматически при push в ветку `web-interface-with-design`
- Только если изменены файлы в папке `table/`
- Вручную через GitHub Actions (кнопка "Run workflow")

---

## ✅ Проверка работы

### 1. Проверка через GitHub Actions UI

После настройки и первого push:

1. Перейдите в репозиторий на GitHub
2. Вкладка **Actions**
3. Найдите workflow "🚀 Auto Deploy to Google Apps Script"
4. Проверьте статус:
   - ✅ **Зеленая галочка** = успешно
   - ❌ **Красный крестик** = ошибка (смотрите логи)

### 2. Проверка в Apps Script

**Серверный проект:**
1. Откройте https://script.google.com
2. Найдите ваш серверный проект
3. Проверьте, что файлы обновились (смотрите даты изменения)

**Клиентский проект:**
1. Откройте Google Таблицу
2. **Расширения** → **Apps Script**
3. Проверьте обновление файлов

---

## 🐛 Troubleshooting

### Ошибка: "Missing credentials"
**Решение:** Проверьте, что Secret `CLASPRC_JSON` правильно добавлен в GitHub.

### Ошибка: "Could not find script"
**Решение:** 
1. Проверьте, что Script ID правильно указан в `.clasp-server.json` и `.clasp-client.json`
2. Убедитесь, что это именно Script ID, а не Deployment ID

### Ошибка: "User has not enabled the Apps Script API"
**Решение:**
1. Перейдите на https://script.google.com/home/usersettings
2. Включите "Google Apps Script API"

### Деплой не запускается автоматически
**Проверка:**
1. Убедитесь, что изменения в ветке `web-interface-with-design`
2. Проверьте, что изменились файлы в папке `table/`
3. Проверьте вкладку Actions в GitHub

### Нужно задеплоить вручную
Даже если автодеплой настроен, можно запустить вручную:
1. Перейдите в **Actions** → **🚀 Auto Deploy to Google Apps Script**
2. Нажмите **Run workflow**
3. Выберите ветку `web-interface-with-design`
4. **Run workflow**

---

## 📝 Дополнительная информация

### Что деплоится:

**Server Project:**
- Все файлы из `table/server/*.gs`
- Все файлы из `table/shared/*.gs`
- `table/server/appsscript.json`

**Client Project:**
- Все файлы из `table/client/*.gs`
- Все файлы из `table/shared/*.gs`
- Все файлы из `table/web/*.html` и `table/web/*.gs`
- `table/appsscript.json`

### Что НЕ деплоится (согласно `.claspignore`):
- Документация (*.md файлы)
- Тесты (tests/** и *Test.gs)
- Бэкапы (*_backup.gs, *_old.gs)
- Git файлы (.git, .gitignore)

### Файлы конфигурации:
- `.clasp-server.json` - конфигурация для серверного проекта
- `.clasp-client.json` - конфигурация для клиентского проекта
- `.claspignore` - список игнорируемых файлов
- `.github/workflows/deploy-apps-script.yml` - GitHub Actions workflow

---

## 🎉 Готово!

После настройки:
1. Factory.ai делает изменения → push в GitHub
2. GitHub Actions **автоматически** деплоит код в оба Apps Script проекта
3. Изменения сразу доступны в Web App и Google Sheets

**Проверить статус деплоя:** GitHub → Actions → 🚀 Auto Deploy to Google Apps Script
