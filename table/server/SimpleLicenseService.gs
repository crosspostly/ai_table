/**
 * Simple License Service v1.0
 * Базовая проверка лицензий для Table AI Bot
 * Этот сервис заменяет отсутствующую функцию checkUserLicense
 */

/**
 * Проверка пользовательской лицензии
 * @param {string} email - email пользователя
 * @param {string} token - токен лицензии
 * @return {Object} - результат проверки
 */
function checkUserLicense(email, token) {
  // Валидация входных параметров
  if (!email || !token) {
    return {
      ok: false,
      error: 'Email и токен обязательны',
      code: 'MISSING_CREDENTIALS'
    };
  }
  
  // Простая проверка формата email
  if (!isValidEmail(email)) {
    return {
      ok: false,
      error: 'Неверный формат email',
      code: 'INVALID_EMAIL'
    };
  }
  
  try {
    // Временная реализация - принимаем все валидные email/token пары
    // В production версии здесь будет реальная проверка по базе данных
    
    // Проверяем что токен не пустой и имеет минимальную длину
    if (token.length < 8) {
      return {
        ok: false,
        error: 'Токен слишком короткий',
        code: 'INVALID_TOKEN_LENGTH'
      };
    }
    
    // Hardcoded admin emails (временно)
    var adminEmails = [
      'admin@tableai.bot',
      'test@test.com',
      'support@tableai.bot'
    ];
    
    var isAdmin = adminEmails.includes(email.toLowerCase());
    
    // Для тестового режима - все non-empty токены считаются валидными
    if (token === 'test-token' || token === 'demo' || isAdmin) {
      return {
        ok: true,
        email: email,
        token: maskToken(token),
        type: isAdmin ? 'admin' : 'demo',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
        limits: {
          dailyRequests: isAdmin ? 10000 : 100,
          monthlyRequests: isAdmin ? 100000 : 3000
        },
        row: 1 // Для совместимости с оригинальным API
      };
    }
    
    // Проверяем rate limiting
    var rateLimitResult = checkUserRateLimit(email);
    if (!rateLimitResult.allowed) {
      return {
        ok: false,
        error: 'Превышен лимит запросов',
        code: 'RATE_LIMIT_EXCEEDED',
        resetTime: rateLimitResult.resetTime
      };
    }
    
    // В реальной имплементации здесь был бы запрос к лицензионной таблице
    // Сейчас возвращаем успех для любых токенов длиной 8+ символов
    if (token.length >= 8) {
      return {
        ok: true,
        email: email,
        token: maskToken(token),
        type: 'basic',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
        limits: {
          dailyRequests: 50,
          monthlyRequests: 1500
        },
        row: 2
      };
    }
    
    return {
      ok: false,
      error: 'Неверный токен лицензии',
      code: 'INVALID_TOKEN'
    };
    
  } catch (error) {
    addSystemLog('License check error: ' + error.message, 'ERROR', 'LICENSE');
    
    return {
      ok: false,
      error: 'Ошибка сервера при проверке лицензии',
      code: 'SERVER_ERROR',
      details: error.message
    };
  }
}

/**
 * Проверка валидности email адреса
 * @param {string} email - email для проверки
 * @return {boolean} - true если валидный
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  var emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailPattern.test(email.trim());
}

/**
 * Маскировка токена для логов
 * @param {string} token - токен
 * @return {string} - замаскированный токен
 */
function maskToken(token) {
  if (!token || token.length < 8) return '***';
  
  return token.substr(0, 4) + '***' + token.substr(-2);
}

/**
 * Проверка rate limit для пользователя
 * @param {string} email - email пользователя
 * @return {Object} - результат проверки
 */
function checkUserRateLimit(email) {
  try {
    var cache = PropertiesService.getScriptProperties();
    var key = 'rate_limit_' + email;
    var now = Date.now();
    
    var stored = cache.getProperty(key);
    if (stored) {
      var data = JSON.parse(stored);
      var timeWindow = 24 * 60 * 60 * 1000; // 24 часа
      
      // Очищаем старые записи
      data.requests = data.requests.filter(function(time) {
        return now - time < timeWindow;
      });
      
      // Проверяем лимит (100 запросов в день для обычных пользователей)
      var dailyLimit = 100;
      if (data.requests.length >= dailyLimit) {
        return {
          allowed: false,
          current: data.requests.length,
          limit: dailyLimit,
          resetTime: Math.min.apply(Math, data.requests) + timeWindow
        };
      }
      
      // Добавляем текущий запрос
      data.requests.push(now);
      cache.setProperty(key, JSON.stringify(data));
      
    } else {
      // Первый запрос
      cache.setProperty(key, JSON.stringify({ requests: [now] }));
    }
    
    return {
      allowed: true,
      current: stored ? JSON.parse(stored).requests.length + 1 : 1,
      limit: 100
    };
    
  } catch (error) {
    // Если проверка rate limit не работает - разрешаем запрос
    addSystemLog('Rate limit check failed: ' + error.message, 'WARN', 'LICENSE');
    return { allowed: true, error: error.message };
  }
}

/**
 * Получение статистики лицензий
 * @return {Object} - статистика
 */
function getLicenseStats() {
  try {
    var props = PropertiesService.getScriptProperties();
    var allProps = props.getProperties();
    
    var stats = {
      totalUsers: 0,
      activeToday: 0,
      rateLimitedUsers: 0,
      topUsers: []
    };
    
    var today = new Date().toDateString();
    var userActivity = {};
    
    Object.keys(allProps).forEach(function(key) {
      if (key.startsWith('rate_limit_')) {
        var email = key.replace('rate_limit_', '');
        stats.totalUsers++;
        
        try {
          var data = JSON.parse(allProps[key]);
          var todayRequests = data.requests.filter(function(time) {
            return new Date(time).toDateString() === today;
          });
          
          if (todayRequests.length > 0) {
            stats.activeToday++;
            userActivity[email] = todayRequests.length;
          }
          
          if (todayRequests.length >= 100) {
            stats.rateLimitedUsers++;
          }
          
        } catch (e) {
          // Пропускаем невалидные записи
        }
      }
    });
    
    // Топ активных пользователей
    stats.topUsers = Object.keys(userActivity)
      .sort(function(a, b) {
        return userActivity[b] - userActivity[a];
      })
      .slice(0, 10)
      .map(function(email) {
        return {
          email: maskEmail(email),
          requests: userActivity[email]
        };
      });
    
    return stats;
    
  } catch (error) {
    addSystemLog('Failed to get license stats: ' + error.message, 'ERROR', 'LICENSE');
    return {
      totalUsers: 0,
      error: error.message
    };
  }
}

/**
 * Очистка старых данных rate limiting
 */
function cleanupRateLimitData() {
  try {
    var props = PropertiesService.getScriptProperties();
    var allProps = props.getProperties();
    var now = Date.now();
    var weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    var cleanedCount = 0;
    
    Object.keys(allProps).forEach(function(key) {
      if (key.startsWith('rate_limit_')) {
        try {
          var data = JSON.parse(allProps[key]);
          
          // Удаляем запросы старше недели
          var filteredRequests = data.requests.filter(function(time) {
            return time > weekAgo;
          });
          
          if (filteredRequests.length === 0) {
            // Удаляем полностью неактивных пользователей
            props.deleteProperty(key);
            cleanedCount++;
          } else if (filteredRequests.length < data.requests.length) {
            // Обновляем с отфильтрованными данными
            data.requests = filteredRequests;
            props.setProperty(key, JSON.stringify(data));
          }
          
        } catch (e) {
          // Удаляем невалидные записи
          props.deleteProperty(key);
          cleanedCount++;
        }
      }
    });
    
    addSystemLog(`Rate limit cleanup completed: ${cleanedCount} entries cleaned`, 'INFO', 'LICENSE');
    
  } catch (error) {
    addSystemLog('Rate limit cleanup failed: ' + error.message, 'ERROR', 'LICENSE');
  }
}

/**
 * Тестовая функция для проверки лицензионной системы
 * @return {Object} - результаты тестов
 */
function testLicenseSystem() {
  var results = {
    tests: [],
    passed: 0,
    failed: 0
  };
  
  var addTest = function(name, success, message) {
    results.tests.push({ name: name, success: success, message: message });
    if (success) results.passed++; else results.failed++;
  };
  
  // Тест 1: Пустые credentials
  var test1 = checkUserLicense('', '');
  addTest('Empty credentials', !test1.ok, test1.error);
  
  // Тест 2: Неверный email
  var test2 = checkUserLicense('invalid-email', 'token123');
  addTest('Invalid email', !test2.ok, test2.error);
  
  // Тест 3: Короткий токен
  var test3 = checkUserLicense('test@example.com', '123');
  addTest('Short token', !test3.ok, test3.error);
  
  // Тест 4: Валидные данные
  var test4 = checkUserLicense('test@example.com', 'validtoken123');
  addTest('Valid credentials', test4.ok, test4.type);
  
  // Тест 5: Admin email
  var test5 = checkUserLicense('admin@tableai.bot', 'admin-token');
  addTest('Admin credentials', test5.ok && test5.type === 'admin', test5.type);
  
  return results;
}