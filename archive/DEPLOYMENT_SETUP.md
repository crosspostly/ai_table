# 🚀 Настройка автоматического деплоя в Google Apps Script

Этот документ описывает, как настроить автоматическое развёртывание кода из GitHub в Google Apps Script при каждом push в ветку `web-interface-with-design`.

## 📋 Структура деплоя

Проект разделён на **два независимых Apps Script проекта**:

### 1. 🖥️ Server Project
- **Путь:** `table/server/`
- **Конфигурация:** `.clasp-server.json`
- **Содержимое:** Все серверные сервисы и API endpoints
- **Тип:** Web App (для HTTP API)

### 2. 📱 Client Project
- **Путь:** `table/client/`, `table/shared/`, `table/web/`
- **Конфигурация:** `.clasp-client.json`
- **Содержимое:** UI, клиентская логика, общие утилиты, веб-интерфейс
- **Тип:** Container-bound script (привязан к Google Sheets)

---

## 🔧 Пошаговая настройка

### Шаг 1: Получить Script IDs для обоих проектов

#### Для Server Project:
1. Создайте новый **Standalone Apps Script** проект на https://script.google.com
2. Или используйте существующий проект
3. Откройте **⚙️ Project Settings** (Настройки проекта)
4. Скопируйте **Script ID** (например: `1a2b3c4d5e6f7g8h9i0j...`)

#### Для Client Project:
1. Откройте вашу **Google Таблицу**
2. Меню **Extensions** → **Apps Script**
3. Откройте **⚙️ Project Settings**
4. Скопируйте **Script ID**

### Шаг 2: Обновить конфигурационные файлы

Откройте и отредактируйте файлы в корне репозитория:

**`.clasp-server.json`:**
```json
{
  "scriptId": "ВСТАВЬТЕ_СЮДА_SERVER_SCRIPT_ID",
  "rootDir": "./table/server"
}
```

**`.clasp-client.json`:**
```json
{
  "scriptId": "ВСТАВЬТЕ_СЮДА_CLIENT_SCRIPT_ID",
  "rootDir": "./table"
}
```

### Шаг 3: Получить credentials для clasp (ОДИН РАЗ)

Это нужно сделать **один раз на любом компьютере**:

#### На Windows:
```cmd
npm install -g @google/clasp
clasp login
```

#### На Mac/Linux:
```bash
npm install -g @google/clasp
clasp login
```

После выполнения `clasp login`:
1. Откроется браузер
2. Выберите ваш Google аккаунт
3. Нажмите **"Разрешить"** (Allow)

#### Найти файл с credentials:

- **Windows:** `C:\Users\ВашеИмя\.clasprc.json`
- **Mac:** `~/.clasprc.json`
- **Linux:** `~/.clasprc.json`

Откройте этот файл блокнотом и **скопируйте весь его содержимый**.

Файл содержит OAuth2 credentials в формате JSON (токены, client ID и secret).

### Шаг 4: Добавить Secret в GitHub

1. Откройте ваш репозиторий на https://github.com
2. Перейдите в **Settings** (Настройки)
3. Слева найдите **Secrets and variables** → **Actions**
4. Нажмите **"New repository secret"**
5. Заполните:
   - **Name:** `CLASPRC_JSON`
   - **Secret:** Вставьте содержимое файла `.clasprc.json`
6. Нажмите **"Add secret"**

✅ Готово! GitHub теперь может деплоить в Apps Script от вашего имени.

---

## 🎯 Как это работает

### Автоматический деплой

После настройки:

1. **Вы делаете изменения** в коде (через Factory.ai или вручную)
2. **Push в ветку** `web-interface-with-design`
3. **GitHub Actions автоматически:**
   - Устанавливает clasp
   - Использует ваши credentials из Secret
   - Деплоит Server Project (`table/server/` → Apps Script)
   - Деплоит Client Project (`table/client/`, `table/shared/`, `table/web/` → Apps Script)

### Проверка статуса

После каждого push:
1. Откройте вкладку **Actions** в репозитории
2. Найдите последний workflow **"Deploy to Google Apps Script"**
3. Зелёная галочка ✅ = успешный деплой
4. Красный крест ❌ = ошибка (кликните для деталей)

---

## 📁 Файловая структура деплоя

### Server Project получает:
```
table/server/
├── CompletionPhraseService.gs
├── ConditionalGemini.gs
├── ContextManager.gs
├── DataCollectors.gs
├── ErrorHandlingService.gs
├── LicenseService.gs
├── OcrService.gs
├── RetryService.gs
├── RulesEngine.gs
├── ServerEndpoints.gs
├── SmartChainService.gs
├── SocialImportService.gs
├── SourceDetector.gs
├── TableLicenseService.gs
├── TelegramImportService.gs
├── TriggerManager.gs
├── ValidationService.gs
├── VkImportService.gs
└── appsscript.json
```

### Client Project получает:
```
table/
├── client/
│   ├── ChatMode.gs
│   ├── GeminiClient.gs
│   ├── Menu.gs
│   ├── SmartPromptProcessor.gs
│   ├── SocialImportClient.gs
│   └── ThinClient.gs
├── shared/
│   ├── Constants.gs
│   ├── LoggingService.gs
│   └── Utils.gs
├── web/
│   ├── WebInterface.gs
│   ├── RealisticWebApp.html
│   └── WebApp.html
└── appsscript.json
```

---

## 🔒 Безопасность

- ✅ Credentials хранятся в **GitHub Secrets** (зашифровано)
- ✅ Доступ только у вас и GitHub Actions
- ✅ Credentials **никогда не попадают** в код или логи
- ✅ Token можно **отозвать** в любой момент через Google Account

### Как отозвать доступ:

1. Откройте https://myaccount.google.com/permissions
2. Найдите **"clasp - The Apps Script CLI"**
3. Нажмите **"Remove Access"**
4. Для возобновления - повторите Шаг 3 (clasp login)

---

## 🐛 Troubleshooting (Решение проблем)

### Ошибка: "Script ID not found"
- Проверьте, что Script ID правильно скопирован
- Убедитесь, что у вашего Google аккаунта есть доступ к этим проектам

### Ошибка: "Unauthorized" 
- Обновите `.clasprc.json` Secret (токен устарел)
- Выполните `clasp login` заново и обновите Secret

### Деплой проходит, но файлы не обновляются
- Проверьте `.claspignore` файлы
- Убедитесь, что `rootDir` правильно указан в `.clasp-*.json`

### Нужно деплоить вручную (для тестирования)
```bash
# Server
cp .clasp-server.json .clasp.json
clasp push -f

# Client
cp .clasp-client.json .clasp.json
clasp push -f
```

---

## 📚 Дополнительные ресурсы

- [Документация clasp](https://github.com/google/clasp)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Apps Script Documentation](https://developers.google.com/apps-script)

---

## ✅ Чеклист готовности

- [ ] Script ID для Server Project получен и добавлен в `.clasp-server.json`
- [ ] Script ID для Client Project получен и добавлен в `.clasp-client.json`
- [ ] `.clasprc.json` credentials получены через `clasp login`
- [ ] Secret `CLASPRC_JSON` добавлен в GitHub repository settings
- [ ] Push в ветку `web-interface-with-design` запускает Actions
- [ ] Workflow выполняется успешно (зелёная галочка в Actions)
- [ ] Файлы появляются в обоих Apps Script проектах

**Готово! 🎉 Теперь каждый push автоматически обновляет код в Apps Script!**
