# 📁 File Structure Rules - ГДЕ СОЗДАВАТЬ НОВЫЕ ФАЙЛЫ

## ❗ ВАЖНО: Автоматическая Синхронизация

GitHub Actions **автоматически** копирует файлы при деплое:

```
table/shared/*.gs  →  table/server/*.gs  (для server проекта)
                   →  table/client/*.gs  (для client проекта)

table/web/*.gs     →  table/client/*.gs  (для UI в Apps Script)
table/web/*.html   →  table/client/*.html
```

## 📂 Где создавать НОВЫЕ файлы:

### 1. `table/shared/` - Общие утилиты (доступны везде)

**Создавайте здесь:**
- ✅ Утилиты (Utils.gs, Constants.gs)
- ✅ Логирование (LoggingService.gs, GoogleSheetsLogger.gs)
- ✅ Форматирование данных
- ✅ Validation функции
- ✅ Любой код который нужен И на сервере И на клиенте

**Примеры:**
```
table/shared/Utils.gs           → автокопируется в client/ и server/
table/shared/LoggingService.gs  → автокопируется в client/ и server/
table/shared/Constants.gs       → автокопируется в client/ и server/
```

**❌ НЕ создавайте здесь:**
- UI логику (это в web/)
- Server-only функции (это в server/)
- Client-only функции (это в client/)

---

### 2. `table/web/` - UI и HTML интерфейсы

**Создавайте здесь:**
- ✅ HTML файлы для dialog/sidebar
- ✅ .gs файлы с функциями открытия UI
- ✅ JavaScript/CSS код в HTML
- ✅ Любые UI компоненты

**Примеры:**
```
table/web/CollectConfigUI.gs    → автокопируется в client/
table/web/CollectConfigUI.html  → автокопируется в client/
table/web/LogViewer.gs          → автокопируется в client/
table/web/WebInterface.html     → автокопируется в client/
```

**❌ НЕ создавайте здесь:**
- Server логику
- API вызовы к внешним сервисам
- Работу с PropertiesService (секреты)

---

### 3. `table/client/` - Client-Side Logic (ТОЛЬКО для специфичной логики!)

**Создавайте здесь ТОЛЬКО:**
- ✅ Функции меню (Menu.gs)
- ✅ Client-side обработчики (ClientUtilities.gs)
- ✅ Triggers (onOpen, onEdit)
- ✅ Специфичную логику которая НЕ в web/ и НЕ в shared/

**Примеры:**
```
table/client/Menu.gs               ← Только здесь (не копируется)
table/client/ClientUtilities.gs    ← Только здесь (не копируется)
table/client/SmartPromptProcessor.gs ← Только здесь (не копируется)
```

**⚠️ ВАЖНО:**
- НЕ создавайте здесь UI файлы (они в web/)!
- НЕ создавайте здесь shared утилиты (они в shared/)!
- Workflow НЕ копирует файлы ИЗ client/ никуда

---

### 4. `table/server/` - Server-Side Logic (API, PropertiesService, секреты)

**Создавайте здесь:**
- ✅ Вызовы внешних API (Gemini, VK, etc.)
- ✅ Работа с PropertiesService (credentials)
- ✅ Тяжёлые вычисления
- ✅ Backend логика

**Примеры:**
```
table/server/ConfigurationManager.gs  ← Только здесь (не копируется)
table/server/GeminiService.gs         ← Только здесь (не копируется)
table/server/ServerEndpoints.gs       ← Только здесь (не копируется)
```

**❌ НЕ создавайте здесь:**
- UI логику
- Menu функции
- onOpen/onEdit triggers

---

## 🔄 Как работает автосинхронизация

### При каждом деплое GitHub Actions:

```bash
# 1. Очистка старых автокопированных файлов
🗑️  Удаляет старые shared/*.gs из client/
🗑️  Удаляет старые shared/*.gs из server/
🗑️  Удаляет старые web/*.gs и web/*.html из client/

# 2. Копирование свежих файлов
📋 Копирует ВСЕ table/shared/*.gs → table/server/
📋 Копирует ВСЕ table/shared/*.gs → table/client/
📋 Копирует ВСЕ table/web/*.gs → table/client/
📋 Копирует ВСЕ table/web/*.html → table/client/

# 3. Деплой через clasp
🚀 clasp push для server/ (Apps Script Server)
🚀 clasp push для client/ (Apps Script Client)
```

---

## ✅ Примеры правильного размещения:

### Пример 1: Добавить новую функцию логирования

```bash
# ✅ ПРАВИЛЬНО:
table/shared/MyNewLogger.gs

# Результат: автоматически попадёт в client/ и server/
```

### Пример 2: Создать новый UI dialog

```bash
# ✅ ПРАВИЛЬНО:
table/web/MyDialog.gs         # Функция openMyDialog()
table/web/MyDialog.html        # HTML содержимое

# Результат: автоматически попадёт в client/ для Apps Script
```

### Пример 3: Добавить server endpoint

```bash
# ✅ ПРАВИЛЬНО:
table/server/MyApiService.gs

# Результат: останется только в server/, не попадёт в client
```

### Пример 4: Добавить пункт меню

```bash
# ✅ ПРАВИЛЬНО:
table/client/Menu.gs           # Редактировать существующий файл

# Результат: останется в client/, вызывает функции из web/ или server/
```

---

## ❌ Частые ошибки:

### ❌ НЕПРАВИЛЬНО:
```bash
table/client/LogViewer.gs      # UI логика НЕ должна быть здесь!
table/client/MyDialog.html     # HTML НЕ должен быть здесь!
table/server/MenuUtils.gs      # Menu логика НЕ должна быть на сервере!
```

### ✅ ПРАВИЛЬНО:
```bash
table/web/LogViewer.gs         # UI логика → в web/
table/web/MyDialog.html        # HTML → в web/
table/client/Menu.gs           # Menu → в client/
```

---

## 🔍 Как проверить что файл скопировался:

### 1. Локально после коммита:
```bash
git log --oneline -1   # Проверить что закоммитили
```

### 2. После деплоя на GitHub:
```
https://github.com/crosspostly/ai_table/actions
→ Смотреть логи Deploy to Google Apps Script
→ Ищем строки:
   "✅ Copied X shared files to client/"
   "✅ Copied X web files to client/"
```

### 3. В Apps Script Editor:
```
Extensions → Apps Script
→ Files слева - должны быть все файлы из:
  - client/
  - shared/ (скопированные)
  - web/ (скопированные)
```

---

## 🚀 Quick Reference:

| Что создаёте | Куда класть | Результат |
|-------------|-------------|-----------|
| Утилиты (общие) | `table/shared/` | → client/ + server/ |
| UI (HTML + .gs) | `table/web/` | → client/ |
| Меню, triggers | `table/client/` | Остаётся в client/ |
| API, credentials | `table/server/` | Остаётся в server/ |

---

## 💡 Совет:

**Если сомневаетесь куда класть файл - спросите себя:**

1. Это UI? → `table/web/`
2. Это нужно везде? → `table/shared/`
3. Это только client-side? → `table/client/`
4. Это только server-side? → `table/server/`

**Workflow сам всё скопирует и задеплоит правильно!** 🎉
