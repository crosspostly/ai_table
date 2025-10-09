# 🚨 СРОЧНЫЕ ДЕЙСТВИЯ ТРЕБУЮТСЯ!

## Дата: 2025-10-08
## Статус: КРИТИЧНО - Требуется немедленное вмешательство

---

## ✅ **ЧТО УЖЕ СДЕЛАНО (автоматически):**

### 1. OAuth Scope для Web Interface - ИСПРАВЛЕНО ✅
- `appsscript.json` теперь копируется в `table/client/` перед деплоем
- Scope `script.container.ui` будет применен при следующем deploy
- **Статус:** Ждет деплоя через GitHub Actions

### 2. Security Check - ДОБАВЛЕН ✅
- Workflow проверяет что server файлы НЕ попадают в client
- Автоматический фильтр при деплое
- **Статус:** Работает с этого коммита

### 3. Функции для кнопок - СОЗДАНЫ ✅
- `ButtonFunctions.gs` добавлен в `table/client/`
- Все функции готовы к использованию
- **Статус:** Ждет деплоя

---

## ⚠️ **ЧТО НУЖНО СДЕЛАТЬ ВРУЧНУЮ:**

### ДЕЙСТВИЕ 1: Удалить server файлы из клиентского проекта 🚨

**ПОЧЕМУ КРИТИЧНО:** В клиентском проекте есть серверный код (утечка IP!)

**КАК ИСПРАВИТЬ:**

#### Вариант A: Через скрипт (рекомендуется)

1. **Убедитесь что clasp установлен:**
   ```bash
   npm install -g @google/clasp
   ```

2. **Авторизуйтесь:**
   ```bash
   clasp login
   ```

3. **Запустите скрипт очистки:**
   ```bash
   node clean-client-project.js
   ```
   
   Скрипт:
   - Клонирует client project
   - Найдет все server файлы
   - Покажет что будет удалено
   - Подождет 5 секунд для отмены (Ctrl+C)
   - Удалит server файлы
   - Загрузит чистую версию обратно

#### Вариант B: Вручную (если скрипт не работает)

1. **Откройте Apps Script Editor:**
   ```
   https://script.google.com/home/projects/1DdlYfvo0EfEA1O1nb5DRI0o-WJoIivtfIPNSE1C1bt3IvvWC91sGE6Xs/edit
   ```

2. **Удалите ВСЕ файлы с префиксом `server/`:**
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

3. **Сохраните** (Ctrl+S)

4. **Проверьте что остались ТОЛЬКО:**
   - ButtonFunctions.gs ⬅️ НОВЫЙ!
   - ChatMode.gs
   - ClientUtilities.gs
   - GeminiClient.gs
   - Menu.gs
   - SmartPromptProcessor.gs
   - SocialImportClient.gs
   - ThinClient.gs
   - Constants.gs
   - LoggingService.gs
   - Utils.gs
   - WebInterface.gs
   - appsscript.json

---

### ДЕЙСТВИЕ 2: Дождаться деплоя через GitHub Actions

**Зачем:** appsscript.json с новыми OAuth scopes загрузится

**Как проверить:**
1. Откройте: https://github.com/crosspostly/ai_table/actions
2. Дождитесь завершения workflow "Deploy to Google Apps Script"
3. Убедитесь что статус ✅ Success

---

### ДЕЙСТВИЕ 3: Привязать функции к кнопкам

**После деплоя:**

1. **Откройте ваш Google Sheets**

2. **Для кнопки "Вжух" (лист с VK ссылкой):**
   - Правый клик на кнопку
   - "Assign script" (или "Назначить скрипт")
   - Введите: `btnVzhuh`
   - Нажмите OK

3. **Для кнопки "Распаковаться" (лист "Распаковка", ячейка A1):**
   - Правый клик на кнопку
   - "Assign script"
   - Введите: `btnRaspakovatsa`
   - Нажмите OK

4. **Для кнопки на листе "Отзывы" (ячейка A3):**
   - Правый клик на кнопку
   - "Assign script"
   - Введите: `btnProcessReviews`
   - Нажмите OK

**Полный список доступных функций:**
- `btnVzhuh` - импорт VK постов
- `btnRaspakovatsa` - распаковка данных
- `btnProcessReviews` - обработка отзывов (OCR)
- `btnProcessData` - универсальная обработка
- `btnRunAnalysis` - запуск анализа
- `btnClearFormulas` - очистка формул
- `btnTest` - тестовая кнопка

---

### ДЕЙСТВИЕ 4: Протестировать Web Interface

**После деплоя:**

1. Откройте Google Sheets
2. Меню "🤖 Table AI" → "🌐 Веб-интерфейс"
3. **Должно открыться БЕЗ ошибки!**

Если ошибка:
- ✅ Проверьте что deploy прошел успешно
- ✅ Проверьте что appsscript.json загружен
- ✅ Сделайте hard refresh (Ctrl+F5)

---

## 📋 **ЧЕКЛИСТ ВЫПОЛНЕНИЯ:**

- [ ] **1. Удалить server файлы из client** (node clean-client-project.js ИЛИ вручную)
- [ ] **2. Дождаться успешного деплоя** (GitHub Actions)
- [ ] **3. Привязать функции к кнопкам** (Assign script)
- [ ] **4. Протестировать Web Interface** (должен открыться)
- [ ] **5. Протестировать кнопки** (все должны работать)

---

## 🆘 **ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ:**

### Web Interface все еще показывает ошибку OAuth:
1. Убедитесь что деплой завершился успешно
2. Откройте Apps Script Editor
3. Проверьте что appsscript.json содержит:
   ```json
   "oauthScopes": [
     "https://www.googleapis.com/auth/script.container.ui"
   ]
   ```
4. Сделайте re-authorization:
   - Запустите любую функцию из меню
   - Разрешите новые права доступа

### Кнопки не работают:
1. Проверьте что ButtonFunctions.gs присутствует в проекте
2. Проверьте правильность написания имени функции
3. Откройте Logs (View → Logs) для ошибок

### Server файлы все еще в client:
1. Запустите: `node clean-client-project.js`
2. ИЛИ удалите вручную через Apps Script Editor
3. Проверьте список файлов после очистки

---

## 📞 **КОНТАКТЫ:**

Если нужна помощь:
1. Проверьте EMERGENCY_FIX.md для детальных инструкций
2. Проверьте логи GitHub Actions
3. Проверьте Apps Script Editor → View → Logs

---

**ПРИОРИТЕТ: КРИТИЧЕСКИЙ**  
**СРОЧНОСТЬ: НЕМЕДЛЕННАЯ**  
**СТАТУС: ОЖИДАЕТ ДЕЙСТВИЙ ПОЛЬЗОВАТЕЛЯ**

**Создано:** 2025-10-08  
**Коммит:** 41b2696
