// New/server/SourceDetector.gs
// Single Responsibility: извлечение и классификация источников данных
// Separation of Concerns: отделена от логики сбора данных

/**
 * Парсинг источников из содержимого ячейки
 * @param {string} cellData - содержимое ячейки A (текст + формулы + rich text)
 * @param {Object} cellMeta - метаданные ячейки {formula, richTextUrl}
 * @returns {Array} массив источников [{type, url, id}]
 */
function extractSources(cellData, cellMeta) {
  var sources = [];
  
  // 1. Rich text ссылки (приоритет)
  if (cellMeta && cellMeta.richTextUrl) {
    var normalized = normalizeUrl(cellMeta.richTextUrl);
    if (normalized) {
      sources.push(classifySource(normalized));
    }
  }
  
  // 2. Формулы IMAGE() и HYPERLINK()
  if (cellMeta && cellMeta.formula) {
    var urlFromFormula = extractUrlFromFormula(cellMeta.formula);
    if (urlFromFormula) {
      var normalized = normalizeUrl(urlFromFormula);
      if (normalized) {
        sources.push(classifySource(normalized));
      }
    }
  }
  
  // 3. Явные URL в тексте
  var textUrls = extractUrlsFromText(cellData || '');
  textUrls.forEach(function(url) {
    var normalized = normalizeUrl(url);
    if (normalized) {
      sources.push(classifySource(normalized));
    }
  });
  
  // Дедупликация (DRY principle)
  return deduplicateSources(sources);
}

/**
 * Нормализация URL (KISS principle)
 */
function normalizeUrl(url) {
  try {
    var cleaned = String(url || '').trim();
    if (!cleaned) return '';
    
    // Убираем HTML теги и угловые скобки
    cleaned = cleaned.replace(/<[^>]*>/g, ' ').replace(/^<+|>+$/g, '');
    
    // Добавляем протокол если нужно
    if (/^https?:\\/\\//i.test(cleaned)) return cleaned;
    if (/^www\\./i.test(cleaned)) return 'https://' + cleaned;
    if (/^(vk\\.com|drive\\.google\\.com|yadi\\.sk|disk\\.yandex\\.(ru|com)|dropbox\\.com)/i.test(cleaned)) {
      return 'https://' + cleaned;
    }
    
    return cleaned;
  } catch (e) {
    return String(url || '');
  }
}

/**
 * Классификация источника по URL
 */
function classifySource(url) {
  var u = String(url);
  
  // VK источники
  if (/vk\\.com\\/reviews-?\\d+/i.test(u)) return {type: 'vk-reviews', url: u};
  if (/vk\\.com\\/album-?\\d+_\\d+/i.test(u)) return {type: 'vk-album', url: u};
  if (/vk\\.com\\/topic-?\\d+_\\d+/i.test(u)) return {type: 'vk-topic', url: u};
  
  // Google Drive
  var driveMatch = detectDriveLink(u);
  if (driveMatch) {
    return {
      type: driveMatch.type === 'folder' ? 'drive-folder' : 'drive-file',
      id: driveMatch.id
    };
  }
  
  // Облачные хранилища
  if (/yadi\\.sk\\//i.test(u) || /disk\\.yandex\\.(ru|com)\\//i.test(u)) {
    return {type: 'yandex', url: u};
  }
  if (/dropbox\\.com\\//i.test(u)) {
    return {type: 'dropbox', url: u};
  }
  
  // Generic URL
  return {type: 'url', url: u};
}

/**
 * Извлечение URL из формул
 */
function extractUrlFromFormula(formula) {
  if (!formula) return '';
  
  var f = String(formula).trim();
  
  // IMAGE() или ИЗОБРАЖЕНИЕ()
  var imageMatch = f.match(/^=\\s*(?:IMAGE|ИЗОБРАЖЕНИЕ)\\s*\\(\\s*([\"'])([^\"']+)\\1/i);
  if (imageMatch) return imageMatch[2];
  
  // HYPERLINK() или ГИПЕРССЫЛКА()
  var linkMatch = f.match(/^=\\s*(?:HYPERLINK|ГИПЕРССЫЛКА)\\s*\\(\\s*([\"'])([^\"']+)\\1/i);
  if (linkMatch) return linkMatch[2];
  
  return '';
}

/**
 * Извлечение URL из текста
 */
function extractUrlsFromText(text) {
  var urls = [];
  
  try {
    // HTTP/HTTPS ссылки
    var httpMatches = text.match(/https?:\\/\\/[^\\s<>\\)\\]\"]+/g) || [];
    urls = urls.concat(httpMatches);
    
    // Домены без протокола
    var domainMatches = text.match(/(?:^|\\s)(?:vk\\.com|drive\\.google\\.com|yadi\\.sk|disk\\.yandex\\.(?:ru|com)|dropbox\\.com)\\/[^\\n\\s<>\\)\\]\"]+/gi) || [];
    urls = urls.concat(domainMatches.map(function(m) { return m.trim(); }));
    
  } catch (e) {
    // Ignore regex errors
  }
  
  return urls.map(function(url) {
    return url.replace(/[),.;]+$/, ''); // Убираем знаки препинания в конце
  });
}

/**
 * Определение Drive ссылки
 */
function detectDriveLink(url) {
  try {
    var u = String(url);
    
    // Папка
    var folderMatch = u.match(/drive\\.google\\.com\\/drive\\/(?:u\\/\\d+\\/)?folders\\/([a-zA-Z0-9_-]+)/);
    if (folderMatch) return {type: 'folder', id: folderMatch[1]};
    
    // Файл
    var fileMatch = u.match(/drive\\.google\\.com\\/file\\/d\\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) return {type: 'file', id: fileMatch[1]};
    
    // ID параметр
    var idMatch = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) return {type: 'file', id: idMatch[1]};
    
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Дедупликация источников
 */
function deduplicateSources(sources) {
  var seen = {};
  return sources.filter(function(source) {
    var key = source.type + ':' + (source.url || source.id || '');
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}