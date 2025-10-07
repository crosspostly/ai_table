/**
 * Real Data Testing Suite v1.0
 * Тестирование SocialImportService на реальных открытых источниках
 */

/**
 * Запуск тестирования с реальными данными
 */
function runRealDataTests() {
  Logger.log('🚀 Starting Real Data Tests...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: [],
    details: []
  };
  
  // Реальные открытые источники для тестирования
  const testCases = [
    // Instagram - популярные открытые аккаунты
    {
      name: 'Instagram URL Test',
      source: 'https://www.instagram.com/nasa/',
      platform: '',
      count: 5,
      expectedPlatform: 'instagram'
    },
    
    // Telegram - популярные открытые каналы  
    {
      name: 'Telegram URL Test',
      source: 'https://t.me/durov',
      platform: '',
      count: 3,
      expectedPlatform: 'telegram'
    },
    
    // VK - открытые группы
    {
      name: 'VK URL Test', 
      source: 'https://vk.com/club1',
      platform: '',
      count: 5,
      expectedPlatform: 'vk'
    },
    
    // Explicit platform tests
    {
      name: 'Explicit Telegram Platform',
      source: 'durov',
      platform: 'telegram', 
      count: 3,
      expectedPlatform: 'telegram'
    },
    
    {
      name: 'Explicit VK Platform',
      source: '-1',
      platform: 'vk',
      count: 3,
      expectedPlatform: 'vk'
    }
  ];
  
  for (const testCase of testCases) {
    Logger.log(`\n📝 Testing: ${testCase.name}`);
    
    try {
      // Устанавливаем параметры в тестовый лист
      const testResult = testSocialImport(
        testCase.source,
        testCase.count,
        testCase.platform,
        testCase.expectedPlatform
      );
      
      if (testResult.success) {
        results.passed++;
        results.details.push({
          test: testCase.name,
          status: 'PASS',
          message: `✅ Got ${testResult.count} posts from ${testResult.platform}`,
          data: testResult
        });
        Logger.log(`✅ PASS: ${testCase.name} - ${testResult.count} posts`);
      } else {
        results.failed++;
        results.details.push({
          test: testCase.name,
          status: 'FAIL',
          message: `❌ ${testResult.error}`,
          data: testResult
        });
        Logger.log(`❌ FAIL: ${testCase.name} - ${testResult.error}`);
      }
      
    } catch (error) {
      results.failed++;
      results.errors.push(error.message);
      results.details.push({
        test: testCase.name,
        status: 'ERROR',
        message: `💥 ${error.message}`,
        data: null
      });
      Logger.log(`💥 ERROR: ${testCase.name} - ${error.message}`);
    }
    
    // Пауза между тестами чтобы не перегружать API
    Utilities.sleep(2000);
  }
  
  // Итоговый отчет
  Logger.log('\n📊 FINAL RESULTS:');
  Logger.log(`✅ Passed: ${results.passed}`);
  Logger.log(`❌ Failed: ${results.failed}`);
  Logger.log(`📊 Total: ${results.passed + results.failed}`);
  
  if (results.errors.length > 0) {
    Logger.log('\n🚨 ERRORS:');
    results.errors.forEach(error => Logger.log(`  • ${error}`));
  }
  
  return results;
}

/**
 * Тестирование одного источника
 */
function testSocialImport(source, count, platform, expectedPlatform) {
  try {
    // Создаем временный лист для тестирования
    const ss = SpreadsheetApp.getActive();
    let testSheet = ss.getSheetByName('TestParams');
    
    if (!testSheet) {
      testSheet = ss.insertSheet('TestParams');
    }
    
    // Устанавливаем параметры
    testSheet.getRange('B1').setValue(source);
    testSheet.getRange('B2').setValue(count);
    testSheet.getRange('C1').setValue(platform);
    
    // Парсим источник через нашу функцию
    const sourceInfo = parseSource(source, normalizePlatformName(platform));
    
    Logger.log(`  📊 Parsed: platform=${sourceInfo.platform}, type=${sourceInfo.type}, value=${sourceInfo.value}`);
    
    // Проверяем что платформа определилась правильно
    if (sourceInfo.platform !== expectedPlatform) {
      return {
        success: false,
        error: `Platform mismatch: expected ${expectedPlatform}, got ${sourceInfo.platform}`
      };
    }
    
    // Тестируем импорт в зависимости от платформы
    let posts = [];
    
    switch (sourceInfo.platform) {
      case 'instagram':
        posts = importInstagramPosts(sourceInfo.value, count);
        break;
      case 'telegram':
        posts = importTelegramPosts(sourceInfo.value, count);
        break;
      case 'vk':
        posts = importVkPostsAdvanced(sourceInfo.value, count);
        break;
      default:
        throw new Error(`Unsupported platform: ${sourceInfo.platform}`);
    }
    
    // Проверяем результат
    if (!posts || posts.length === 0) {
      return {
        success: false,
        error: 'No posts returned'
      };
    }
    
    // Проверяем структуру постов
    const firstPost = posts[0];
    const requiredFields = ['platform', 'date', 'text', 'link', 'id'];
    
    for (const field of requiredFields) {
      if (!(field in firstPost)) {
        return {
          success: false,
          error: `Missing required field: ${field}`
        };
      }
    }
    
    return {
      success: true,
      platform: sourceInfo.platform,
      count: posts.length,
      posts: posts.slice(0, 3) // Первые 3 поста для примера
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Тест парсинга URL без реальных запросов
 */
function testUrlParsing() {
  Logger.log('🔗 Testing URL parsing...');
  
  const testUrls = [
    'https://www.instagram.com/nasa/',
    'https://instagram.com/natgeo',
    'https://t.me/durov',
    'https://telegram.me/channel',
    'https://vk.com/club1',
    'https://vk.com/public123456',
    'https://vk.com/nasa',
    'durov', // Должно требовать explicit platform
    '@channel', // Должно требовать explicit platform
    '-123456' // Должно требовать explicit platform
  ];
  
  for (const url of testUrls) {
    try {
      const result = parseSource(url, null);
      Logger.log(`✅ ${url} → ${result.platform} (${result.type}): ${result.value}`);
    } catch (error) {
      Logger.log(`⚠️ ${url} → ${error.message}`);
    }
  }
}

/**
 * Быстрый синтакс тест без API вызовов
 */
function quickSyntaxTest() {
  Logger.log('⚡ Quick syntax test...');
  
  try {
    // Тестируем парсинг
    const testSource = parseSource('https://www.instagram.com/nasa/', null);
    Logger.log('✅ parseSource works');
    
    // Тестируем нормализацию
    const testPlatform = normalizePlatformName('инста');
    Logger.log('✅ normalizePlatformName works: ' + testPlatform);
    
    // Тестируем что функции доступны
    if (typeof importInstagramPosts === 'function') {
      Logger.log('✅ importInstagramPosts function exists');
    }
    
    if (typeof importVkPostsAdvanced === 'function') {
      Logger.log('✅ importVkPostsAdvanced function exists');
    }
    
    if (typeof importTelegramPosts === 'function') {
      Logger.log('✅ importTelegramPosts function exists');
    } else {
      Logger.log('❌ importTelegramPosts function missing!');
    }
    
    return true;
    
  } catch (error) {
    Logger.log('❌ Syntax test failed: ' + error.message);
    return false;
  }
}

/**
 * Имитация тестирования с mock данными
 */
function testWithMockData() {
  Logger.log('🎭 Testing with mock data...');
  
  const mockPosts = [
    {
      platform: 'instagram',
      date: new Date(),
      text: 'Test post from Instagram',
      link: 'https://www.instagram.com/p/test/',
      id: 'test123',
      likes: 100,
      comments: 10
    },
    {
      platform: 'telegram', 
      date: new Date(),
      text: 'Test post from Telegram',
      link: 'https://t.me/test/123',
      id: 'test456',
      likes: 50,
      comments: 5
    }
  ];
  
  try {
    writePostsToSheet(mockPosts, 'TestPosts');
    Logger.log('✅ Mock data written successfully');
    return true;
  } catch (error) {
    Logger.log('❌ Mock data test failed: ' + error.message);
    return false;
  }
}