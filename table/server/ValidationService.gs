/**
 * Input Validation Service v1.0
 * Валидация и очистка пользовательских данных для предотвращения XSS и ошибок
 */

/**
 * Валидация и очистка входных данных для социального импорта
 * @param {string} sourceUrl - URL или username источника
 * @param {number} count - количество постов
 * @param {string} platform - платформа (необязательный)
 * @return {Object} - очищенные и валидированные данные
 */
function validateAndSanitizeInputs(sourceUrl, count, platform) {
  const errors = [];
  
  try {
    // 1. Проверка и очистка URL источника
    const cleanSourceUrl = validateSourceUrl(sourceUrl);
    
    // 2. Проверка и нормализация количества
    const validCount = validateCount(count);
    
    // 3. Проверка и нормализация платформы
    const cleanPlatform = validatePlatform(platform);
    
    return {
      sourceUrl: cleanSourceUrl,
      count: validCount, 
      platform: cleanPlatform,
      isValid: true
    };
    
  } catch (error) {
    addSystemLog('❌ Validation error: ' + error.message, 'ERROR', 'VALIDATION');
    throw error;
  }
}

/**
 * Валидация URL источника
 * @param {string} sourceUrl - URL или username
 * @return {string} - очищенный URL
 */
function validateSourceUrl(sourceUrl) {
  // Проверка на пустоту
  if (!sourceUrl || typeof sourceUrl !== 'string') {
    throw new Error('❌ URL источника обязателен и должен быть строкой');
  }
  
  // Очистка от лишних пробелов
  let cleanUrl = String(sourceUrl).trim();
  
  // Проверка длины
  if (cleanUrl.length === 0) {
    throw new Error('❌ URL источника не может быть пустым');
  }
  
  if (cleanUrl.length > 2000) {
    throw new Error('❌ URL слишком длинный (максимум 2000 символов)');
  }
  
  // Защита от XSS - проверка опасных протоколов
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  const lowerUrl = cleanUrl.toLowerCase();
  
  for (const scheme of dangerousSchemes) {
    if (lowerUrl.startsWith(scheme)) {
      throw new Error('❌ Недопустимый протокол URL. Используйте только https:// или http://');
    }\n  }
  
  // Проверка на HTML/JS инъекции
  if (cleanUrl.includes('<') || cleanUrl.includes('>') || cleanUrl.includes('\"') || cleanUrl.includes(\"'\")) {
    throw new Error('❌ URL содержит недопустимые символы (<, >, \", \\')');\n  }
  
  // Валидация URL если это полная ссылка
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    try {
      // Простая проверка URL структуры
      const urlPattern = /^https?:\\/\\/[^\\s/$.?#].[^\\s]*$/i;
      if (!urlPattern.test(cleanUrl)) {
        throw new Error('❌ Неверный формат URL');
      }
      
      // Проверка на подозрительные домены
      const suspiciousDomains = ['localhost', '127.0.0.1', '192.168.', '10.0.', '172.16.'];
      for (const domain of suspiciousDomains) {
        if (cleanUrl.includes(domain)) {
          throw new Error('❌ Локальные и приватные IP адреса не поддерживаются');
        }
      }
      
    } catch (error) {
      throw new Error('❌ Некорректный URL: ' + error.message);
    }
  }
  
  // Валидация username/ID
  else {
    // Проверка для @username
    if (cleanUrl.startsWith('@')) {
      cleanUrl = cleanUrl.substring(1); // Убираем @
    }
    
    // Проверка допустимых символов для username
    const usernamePattern = /^[a-zA-Z0-9_.-]+$/;
    if (!usernamePattern.test(cleanUrl) && !cleanUrl.match(/^-?\\d+$/)) {
      // Разрешаем только буквы, цифры, подчеркивание, точку, дефис
      // Или отрицательные числа для VK ID
      throw new Error('❌ Username может содержать только буквы, цифры, _, ., - или быть числовым ID');
    }
    
    // Проверка длины username
    if (cleanUrl.length > 100) {
      throw new Error('❌ Username слишком длинный (максимум 100 символов)');
    }
  }
  
  return cleanUrl;
}

/**
 * Валидация количества постов
 * @param {*} count - количество постов
 * @return {number} - валидированное количество
 */
function validateCount(count) {
  // Преобразование в число
  let numCount;
  
  if (typeof count === 'string') {
    numCount = parseInt(count, 10);
  } else if (typeof count === 'number') {
    numCount = Math.floor(count);
  } else {
    numCount = 20; // Значение по умолчанию
  }
  
  // Проверка валидности
  if (isNaN(numCount) || numCount < 1) {
    throw new Error('❌ Количество постов должно быть положительным числом (минимум 1)');
  }
  
  // Ограничение максимума
  if (numCount > 100) {
    addSystemLog('⚠️ Количество постов ограничено до 100 (было запрошено ' + numCount + ')', 'WARN', 'VALIDATION');
    numCount = 100;
  }
  
  return numCount;
}

/**
 * Валидация платформы
 * @param {string} platform - название платформы
 * @return {string|null} - нормализованное название или null
 */
function validatePlatform(platform) {
  if (!platform || typeof platform !== 'string') {
    return null; // Платформа необязательна
  }
  
  let cleanPlatform = String(platform).trim().toLowerCase();
  
  // Защита от инъекций
  if (cleanPlatform.includes('<') || cleanPlatform.includes('>') || 
      cleanPlatform.includes('\"') || cleanPlatform.includes(\"'\") ||
      cleanPlatform.includes('&') || cleanPlatform.includes(';')) {
    throw new Error('❌ Название платформы содержит недопустимые символы');
  }
  
  // Ограничение длины
  if (cleanPlatform.length > 50) {
    throw new Error('❌ Название платформы слишком длинное (максимум 50 символов)');
  }
  
  // Валидация против списка разрешенных платформ
  const validPlatforms = ['instagram', 'telegram', 'vk', 'инста', 'инстаграм', 'тг', 'телеграм', 'вк', 'вконтакте', 'ig', 'tg'];
  
  if (cleanPlatform && !validPlatforms.includes(cleanPlatform)) {
    throw new Error(`❌ Неподдерживаемая платформа: "${cleanPlatform}". Доступные: ${validPlatforms.slice(0, 6).join(', ')}`);
  }
  
  return cleanPlatform || null;
}

/**
 * Общая функция sanitization для строк
 * @param {string} input - входная строка
 * @param {Object} options - опции очистки
 * @return {string} - очищенная строка
 */
function sanitizeString(input, options = {}) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  let clean = String(input).trim();
  
  // Удаление HTML тегов если требуется
  if (options.stripHtml) {
    clean = clean.replace(/<[^>]*>/g, '');
  }
  
  // Экранирование HTML специальных символов
  if (options.escapeHtml) {
    clean = clean
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  
  // Удаление потенциально опасных символов
  if (options.removeDangerous) {
    clean = clean.replace(/[<>\"'&;(){}\\[\\]]/g, '');
  }
  
  // Ограничение длины
  if (options.maxLength && clean.length > options.maxLength) {
    clean = clean.substring(0, options.maxLength);
  }
  
  return clean;
}

/**
 * Валидация для Gemini API запросов
 * @param {string} prompt - текст промпта
 * @param {Array} posts - массив постов
 * @return {Object} - валидированные данные
 */
function validateGeminiInput(prompt, posts) {
  // Проверка промпта
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('❌ Промпт для Gemini обязателен');
  }
  
  const cleanPrompt = sanitizeString(prompt, { 
    stripHtml: true, 
    maxLength: 8000 // Ограичение для Gemini API
  });
  
  if (cleanPrompt.length === 0) {
    throw new Error('❌ Промпт не может быть пустым после очистки');
  }
  
  // Проверка постов
  if (!Array.isArray(posts)) {
    throw new Error('❌ Посты должны быть массивом');
  }
  
  if (posts.length === 0) {
    throw new Error('❌ Нет постов для анализа');
  }
  
  if (posts.length > 50) {
    addSystemLog('⚠️ Слишком много постов для Gemini, ограничиваем до 50', 'WARN', 'VALIDATION');
    posts = posts.slice(0, 50);
  }
  
  // Очистка текста постов
  const cleanPosts = posts.map((post, index) => {
    if (!post || typeof post !== 'object') {
      throw new Error(`❌ Пост ${index} имеет неверный формат`);
    }
    
    return {
      ...post,
      text: sanitizeString(post.text || '', { stripHtml: true, maxLength: 2000 }),
      platform: sanitizeString(post.platform || '', { removeDangerous: true, maxLength: 20 })
    };
  });
  
  return {
    prompt: cleanPrompt,
    posts: cleanPosts,
    isValid: true
  };
}

/**
 * Создание безопасных параметров для API вызовов
 * @param {Object} params - исходные параметры
 * @return {Object} - безопасные параметры
 */
function createSafeApiParams(params) {
  const safe = {};
  
  // Белый список разрешенных параметров
  const allowedParams = ['username', 'count', 'platform', 'channel', 'limit', 'offset'];
  
  for (const key of allowedParams) {
    if (params[key] !== undefined) {
      safe[key] = sanitizeString(String(params[key]), { 
        removeDangerous: true, 
        maxLength: 200 
      });
    }
  }
  
  return safe;
}

/**
 * Проверка rate limiting для пользователя
 * @param {string} userId - ID пользователя (может быть email или session ID)
 * @param {string} action - тип действия
 * @return {Object} - результат проверки
 */
function checkRateLimit(userId, action) {
  try {
    // Используем PropertiesService для хранения rate limit данных
    const cache = PropertiesService.getScriptProperties();
    const key = `rate_limit_${userId}_${action}`;
    const now = Date.now();
    
    const stored = cache.getProperty(key);
    if (stored) {
      const data = JSON.parse(stored);
      
      // Проверяем лимиты (например, 20 запросов в час)
      const hourLimits = {
        'social_import': 20,
        'gemini_request': 50,
        'general': 100
      };
      
      const limit = hourLimits[action] || hourLimits['general'];
      const timeWindow = 60 * 60 * 1000; // 1 час
      
      // Очищаем старые записи
      data.requests = data.requests.filter(time => now - time < timeWindow);
      
      // Проверяем лимит
      if (data.requests.length >= limit) {
        return {
          allowed: false,
          limit: limit,
          current: data.requests.length,
          resetTime: Math.min(...data.requests) + timeWindow
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
      limit: hourLimits[action] || hourLimits['general'],
      current: 1
    };
    
  } catch (error) {
    // Если проверка rate limit не работает - разрешаем запрос
    addSystemLog('⚠️ Rate limit check failed: ' + error.message, 'WARN', 'VALIDATION');
    return { allowed: true, error: error.message };
  }
}