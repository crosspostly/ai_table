/**
 * Comprehensive Social Media Import Tests v1.0
 * Тестирование парсинга постов из Instagram, Telegram и VK
 * с реальными ссылками и различными сценариями
 */

/**
 * Главная функция запуска всех тестов
 */
function runAllSocialImportTests() {
  addSystemLog('🧪 Запуск полного тестирования социальных сетей', 'INFO', 'TESTS');
  
  var results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };
  
  // Тесты Instagram
  var instagramTests = testInstagramParsing();
  results.total += instagramTests.length;
  results.passed += instagramTests.filter(function(t) { return t.passed; }).length;
  results.failed += instagramTests.filter(function(t) { return !t.passed; }).length;
  results.details = results.details.concat(instagramTests);
  
  // Тесты Telegram
  var telegramTests = testTelegramParsing();
  results.total += telegramTests.length;
  results.passed += telegramTests.filter(function(t) { return t.passed; }).length;
  results.failed += telegramTests.filter(function(t) { return !t.passed; }).length;
  results.details = results.details.concat(telegramTests);
  
  // Тесты VK
  var vkTests = testVKParsing();
  results.total += vkTests.length;
  results.passed += vkTests.filter(function(t) { return t.passed; }).length;
  results.failed += vkTests.filter(function(t) { return !t.passed; }).length;
  results.details = results.details.concat(vkTests);
  
  // Тесты логики определения платформы
  var logicTests = testPlatformDetectionLogic();
  results.total += logicTests.length;
  results.passed += logicTests.filter(function(t) { return t.passed; }).length;
  results.failed += logicTests.filter(function(t) { return !t.passed; }).length;
  results.details = results.details.concat(logicTests);
  
  // Записываем результаты в лист
  writeTestResultsToSheet(results);
  
  addSystemLog('✅ Тестирование завершено: ' + results.passed + '/' + results.total + ' прошли', 
                results.failed > 0 ? 'WARN' : 'INFO', 'TESTS');
  
  return results;
}

/**
 * Тестирование Instagram парсинга
 */
function testInstagramParsing() {
  addSystemLog('📸 Тестирование Instagram...', 'INFO', 'TESTS');
  
  var tests = [];
  
  // Реальные Instagram аккаунты для тестирования
  var testAccounts = [
    { username: 'instagram', description: 'Официальный аккаунт Instagram' },
    { username: 'cristiano', description: 'Криштиану Роналду - популярный аккаунт' },
    { username: 'selenagomez', description: 'Селена Гомес - много постов' },
    { username: 'therock', description: 'Дуэйн Джонсон - активный аккаунт' }
  ];
  
  testAccounts.forEach(function(account) {
    tests.push(runSingleTest('Instagram: ' + account.username, function() {
      var posts = importInstagramPosts(account.username, 5);
      
      if (!posts || posts.length === 0) {
        throw new Error('Не получено ни одного поста');
      }
      
      // Проверяем структуру первого поста
      var firstPost = posts[0];
      if (!firstPost.platform || firstPost.platform !== 'instagram') {
        throw new Error('Неверная платформа: ' + firstPost.platform);
      }
      
      if (!firstPost.text && !firstPost.link) {
        throw new Error('Отсутствуют text и link');
      }
      
      if (!firstPost.date || !(firstPost.date instanceof Date)) {
        throw new Error('Неверная дата: ' + firstPost.date);
      }
      
      if (!firstPost.id) {
        throw new Error('Отсутствует ID поста');
      }
      
      return {
        success: true,
        posts: posts.length,
        sample: {
          text: firstPost.text.substring(0, 50) + '...',
          link: firstPost.link,
          date: firstPost.date,
          likes: firstPost.likes
        }
      };
    }));
  });
  
  return tests;
}

/**
 * Тестирование Telegram парсинга
 */
function testTelegramParsing() {
  addSystemLog('📱 Тестирование Telegram...', 'INFO', 'TESTS');
  
  var tests = [];
  
  // Реальные публичные Telegram каналы
  var testChannels = [
    { name: 'durov', description: 'Павел Дуров - основатель Telegram' },
    { name: 'breakingmash', description: 'Breaking Mash - новостной канал' },
    { name: 'varlamov_news', description: 'Варламов - популярный блогер' },
    { name: 'tproger', description: 'Типичный программист' }
  ];
  
  testChannels.forEach(function(channel) {
    tests.push(runSingleTest('Telegram: ' + channel.name, function() {
      var posts = importTelegramPosts(channel.name, 3);
      
      if (!posts || posts.length === 0) {
        throw new Error('Не получено ни одного поста');
      }
      
      // Проверяем структуру первого поста
      var firstPost = posts[0];
      if (!firstPost.platform || firstPost.platform !== 'telegram') {
        throw new Error('Неверная платформа: ' + firstPost.platform);
      }
      
      if (!firstPost.text && !firstPost.link) {
        throw new Error('Отсутствуют text и link');
      }
      
      if (!firstPost.date || !(firstPost.date instanceof Date)) {
        throw new Error('Неверная дата: ' + firstPost.date);
      }
      
      return {
        success: true,
        posts: posts.length,
        method: posts[0].method || 'unknown',
        sample: {
          text: firstPost.text.substring(0, 50) + '...',
          link: firstPost.link,
          views: firstPost.views || 0
        }
      };
    }));
  });
  
  return tests;
}

/**
 * Тестирование VK парсинга
 */
function testVKParsing() {
  addSystemLog('🔷 Тестирование VK...', 'INFO', 'TESTS');
  
  var tests = [];
  
  // Реальные VK источники
  var testSources = [
    { source: 'durov', description: 'Павел Дуров - основатель VK' },
    { source: '-1', description: 'API VKontakte - официальная группа' },
    { source: 'thecoderblog', description: 'Популярная IT группа' },
    { source: 'club1', description: 'Первая группа VK' }
  ];
  
  testSources.forEach(function(src) {
    tests.push(runSingleTest('VK: ' + src.source, function() {
      var posts = importVkPostsAdvanced(src.source, 3);
      
      if (!posts || posts.length === 0) {
        throw new Error('Не получено ни одного поста');
      }
      
      // Проверяем структуру первого поста
      var firstPost = posts[0];
      if (!firstPost.platform || firstPost.platform !== 'vk') {
        throw new Error('Неверная платформа: ' + firstPost.platform);
      }
      
      if (!firstPost.link) {
        throw new Error('Отсутствует ссылка на пост');
      }
      
      if (!firstPost.date || !(firstPost.date instanceof Date)) {
        throw new Error('Неверная дата: ' + firstPost.date);
      }
      
      if (!firstPost.id) {
        throw new Error('Отсутствует ID поста');
      }
      
      return {
        success: true,
        posts: posts.length,
        sample: {
          text: firstPost.text.substring(0, 50) + '...',
          link: firstPost.link,
          likes: firstPost.likes || 0,
          comments: firstPost.comments || 0
        }
      };
    }));
  });
  
  return tests;
}

/**
 * Тестирование логики определения платформы
 */
function testPlatformDetectionLogic() {
  addSystemLog('🔍 Тестирование логики определения платформы...', 'INFO', 'TESTS');
  
  var tests = [];
  
  // Тесты автоматического определения по ссылкам
  var autoDetectionTests = [
    {
      input: 'https://instagram.com/durov',
      expected: 'instagram',
      description: 'Instagram полная ссылка'
    },
    {
      input: 'https://www.instagram.com/selenagomez',
      expected: 'instagram', 
      description: 'Instagram ссылка с www'
    },
    {
      input: 'https://t.me/durov',
      expected: 'telegram',
      description: 'Telegram полная ссылка'
    },
    {
      input: 'https://telegram.me/breakingmash',
      expected: 'telegram',
      description: 'Telegram альтернативный домен'
    },
    {
      input: 'https://vk.com/durov',
      expected: 'vk',
      description: 'VK полная ссылка'
    },
    {
      input: 'https://www.vk.com/club1',
      expected: 'vk',
      description: 'VK ссылка на группу'
    }
  ];
  
  autoDetectionTests.forEach(function(test) {
    tests.push(runSingleTest('Автоопределение: ' + test.description, function() {
      var result = parseSource(test.input, null);
      
      if (result.platform !== test.expected) {
        throw new Error('Ожидалось: ' + test.expected + ', получено: ' + result.platform);
      }
      
      return {
        success: true,
        input: test.input,
        detected: result.platform,
        type: result.type
      };
    }));
  });
  
  // Тесты явного указания платформы
  var explicitPlatformTests = [
    {
      input: 'durov',
      platform: 'telegram',
      description: 'Простой username с указанием TG'
    },
    {
      input: '@durov',
      platform: 'vk',
      description: '@username с указанием VK' 
    },
    {
      input: '-123456',
      platform: 'telegram',
      description: 'Отрицательный ID с указанием TG'
    },
    {
      input: 'lena_insait',
      platform: 'instagram',
      description: 'Username с подчеркиванием для Instagram'
    }
  ];
  
  explicitPlatformTests.forEach(function(test) {
    tests.push(runSingleTest('Явная платформа: ' + test.description, function() {
      var result = parseSource(test.input, test.platform);
      
      if (result.platform !== test.platform) {
        throw new Error('Ожидалось: ' + test.platform + ', получено: ' + result.platform);
      }
      
      if (result.type !== 'explicit') {
        throw new Error('Ожидался тип: explicit, получено: ' + result.type);
      }
      
      return {
        success: true,
        input: test.input,
        platform: test.platform,
        type: result.type
      };
    }));
  });
  
  // Тесты ошибок (должны выбрасывать исключения)
  var errorTests = [
    {
      input: 'durov',
      platform: null,
      description: 'Простой username без платформы'
    },
    {
      input: '@channel123',
      platform: null,
      description: '@username без платформы'
    },
    {
      input: '-987654321',
      platform: null,
      description: 'ID без платформы'
    }
  ];
  
  errorTests.forEach(function(test) {
    tests.push(runSingleTest('Ошибка: ' + test.description, function() {
      try {
        parseSource(test.input, test.platform);
        throw new Error('Должна была быть выброшена ошибка, но её не было');
      } catch (e) {
        if (e.message.includes('укажите платформу')) {
          return {
            success: true,
            input: test.input,
            expectedError: true,
            errorMessage: e.message.substring(0, 50) + '...'
          };
        } else {
          throw e; // Неожиданная ошибка
        }
      }
    }));
  });
  
  return tests;
}

/**
 * Запуск одного теста с обработкой ошибок
 */
function runSingleTest(name, testFunction) {
  var startTime = new Date();
  
  try {
    var result = testFunction();
    var duration = new Date() - startTime;
    
    addSystemLog('✅ ' + name + ' - ПРОШЁЛ (' + duration + 'мс)', 'INFO', 'TESTS');
    
    return {
      name: name,
      passed: true,
      duration: duration,
      details: result,
      error: null
    };
    
  } catch (error) {
    var duration = new Date() - startTime;
    
    addSystemLog('❌ ' + name + ' - ПРОВАЛЕН: ' + error.message, 'ERROR', 'TESTS');
    
    return {
      name: name,
      passed: false,
      duration: duration,
      details: null,
      error: error.message
    };
  }
}

/**
 * Записывает результаты тестов в Google Sheets
 */
function writeTestResultsToSheet(results) {
  try {
    var ss = SpreadsheetApp.getActive();
    var sheetName = 'TestResults_' + Utilities.formatDate(new Date(), 'GMT+3', 'yyyy-MM-dd_HH-mm');
    var sheet = ss.insertSheet(sheetName);
    
    // Заголовки
    var headers = [
      'Тест', 'Статус', 'Длительность (мс)', 'Детали', 'Ошибка', 'Время выполнения'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Форматируем заголовки
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#4285f4').setFontColor('white').setFontWeight('bold');
    
    // Записываем результаты
    var data = results.details.map(function(test) {
      return [
        test.name,
        test.passed ? '✅ ПРОШЁЛ' : '❌ ПРОВАЛЕН',
        test.duration,
        test.details ? JSON.stringify(test.details) : '',
        test.error || '',
        new Date()
      ];
    });
    
    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, headers.length).setValues(data);
    }
    
    // Добавляем суммарную статистику
    sheet.getRange(data.length + 3, 1, 1, 6).setValues([[
      'ИТОГО:', 
      results.passed + '/' + results.total + ' прошли',
      '',
      'Успешность: ' + Math.round((results.passed / results.total) * 100) + '%',
      results.failed + ' провалены',
      new Date()
    ]]);
    
    // Форматируем итоговую строку
    var summaryRange = sheet.getRange(data.length + 3, 1, 1, 6);
    summaryRange.setBackground('#f0f0f0').setFontWeight('bold');
    
    // Автоширина колонок
    sheet.autoResizeColumns(1, headers.length);
    
    addSystemLog('📊 Результаты тестов записаны в лист: ' + sheetName, 'INFO', 'TESTS');
    
  } catch (error) {
    addSystemLog('❌ Ошибка записи результатов: ' + error.message, 'ERROR', 'TESTS');
  }
}

/**
 * Быстрые тесты основных функций
 */
function runQuickSmokeTests() {
  addSystemLog('🔥 Запуск быстрых smoke-тестов...', 'INFO', 'TESTS');
  
  var tests = [];
  
  // Тест нормализации платформ
  tests.push(runSingleTest('Нормализация: тг → telegram', function() {
    var result = normalizePlatformName('тг');
    if (result !== 'telegram') {
      throw new Error('Ожидалось: telegram, получено: ' + result);
    }
    return { success: true };
  }));
  
  tests.push(runSingleTest('Нормализация: инста → instagram', function() {
    var result = normalizePlatformName('инста');
    if (result !== 'instagram') {
      throw new Error('Ожидалось: instagram, получено: ' + result);
    }
    return { success: true };
  }));
  
  tests.push(runSingleTest('Нормализация: вк → vk', function() {
    var result = normalizePlatformName('вк');
    if (result !== 'vk') {
      throw new Error('Ожидалось: vk, получено: ' + result);
    }
    return { success: true };
  }));
  
  // Базовые тесты parseSource
  tests.push(runSingleTest('parseSource: Instagram URL', function() {
    var result = parseSource('https://instagram.com/test', null);
    if (result.platform !== 'instagram') {
      throw new Error('Неверная платформа: ' + result.platform);
    }
    return { success: true, result: result };
  }));
  
  var passed = tests.filter(function(t) { return t.passed; }).length;
  var total = tests.length;
  
  addSystemLog('🔥 Smoke-тесты: ' + passed + '/' + total + ' прошли', 
                passed === total ? 'INFO' : 'WARN', 'TESTS');
  
  return {
    total: total,
    passed: passed,
    failed: total - passed,
    details: tests
  };
}