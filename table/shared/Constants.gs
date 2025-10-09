/**
 * Constants for Table AI Bot v2.0
 * Константы используемые во всех частях приложения
 */

// ====== ГЛАВНЫЙ СЕРВЕР API ======
// ИСПРАВЛЕНО: Единый URL сервера без дублирования
const SERVER_API_URL = 'https://script.google.com/macros/s/AKfycbyyUlB5YWP4bwv3gHHniTv_12cAHlqjYfra7fQ3m3Vri5XvZTQ_uUZZovCYeTo2_u6gQw/exec';

// ====== ДОПОЛНИТЕЛЬНЫЕ СЕРВИСЫ ======
const VK_PARSER_URL = 'https://script.google.com/macros/s/AKfycbzttbqz16EmmcXbEYCuYhNlXkCxAnCG77phspFL1_rTCi4xVqoorByJAPa4dI4iwT8/exec';

// ====== ВНЕШНИЕ API ======
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ====== COMPLETION PHRASE (фраза готовности) ======
const COMPLETION_PHRASE = 'Отчёт готов'; // Фраза для проверки готовности результата

// ====== АВТОМАТИЗАЦИЯ ======
const AUTO_PROCESSING_DELAY = 20000; // 20 секунд - базовая задержка
const LONG_PROCESSING_DELAY = 45000; // 45 секунд - для долгих ответов
const PROCESSING_STATUS_KEY = 'AUTO_PROCESSING_STATUS'; // Ключ для кеша
const MAX_RETRY_ATTEMPTS = 5; // Максимум попыток проверки готовности
const RETRY_DELAY_INCREMENT = 10000; // Увеличение задержки с каждой попыткой (10 сек)

// ====== ЛОГИРОВАНИЕ ======
const LOGS_CACHE_KEY = 'SYSTEM_LOGS'; // Ключ для логов
const MAX_LOGS = 200; // Максимум логов в памяти
const LOGS_TTL = 86400; // TTL логов: 24 часа

// ====== Rate Limiting ======
const RATE_LIMIT_WINDOW = 3600; // 1 час в секундах
const MAX_REQUESTS_PER_HOUR = 100; // Максимум запросов в час

// ====== DEBUG MODE ======
const DEV_MODE = true; // Включить меню разработчика и расширенное логирование
