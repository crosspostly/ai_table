/**
 * Manual Test Runner v1.0
 * Ручное тестирование с реальными ссылками для проверки парсинга
 */

/**
 * Тестирование Instagram с реальными аккаунтами
 */
function testRealInstagramAccounts() {
  addSystemLog('📸 Ручное тестирование Instagram с реальными аккаунтами', 'INFO', 'MANUAL_TEST');
  
  var realAccounts = [
    'instagram',        // Официальный аккаунт
    'cristiano',        // Роналду - 500M+ подписчиков
    'kyliejenner',      // Кайли Дженнер - популярный аккаунт
    'selenagomez',      // Селена Гомес - много постов
    'therock'           // Дуэйн Джонсон - активный
  ];
  
  realAccounts.forEach(function(username) {
    try {
      addSystemLog('→ Тестируем @' + username, 'INFO', 'MANUAL_TEST');
      
      var posts = importInstagramPosts(username, 3);
      
      addSystemLog('✅ @' + username + ': получено ' + posts.length + ' постов', 'INFO', 'MANUAL_TEST');
      
      if (posts.length > 0) {
        var sample = posts[0];
        addSystemLog('📝 Образец: ' + sample.text.substring(0, 100) + '...', 'DEBUG', 'MANUAL_TEST');
        addSystemLog('🔗 Ссылка: ' + sample.link, 'DEBUG', 'MANUAL_TEST');
        addSystemLog('❤️ Лайков: ' + sample.likes + ', 💬 Комментариев: ' + sample.comments, 'DEBUG', 'MANUAL_TEST');
      }
      
    } catch (error) {
      addSystemLog('❌ @' + username + ': ' + error.message, 'ERROR', 'MANUAL_TEST');
    }
    
    // Пауза между запросами
    Utilities.sleep(3000);
  });
}

/**
 * Тестирование Telegram с реальными каналами
 */
function testRealTelegramChannels() {
  addSystemLog('📱 Ручное тестирование Telegram с реальными каналами', 'INFO', 'MANUAL_TEST');
  
  var realChannels = [
    'durov',           // Павел Дуров
    'breakingmash',    // Новостной канал
    'varlamov_news',   // Варламов
    'tproger',         // Типичный программист
    'habr_com'         // Хабр
  ];
  
  realChannels.forEach(function(channel) {
    try {
      addSystemLog('→ Тестируем t.me/' + channel, 'INFO', 'MANUAL_TEST');
      
      var posts = importTelegramPosts(channel, 3);
      
      addSystemLog('✅ ' + channel + ': получено ' + posts.length + ' постов', 'INFO', 'MANUAL_TEST');
      
      if (posts.length > 0) {
        var sample = posts[0];
        addSystemLog('📝 Образец: ' + sample.text.substring(0, 100) + '...', 'DEBUG', 'MANUAL_TEST');
        addSystemLog('🔗 Ссылка: ' + sample.link, 'DEBUG', 'MANUAL_TEST');
        addSystemLog('👀 Просмотров: ' + (sample.views || 0), 'DEBUG', 'MANUAL_TEST');
      }
      
    } catch (error) {
      addSystemLog('❌ ' + channel + ': ' + error.message, 'ERROR', 'MANUAL_TEST');
    }
    
    // Пауза между запросами
    Utilities.sleep(2000);
  });
}

/**
 * Тестирование VK с реальными источниками
 */
function testRealVKSources() {
  addSystemLog('🔷 Ручное тестирование VK с реальными источниками', 'INFO', 'MANUAL_TEST');
  
  var realSources = [
    'durov',          // Павел Дуров
    '-1',             // API VKontakte  
    'thecoderblog',   // IT сообщество
    'club1',          // Первая группа VK
    'apiclub'         // API клуб
  ];
  
  realSources.forEach(function(source) {
    try {
      addSystemLog('→ Тестируем vk.com/' + source, 'INFO', 'MANUAL_TEST');
      
      var posts = importVkPostsAdvanced(source, 3);
      
      addSystemLog('✅ ' + source + ': получено ' + posts.length + ' постов', 'INFO', 'MANUAL_TEST');
      
      if (posts.length > 0) {
        var sample = posts[0];
        addSystemLog('📝 Образец: ' + sample.text.substring(0, 100) + '...', 'DEBUG', 'MANUAL_TEST');
        addSystemLog('🔗 Ссылка: ' + sample.link, 'DEBUG', 'MANUAL_TEST');
        addSystemLog('❤️ Лайков: ' + sample.likes + ', 💬 Комментариев: ' + sample.comments, 'DEBUG', 'MANUAL_TEST');
      }
      
    } catch (error) {
      addSystemLog('❌ ' + source + ': ' + error.message, 'ERROR', 'MANUAL_TEST');
    }
    
    // Пауза между запросами
    Utilities.sleep(2000);
  });
}

/**
 * Тест с полными ссылками (автоопределение платформы)
 */
function testFullUrlsPlatformDetection() {
  addSystemLog('🔗 Тестирование автоопределения платформы по полным ссылкам', 'INFO', 'MANUAL_TEST');
  
  var testUrls = [
    'https://instagram.com/cristiano',
    'https://www.instagram.com/selenagomez',  
    'https://t.me/durov',
    'https://telegram.me/breakingmash',
    'https://vk.com/durov',
    'https://www.vk.com/club1'
  ];
  
  testUrls.forEach(function(url) {
    try {
      addSystemLog('→ Тестируем: ' + url, 'INFO', 'MANUAL_TEST');
      
      var sourceInfo = parseSource(url, null);
      addSystemLog('✅ Платформа: ' + sourceInfo.platform + ', тип: ' + sourceInfo.type, 'INFO', 'MANUAL_TEST');
      addSystemLog('📊 Значение: ' + sourceInfo.value, 'DEBUG', 'MANUAL_TEST');
      
    } catch (error) {
      addSystemLog('❌ ' + url + ': ' + error.message, 'ERROR', 'MANUAL_TEST');
    }
  });
}

/**
 * Тест с простыми username (должны требовать C1)
 */
function testSimpleUsernamesRequireC1() {
  addSystemLog('👤 Тестирование простых username (должны требовать C1)', 'INFO', 'MANUAL_TEST');
  
  var testUsernames = [
    'durov',
    '@durov', 
    'lena_insait',
    'cristiano',
    '-123456789',
    'channel_name'
  ];
  
  testUsernames.forEach(function(username) {
    try {
      addSystemLog('→ Тестируем: ' + username + ' (без C1)', 'INFO', 'MANUAL_TEST');
      
      var sourceInfo = parseSource(username, null);
      addSystemLog('❌ ОШИБКА: должна была быть ошибка для ' + username, 'ERROR', 'MANUAL_TEST');
      
    } catch (error) {
      if (error.message.includes('укажите платформу')) {
        addSystemLog('✅ Правильно: требуется C1 для ' + username, 'INFO', 'MANUAL_TEST');
      } else {
        addSystemLog('❌ Неожиданная ошибка для ' + username + ': ' + error.message, 'ERROR', 'MANUAL_TEST');
      }
    }
  });
}

/**
 * Тест с явным указанием платформы в C1
 */
function testExplicitPlatformC1() {
  addSystemLog('🎯 Тестирование явного указания платформы (C1)', 'INFO', 'MANUAL_TEST');
  
  var testCases = [
    { username: 'durov', platform: 'telegram' },
    { username: '@durov', platform: 'vk' },
    { username: 'lena_insait', platform: 'instagram' },
    { username: '-100124091', platform: 'telegram' },
    { username: 'cristiano', platform: 'instagram' }
  ];
  
  testCases.forEach(function(testCase) {
    try {
      addSystemLog('→ Тестируем: ' + testCase.username + ' + C1=' + testCase.platform, 'INFO', 'MANUAL_TEST');
      
      var sourceInfo = parseSource(testCase.username, testCase.platform);
      
      if (sourceInfo.platform === testCase.platform && sourceInfo.type === 'explicit') {
        addSystemLog('✅ Правильно: ' + sourceInfo.platform + ' (explicit)', 'INFO', 'MANUAL_TEST');
      } else {
        addSystemLog('❌ Неверно: ожидалось ' + testCase.platform + ' (explicit), получено ' + 
                      sourceInfo.platform + ' (' + sourceInfo.type + ')', 'ERROR', 'MANUAL_TEST');
      }
      
    } catch (error) {
      addSystemLog('❌ Ошибка для ' + testCase.username + ': ' + error.message, 'ERROR', 'MANUAL_TEST');
    }
  });
}

/**
 * Комплексный интеграционный тест с настройкой листа Параметры
 */
function testFullIntegrationWithParametersSheet() {
  addSystemLog('🔄 Комплексный интеграционный тест с листом Параметры', 'INFO', 'MANUAL_TEST');
  
  var ss = SpreadsheetApp.getActive();
  var params = ss.getSheetByName('Параметры');
  
  if (!params) {
    params = ss.insertSheet('Параметры');
    addSystemLog('✨ Создан лист Параметры для тестов', 'INFO', 'MANUAL_TEST');
  }
  
  var testScenarios = [
    {
      name: 'Instagram по ссылке',
      B1: 'https://instagram.com/cristiano',
      B2: 5,
      C1: ''
    },
    {
      name: 'Telegram с явной платформой',
      B1: 'durov',
      B2: 3,
      C1: 'тг'
    },
    {
      name: 'VK с явной платформой', 
      B1: '@durov',
      B2: 4,
      C1: 'вк'
    },
    {
      name: 'Instagram username с платформой',
      B1: 'selenagomez',
      B2: 3,
      C1: 'инста'
    }
  ];
  
  testScenarios.forEach(function(scenario) {
    try {
      addSystemLog('→ Сценарий: ' + scenario.name, 'INFO', 'MANUAL_TEST');
      
      // Настраиваем лист Параметры
      params.getRange('B1').setValue(scenario.B1);
      params.getRange('B2').setValue(scenario.B2);
      params.getRange('C1').setValue(scenario.C1);
      
      addSystemLog('📝 B1=' + scenario.B1 + ', B2=' + scenario.B2 + ', C1=' + scenario.C1, 'DEBUG', 'MANUAL_TEST');
      
      // Запускаем импорт
      var result = importSocialPosts();
      
      if (result.success) {
        addSystemLog('✅ ' + scenario.name + ': импортировано ' + result.count + ' постов (' + result.platform + ')', 'INFO', 'MANUAL_TEST');
      } else {
        addSystemLog('❌ ' + scenario.name + ': ошибка - ' + result.error, 'ERROR', 'MANUAL_TEST');
      }
      
    } catch (error) {
      addSystemLog('❌ Сценарий "' + scenario.name + '": ' + error.message, 'ERROR', 'MANUAL_TEST');
    }
    
    // Пауза между сценариями
    Utilities.sleep(3000);
  });
}

/**
 * Тест нормализации платформ
 */
function testPlatformNormalization() {
  addSystemLog('🔤 Тестирование нормализации названий платформ', 'INFO', 'MANUAL_TEST');
  
  var testCases = [
    { input: 'тг', expected: 'telegram' },
    { input: 'телеграм', expected: 'telegram' },
    { input: 'telegram', expected: 'telegram' },
    { input: 'TG', expected: 'telegram' },
    { input: 'инста', expected: 'instagram' },
    { input: 'инстаграм', expected: 'instagram' },
    { input: 'instagram', expected: 'instagram' },
    { input: 'IG', expected: 'instagram' },
    { input: 'вк', expected: 'vk' },
    { input: 'вконтакте', expected: 'vk' },
    { input: 'VK', expected: 'vk' },
    { input: 'facebook', expected: null },
    { input: '', expected: null }
  ];
  
  testCases.forEach(function(testCase) {
    var result = normalizePlatformName(testCase.input);
    
    if (result === testCase.expected) {
      addSystemLog('✅ "' + testCase.input + '" → "' + result + '"', 'INFO', 'MANUAL_TEST');
    } else {
      addSystemLog('❌ "' + testCase.input + '": ожидалось "' + testCase.expected + '", получено "' + result + '"', 'ERROR', 'MANUAL_TEST');
    }
  });
}

/**
 * Запуск всех ручных тестов последовательно
 */
function runAllManualTests() {
  addSystemLog('🚀 Запуск всех ручных тестов', 'INFO', 'MANUAL_TEST');
  
  var startTime = new Date();
  
  try {
    // Быстрые тесты логики
    testPlatformNormalization();
    testFullUrlsPlatformDetection();
    testSimpleUsernamesRequireC1();
    testExplicitPlatformC1();
    
    // Тесты парсинга (медленные)
    addSystemLog('⏰ Переходим к тестам парсинга (займет время)...', 'INFO', 'MANUAL_TEST');
    
    testRealInstagramAccounts();
    testRealTelegramChannels(); 
    testRealVKSources();
    
    // Интеграционный тест
    testFullIntegrationWithParametersSheet();
    
    var duration = new Date() - startTime;
    addSystemLog('🎉 Все ручные тесты завершены за ' + Math.round(duration / 1000) + ' секунд', 'INFO', 'MANUAL_TEST');
    
  } catch (error) {
    addSystemLog('💥 Критическая ошибка в ручных тестах: ' + error.message, 'ERROR', 'MANUAL_TEST');
  }
}