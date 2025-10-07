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
      };\n    }\n    \n    // Проверяем rate limiting\n    var rateLimitResult = checkUserRateLimit(email);\n    if (!rateLimitResult.allowed) {\n      return {\n        ok: false,\n        error: 'Превышен лимит запросов',\n        code: 'RATE_LIMIT_EXCEEDED',\n        resetTime: rateLimitResult.resetTime\n      };\n    }\n    \n    // В реальной имплементации здесь был бы запрос к лицензионной таблице\n    // Сейчас возвращаем успех для любых токенов длиной 8+ символов\n    if (token.length >= 8) {\n      return {\n        ok: true,\n        email: email,\n        token: maskToken(token),\n        type: 'basic',\n        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней\n        limits: {\n          dailyRequests: 50,\n          monthlyRequests: 1500\n        },\n        row: 2\n      };\n    }\n    \n    return {\n      ok: false,\n      error: 'Неверный токен лицензии',\n      code: 'INVALID_TOKEN'\n    };\n    \n  } catch (error) {\n    addSystemLog('License check error: ' + error.message, 'ERROR', 'LICENSE');\n    \n    return {\n      ok: false,\n      error: 'Ошибка сервера при проверке лицензии',\n      code: 'SERVER_ERROR',\n      details: error.message\n    };\n  }\n}\n\n/**\n * Проверка валидности email адреса\n * @param {string} email - email для проверки\n * @return {boolean} - true если валидный\n */\nfunction isValidEmail(email) {\n  if (!email || typeof email !== 'string') return false;\n  \n  var emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\n  return emailPattern.test(email.trim());\n}\n\n/**\n * Маскировка токена для логов\n * @param {string} token - токен\n * @return {string} - замаскированный токен\n */\nfunction maskToken(token) {\n  if (!token || token.length < 8) return '***';\n  \n  return token.substr(0, 4) + '***' + token.substr(-2);\n}\n\n/**\n * Проверка rate limit для пользователя\n * @param {string} email - email пользователя\n * @return {Object} - результат проверки\n */\nfunction checkUserRateLimit(email) {\n  try {\n    var cache = PropertiesService.getScriptProperties();\n    var key = 'rate_limit_' + email;\n    var now = Date.now();\n    \n    var stored = cache.getProperty(key);\n    if (stored) {\n      var data = JSON.parse(stored);\n      var timeWindow = 24 * 60 * 60 * 1000; // 24 часа\n      \n      // Очищаем старые записи\n      data.requests = data.requests.filter(function(time) {\n        return now - time < timeWindow;\n      });\n      \n      // Проверяем лимит (100 запросов в день для обычных пользователей)\n      var dailyLimit = 100;\n      if (data.requests.length >= dailyLimit) {\n        return {\n          allowed: false,\n          current: data.requests.length,\n          limit: dailyLimit,\n          resetTime: Math.min.apply(Math, data.requests) + timeWindow\n        };\n      }\n      \n      // Добавляем текущий запрос\n      data.requests.push(now);\n      cache.setProperty(key, JSON.stringify(data));\n      \n    } else {\n      // Первый запрос\n      cache.setProperty(key, JSON.stringify({ requests: [now] }));\n    }\n    \n    return {\n      allowed: true,\n      current: stored ? JSON.parse(stored).requests.length + 1 : 1,\n      limit: 100\n    };\n    \n  } catch (error) {\n    // Если проверка rate limit не работает - разрешаем запрос\n    addSystemLog('Rate limit check failed: ' + error.message, 'WARN', 'LICENSE');\n    return { allowed: true, error: error.message };\n  }\n}\n\n/**\n * Получение статистики лицензий\n * @return {Object} - статистика\n */\nfunction getLicenseStats() {\n  try {\n    var props = PropertiesService.getScriptProperties();\n    var allProps = props.getProperties();\n    \n    var stats = {\n      totalUsers: 0,\n      activeToday: 0,\n      rateLimitedUsers: 0,\n      topUsers: []\n    };\n    \n    var today = new Date().toDateString();\n    var userActivity = {};\n    \n    Object.keys(allProps).forEach(function(key) {\n      if (key.startsWith('rate_limit_')) {\n        var email = key.replace('rate_limit_', '');\n        stats.totalUsers++;\n        \n        try {\n          var data = JSON.parse(allProps[key]);\n          var todayRequests = data.requests.filter(function(time) {\n            return new Date(time).toDateString() === today;\n          });\n          \n          if (todayRequests.length > 0) {\n            stats.activeToday++;\n            userActivity[email] = todayRequests.length;\n          }\n          \n          if (todayRequests.length >= 100) {\n            stats.rateLimitedUsers++;\n          }\n          \n        } catch (e) {\n          // Пропускаем невалидные записи\n        }\n      }\n    });\n    \n    // Топ активных пользователей\n    stats.topUsers = Object.keys(userActivity)\n      .sort(function(a, b) {\n        return userActivity[b] - userActivity[a];\n      })\n      .slice(0, 10)\n      .map(function(email) {\n        return {\n          email: maskEmail(email),\n          requests: userActivity[email]\n        };\n      });\n    \n    return stats;\n    \n  } catch (error) {\n    addSystemLog('Failed to get license stats: ' + error.message, 'ERROR', 'LICENSE');\n    return {\n      totalUsers: 0,\n      error: error.message\n    };\n  }\n}\n\n/**\n * Очистка старых данных rate limiting\n */\nfunction cleanupRateLimitData() {\n  try {\n    var props = PropertiesService.getScriptProperties();\n    var allProps = props.getProperties();\n    var now = Date.now();\n    var weekAgo = now - (7 * 24 * 60 * 60 * 1000);\n    \n    var cleanedCount = 0;\n    \n    Object.keys(allProps).forEach(function(key) {\n      if (key.startsWith('rate_limit_')) {\n        try {\n          var data = JSON.parse(allProps[key]);\n          \n          // Удаляем запросы старше недели\n          var filteredRequests = data.requests.filter(function(time) {\n            return time > weekAgo;\n          });\n          \n          if (filteredRequests.length === 0) {\n            // Удаляем полностью неактивных пользователей\n            props.deleteProperty(key);\n            cleanedCount++;\n          } else if (filteredRequests.length < data.requests.length) {\n            // Обновляем с отфильтрованными данными\n            data.requests = filteredRequests;\n            props.setProperty(key, JSON.stringify(data));\n          }\n          \n        } catch (e) {\n          // Удаляем невалидные записи\n          props.deleteProperty(key);\n          cleanedCount++;\n        }\n      }\n    });\n    \n    addSystemLog(`Rate limit cleanup completed: ${cleanedCount} entries cleaned`, 'INFO', 'LICENSE');\n    \n  } catch (error) {\n    addSystemLog('Rate limit cleanup failed: ' + error.message, 'ERROR', 'LICENSE');\n  }\n}\n\n/**\n * Тестовая функция для проверки лицензионной системы\n * @return {Object} - результаты тестов\n */\nfunction testLicenseSystem() {\n  var results = {\n    tests: [],\n    passed: 0,\n    failed: 0\n  };\n  \n  var addTest = function(name, success, message) {\n    results.tests.push({ name: name, success: success, message: message });\n    if (success) results.passed++; else results.failed++;\n  };\n  \n  // Тест 1: Пустые credentials\n  var test1 = checkUserLicense('', '');\n  addTest('Empty credentials', !test1.ok, test1.error);\n  \n  // Тест 2: Неверный email\n  var test2 = checkUserLicense('invalid-email', 'token123');\n  addTest('Invalid email', !test2.ok, test2.error);\n  \n  // Тест 3: Короткий токен\n  var test3 = checkUserLicense('test@example.com', '123');\n  addTest('Short token', !test3.ok, test3.error);\n  \n  // Тест 4: Валидные данные\n  var test4 = checkUserLicense('test@example.com', 'validtoken123');\n  addTest('Valid credentials', test4.ok, test4.type);\n  \n  // Тест 5: Admin email\n  var test5 = checkUserLicense('admin@tableai.bot', 'admin-token');\n  addTest('Admin credentials', test5.ok && test5.type === 'admin', test5.type);\n  \n  return results;\n}"