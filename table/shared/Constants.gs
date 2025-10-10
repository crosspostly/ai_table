/**
 * Constants for Table AI Bot v2.0
 * Константы используемые во всех частях приложения
 */

// ====== ГЛАВНЫЙ СЕРВЕР API ======
// ИСПРАВЛЕНО: Правильное имя константы как в old/Main.txt
const SERVER_URL = 'https://script.google.com/macros/s/AKfycbyyUlB5YWP4bwv3gHHniTv_12cAHlqjYfra7fQ3m3Vri5XvZTQ_uUZZovCYeTo2_u6gQw/exec';
// Алиас для обратной совместимости
const SERVER_API_URL = SERVER_URL;

// ====== ДОПОЛНИТЕЛЬНЫЕ СЕРВИСЫ ======
// VK_PARSER_URL - ВНЕШНЕЕ приложение для парсинга VK (parseAlbum, parseDiscussion, parseReviews)
// ВОССТАНОВЛЕНО: Сервер не обрабатывает эти действия, нужен VK_PARSER
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
const SYSTEM_LOGS_NAME = 'SYSTEM_LOGS'; // Алиас для совместимости с Utils.gs
const MAX_LOGS = 200; // Максимум логов в памяти
const LOGS_TTL = 86400; // TTL логов: 24 часа

// ====== GOOGLE SHEETS LOGGER CONFIG ======
var SHEETS_LOGGER_CONFIG = {
  // ID таблицы для логов (извлекаем из URL)
  spreadsheetId: '1Gt-am7rwX1R-1-uypLjrpI66ktMHkRfR-aPwAKTBC2A',
  sheetName: 'Логи',
  
  // Структура колонок
  columns: {
    timestamp: 1,    // A: Время
    level: 2,        // B: Уровень (INFO/WARN/ERROR)
    category: 3,     // C: Категория (GEMINI/SECURITY/ATOMIC)
    operation: 4,    // D: Операция (GM/VK_IMPORT/TEST)
    status: 5,       // E: Статус (SUCCESS/FAILED/IN_PROGRESS)
    message: 6,      // F: Сообщение
    details: 7,      // G: Детали (JSON)
    traceId: 8,      // H: Trace ID для связи операций
    userId: 9,       // I: User ID (email)
    executionTime: 10 // J: Время выполнения (ms)
  },
  
  // Настройки
  maxRows: 10000,  // Максимум строк логов
  batchSize: 50,   // Размер batch для записи
  flushInterval: 30000, // Flush каждые 30 секунд
  
  // Алерты
  errorThreshold: 10, // Алерт при >10 ошибок за час
  performanceThreshold: 30000 // Алерт при операциях >30 секунд
};

// ====== Rate Limiting ======
const RATE_LIMIT_WINDOW = 3600; // 1 час в секундах
const MAX_REQUESTS_PER_HOUR = 100; // Максимум запросов в час

// ====== DEBUG MODE ======
const DEV_MODE = true; // Включить меню разработчика и расширенное логирование
