# 📚 ДОКУМЕНТАЦИЯ TABLE AI BOT v2.0

## ⚠️ ВАЖНО: Статус документов

### ✅ АКТУАЛЬНЫЕ ДОКУМЕНТЫ (2025-10-08):

| Документ | Описание | Статус |
|----------|----------|--------|
| **CURRENT_FILE_STRUCTURE.md** | 📁 Актуальная структура файлов | ✅ АКТУАЛЬНО |
| **FUNCTIONS_REFERENCE.md** | 📖 Справочник всех функций (1309 строк) | ✅ АКТУАЛЬНО |

### ⚠️ УСТАРЕВШИЕ ДОКУМЕНТЫ (требуют обновления):

| Документ | Проблема | Последнее обновление |
|----------|----------|---------------------|
| **CORRECT_ARCHITECTURE.md** | Не отражает новые файлы (ButtonFunctions.gs, ClientUtilities.gs) | 20 часов назад |
| **FILES_DEPLOYMENT_GUIDE.md** | Не учитывает security fixes и appsscript.json copying | 19 часов назад |
| **CLIENT_SERVER_INSTALLATION.md** | Устаревший список файлов | 20 часов назад |
| **INSTALLATION.md** | Не отражает текущий deployment процесс | 20 часов назад |
| **QUICK_START.md** | Устаревшие инструкции | 20 часов назад |

### 📋 ЧАСТИЧНО АКТУАЛЬНЫЕ:

| Документ | Описание | Что актуально |
|----------|----------|---------------|
| **SocialImportExamples.md** | Примеры импорта | ✅ Примеры корректны, API актуален |
| **ProductionReadinessSummary.md** | Готовность к продакшну | ⚠️ Частично - не отражает новые fixes |
| **VK_ARCHITECTURE_ANALYSIS.md** | Анализ VK архитектуры | ✅ Актуален (без изменений) |
| **VK_CURRENT_ANALYSIS.md** | Текущая VK реализация | ✅ Актуален |
| **WEB_INTERFACE_REALITY_CHECK.md** | Веб-интерфейс | ⚠️ Не отражает OAuth fix |

---

## 🎯 РЕКОМЕНДУЕМЫЙ ПОРЯДОК ЧТЕНИЯ:

### Для начинающих:

1. ⭐ **CURRENT_FILE_STRUCTURE.md** - начните с актуальной структуры
2. 📖 **FUNCTIONS_REFERENCE.md** - изучите все доступные функции
3. 📝 **SocialImportExamples.md** - примеры использования

### Для разработчиков:

1. 📁 **CURRENT_FILE_STRUCTURE.md** - полная карта проекта
2. 🔧 **FUNCTIONS_REFERENCE.md** - детальное API
3. 🏗️ **VK_ARCHITECTURE_ANALYSIS.md** - архитектура VK модуля
4. 🌐 **WEB_INTERFACE_REALITY_CHECK.md** - веб-интерфейс

### Для администраторов:

1. 📋 **CURRENT_FILE_STRUCTURE.md** - что деплоить
2. ⚙️ **FILES_DEPLOYMENT_GUIDE.md** - как деплоить (⚠️ устарел, используйте GitHub Actions)
3. 🔐 **ProductionReadinessSummary.md** - чеклист

---

## 📂 СТРУКТУРА ДОКУМЕНТАЦИИ:

```
table/docs/
├── ✅ CURRENT_FILE_STRUCTURE.md      (АКТУАЛЬНО - используйте это!)
├── ✅ FUNCTIONS_REFERENCE.md         (АКТУАЛЬНО - полный справочник)
│
├── ⚠️ CORRECT_ARCHITECTURE.md        (УСТАРЕЛ - см. CURRENT_FILE_STRUCTURE.md)
├── ⚠️ FILES_DEPLOYMENT_GUIDE.md      (УСТАРЕЛ - см. GitHub Actions workflow)
├── ⚠️ CLIENT_SERVER_INSTALLATION.md  (УСТАРЕЛ - см. CURRENT_FILE_STRUCTURE.md)
├── ⚠️ INSTALLATION.md                (УСТАРЕЛ)
├── ⚠️ QUICK_START.md                 (УСТАРЕЛ)
│
├── ✅ SocialImportExamples.md        (актуален - примеры)
├── ⚠️ ProductionReadinessSummary.md  (частично актуален)
├── ✅ VK_ARCHITECTURE_ANALYSIS.md    (актуален - VK модуль)
├── ✅ VK_CURRENT_ANALYSIS.md         (актуален - текущая реализация)
└── ⚠️ WEB_INTERFACE_REALITY_CHECK.md (частично актуален - нужен OAuth update)
```

---

## 🚀 БЫСТРЫЙ СТАРТ:

### 1. Изучите структуру:
```bash
# Читайте актуальную структуру:
cat table/docs/CURRENT_FILE_STRUCTURE.md
```

### 2. Найдите нужную функцию:
```bash
# Используйте справочник:
cat table/docs/FUNCTIONS_REFERENCE.md
```

### 3. Посмотрите примеры:
```bash
# Примеры импорта из соцсетей:
cat table/docs/SocialImportExamples.md
```

---

## 📝 ЧТО ИЗМЕНИЛОСЬ (2025-10-08):

### ✅ Новые файлы:
- `table/client/ButtonFunctions.gs` - 7 функций для кнопок
- `table/client/ClientUtilities.gs` - 25+ вспомогательных функций

### ✅ Security fixes:
- Защита от утечки server кода в client
- Security check в GitHub Actions workflow
- Script для очистки: `clean-client-project.js`

### ✅ OAuth fixes:
- `appsscript.json` теперь копируется в client
- Scope `script.container.ui` для Web Interface
- Исправлена ошибка "Указанных разрешений недостаточно"

### ✅ Deployment improvements:
- Автоматическое копирование appsscript.json
- Security проверка перед деплоем
- Cleanup после деплоя

---

## 🔍 ПОИСК ИНФОРМАЦИИ:

### Найти функцию:
```bash
# Поиск в справочнике:
grep -i "function_name" table/docs/FUNCTIONS_REFERENCE.md
```

### Найти файл:
```bash
# Поиск в структуре:
grep -i "filename" table/docs/CURRENT_FILE_STRUCTURE.md
```

### Найти пример:
```bash
# Поиск примера использования:
grep -A10 "example" table/docs/SocialImportExamples.md
```

---

## 📞 КУДА ОБРАЩАТЬСЯ:

### Вопросы по структуре файлов:
→ `CURRENT_FILE_STRUCTURE.md`

### Вопросы по функциям:
→ `FUNCTIONS_REFERENCE.md`

### Вопросы по деплойменту:
→ GitHub Actions workflow (`.github/workflows/deploy-apps-script.yml`)

### Вопросы по безопасности:
→ `EMERGENCY_FIX.md` (в корне репо)

### Вопросы по кнопкам:
→ `URGENT_ACTIONS_REQUIRED.md` (в корне репо)

---

## ⚙️ TODO: Обновить документацию

Следующие документы требуют обновления:

- [ ] CORRECT_ARCHITECTURE.md - добавить новые файлы
- [ ] FILES_DEPLOYMENT_GUIDE.md - отразить GitHub Actions
- [ ] CLIENT_SERVER_INSTALLATION.md - актуализировать список файлов
- [ ] INSTALLATION.md - новый процесс установки
- [ ] QUICK_START.md - обновленные инструкции
- [ ] ProductionReadinessSummary.md - новые fixes
- [ ] WEB_INTERFACE_REALITY_CHECK.md - OAuth scopes fix

---

**Дата обновления:** 2025-10-08  
**Статус:** ✅ АКТУАЛЬНОЕ README  
**Приоритет:** Используйте CURRENT_FILE_STRUCTURE.md и FUNCTIONS_REFERENCE.md
