// New/server/LicenseService.gs
// Лицензионная система - критически важный недостающий компонент!

/**
 * Лицензионная система из server-app/Server.gs
 * ВАЖНО: адаптировано для новой архитектуры
 */

// Константы лицензий (должны быть в properties или config)
var LICENSE_SHEET_ID = '1u9rNx0Zwk4Y1cKHiquwu2jH3elpX7VUSJVgkq_Tb3-s';
var LICENSE_SHEET_NAME = 'Tokens';
var RATE_LIMIT_PER_SEC = 3; // max запросов/сек на токен

/**
 * Проверка лицензии пользователя
 */
function checkUserLicense(email, token) {
  var traceId = 'lic-' + Date.now();
  
  try {
    if (!email || !token) {
      return {
        ok: false,
        error: 'EMAIL и TOKEN обязательны',
        traceId: traceId
      };
    }
    
    // Открываем лицензионную таблицу
    var ss = SpreadsheetApp.openById(LICENSE_SHEET_ID);
    var sheet = ss.getSheetByName(LICENSE_SHEET_NAME);
    
    if (!sheet) {
      logServer('Лист лицензий не найден: ' + LICENSE_SHEET_NAME, traceId);
      return {
        ok: false,
        error: 'ЛИЦЕНЗИОННАЯ_СИСТЕМА_НЕДОСТУПНА',
        traceId: traceId
      };
    }
    
    var data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) {
      return {
        ok: false,
        error: 'ЛИЦЕНЗИОННАЯ_ТАБЛИЦА_ПУСТА',
        traceId: traceId
      };
    }
    
    // Определяем колонки (гибко)
    var header = data[0].map(function(x) { return String(x || '').toLowerCase().trim(); });
    var colEmail = findLicenseHeader(header, ['email', 'e-mail', 'почта', 'емейл']);
    var colToken = findLicenseHeader(header, ['token', 'токен']);
    var colUntil = findLicenseHeader(header, ['until', 'до', 'действует_до', 'expires']);
    var colActive = findLicenseHeader(header, ['active', 'активен', 'enabled']);
    
    if (colEmail === -1 || colToken === -1) {
      return {
        ok: false,
        error: 'НЕВЕРНАЯ_СТРУКТУРА_ЛИЦЕНЗИОННОЙ_ТАБЛИЦЫ',
        traceId: traceId
      };
    }
    
    // Ищем пользователя
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowEmail = String(row[colEmail] || '').trim().toLowerCase();
      var rowToken = String(row[colToken] || '').trim();
      
      if (rowEmail === email.toLowerCase() && rowToken === token) {
        // Проверяем активность
        if (colActive !== -1) {
          var isActive = row[colActive];
          if (!isActive || String(isActive).toLowerCase() === 'false' || String(isActive) === '0') {
            return {
              ok: false,
              error: 'ЛИЦЕНЗИЯ_ДЕАКТИВИРОВАНА',
              traceId: traceId,
              row: i + 1
            };
          }
        }
        
        // Проверяем срок действия
        if (colUntil !== -1) {
          var until = row[colUntil];
          if (until && until instanceof Date) {
            if (until < new Date()) {
              return {
                ok: false,
                error: 'ЛИЦЕНЗИЯ_ИСТЕКЛА',
                traceId: traceId,
                until: until.toISOString(),
                row: i + 1
              };
            }
          }
        }
        
        // Проверяем rate limiting
        if (!checkRateLimit(token)) {
          return {
            ok: false,
            error: 'ПРЕВЫШЕН_ЛИМИТ_ЗАПРОСОВ',
            traceId: traceId,
            row: i + 1
          };
        }
        
        logServer('Лицензия проверена: ' + maskEmail(email) + ', row=' + (i + 1), traceId);
        
        return {
          ok: true,
          email: email,
          token: token,
          row: i + 1,
          until: colUntil !== -1 && row[colUntil] instanceof Date ? row[colUntil].toISOString() : null,
          traceId: traceId
        };
      }
    }
    
    return {
      ok: false,
      error: 'НЕВЕРНЫЕ_УЧЕТНЫЕ_ДАННЫЕ',
      traceId: traceId
    };
    
  } catch (e) {
    logServer('Ошибка проверки лицензии: ' + e.message, traceId);
    return {
      ok: false,
      error: 'ОШИБКА_ПРОВЕРКИ_ЛИЦЕНЗИИ: ' + e.message,
      traceId: traceId
    };
  }
}

/**
 * Поиск заголовка в таблице лицензий
 */
function findLicenseHeader(headers, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var idx = headers.indexOf(candidates[i]);
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Rate limiting проверка
 */
function checkRateLimit(token) {
  try {
    var cache = CacheService.getScriptCache();
    var key = 'rate_limit_' + token;
    var now = Date.now();
    
    var data = cache.get(key);
    if (!data) {
      // Первый запрос
      cache.put(key, JSON.stringify({
        requests: [now],
        count: 1
      }), 60); // TTL 60 секунд
      return true;
    }
    
    var rateData = JSON.parse(data);
    var requests = rateData.requests || [];
    
    // Очищаем старые запросы (старше 1 секунды)
    var cutoff = now - 1000;
    requests = requests.filter(function(timestamp) {
      return timestamp > cutoff;
    });
    
    // Проверяем лимит
    if (requests.length >= RATE_LIMIT_PER_SEC) {
      logServer('Rate limit exceeded for token: ' + token.slice(-4), 'rate-limit');
      return false;
    }
    
    // Добавляем текущий запрос
    requests.push(now);
    
    cache.put(key, JSON.stringify({
      requests: requests,
      count: requests.length
    }), 60);
    
    return true;
    
  } catch (e) {
    // В случае ошибки rate limiting разрешаем запрос
    logServer('Rate limit check error: ' + e.message, 'rate-error');
    return true;
  }
}

// maskEmail() теперь в shared/LoggingService.gs

/**
 * Логирование лицензионной активности в серверную таблицу
 */
function logLicenseActivity(action, email, token, result, traceId) {
  try {
    var ss = SpreadsheetApp.openById(LICENSE_SHEET_ID);
    var logSheet = ss.getSheetByName('Логи') || ss.insertSheet('Логи');
    
    // Заголовки если лист пустой
    if (logSheet.getLastRow() === 0) {
      logSheet.getRange(1, 1, 1, 7).setValues([[
        'Время', 'Action', 'Email', 'Token', 'Result', 'TraceId', 'Details'
      ]]);
      logSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#E8F0FE');
    }
    
    var timestamp = new Date().toISOString();
    var maskedEmail = maskEmail(email);
    var maskedToken = token ? '***' + token.slice(-4) : 'none';
    var resultStr = result.ok ? 'SUCCESS' : 'FAIL: ' + (result.error || 'unknown');
    
    logSheet.appendRow([
      timestamp,
      action,
      maskedEmail,
      maskedToken,
      resultStr,
      traceId || 'none',
      JSON.stringify({
        row: result.row || null,
        until: result.until || null
      })
    ]);
    
    // Ограничиваем количество логов (оставляем последние 1000)
    var lastRow = logSheet.getLastRow();
    if (lastRow > 1001) { // 1000 + заголовок
      logSheet.deleteRows(2, lastRow - 1001);
    }
    
  } catch (e) {
    // Не критично если логирование не работает
    Logger.log('License log error: ' + e.message);
  }
}

/**
 * Получение статистики использования лицензий
 */
function getLicenseStats() {
  try {
    var ss = SpreadsheetApp.openById(LICENSE_SHEET_ID);
    var sheet = ss.getSheetByName(LICENSE_SHEET_NAME);
    
    if (!sheet) {
      return { error: 'Лист лицензий не найден' };
    }
    
    var data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) {
      return { total: 0, active: 0, expired: 0 };
    }
    
    var header = data[0].map(function(x) { return String(x || '').toLowerCase().trim(); });
    var colActive = findLicenseHeader(header, ['active', 'активен', 'enabled']);
    var colUntil = findLicenseHeader(header, ['until', 'до', 'действует_до', 'expires']);
    
    var stats = {
      total: data.length - 1,
      active: 0,
      inactive: 0,
      expired: 0,
      valid: 0
    };
    
    var now = new Date();
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      // Проверяем активность
      var isActive = true;
      if (colActive !== -1) {
        var activeVal = row[colActive];
        isActive = activeVal && String(activeVal).toLowerCase() !== 'false' && String(activeVal) !== '0';
      }
      
      if (!isActive) {
        stats.inactive++;
        continue;
      }
      
      // Проверяем срок действия
      var isExpired = false;
      if (colUntil !== -1) {
        var until = row[colUntil];
        if (until && until instanceof Date && until < now) {
          isExpired = true;
        }
      }
      
      if (isExpired) {
        stats.expired++;
      } else {
        stats.active++;
        stats.valid++;
      }
    }
    
    return stats;
    
  } catch (e) {
    return { error: 'Ошибка получения статистики: ' + e.message };
  }
}