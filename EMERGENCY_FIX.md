# 🚨 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ - УТЕЧКА СЕРВЕРНОГО КОДА

## ❌ КРИТИЧЕСКАЯ ПРОБЛЕМА

В клиентском Google Apps Script проекте обнаружены **серверные файлы**:
- server/RulesEngine.gs
- server/ServerEndpoints.gs
- server/SimpleLicenseService.gs
- server/SmartChainService.gs
- server/SocialImportService.gs
- server/SourceDetector.gs
- server/TableLicenseService.gs
- server/TelegramImportService.gs
- server/TriggerManager.gs
- server/ValidationService.gs
- server/VkImportService.gs

**Это УТЕЧКА ИНТЕЛЛЕКТУАЛЬНОЙ СОБСТВЕННОСТИ!**

---

## ✅ РЕШЕНИЕ

### Вариант 1: Ручное удаление (СРОЧНО!)

1. Откройте клиентский проект:
   ```
   https://script.google.com/home/projects/1DdlYfvo0EfEA1O1nb5DRI0o-WJoIivtfIPNSE1C1bt3IvvWC91sGE6Xs/edit
   ```

2. **УДАЛИТЕ ВСЕ файлы с префиксом `server/`:**
   - server/RulesEngine.gs
   - server/ServerEndpoints.gs  
   - server/SimpleLicenseService.gs
   - server/SmartChainService.gs
   - server/SocialImportService.gs
   - server/SourceDetector.gs
   - server/TableLicenseService.gs
   - server/TelegramImportService.gs
   - server/TriggerManager.gs
   - server/ValidationService.gs
   - server/VkImportService.gs

3. **Сохраните изменения** (Ctrl+S)

4. **Проверьте что остались ТОЛЬКО клиентские файлы:**
   - ✅ ChatMode.gs
   - ✅ ClientUtilities.gs
   - ✅ GeminiClient.gs
   - ✅ Menu.gs
   - ✅ SmartPromptProcessor.gs
   - ✅ SocialImportClient.gs
   - ✅ ThinClient.gs
   - ✅ Constants.gs (shared)
   - ✅ LoggingService.gs (shared)
   - ✅ Utils.gs (shared)
   - ✅ WebInterface.gs (web)
   - ✅ appsscript.json

---

### Вариант 2: Автоматическое удаление через clasp (если есть доступ)

```bash
# 1. Установите clasp если нет
npm install -g @google/clasp

# 2. Авторизуйтесь
clasp login

# 3. Склонируйте проект
clasp clone 1DdlYfvo0EfEA1O1nb5DRI0o-WJoIivtfIPNSE1C1bt3IvvWC91sGE6Xs

# 4. Удалите серверные файлы
rm server/*.gs

# 5. Загрузите обратно
clasp push -f
```

---

### Вариант 3: Полная переустановка (самый безопасный)

1. **Создайте НОВЫЙ скрипт** привязанный к Google Sheets:
   - Sheets → Расширения → Apps Script
   - Скопируйте новый Script ID

2. **Обновите `.clasp-client.json`:**
   ```json
   {
     "scriptId": "НОВЫЙ_SCRIPT_ID",
     "rootDir": "./table/client"
   }
   ```

3. **Запустите deployment** через GitHub Actions

4. **Старый проект УДАЛИТЕ** чтобы серверный код не был доступен

---

## 🔒 ПОЧЕМУ ЭТО ПРОИЗОШЛО?

### Возможные причины:

1. **Ручное копирование файлов** - кто-то вручную загрузил server/* в клиент

2. **Ошибка в deployment** - workflow мог случайно скопировать server файлы

3. **Проблема с clasp rootDir** - неправильная конфигурация путей

---

## ✅ КАК ПРЕДОТВРАТИТЬ В БУДУЩЕМ?

### 1. Проверка в CI/CD

Добавить в `.github/workflows/deploy-apps-script.yml`:

```yaml
- name: Verify NO server files in client
  run: |
    echo "🔍 Checking for server files in client directory..."
    if ls table/client/server* 2>/dev/null || ls table/client/*Server* 2>/dev/null; then
      echo "❌ ERROR: Server files found in client directory!"
      ls -la table/client/server* table/client/*Server* 2>/dev/null || true
      exit 1
    fi
    echo "✅ No server files in client"
```

### 2. .gitignore для защиты

Добавить в `table/client/.gitignore`:
```
# Never allow server files in client!
server/
*Server*.gs
*License*.gs (except ClientUtilities.gs)
```

### 3. Pre-commit hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

if git diff --cached --name-only | grep -q "table/client/server"; then
    echo "❌ ERROR: Trying to commit server files to client!"
    exit 1
fi
```

### 4. Документация для команды

Создать `SECURITY.md` с правилами:
- ❌ НИКОГДА не копировать server/* файлы в client/
- ❌ НИКОГДА не деплоить вручную без проверки
- ✅ ВСЕГДА использовать GitHub Actions для deployment
- ✅ ВСЕГДА проверять files list после deployment

---

## 📋 ЧЕКЛИСТ ИСПРАВЛЕНИЯ

- [ ] 1. Открыть клиентский проект в браузере
- [ ] 2. Удалить ВСЕ файлы server/*
- [ ] 3. Проверить что остались только client файлы
- [ ] 4. Сохранить изменения
- [ ] 5. Протестировать что клиент работает
- [ ] 6. Добавить проверки в CI/CD
- [ ] 7. Обновить документацию
- [ ] 8. Уведомить команду о проблеме

---

## 🆘 ПОДДЕРЖКА

Если нужна помощь:
1. Сделайте скриншот списка файлов
2. Проверьте логи последнего deployment
3. Свяжитесь с DevOps командой

---

**СРОЧНОСТЬ: КРИТИЧЕСКАЯ**  
**СТАТУС: ТРЕБУЕТ НЕМЕДЛЕННОГО ИСПРАВЛЕНИЯ**  
**ДАТА: 2025-10-08**
