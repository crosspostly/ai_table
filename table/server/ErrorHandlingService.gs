/**
 * Error Handling Service v1.0  
 * Дружелюбные и понятные пользователю сообщения об ошибках
 */

/**
 * Создание user-friendly ошибки на основе технической ошибки
 * @param {Error} error - техническая ошибка
 * @param {Object} context - контекст ошибки
 * @return {Error} - дружелюбная ошибка
 */
function createUserFriendlyError(error, context = {}) {
  const friendlyError = new Error();
  friendlyError.originalError = error;
  friendlyError.context = context;
  friendlyError.timestamp = new Date();
  
  // Определяем тип ошибки и создаем понятное сообщение
  const friendlyMessage = generateFriendlyMessage(error, context);
  friendlyError.message = friendlyMessage;
  
  // Логируем техническую ошибку для разработчиков
  addSystemLog(`❌ [${context.operation || 'UNKNOWN'}] ${error.message}`, 'ERROR', 'ERROR_HANDLER');
  addSystemLog(`👤 User message: ${friendlyMessage}`, 'INFO', 'ERROR_HANDLER');
  
  return friendlyError;
}

/**
 * Генерация понятного пользователю сообщения
 * @param {Error} error - техническая ошибка
 * @param {Object} context - контекст
 * @return {string} - дружелюбное сообщение
 */
function generateFriendlyMessage(error, context) {
  const errorMessage = error.message || '';
  const lowerError = errorMessage.toLowerCase();
  
  // HTTP ошибки
  const httpCode = extractHttpCode(errorMessage);
  if (httpCode) {
    return generateHttpErrorMessage(httpCode, context);
  }
  
  // Платформо-специфичные ошибки
  if (context.platform) {
    const platformError = generatePlatformErrorMessage(lowerError, context.platform, context);
    if (platformError) {
      return platformError;
    }
  }
  
  // Общие ошибки приложения
  const commonError = generateCommonErrorMessage(lowerError, context);
  if (commonError) {
    return commonError;
  }
  
  // Если не удалось определить тип ошибки - возвращаем базовое сообщение
  return generateGenericErrorMessage(error, context);
}

/**
 * Извлечение HTTP кода из сообщения об ошибке
 * @param {string} message - сообщение об ошибке
 * @return {number|null} - HTTP код или null
 */
function extractHttpCode(message) {
  const httpMatch = message.match(/HTTP\\s+(\\d+)/i);
  return httpMatch ? parseInt(httpMatch[1]) : null;
}

/**
 * Сообщения для HTTP ошибок
 * @param {number} httpCode - код ошибки HTTP
 * @param {Object} context - контекст
 * @return {string} - сообщение
 */
function generateHttpErrorMessage(httpCode, context) {
  const baseMessages = {
    400: '❌ Неправильный запрос. Проверьте параметры.',
    401: '🔐 Ошибка авторизации.',
    403: '🚫 Доступ запрещен.',
    404: '🔍 Ресурс не найден.',
    429: '⏰ Слишком много запросов.',
    500: '🔧 Внутренняя ошибка сервера.',
    502: '🌐 Проблемы с подключением к серверу.',
    503: '⚠️ Сервис временно недоступен.',
    504: '⏳ Превышено время ожидания ответа.'
  };
  
  let message = baseMessages[httpCode] || `❌ Ошибка HTTP ${httpCode}.`;
  
  // Платформо-специфичные уточнения
  if (context.platform === 'instagram' && httpCode === 403) {
    message = '📷 Instagram заблокировал запрос. Возможные причины:\
' +
              '  • Слишком частые запросы\
' +
              '  • Аккаунт приватный или заблокированный\
' +
              '  • Временная блокировка IP адреса';
              
  } else if (context.platform === 'instagram' && httpCode === 429) {
    message = '📷 Instagram ограничил скорость запросов.\
' +
              '⏰ Подождите 15-30 минут перед повторной попыткой.';
              
  } else if (context.platform === 'vk' && httpCode === 403) {
    message = '📘 VK заблокировал доступ. Возможные причины:\
' +
              '  • Группа/профиль приватный\
' +
              '  • Требуется авторизация\
' +
              '  • Контент заблокирован';
              
  } else if (context.platform === 'telegram' && httpCode === 404) {
    message = '✈️ Telegram канал не найден.\
' +
              '  • Проверьте правильность имени канала\
' +
              '  • Убедитесь что канал публичный';
              
  } else if (httpCode === 429) {
    message += '\
\
💡 Советы:\
' +
               '  • Подождите 5-15 минут\
' +
               '  • Уменьшите количество запрашиваемых постов\
' +
               '  • Попробуйте в менее активное время';
  }
  
  // Добавляем контекстную информацию
  if (context.username) {
    message += `\
\
👤 Пользователь: ${context.username}`;
  }
  if (context.url) {
    message += `\
🔗 URL: ${context.url}`;
  }
  
  return message;
}

/**
 * Платформо-специфичные сообщения об ошибках
 * @param {string} lowerError - ошибка в нижнем регистре
 * @param {string} platform - платформа
 * @param {Object} context - контекст
 * @return {string|null} - сообщение или null
 */
function generatePlatformErrorMessage(lowerError, platform, context) {
  // Instagram ошибки
  if (platform === 'instagram') {
    if (lowerError.includes('user') && lowerError.includes('not found')) {
      return `📷 Instagram пользователь \"${context.username || 'неизвестен'}\" не найден.\
` +
             '💡 Проверьте правильность написания имени пользователя.';
    }
    
    if (lowerError.includes('private') || lowerError.includes('blocked')) {
      return `🔒 Аккаунт Instagram \"${context.username || 'неизвестен'}\" приватный или заблокированный.\
` +
             '💡 Импорт возможен только из публичных аккаунтов.';
    }
    
    if (lowerError.includes('rate limit') || lowerError.includes('too many requests')) {
      return '📷 Instagram ограничил количество запросов.\
' +
             '⏰ Подождите 30 минут и попробуйте снова.';
    }
  }
  
  // VK ошибки
  if (platform === 'vk') {
    if (lowerError.includes('access denied') || lowerError.includes('доступ запрещен')) {
      return `📘 Нет доступа к VK источнику \"${context.username || 'неизвестен'}\".\
` +
             '💡 Проверьте что группа/профиль публичные.';
    }
    
    if (lowerError.includes('not found') || lowerError.includes('не найден')) {
      return `📘 VK источник \"${context.username || 'неизвестен'}\" не найден.\
` +
             '💡 Проверьте правильность ID или имени группы.';
    }
    
    if (lowerError.includes('parser') && lowerError.includes('unavailable')) {
      return '🔧 VK Parser временно недоступен.\
' +
             '⏰ Попробуйте через 1-2 часа.';
    }
  }
  
  // Telegram ошибки
  if (platform === 'telegram') {
    if (lowerError.includes('channel') && lowerError.includes('not found')) {
      return `✈️ Telegram канал \"${context.username || 'неизвестен'}\" не найден.\
` +
             '💡 Убедитесь что канал существует и является публичным.';
    }
    
    if (lowerError.includes('private') || lowerError.includes('blocked')) {
      return `🔒 Telegram канал \"${context.username || 'неизвестен'}\" приватный.\
` +
             '💡 Импорт возможен только из публичных каналов.';
    }
    
    if (lowerError.includes('rss') && lowerError.includes('failed')) {
      return '📡 RSS канал недоступен. Пробуем альтернативные методы...\
' +
             '⏳ Это может занять больше времени.';
    }
  }
  
  // Gemini ошибки
  if (platform === 'gemini') {
    if (lowerError.includes('quota') || lowerError.includes('limit')) {
      return '🤖 Превышен лимит запросов к Gemini AI.\
' +
             '⏰ Попробуйте через несколько часов.';
    }
    
    if (lowerError.includes('invalid') && lowerError.includes('request')) {
      return '🤖 Некорректный запрос к Gemini AI.\
' +
             '💡 Попробуйте уменьшить количество постов для анализа.';
    }
  }
  
  return null;
}

/**
 * Общие сообщения об ошибках приложения
 * @param {string} lowerError - ошибка в нижнем регистре
 * @param {Object} context - контекст
 * @return {string|null} - сообщение или null
 */
function generateCommonErrorMessage(lowerError, context) {
  // Валидация входных данных
  if (lowerError.includes('validation') || lowerError.includes('invalid input')) {
    return '❌ Неверные входные данные.\
' +
           '💡 Проверьте правильность заполнения всех полей.';
  }
  
  if (lowerError.includes('url') && lowerError.includes('invalid')) {
    return '❌ Неверный формат URL.\
' +
           '💡 Используйте полные ссылки, например: https://instagram.com/username';
  }
  
  if (lowerError.includes('username') && lowerError.includes('invalid')) {
    return '❌ Неверное имя пользователя.\
' +
           '💡 Используйте только буквы, цифры и подчеркивание.';
  }
  
  // Проблемы с подключением
  if (lowerError.includes('network') || lowerError.includes('connection')) {
    return '🌐 Проблема с подключением к интернету.\
' +
           '💡 Проверьте соединение и попробуйте позже.';
  }
  
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return '⏳ Превышено время ожидания ответа.\
' +
           '💡 Попробуйте уменьшить количество постов или повторите позже.';
  }
  
  // Проблемы с парсингом
  if (lowerError.includes('parse') || lowerError.includes('parsing')) {
    return '📄 Ошибка обработки данных.\
' +
           '💡 Возможно, формат данных изменился. Попробуйте позже.';
  }
  
  // Проблемы с лицензией
  if (lowerError.includes('license') || lowerError.includes('лицензия')) {
    return '🎫 Проблема с лицензией.\
' +
           '💡 Проверьте настройки лицензирования в таблице.';
  }
  
  // Проблемы с Gemini
  if (lowerError.includes('gemini') && lowerError.includes('error')) {
    return '🤖 Ошибка AI анализа.\
' +
           '💡 Попробуйте повторить анализ через несколько минут.';
  }
  
  return null;
}

/**
 * Универсальное сообщение для неопределенных ошибок
 * @param {Error} error - ошибка
 * @param {Object} context - контекст
 * @return {string} - сообщение
 */
function generateGenericErrorMessage(error, context) {
  let message = '❌ Произошла неожиданная ошибка.';
  
  // Добавляем контекст операции
  if (context.operation) {
    const operationNames = {
      'social_import': 'импорте из социальных сетей',
      'gemini_analysis': 'AI анализе постов',
      'license_check': 'проверке лицензии',
      'data_validation': 'проверке данных',
      'api_request': 'API запросе'
    };
    
    const operationName = operationNames[context.operation] || context.operation;
    message = `❌ Ошибка при ${operationName}.`;
  }
  
  // Добавляем общие советы
  message += '\
\
💡 Что можно попробовать:\
' +
             '  • Проверьте интернет-соединение\
' +
             '  • Попробуйте через несколько минут\
' +
             '  • Уменьшите количество запрашиваемых данных\
' +
             '  • Проверьте правильность введенных параметров';
  
  // Добавляем информацию для поддержки
  if (context.supportInfo !== false) {
    message += '\
\
🆘 При повторных проблемах сохраните эту информацию:\
' +
               `  • Время: ${new Date().toLocaleString()}\
` +
               `  • Операция: ${context.operation || 'неизвестно'}\
` +
               `  • Платформа: ${context.platform || 'неизвестно'}`;
  }
  
  return message;
}

/**
 * Обертка для выполнения операций с обработкой ошибок
 * @param {Function} operation - операция для выполнения
 * @param {Object} context - контекст операции
 * @return {*} - результат операции
 */
function executeWithErrorHandling(operation, context = {}) {
  try {
    return operation();
  } catch (error) {
    const friendlyError = createUserFriendlyError(error, context);
    throw friendlyError;
  }
}

/**
 * Обертка для асинхронных операций с обработкой ошибок
 * @param {Function} asyncOperation - асинхронная операция
 * @param {Object} context - контекст
 * @return {Promise} - промис с результатом
 */
function executeAsyncWithErrorHandling(asyncOperation, context = {}) {
  return new Promise((resolve, reject) => {
    try {
      const result = asyncOperation();
      resolve(result);
    } catch (error) {
      const friendlyError = createUserFriendlyError(error, context);
      reject(friendlyError);
    }
  });
}

/**
 * Логирование ошибки с полным контекстом
 * @param {Error} error - ошибка
 * @param {Object} context - контекст
 */
function logErrorWithContext(error, context = {}) {
  // Создаем детальный лог для разработчиков
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context: context,
    userAgent: context.userAgent || 'unknown',
    sessionId: context.sessionId || 'unknown'
  };
  
  // Логируем в системный лог
  addSystemLog(
    `🔍 Error Details: ${JSON.stringify(errorInfo, null, 2)}`,
    'ERROR',
    'ERROR_HANDLER'
  );
  
  // Опционально сохраняем в PropertiesService для анализа
  if (context.saveForAnalysis) {
    try {
      const cache = PropertiesService.getScriptProperties();
      const key = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      cache.setProperty(key, JSON.stringify(errorInfo));
    } catch (e) {
      addSystemLog('⚠️ Failed to save error for analysis: ' + e.message, 'WARN', 'ERROR_HANDLER');
    }
  }
}

/**
 * Создание ошибки с пользовательскими данными
 * @param {string} message - сообщение
 * @param {Object} details - дополнительные данные
 * @return {Error} - кастомная ошибка
 */
function createCustomError(message, details = {}) {
  const error = new Error(message);
  error.isCustom = true;
  error.details = details;
  error.timestamp = new Date();
  
  return error;
}"