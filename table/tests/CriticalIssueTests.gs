/**
 * Critical Issues & Edge Case Tests v1.0
 * Тестирование критических ошибок и граничных случаев
 * НАЙДЕННЫЕ ПРОБЛЕМЫ И ИХ ПРОВЕРКА
 */

/**
 * 🚨 ПРОБЛЕМА 1: USER_AGENT не определен в Instagram запросах
 */
function testInstagramUserAgentIssue() {
  addSystemLog('🚨 Тестирование проблемы с USER_AGENT в Instagram', 'WARN', 'CRITICAL_TEST');
  
  try {
    // Проверяем, определена ли константа USER_AGENT
    if (typeof USER_AGENT === 'undefined') {
      throw new Error('USER_AGENT не определен! Instagram запросы будут заблокированы');
    }
    
    addSystemLog('✅ USER_AGENT определен: ' + USER_AGENT, 'INFO', 'CRITICAL_TEST');
    
    // Пробуем реальный запрос к Instagram
    var testUrl = 'https://www.instagram.com/api/v1/users/web_profile_info/?username=instagram';
    var options = {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'X-IG-App-ID': '936619743392459'
      },
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(testUrl, options);
    var statusCode = response.getResponseCode();
    
    if (statusCode === 200) {
      addSystemLog('✅ Instagram API доступен (HTTP 200)', 'INFO', 'CRITICAL_TEST');
      return { success: true, statusCode: statusCode };
    } else {
      addSystemLog('⚠️ Instagram API вернул: HTTP ' + statusCode, 'WARN', 'CRITICAL_TEST');
      return { success: false, statusCode: statusCode, issue: 'HTTP_' + statusCode };
    }
    
  } catch (error) {
    addSystemLog('❌ Критическая ошибка Instagram API: ' + error.message, 'ERROR', 'CRITICAL_TEST');
    return { success: false, error: error.message };
  }
}

/**
 * 🚨 ПРОБЛЕМА 2: VK_PARSER_URL может быть недоступен
 */
function testVKParserAvailability() {
  addSystemLog('🚨 Тестирование доступности VK_PARSER_URL', 'WARN', 'CRITICAL_TEST');
  
  try {
    if (typeof VK_PARSER_URL === 'undefined') {
      throw new Error('VK_PARSER_URL не определен!');
    }
    
    addSystemLog('📝 Тестируем VK Parser: ' + VK_PARSER_URL, 'INFO', 'CRITICAL_TEST');
    
    var testUrl = VK_PARSER_URL + '?owner=durov&count=1';
    var response = UrlFetchApp.fetch(testUrl, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
      muteHttpExceptions: true,
      followRedirects: true
    });
    
    var statusCode = response.getResponseCode();
    
    if (statusCode === 200) {
      var content = response.getContentText();
      var data = JSON.parse(content);
      
      if (data.error) {
        addSystemLog('⚠️ VK Parser вернул ошибку: ' + data.error, 'WARN', 'CRITICAL_TEST');
        return { success: false, vkError: data.error };
      }
      
      if (data.posts && data.posts.length > 0) {
        addSystemLog('✅ VK Parser работает! Получен тестовый пост', 'INFO', 'CRITICAL_TEST');
        return { success: true, posts: data.posts.length };
      } else {
        addSystemLog('⚠️ VK Parser вернул пустой результат', 'WARN', 'CRITICAL_TEST');
        return { success: false, issue: 'EMPTY_RESULT' };
      }
    } else {
      addSystemLog('❌ VK Parser недоступен: HTTP ' + statusCode, 'ERROR', 'CRITICAL_TEST');
      return { success: false, statusCode: statusCode };
    }
    
  } catch (error) {
    addSystemLog('❌ Критическая ошибка VK Parser: ' + error.message, 'ERROR', 'CRITICAL_TEST');
    return { success: false, error: error.message };
  }
}

/**
 * 🚨 ПРОБЛЕМА 3: Telegram может не работать без Bot API
 */
function testTelegramAccessibility() {
  addSystemLog('🚨 Тестирование доступности Telegram каналов', 'WARN', 'CRITICAL_TEST');
  
  var testChannels = ['durov', 'telegram', 'breakingmash'];
  var results = [];
  
  testChannels.forEach(function(channel) {
    try {
      addSystemLog('→ Тестируем t.me/s/' + channel, 'INFO', 'CRITICAL_TEST');
      
      var url = 'https://t.me/s/' + channel;
      var response = UrlFetchApp.fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GoogleAppsScript)',
          'Accept': 'text/html,application/xhtml+xml'
        },
        muteHttpExceptions: true,
        followRedirects: true
      });
      
      var statusCode = response.getResponseCode();
      var content = response.getContentText();
      
      if (statusCode === 200) {
        // Проверяем, есть ли контент постов
        var hasMessages = content.includes('tgme_widget_message');
        
        if (hasMessages) {
          addSystemLog('✅ ' + channel + ': доступен и содержит посты', 'INFO', 'CRITICAL_TEST');
          results.push({ channel: channel, success: true });
        } else {
          addSystemLog('⚠️ ' + channel + ': доступен, но не содержит постов', 'WARN', 'CRITICAL_TEST');
          results.push({ channel: channel, success: false, issue: 'NO_MESSAGES' });
        }
      } else {
        addSystemLog('❌ ' + channel + ': недоступен (HTTP ' + statusCode + ')', 'ERROR', 'CRITICAL_TEST');
        results.push({ channel: channel, success: false, statusCode: statusCode });
      }
      
      Utilities.sleep(1000); // Пауза между запросами
      
    } catch (error) {
      addSystemLog('❌ Ошибка для ' + channel + ': ' + error.message, 'ERROR', 'CRITICAL_TEST');
      results.push({ channel: channel, success: false, error: error.message });
    }
  });
  
  var successCount = results.filter(function(r) { return r.success; }).length;
  addSystemLog('📊 Telegram: ' + successCount + '/' + testChannels.length + ' каналов доступны', 
              successCount > 0 ? 'INFO' : 'ERROR', 'CRITICAL_TEST');
  
  return { success: successCount > 0, results: results };
}

/**
 * 🚨 ПРОБЛЕМА 4: Rate Limiting и блокировка IP
 */
function testRateLimitingHandling() {
  addSystemLog('🚨 Тестирование обработки rate limiting', 'WARN', 'CRITICAL_TEST');
  
  var results = [];
  
  // Быстрые запросы к Instagram для проверки блокировки
  for (var i = 0; i < 3; i++) {
    try {
      var response = UrlFetchApp.fetch('https://instagram.com/instagram', {
        method: 'HEAD',
        muteHttpExceptions: true
      });
      
      var statusCode = response.getResponseCode();
      results.push({ attempt: i + 1, statusCode: statusCode });
      
      if (statusCode === 429) {
        addSystemLog('⚠️ Rate limit достигнут на попытке ' + (i + 1), 'WARN', 'CRITICAL_TEST');
        break;
      }
      
    } catch (error) {
      results.push({ attempt: i + 1, error: error.message });
    }
  }
  
  return { results: results };
}

/**
 * 🚨 ПРОБЛЕМА 5: Некорректные входные данные
 */
function testInvalidInputHandling() {
  addSystemLog('🚨 Тестирование обработки некорректных данных', 'WARN', 'CRITICAL_TEST');
  
  var invalidInputs = [
    { input: '', platform: null, expected: 'error' },
    { input: 'http://malicious-site.com', platform: null, expected: 'error' },
    { input: 'javascript:alert("xss")', platform: null, expected: 'error' },
    { input: '../../etc/passwd', platform: null, expected: 'error' },
    { input: 'very-long-string-' + 'x'.repeat(1000), platform: null, expected: 'error' },
    { input: null, platform: null, expected: 'error' },
    { input: undefined, platform: null, expected: 'error' },
    { input: 123456, platform: null, expected: 'error' },
    { input: 'durov', platform: 'invalid-platform', expected: 'error' }
  ];
  
  var results = [];
  
  invalidInputs.forEach(function(test) {
    try {
      var result = parseSource(test.input, test.platform);
      
      // Если не было ошибки, но ожидалась - это проблема
      if (test.expected === 'error') {
        addSystemLog('❌ Не было ошибки для: ' + JSON.stringify(test.input), 'ERROR', 'CRITICAL_TEST');
        results.push({ input: test.input, expected: 'error', actual: 'success', problem: true });
      }
      
    } catch (error) {
      if (test.expected === 'error') {
        addSystemLog('✅ Правильно обработана ошибка: ' + test.input, 'INFO', 'CRITICAL_TEST');
        results.push({ input: test.input, expected: 'error', actual: 'error', problem: false });
      } else {
        addSystemLog('❌ Неожиданная ошибка для: ' + test.input + ' - ' + error.message, 'ERROR', 'CRITICAL_TEST');
        results.push({ input: test.input, expected: test.expected, actual: 'error', problem: true });
      }
    }
  });
  
  var problems = results.filter(function(r) { return r.problem; }).length;
  addSystemLog('📊 Валидация входных данных: ' + (results.length - problems) + '/' + results.length + ' корректны', 
              problems === 0 ? 'INFO' : 'WARN', 'CRITICAL_TEST');
  
  return { results: results, problems: problems };
}

/**
 * 🚨 ПРОБЛЕМА 6: Отсутствие fallback механизмов
 */
function testFallbackMechanisms() {
  addSystemLog('🚨 Тестирование fallback механизмов', 'WARN', 'CRITICAL_TEST');
  
  var issues = [];
  
  // Проверяем fallback для Telegram
  try {
    addSystemLog('→ Тестируем Telegram fallback для недоступного канала', 'INFO', 'CRITICAL_TEST');
    var posts = importTelegramPosts('non-existent-channel-test-123', 1);
    
    if (posts && posts.length > 0) {
      issues.push('Telegram fallback не работает - вернул данные для несуществующего канала');
    }
  } catch (error) {
    if (!error.message.includes('fallback') && !error.message.includes('все методы')) {
      issues.push('Telegram fallback не реализован должным образом');
    } else {
      addSystemLog('✅ Telegram fallback работает корректно', 'INFO', 'CRITICAL_TEST');
    }
  }
  
  // Проверяем обработку сбоев сети
  try {
    addSystemLog('→ Тестируем обработку сетевых сбоев', 'INFO', 'CRITICAL_TEST');
    // Тестируем с несуществующим URL
    var response = UrlFetchApp.fetch('https://non-existent-domain-test-123.com', {
      muteHttpExceptions: true
    });
  } catch (error) {
    addSystemLog('✅ Сетевые ошибки обрабатываются корректно', 'INFO', 'CRITICAL_TEST');
  }
  
  return { issues: issues };
}

/**
 * 🚨 ПРОБЛЕМА 7: Производительность и таймауты
 */
function testPerformanceIssues() {
  addSystemLog('🚨 Тестирование производительности и таймаутов', 'WARN', 'CRITICAL_TEST');
  
  var tests = [];
  
  // Тест 1: Время выполнения parseSource
  var start = new Date();
  for (var i = 0; i < 100; i++) {
    try {
      parseSource('https://instagram.com/test', null);
    } catch (e) {
      // Ожидаемо для некоторых тестов
    }
  }
  var parseSourceTime = new Date() - start;
  tests.push({ name: 'parseSource x100', time: parseSourceTime, threshold: 1000 });
  
  // Тест 2: Время выполнения нормализации платформ
  start = new Date();
  for (var i = 0; i < 1000; i++) {
    normalizePlatformName('тг');
  }
  var normalizeTime = new Date() - start;
  tests.push({ name: 'normalizePlatformName x1000', time: normalizeTime, threshold: 500 });
  
  tests.forEach(function(test) {
    if (test.time > test.threshold) {
      addSystemLog('⚠️ ' + test.name + ' медленный: ' + test.time + 'мс (лимит: ' + test.threshold + 'мс)', 'WARN', 'CRITICAL_TEST');
    } else {
      addSystemLog('✅ ' + test.name + ' быстрый: ' + test.time + 'мс', 'INFO', 'CRITICAL_TEST');
    }
  });
  
  return { tests: tests };
}

/**
 * Запуск всех критических тестов
 */
function runAllCriticalTests() {
  addSystemLog('💥 Запуск всех критических тестов', 'WARN', 'CRITICAL_TEST');
  
  var results = {
    instagram: testInstagramUserAgentIssue(),
    vkParser: testVKParserAvailability(),
    telegram: testTelegramAccessibility(),
    rateLimit: testRateLimitingHandling(),
    invalidInput: testInvalidInputHandling(),
    fallback: testFallbackMechanisms(),
    performance: testPerformanceIssues()
  };
  
  // Подсчитываем критические проблемы
  var criticalIssues = 0;
  
  if (!results.instagram.success) criticalIssues++;
  if (!results.vkParser.success) criticalIssues++;
  if (!results.telegram.success) criticalIssues++;
  if (results.invalidInput.problems > 0) criticalIssues++;
  if (results.fallback.issues.length > 0) criticalIssues++;
  
  addSystemLog('📊 ИТОГО критических проблем: ' + criticalIssues, 
              criticalIssues === 0 ? 'INFO' : 'ERROR', 'CRITICAL_TEST');
  
  return {
    criticalIssues: criticalIssues,
    results: results,
    ready: criticalIssues === 0
  };
}