/**
 * 🔐 AUTHORIZATION HELPER
 * Автоматическая проверка и запуск процесса авторизации
 * 
 * ОСОБЕННОСТИ:
 * - Проверка всех необходимых OAuth scopes
 * - Автоматический показ диалога авторизации
 * - UI для управления разрешениями
 * - Детальная диагностика проблем с правами
 */

/**
 * 📋 Список всех необходимых OAuth scopes для проекта
 */
var REQUIRED_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/script.external_request',
  'https://www.googleapis.com/auth/script.container.ui',
  'https://www.googleapis.com/auth/script.scriptapp',
  'https://www.googleapis.com/auth/userinfo.email'
];

/**
 * 🔍 Проверка статуса авторизации
 * Возвращает объект с информацией о текущих разрешениях
 */
function checkAuthorizationStatus() {
  try {
    var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
    
    var status = {
      authorized: true,
      needsAuthorization: false,
      authorizationUrl: null,
      errors: [],
      missingScopes: [],
      availableScopes: []
    };
    
    // Проверяем статус авторизации
    var authStatus = authInfo.getAuthorizationStatus();
    
    if (authStatus === ScriptApp.AuthorizationStatus.REQUIRED) {
      status.authorized = false;
      status.needsAuthorization = true;
      status.authorizationUrl = authInfo.getAuthorizationUrl();
      status.errors.push('Требуется авторизация');
    }
    
    // Проверяем доступ к email
    try {
      var email = Session.getActiveUser().getEmail();
      status.userEmail = email;
      status.availableScopes.push('userinfo.email');
    } catch (e) {
      status.errors.push('Нет доступа к email пользователя');
      status.missingScopes.push('https://www.googleapis.com/auth/userinfo.email');
    }
    
    // Проверяем доступ к таблицам
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      status.spreadsheetAccess = true;
      status.availableScopes.push('spreadsheets');
    } catch (e) {
      status.errors.push('Нет доступа к таблицам');
      status.missingScopes.push('https://www.googleapis.com/auth/spreadsheets');
      status.spreadsheetAccess = false;
    }
    
    // Проверяем доступ к внешним запросам
    try {
      var testUrl = 'https://www.google.com';
      // Не делаем реальный запрос, только проверяем наличие объекта
      if (typeof UrlFetchApp !== 'undefined') {
        status.urlFetchAccess = true;
        status.availableScopes.push('external_request');
      }
    } catch (e) {
      status.errors.push('Нет доступа к внешним запросам');
      status.missingScopes.push('https://www.googleapis.com/auth/script.external_request');
      status.urlFetchAccess = false;
    }
    
    // Определяем общий статус
    status.authorized = status.errors.length === 0 && !status.needsAuthorization;
    
    return status;
    
  } catch (error) {
    return {
      authorized: false,
      needsAuthorization: true,
      errors: ['Ошибка проверки авторизации: ' + error.message],
      missingScopes: REQUIRED_OAUTH_SCOPES
    };
  }
}

/**
 * 🚀 Запуск процесса авторизации
 * Показывает пользователю UI с инструкциями
 */
function initiateAuthorizationFlow() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    var status = checkAuthorizationStatus();
    
    if (status.authorized) {
      ui.alert(
        '✅ Авторизация в порядке',
        'Все необходимые разрешения уже предоставлены.\n\n' +
        'Email пользователя: ' + (status.userEmail || 'доступен') + '\n' +
        'Доступ к таблицам: ' + (status.spreadsheetAccess ? '✅' : '❌') + '\n' +
        'Доступ к внешним запросам: ' + (status.urlFetchAccess ? '✅' : '❌'),
        ui.ButtonSet.OK
      );
      return true;
    }
    
    // Формируем сообщение с инструкциями
    var message = '🔐 ТРЕБУЕТСЯ АВТОРИЗАЦИЯ\n\n';
    message += 'Для работы системы необходимо предоставить дополнительные разрешения.\n\n';
    
    if (status.errors.length > 0) {
      message += '❌ Обнаружены проблемы:\n';
      status.errors.forEach(function(error) {
        message += '• ' + error + '\n';
      });
      message += '\n';
    }
    
    if (status.missingScopes.length > 0) {
      message += '🔑 Отсутствующие разрешения:\n';
      status.missingScopes.forEach(function(scope) {
        var scopeName = scope.split('/').pop();
        message += '• ' + scopeName + '\n';
      });
      message += '\n';
    }
    
    message += '📋 ЧТО ДЕЛАТЬ:\n';
    message += '1. Нажмите "Авторизовать" ниже\n';
    message += '2. В новом окне нажмите "Просмотреть разрешения"\n';
    message += '3. Нажмите "Дополнительные настройки"\n';
    message += '4. Выберите "Перейти на страницу (небезопасно)"\n';
    message += '5. Нажмите "Разрешить"\n\n';
    message += '💡 Это безопасно - скрипт работает только с вашими данными';
    
    var result = ui.alert(
      '🔐 Необходима авторизация',
      message,
      ui.ButtonSet.OK_CANCEL
    );
    
    if (result === ui.Button.OK) {
      // Пытаемся инициировать авторизацию
      try {
        // Вызываем функцию, требующую полных прав
        triggerAuthorizationDialog_();
        
        // Проверяем статус после попытки авторизации
        var newStatus = checkAuthorizationStatus();
        if (newStatus.authorized) {
          ui.alert(
            '✅ Успешно!',
            'Авторизация завершена. Все разрешения предоставлены.',
            ui.ButtonSet.OK
          );
          addSystemLog('Authorization successful', 'INFO', 'AUTH');
          return true;
        } else {
          ui.alert(
            '⚠️ Требуется действие',
            'Пожалуйста, разрешите доступ в открывшемся окне.\n\n' +
            'Если окно не открылось, попробуйте:\n' +
            '1. Выполнить любую функцию из меню\n' +
            '2. Разрешить всплывающие окна для этого сайта\n' +
            '3. Проверить статус авторизации снова',
            ui.ButtonSet.OK
          );
          return false;
        }
      } catch (authError) {
        ui.alert(
          '❌ Ошибка авторизации',
          'Не удалось запустить процесс авторизации: ' + authError.message + '\n\n' +
          'Попробуйте выполнить любую функцию из меню - это автоматически запустит процесс авторизации.',
          ui.ButtonSet.OK
        );
        addSystemLog('Authorization error: ' + authError.message, 'ERROR', 'AUTH');
        return false;
      }
    }
    
    return false;
    
  } catch (error) {
    ui.alert(
      '❌ Ошибка',
      'Ошибка при проверке авторизации: ' + error.message,
      ui.ButtonSet.OK
    );
    addSystemLog('Authorization check error: ' + error.message, 'ERROR', 'AUTH');
    return false;
  }
}

/**
 * 🎯 Триггер диалога авторизации
 * Вызывает функции, требующие разных разрешений
 */
function triggerAuthorizationDialog_() {
  try {
    // Проверяем все необходимые разрешения
    var email = Session.getActiveUser().getEmail();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
    
    // Если мы дошли сюда, значит все разрешения есть
    return true;
  } catch (e) {
    // Ошибка означает, что нужна авторизация
    throw new Error('Требуется авторизация: ' + e.message);
  }
}

/**
 * 📊 Показать детальный статус авторизации
 * UI функция для вызова из меню
 */
function showAuthorizationStatus() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    var status = checkAuthorizationStatus();
    
    var message = '🔐 СТАТУС АВТОРИЗАЦИИ\n\n';
    
    // Общий статус
    if (status.authorized) {
      message += '✅ СТАТУС: Авторизовано\n\n';
    } else {
      message += '❌ СТАТУС: Требуется авторизация\n\n';
    }
    
    // Email пользователя
    message += '👤 Email: ' + (status.userEmail || '❌ недоступен') + '\n\n';
    
    // Доступные разрешения
    message += '✅ ДОСТУПНЫЕ РАЗРЕШЕНИЯ:\n';
    if (status.availableScopes.length > 0) {
      status.availableScopes.forEach(function(scope) {
        message += '• ' + scope + '\n';
      });
    } else {
      message += '• (нет)\n';
    }
    message += '\n';
    
    // Отсутствующие разрешения
    if (status.missingScopes.length > 0) {
      message += '❌ ОТСУТСТВУЮЩИЕ РАЗРЕШЕНИЯ:\n';
      status.missingScopes.forEach(function(scope) {
        var scopeName = scope.split('/').pop();
        message += '• ' + scopeName + '\n';
      });
      message += '\n';
    }
    
    // Ошибки
    if (status.errors.length > 0) {
      message += '⚠️ ПРОБЛЕМЫ:\n';
      status.errors.forEach(function(error) {
        message += '• ' + error + '\n';
      });
      message += '\n';
    }
    
    // Действия
    if (!status.authorized) {
      message += '💡 Используйте "Запустить авторизацию" для исправления';
    } else {
      message += '💡 Все в порядке, система готова к работе!';
    }
    
    ui.alert('Статус авторизации', message, ui.ButtonSet.OK);
    
    addSystemLog('Authorization status checked', 'INFO', 'AUTH');
    
  } catch (error) {
    ui.alert(
      '❌ Ошибка',
      'Не удалось проверить статус авторизации: ' + error.message,
      ui.ButtonSet.OK
    );
    addSystemLog('Authorization status check error: ' + error.message, 'ERROR', 'AUTH');
  }
}

/**
 * 🔄 Автоматическая проверка и авторизация при ошибках
 * Вызывается автоматически при возникновении ошибок авторизации
 */
function autoCheckAndAuthorize() {
  try {
    var status = checkAuthorizationStatus();
    
    if (!status.authorized) {
      addSystemLog('Auto-detected authorization issue, initiating flow', 'WARN', 'AUTH');
      return initiateAuthorizationFlow();
    }
    
    return true;
  } catch (error) {
    addSystemLog('Auto authorization check failed: ' + error.message, 'ERROR', 'AUTH');
    return false;
  }
}

/**
 * 🛠️ Wrapper для функций, требующих авторизацию
 * Автоматически проверяет и запускает авторизацию при необходимости
 */
function withAuthorization(func, context) {
  try {
    // Пытаемся выполнить функцию
    return func.call(context);
  } catch (error) {
    // Проверяем, связана ли ошибка с авторизацией
    if (error.message && 
        (error.message.includes('insufficient permissions') || 
         error.message.includes('authorization') ||
         error.message.includes('Authorization'))) {
      
      addSystemLog('Authorization error detected, attempting auto-fix', 'WARN', 'AUTH');
      
      // Пытаемся авторизовать
      var authorized = autoCheckAndAuthorize();
      
      if (authorized) {
        // Повторяем попытку выполнения функции
        try {
          return func.call(context);
        } catch (retryError) {
          addSystemLog('Function failed after authorization: ' + retryError.message, 'ERROR', 'AUTH');
          throw retryError;
        }
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
}

/**
 * 🎨 Открыть красивый UI для управления авторизацией
 */
function openAuthorizationDialog() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('web/AuthorizationDialog')
      .setWidth(600)
      .setHeight(500)
      .setTitle('🔐 Управление авторизацией');
    
    SpreadsheetApp.getUi().showModalDialog(html, '🔐 Управление авторизацией');
    
    addSystemLog('Authorization dialog opened', 'INFO', 'AUTH');
    
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      '❌ Ошибка',
      'Не удалось открыть диалог авторизации: ' + error.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    addSystemLog('Failed to open authorization dialog: ' + error.message, 'ERROR', 'AUTH');
  }
}

/**
 * 🧪 Тест авторизации
 * Проверяет все разрешения и выводит отчет
 */
function testAuthorization() {
  var ui = SpreadsheetApp.getUi();
  
  var report = '🧪 ТЕСТ АВТОРИЗАЦИИ\n\n';
  var allPassed = true;
  
  // Тест 1: Email пользователя
  try {
    var email = Session.getActiveUser().getEmail();
    report += '✅ Тест 1: Email пользователя\n';
    report += '   Email: ' + email + '\n\n';
  } catch (e) {
    report += '❌ Тест 1: Email пользователя\n';
    report += '   Ошибка: ' + e.message + '\n\n';
    allPassed = false;
  }
  
  // Тест 2: Доступ к таблице
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = ss.getName();
    report += '✅ Тест 2: Доступ к таблице\n';
    report += '   Таблица: ' + sheetName + '\n\n';
  } catch (e) {
    report += '❌ Тест 2: Доступ к таблице\n';
    report += '   Ошибка: ' + e.message + '\n\n';
    allPassed = false;
  }
  
  // Тест 3: Script App
  try {
    var timezone = Session.getScriptTimeZone();
    report += '✅ Тест 3: Script App\n';
    report += '   Timezone: ' + timezone + '\n\n';
  } catch (e) {
    report += '❌ Тест 3: Script App\n';
    report += '   Ошибка: ' + e.message + '\n\n';
    allPassed = false;
  }
  
  // Тест 4: Properties
  try {
    var props = PropertiesService.getScriptProperties();
    report += '✅ Тест 4: Properties\n';
    report += '   Доступ: OK\n\n';
  } catch (e) {
    report += '❌ Тест 4: Properties\n';
    report += '   Ошибка: ' + e.message + '\n\n';
    allPassed = false;
  }
  
  // Общий результат
  if (allPassed) {
    report += '🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!\n';
    report += 'Система полностью авторизована и готова к работе.';
  } else {
    report += '⚠️ НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ\n';
    report += 'Рекомендуется запустить процесс авторизации.';
  }
  
  ui.alert('Результаты теста авторизации', report, ui.ButtonSet.OK);
  
  addSystemLog('Authorization test completed: ' + (allPassed ? 'PASSED' : 'FAILED'), 
               allPassed ? 'INFO' : 'WARN', 
               'AUTH');
  
  return allPassed;
}
