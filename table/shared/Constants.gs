// New/shared/Constants.gs
// Single Responsibility: единое место для всех констант системы

// URL сервера
var SERVER_URL = 'https://script.google.com/macros/s/AKfycbyyUlB5YWP4bwv3gHHniTv_12cAHlqjYfra7fQ3m3Vri5XvZTQ_uUZZovCYEto2_u6gQw/exec';

// API URLs  
var GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
var VK_PARSER_URL = 'https://script.google.com/macros/s/AKfycbzttbqz16EmmcXbEYCuYhNlXkCxAnCG77phspFL1_rTCi4xVqoorByJAPa4dI4iwT8/exec';

// Фраза готовности по умолчанию
var COMPLETION_PHRASE = 'Отчёт готов';

// Настройки автоматических цепочек
var AUTO_PROCESSING_DELAY = 5000; // 5 секунд
var MAX_RETRY_ATTEMPTS = 3;
var RETRY_DELAY_INCREMENT = 2000; // 2 секунды

// Ключи для кэша
var PROCESSING_STATUS_NAME = 'auto_processing_status';
var SYSTEM_LOGS_NAME = 'system_logs_v2';

// Режим разработчика
var DEV_MODE = false; // Включить для отладки

// API настройки
var API_LIMITS = {
  MAX_IMAGES_PER_BATCH: 8,
  MAX_TEXT_LENGTH: 10000,
  MAX_RETRIES: 3,
  BATCH_DELAY_MS: 1000,
  RATE_LIMIT_DELAY_MS: 100
};

// OCR настройки
var OCR_DEFAULTS = {
  LANGUAGE: 'ru',
  MAX_RESULTS: 50,
  MARKDOWN_DELIMITER: '---'
};

// VK API настройки
var VK_LIMITS = {
  MAX_POSTS_PER_REQUEST: 100,
  DEFAULT_POSTS_COUNT: 50,
  REQUEST_TIMEOUT_MS: 30000
};

// Gemini настройки
var GEMINI_DEFAULTS = {
  MAX_TOKENS: 25000,
  TEMPERATURE: 0.7,
  MODEL: 'gemini-pro'
};

// Кэширование
var CACHE_TTL = {
  CLIENT_LOGS: 3600,     // 1 час
  API_RESPONSES: 1800,   // 30 минут
  CREDENTIALS: 300       // 5 минут
};

// Маппинг действий сервера
var SERVER_ACTIONS = {
  OCR_PROCESS: 'ocr_process',
  VK_IMPORT: 'vk_import',
  GM: 'gm',
  HEALTH: 'health'
};

// Поддерживаемые источники изображений
var IMAGE_SOURCES = {
  VK: 'vk',
  DRIVE: 'drive', 
  YANDEX: 'yandex',
  DROPBOX: 'dropbox',
  URL: 'url'
};

// Регулярные выражения для извлечения ссылок
var URL_PATTERNS = {
  VK_PHOTO: /(?:vk\.com|vkontakte\.ru)\/.*photo.*_.*_/i,
  DRIVE_FILE: /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
  YANDEX_DISK: /disk\.yandex\.[a-z]+\/i\/([a-zA-Z0-9_-]+)/i,
  DROPBOX: /dropbox\.com\/s\/([a-zA-Z0-9_-]+)/i,
  GENERIC_IMAGE: /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$|#)/i
};

// Листы приложения
var SHEET_NAMES = {
  REVIEWS: 'Отзывы',
  POSTS: 'посты', 
  PARAMS: 'Параметры'
};

// Сообщения об ошибках
var ERROR_MESSAGES = {
  NO_CREDENTIALS: 'Credentials не настроены. Используйте меню для настройки.',
  NO_GEMINI_KEY: 'Gemini API ключ не настроен.',
  NO_SERVER_URL: 'URL сервера не настроен.',
  SERVER_UNAVAILABLE: 'Сервер недоступен.',
  INVALID_RESPONSE: 'Неверный ответ от сервера.',
  SHEET_NOT_FOUND: 'Лист не найден.',
  NO_DATA: 'Нет данных для обработки.',
  RATE_LIMITED: 'Превышен лимит запросов. Попробуйте позже.'
};

// Логи и трейсинг
var LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN', 
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Property ключи для настройки
var PROPERTY_KEYS = {
  LICENSE_EMAIL: 'LICENSE_EMAIL',
  LICENSE_TOKEN: 'LICENSE_TOKEN',
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  OCR_OVERWRITE: 'OCR_OVERWRITE',
  DEBUG_MODE: 'DEBUG_MODE'
};

// Версия API
var API_VERSION = '2.0';

// User Agent для внешних запросов
var USER_AGENT = 'Table-AI-GoogleSheets/' + API_VERSION;
