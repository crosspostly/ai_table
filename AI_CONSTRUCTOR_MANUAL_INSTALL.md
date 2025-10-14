# 🎯 AI Конструктор - Ручная установка

## ❌ Проблема: Изменения не видны в таблице

Если GitHub Actions не запустился или вы хотите установить вручную.

---

## ✅ Решение 1: Проверить GitHub Actions

1. Откройте: https://github.com/crosspostly/ai_table/actions
2. Найдите последний workflow run для commit `3596c10`
3. Проверьте статус:
   - ✅ **Success** → перезагрузите таблицу (Ctrl+F5)
   - ❌ **Failed** → смотрите логи, возможно нужны secrets
   - ⏸️ **Не запустился** → используйте ручную установку ниже

---

## ✅ Решение 2: Ручная установка (5 минут)

### 📦 Что нужно скопировать:

#### **В Client Apps Script:**

1. Откройте Apps Script:
   ```
   https://script.google.com/home/projects/1DdlYfvo0EfEA1O1nb5DRI0o-WJoIivtfIPNSE1C1bt3IvvWC91sGE6Xs/edit
   ```

2. Создайте 2 новых файла:

   **Файл 1: `CollectConfigUI.gs`**
   - Нажмите **+** → **Script**
   - Назовите: `CollectConfigUI`
   - Скопируйте содержимое из: `table/client/CollectConfigUI.gs`

   **Файл 2: `CollectConfigUI.html`**
   - Нажмите **+** → **HTML**
   - Назовите: `CollectConfigUI`
   - Скопируйте содержимое из: `table/client/CollectConfigUI.html`

3. Обновите **`Menu.gs`**:
   - Откройте существующий файл `Menu.gs`
   - Найдите строку с `.addItem('❓ Справка', 'showTextToFormulaHelp'))`
   - Добавьте ПОСЛЕ неё:
   
   ```javascript
   .addSeparator()
   .addSubMenu(ui.createMenu('🎯 AI Конструктор (без лимитов)')
     .addItem('🎯 Настроить запрос', 'openCollectConfigUI')
     .addItem('🔄 Обновить ячейку', 'refreshCellWithConfig')
     .addSeparator()
     .addItem('❓ Что это?', 'showCollectConfigHelp'))
   ```

4. **Сохраните** (Ctrl+S)

#### **В Server Apps Script:**

1. Откройте Apps Script:
   ```
   https://script.google.com/home/projects/1ncX8FGqT7QP-LxqrRJu0_z_FmUTGsbqmbWDCRePLfHgW8x85bX_Yu9uP/edit
   ```

2. Создайте новый файл:

   **Файл: `ConfigurationManager.gs`**
   - Нажмите **+** → **Script**
   - Назовите: `ConfigurationManager`
   - Скопируйте содержимое из: `table/server/ConfigurationManager.gs`

3. **Сохраните** (Ctrl+S)

---

## 🔄 После установки:

1. **Обновите таблицу** (Ctrl+F5 или Cmd+Shift+R)
2. В меню **🤖 Table AI** должен появиться **🎯 AI Конструктор (без лимитов)**
3. Попробуйте:
   - Выделите любую ячейку
   - Меню → 🎯 AI Конструктор → 🎯 Настроить запрос
   - Должен открыться красивый интерфейс!

---

## 🔍 Проверка что всё работает:

1. Выделите ячейку B3
2. Меню → **🤖 Table AI** → **🎯 AI Конструктор** → **🎯 Настроить запрос**
3. Должен открыться интерфейс с:
   - 📍 System Prompt (выбор листа и ячейки)
   - 📦 User Data (можно добавлять строки)
   - 🚀 Запустить / 💾 Сохранить / 🔄 Сбросить

4. Попробуйте справку:
   - Меню → **🎯 AI Конструктор** → **❓ Что это?**

---

## ⚠️ Если НЕ работает:

### Ошибка: "openCollectConfigUI is not defined"

**Причина:** Файл `CollectConfigUI.gs` не создан в Client Apps Script

**Решение:** Проверьте что файл создан и сохранён

### Ошибка: "getOrCreateConfigSheet is not defined"

**Причина:** Файл `ConfigurationManager.gs` не создан в Server Apps Script

**Решение:** Добавьте файл в Server проект

### Интерфейс не открывается

**Причина:** HTML файл не создан

**Решение:** Создайте `CollectConfigUI.html` в Client Apps Script

---

## 📋 Файлы для копирования:

Все файлы в репозитории:
- `table/client/CollectConfigUI.gs`
- `table/client/CollectConfigUI.html`
- `table/client/Menu.gs` (изменения)
- `table/server/ConfigurationManager.gs`

GitHub: https://github.com/crosspostly/ai_table/tree/web-interface-with-design/table

---

## 💡 Почему GitHub Actions не сработал?

Возможные причины:
1. **Нет GitHub Secrets** - нужны для clasp auth
2. **Workflow отключен** - проверьте настройки
3. **Первый раз** - может требовать настройки

**Решение:** Используйте ручную установку выше (5 минут)

---

## ✅ После установки вы получите:

- 🎯 **AI Конструктор** - без лимита 50К символов
- 📊 **JSON формат** - данные структурированы
- 💾 **Сохранённые настройки** - для каждой ячейки
- 🔄 **Быстрое обновление** - 1 клик
- 📁 **ConfigData лист** - все конфигурации в одном месте

**Работает с любым объёмом данных!** 🚀
