/**
 * VK TOKEN VALIDATOR
 * Проверка ВАЛИДНОСТИ VK_TOKEN (не просто наличия!)
 * 
 * ВАЖНО: Токен может СУЩЕСТВОВАТЬ, но быть НЕВАЛИДНЫМ!
 * Этот модуль проверяет что токен работает через реальный VK API запрос.
 */

/**
 * Проверка валидности VK_TOKEN через реальный API запрос
 * @return {Object} {valid: boolean, token: string|null, error: string|null, details: Object}
 */
function validateVkToken() {
  var result = {
    valid: false,
    token: null,
    error: null,
    details: {}
  };
  
  try {
    // 1. Проверяем наличие токена
    var token = PropertiesService.getScriptProperties().getProperty('VK_TOKEN');
    
    if (!token || token.trim() === '') {
      result.error = 'VK_TOKEN не найден в Script Properties';
      result.details.step = 'token_check';
      result.details.recommendation = 'Добавьте VK_TOKEN в Project Settings → Script Properties';
      return result;
    }
    
    result.token = token.substring(0, 10) + '...' + token.substring(token.length - 4); // Маскируем для безопасности
    
    // 2. Проверяем формат токена
    if (token.length < 20) {
      result.error = 'VK_TOKEN слишком короткий (< 20 символов)';
      result.details.step = 'token_format';
      result.details.length = token.length;
      result.details.recommendation = 'Получите правильный токен на https://vk.com/dev/access_token';
      return result;
    }
    
    // 3. КЛЮЧЕВАЯ ПРОВЕРКА: Реальный API запрос к VK
    result.details.step = 'api_validation';
    
    var apiUrl = 'https://api.vk.com/method/users.get?user_ids=1&access_token=' + 
                 encodeURIComponent(token) + 
                 '&v=5.131';
    
    var response = UrlFetchApp.fetch(apiUrl, {
      method: 'GET',
      muteHttpExceptions: true
    });
    
    var responseCode = response.getResponseCode();
    result.details.httpCode = responseCode;
    
    if (responseCode !== 200) {
      result.error = 'VK API недоступен: HTTP ' + responseCode;
      result.details.recommendation = 'Проверьте интернет-соединение или VK API статус';
      return result;
    }
    
    var data = JSON.parse(response.getContentText());
    result.details.rawResponse = JSON.stringify(data).substring(0, 200);
    
    // 4. Проверяем ответ VK API
    if (data.error) {
      result.error = 'VK API вернул ошибку: ' + data.error.error_msg;
      result.details.errorCode = data.error.error_code;
      result.details.errorMsg = data.error.error_msg;
      
      // Специфичные рекомендации по кодам ошибок
      switch (data.error.error_code) {
        case 5:
          result.details.recommendation = 'Токен НЕВАЛИДНЫЙ! Получите новый на https://vk.com/dev/access_token';
          break;
        case 27:
          result.details.recommendation = 'Токен ИСТЁК! Получите новый с правами offline';
          break;
        case 28:
          result.details.recommendation = 'Приложение заблокировано. Проверьте статус на vk.com/dev';
          break;
        default:
          result.details.recommendation = 'Проверьте документацию VK API: https://vk.com/dev/errors';
      }
      
      return result;
    }
    
    // 5. Проверяем что получили корректные данные
    if (!data.response || !Array.isArray(data.response) || data.response.length === 0) {
      result.error = 'VK API вернул пустой ответ';
      result.details.recommendation = 'Токен работает, но формат ответа неожиданный';
      return result;
    }
    
    // 6. ВСЁ ОК! Токен валидный
    result.valid = true;
    result.details.testUser = data.response[0];
    result.details.testUserName = data.response[0].first_name + ' ' + data.response[0].last_name;
    result.details.recommendation = 'Токен работает отлично! ✅';
    
    return result;
    
  } catch (e) {
    result.error = 'Исключение при проверке: ' + e.message;
    result.details.exception = e.toString();
    result.details.stack = e.stack || 'Stack trace недоступен';
    result.details.recommendation = 'Проверьте логи Apps Script для детальной ошибки';
    return result;
  }
}

/**
 * Проверка валидности VK_TOKEN с детальным отчётом в UI
 * Для вызова из меню или вручную
 */
function checkVkTokenValidity() {
  var result = validateVkToken();
  var ui = SpreadsheetApp.getUi();
  
  var report = [];
  report.push('🔍 ПРОВЕРКА VK_TOKEN');
  report.push('═'.repeat(40));
  report.push('');
  
  if (result.valid) {
    report.push('✅ СТАТУС: ВАЛИДНЫЙ!');
    report.push('');
    report.push('📊 ДЕТАЛИ:');
    report.push('• Токен: ' + (result.token || 'скрыт'));
    report.push('• HTTP Code: ' + result.details.httpCode);
    report.push('• Тестовый запрос: users.get(id=1)');
    report.push('• Результат: ' + result.details.testUserName);
    report.push('');
    report.push('🎉 ' + result.details.recommendation);
    
  } else {
    report.push('❌ СТАТУС: НЕВАЛИДНЫЙ!');
    report.push('');
    report.push('🔴 ОШИБКА:');
    report.push(result.error || 'Неизвестная ошибка');
    report.push('');
    
    if (result.details.errorCode) {
      report.push('📋 КОД ОШИБКИ VK API: ' + result.details.errorCode);
      report.push('📝 СООБЩЕНИЕ: ' + result.details.errorMsg);
      report.push('');
    }
    
    if (result.details.httpCode) {
      report.push('🌐 HTTP Code: ' + result.details.httpCode);
    }
    
    if (result.token) {
      report.push('🔑 Токен найден: ' + result.token);
    }
    
    report.push('');
    report.push('💡 РЕКОМЕНДАЦИЯ:');
    report.push(result.details.recommendation || 'Проверьте настройки');
    
    if (result.details.stack) {
      report.push('');
      report.push('🔧 Для разработчика:');
      report.push(result.details.stack.substring(0, 200));
    }
  }
  
  ui.alert(
    result.valid ? '✅ VK Token Valid' : '❌ VK Token Invalid',
    report.join('\n'),
    ui.ButtonSet.OK
  );
  
  // Логируем результат
  if (typeof addSystemLog === 'function') {
    addSystemLog(
      'VK Token validation: ' + (result.valid ? 'VALID ✅' : 'INVALID ❌ - ' + result.error),
      result.valid ? 'INFO' : 'ERROR',
      'VK_VALIDATION'
    );
  }
  
  return result;
}

/**
 * Быстрая проверка только наличия токена (без API запроса)
 * @return {boolean} true если токен существует
 */
function hasVkToken() {
  try {
    var token = PropertiesService.getScriptProperties().getProperty('VK_TOKEN');
    return !!(token && token.trim() !== '');
  } catch (e) {
    return false;
  }
}

/**
 * Проверка прав токена через VK API (wall.get)
 * @return {Object} {hasWallAccess: boolean, error: string|null}
 */
function checkVkTokenPermissions() {
  var result = {
    hasWallAccess: false,
    error: null
  };
  
  try {
    var token = PropertiesService.getScriptProperties().getProperty('VK_TOKEN');
    
    if (!token) {
      result.error = 'Токен не найден';
      return result;
    }
    
    // Проверяем доступ к wall.get (публичная стена Павла Дурова - всегда доступна)
    var apiUrl = 'https://api.vk.com/method/wall.get?owner_id=1&count=1&access_token=' + 
                 encodeURIComponent(token) + 
                 '&v=5.131';
    
    var response = UrlFetchApp.fetch(apiUrl, {
      method: 'GET',
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      result.error = 'HTTP ' + response.getResponseCode();
      return result;
    }
    
    var data = JSON.parse(response.getContentText());
    
    if (data.error) {
      result.error = data.error.error_msg + ' (код: ' + data.error.error_code + ')';
      return result;
    }
    
    if (data.response && data.response.items) {
      result.hasWallAccess = true;
    }
    
    return result;
    
  } catch (e) {
    result.error = 'Исключение: ' + e.message;
    return result;
  }
}

/**
 * Полная диагностика VK токена
 * @return {Object} Детальный отчёт о токене и его правах
 */
function diagnoseVkToken() {
  var report = {
    timestamp: new Date().toISOString(),
    exists: false,
    valid: false,
    permissions: {},
    errors: [],
    recommendations: []
  };
  
  // 1. Проверяем наличие
  report.exists = hasVkToken();
  
  if (!report.exists) {
    report.errors.push('VK_TOKEN не найден в Script Properties');
    report.recommendations.push('Добавьте VK_TOKEN в Project Settings → Script Properties');
    report.recommendations.push('Получите токен: https://vk.com/dev/access_token');
    report.recommendations.push('Права: wall (доступ к стене), offline (постоянный доступ)');
    return report;
  }
  
  // 2. Проверяем валидность
  var validation = validateVkToken();
  report.valid = validation.valid;
  report.validationDetails = validation.details;
  
  if (!validation.valid) {
    report.errors.push(validation.error);
    report.recommendations.push(validation.details.recommendation);
    return report;
  }
  
  // 3. Проверяем права
  var permissions = checkVkTokenPermissions();
  report.permissions.wall = permissions.hasWallAccess;
  
  if (!permissions.hasWallAccess) {
    report.errors.push('Нет доступа к wall.get: ' + permissions.error);
    report.recommendations.push('Получите новый токен с правами: wall, offline');
  }
  
  // 4. Итоговые рекомендации
  if (report.valid && report.permissions.wall) {
    report.recommendations.push('✅ Токен полностью рабочий! Импорт VK должен работать.');
  } else if (report.valid && !report.permissions.wall) {
    report.recommendations.push('⚠️ Токен валидный, но нет прав на wall. Получите токен с правами wall.');
  }
  
  return report;
}

/**
 * Показать полную диагностику VK токена в UI
 */
function showVkTokenDiagnosis() {
  var diagnosis = diagnoseVkToken();
  var ui = SpreadsheetApp.getUi();
  
  var lines = [];
  lines.push('🔍 ПОЛНАЯ ДИАГНОСТИКА VK_TOKEN');
  lines.push('═'.repeat(45));
  lines.push('');
  lines.push('📊 СТАТУС:');
  lines.push('• Существует: ' + (diagnosis.exists ? '✅' : '❌'));
  lines.push('• Валидный: ' + (diagnosis.valid ? '✅' : '❌'));
  lines.push('• Права wall: ' + (diagnosis.permissions.wall ? '✅' : '❌'));
  lines.push('');
  
  if (diagnosis.errors.length > 0) {
    lines.push('❌ ОШИБКИ:');
    diagnosis.errors.forEach(function(err) {
      lines.push('• ' + err);
    });
    lines.push('');
  }
  
  if (diagnosis.recommendations.length > 0) {
    lines.push('💡 РЕКОМЕНДАЦИИ:');
    diagnosis.recommendations.forEach(function(rec) {
      lines.push('• ' + rec);
    });
  }
  
  lines.push('');
  lines.push('🕒 Проверено: ' + new Date().toLocaleString('ru-RU'));
  
  ui.alert('VK Token Diagnosis', lines.join('\n'), ui.ButtonSet.OK);
  
  if (typeof addSystemLog === 'function') {
    addSystemLog(
      'VK Token diagnosis: exists=' + diagnosis.exists + ', valid=' + diagnosis.valid + ', wall=' + diagnosis.permissions.wall,
      diagnosis.valid && diagnosis.permissions.wall ? 'INFO' : 'WARN',
      'VK_DIAGNOSIS'
    );
  }
  
  return diagnosis;
}
