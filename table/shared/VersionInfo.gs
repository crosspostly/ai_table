/**
 * Получение информации о версии системы
 * @return {Object} Объект с данными о версии
 */
function getVersionInfo() {
  return {
    "project": {
      "name": "AI_TABLE",
      "description": "Enterprise AI Assistant для Google Sheets",
      "repository": "https://github.com/crosspostly/ai_table",
      "homepage": "https://aitables.com"
    },
    "version": {
      "current": "2.1.0",
      "previous": "2.0.1",
      "releaseDate": "2024-10-09",
      "updateTimestamp": "2024-10-09T21:45:00Z",
      "status": "stable"
    },
    "build": {
      "number": "20241009",
      "environment": "production",
      "platform": "Google Apps Script",
      "deployedBy": "GitHub Actions"
    },
    "features": {
      "unified_credentials": {
        "name": "Единое окно ввода ключей",
        "description": "setupAllCredentialsUnified() - все credentials в одном месте",
        "status": "active",
        "added_in": "2.0.1"
      },
      "google_sheets_logging": {
        "name": "Google Sheets логирование",
        "description": "Система логирования в реальном времени в лист Логи",
        "status": "active",
        "added_in": "2.0.1"
      },
      "comprehensive_testing": {
        "name": "Comprehensive Testing",
        "description": "25+ автоматических тестов с детальными отчётами",
        "status": "active",
        "added_in": "2.0.1"
      },
      "security_validation": {
        "name": "Security Validation",
        "description": "Защита от XSS, SQL injection, безопасное логирование",
        "status": "active",
        "added_in": "2.0.0"
      },
      "dev_functions": {
        "name": "DEV Functions",
        "description": "Функции разработчика работают локально",
        "status": "active",
        "added_in": "2.0.1"
      }
    }
  };
}

/**
 * Получение текущей версии (строка)
 * @return {string} Номер версии
 */
function getCurrentVersion() {
  return getVersionInfo().version.current;
}

/**
 * Получение даты последнего обновления
 * @return {string} ISO строка даты
 */
function getLastUpdateDate() {
  return getVersionInfo().version.updateTimestamp;
}

/**
 * Получение информации для отображения в меню (короткая версия)
 * @return {string} Версия, дата и время для отображения
 */
function getVersionDisplayInfo() {
  try {
    var versionInfo = getVersionInfo();
    var version = versionInfo.version.current;
    var timestamp = versionInfo.version.updateTimestamp;
    
    // Парсим ISO timestamp для получения даты и времени
    var updateDate = new Date(timestamp);
    
    // Форматируем дату и время для краткого отображения (dd.mm HH:MM)
    var shortDate = updateDate.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    });
    
    var shortTime = updateDate.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return 'v' + version + ' от ' + shortDate + ' ' + shortTime;
  } catch (e) {
    // Fallback с текущим временем
    var now = new Date();
    var shortDate = now.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    });
    var shortTime = now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return 'v2.0.1 от ' + shortDate + ' ' + shortTime;
  }
}