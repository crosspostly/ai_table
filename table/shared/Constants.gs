/**
 * Constants for Table AI Bot v2.0
 * Константы используемые во всех частях приложения
 */

// ====== VK Parser URL (DEPRECATED - больше не используется!) ======
// VK parsing теперь происходит через универсальный Social Import Service
// const VK_PARSER_URL = 'DEPRECATED';

// ====== Gemini API ======
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ====== COMPLETION PHRASE (фраза готовности) ======
const COMPLETION_PHRASE = 'Отчёт готов'; // Фраза для проверки готовности результата

// ====== КОНСТАНТЫ ДЛЯ АВТОМАТИЗАЦИИ ======
const AUTO_PROCESSING_DELAY = 20000; // 20 секунд - базовая задержка
const LONG_PROCESSING_DELAY = 45000; // 45 секунд - для долгих ответов
const PROCESSING_STATUS_KEY = 'AUTO_PROCESSING_STATUS'; // Ключ для кеша
const MAX_RETRY_ATTEMPTS = 5; // Максимум попыток проверки готовности
const RETRY_DELAY_INCREMENT = 10000; // Увеличение задержки с каждой попыткой (10 сек)

// ====== КОНСТАНТЫ ДЛЯ ЛОГИРОВАНИЯ ======
const LOGS_CACHE_KEY = 'SYSTEM_LOGS'; // Ключ для логов
const MAX_LOGS = 200; // Максимум логов в памяти
const LOGS_TTL = 86400; // TTL логов: 24 часа

// ====== SERVER URL ======
const SERVER_API_URL = 'https://script.google.com/macros/s/AKfycby_YOUR_SERVER_ID/exec';

// ====== Rate Limiting ======
const RATE_LIMIT_WINDOW = 3600; // 1 час в секундах
const MAX_REQUESTS_PER_HOUR = 100; // Максимум запросов в час

// ====== DEBUG MODE ======
const DEV_MODE = true; // Включить меню разработчика и расширенное логирование
