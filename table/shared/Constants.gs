/**
 * Global Constants v1.0
 * Централизованное хранение всех констант проекта
 */

// === API ВЕРСИИ ===
var API_VERSION = 'v2.1';

// === HTTP USER AGENTS ===
var USER_AGENT = 'Mozilla/5.0 (compatible; TableAI-Bot/2.1; +https://tableai.bot)';

// === CLIENT-SERVER COMMUNICATION ===
// URL основного сервера (Main API Server)
var SERVER_URL = 'https://script.google.com/macros/s/AKfycbyyUlB5YWP4bwv3gHHniTv_12cAHlqjYfra7fQ3m3Vri5XvZTQ_uUZZovCYeTo2_u6gQw/exec';

// === VK PARSER (ТРЕТЬЕ ОТДЕЛЬНОЕ ПРИЛОЖЕНИЕ) ===
// Это ОТДЕЛЬНЫЙ Google Apps Script сервис для VK парсинга
// Развертывается независимо от основного сервера
var VK_PARSER_URL = 'https://script.google.com/macros/s/AKfycbzttbqz16EmmcXbEYCuYhNlXkCxAnCG77phspFL1_rTCi4xVqoorByJAPa4dI4iwT8/exec';

// === GEMINI API ===
var GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
var GEMINI_DEFAULTS = {
  MAX_TOKENS: 25000,
  TEMPERATURE: 0.7,
  TOP_P: 0.8,
  TOP_K: 40
};

// === SOCIAL MEDIA LIMITS ===
var VK_LIMITS = {
  MAX_POSTS_PER_REQUEST: 100,
  DEFAULT_POSTS_COUNT: 50
};

var INSTAGRAM_LIMITS = {
  MAX_POSTS_PER_REQUEST: 50,
  DEFAULT_POSTS_COUNT: 20,
  MAX_PAGINATION_ATTEMPTS: 5
};

var TELEGRAM_LIMITS = {
  MAX_POSTS_PER_REQUEST: 100,
  DEFAULT_POSTS_COUNT: 30
};

// === IMAGE SOURCES ===
var IMAGE_SOURCES = {
  VK: 'vk',
  INSTAGRAM: 'instagram', 
  TELEGRAM: 'telegram',
  UNKNOWN: 'unknown'
};

// === HTTP TIMEOUTS ===
var HTTP_TIMEOUTS = {
  DEFAULT: 30000,      // 30 секунд
  VK_PARSER: 60000,    // 1 минута
  GEMINI_API: 120000,  // 2 минуты
  SOCIAL_API: 45000    // 45 секунд
};

// === RETRY CONFIGURATION ===
var RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,    // 1 секунда
  MAX_DELAY: 30000,    // 30 секунд
  BACKOFF_MULTIPLIER: 2,
  JITTER_FACTOR: 0.25
};

// === LOGGING LEVELS ===
var LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

// === LICENSE SETTINGS ===
var LICENSE_CONFIG = {
  SHEET_ID: null, // Будет настроено в Properties
  DEFAULT_DAILY_LIMIT: 100,
  DEFAULT_MONTHLY_LIMIT: 3000,
  ADMIN_EMAILS: ['admin@tableai.bot']
};

// === VALIDATION RULES ===
var VALIDATION_RULES = {
  MAX_URL_LENGTH: 2000,
  MAX_USERNAME_LENGTH: 100,
  MAX_PLATFORM_NAME_LENGTH: 50,
  MAX_POSTS_COUNT: 100,
  MIN_POSTS_COUNT: 1,
  ALLOWED_URL_SCHEMES: ['http://', 'https://'],
  DANGEROUS_URL_SCHEMES: ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'],
  USERNAME_PATTERN: /^[a-zA-Z0-9_.-]+$/,
  URL_PATTERN: /^https?:\/\/[^\s/$.?#].[^\s]*$/i
};

// === ERROR MESSAGES ===
var ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Неверные учетные данные',
  LICENSE_EXPIRED: 'Лицензия истекла',
  RATE_LIMIT_EXCEEDED: 'Превышен лимит запросов',
  PLATFORM_NOT_SUPPORTED: 'Платформа не поддерживается',
  SOURCE_NOT_FOUND: 'Источник не найден',
  NETWORK_ERROR: 'Ошибка сети',
  PARSING_ERROR: 'Ошибка обработки данных',
  VALIDATION_ERROR: 'Ошибка валидации входных данных'
};

// === CACHE SETTINGS ===
var CACHE_CONFIG = {
  DEFAULT_TTL: 3600,        // 1 час
  SHORT_TTL: 600,           // 10 минут
  LONG_TTL: 86400,          // 24 часа
  MAX_CACHE_SIZE: 100 * 1024, // 100KB
  
  KEYS: {
    RATE_LIMIT_PREFIX: 'rate_limit_',
    LICENSE_PREFIX: 'license_',
    API_HEALTH_PREFIX: 'api_health_',
    CLIENT_LOG_PREFIX: 'client_log_'
  }
};

// === INSTAGRAM API CONFIG ===
var INSTAGRAM_CONFIG = {
  APP_ID: '936619743392459',
  QUERY_HASH: '003056d32c2554def87228bc3fd9668a',
  BASE_URL: 'https://www.instagram.com',
  API_PATH: '/api/v1/users/web_profile_info/',
  GRAPHQL_PATH: '/api/graphql/query/',
  PAGINATION_LIMIT: 12,
  MAX_RETRIES: 2
};

// === VK API CONFIG ===
var VK_CONFIG = {
  BASE_URL: 'https://vk.com',
  API_VERSION: '5.131',
  DEFAULT_FIELDS: 'post',
  MAX_POSTS_PER_PAGE: 100
};

// === TELEGRAM CONFIG ===
var TELEGRAM_CONFIG = {
  BASE_URL: 'https://t.me',
  RSS_SUFFIX: '/rss',
  WEB_PREVIEW_TIMEOUT: 10000,
  EMBED_TIMEOUT: 5000
};

/**
 * Получение константы по имени с fallback значением
 * @param {string} name - имя константы
 * @param {*} defaultValue - значение по умолчанию
 * @return {*} - значение константы
 */
function getConstant(name, defaultValue = null) {
  try {
    var value = eval(name);
    return value !== undefined ? value : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Проверка определена ли константа
 * @param {string} name - имя константы
 * @return {boolean} - true если определена
 */
function isConstantDefined(name) {
  try {
    var value = eval(name);
    return value !== undefined;
  } catch (error) {
    return false;
  }
}

/**
 * Получение конфигурации для платформы
 * @param {string} platform - имя платформы
 * @return {Object} - конфигурация платформы
 */
function getPlatformConfig(platform) {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return INSTAGRAM_CONFIG;
    case 'vk':
      return VK_CONFIG;
    case 'telegram':
      return TELEGRAM_CONFIG;
    default:
      return {};
  }
}

/**
 * Получение лимитов для платформы
 * @param {string} platform - имя платформы
 * @return {Object} - лимиты платформы
 */
function getPlatformLimits(platform) {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return INSTAGRAM_LIMITS;
    case 'vk':
      return VK_LIMITS;
    case 'telegram':
      return TELEGRAM_LIMITS;
    default:
      return {
        MAX_POSTS_PER_REQUEST: 50,
        DEFAULT_POSTS_COUNT: 20
      };
  }
}

/**
 * Получение timeout для платформы
 * @param {string} platform - имя платформы
 * @return {number} - timeout в миллисекундах
 */
function getPlatformTimeout(platform) {
  switch (platform.toLowerCase()) {
    case 'vk':
      return HTTP_TIMEOUTS.VK_PARSER;
    case 'gemini':
      return HTTP_TIMEOUTS.GEMINI_API;
    case 'instagram':
    case 'telegram':
      return HTTP_TIMEOUTS.SOCIAL_API;
    default:
      return HTTP_TIMEOUTS.DEFAULT;
  }
}