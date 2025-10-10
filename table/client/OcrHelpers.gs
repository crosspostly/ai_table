/**
 * OCR Helpers - Восстановленная логика из old/ocrRunV2_client.txt
 * Полная поддержка VK, GDrive, Yandex, Dropbox, прямых URL
 */

// ====== CONSTANTS ======
var OCR2_BATCH_LIMIT = 50;  // Лимит изображений за прогон
var OCR2_CHUNK_SIZE = 8;    // Размер чанка для batch OCR
var MAX_FOLDER_IMAGES = 50; // Лимит для папок

/**
 * Extract Sources V2 - главная функция парсинга источников
 * ИЗ old/ocrRunV2_client.txt строки 155-180
 */
function extractSourcesV2_(textVal, formula, richUrl) {
  var list = [];
  
  function push(u) {
    if (!u) return;
    var n = normalizeUrlV2_(u);
    if (!n) return;
    list.push(classifyV2_(n));
  }
  
  // Rich text link
  if (richUrl) push(richUrl);
  
  // Formula parsing
  if (formula) {
    var f = String(formula).trim();
    
    // =IMAGE() or =ИЗОБРАЖЕНИЕ()
    var mImg = f.match(/^=\s*(?:IMAGE|ИЗОБРАЖЕНИЕ)\s*\(\s*(["'])([^"']+)\1/i);
    if (mImg) push(mImg[2]);
    
    // =HYPERLINK() or =ГИПЕРССЫЛКА()
    var mHyp = f.match(/^=\s*(?:HYPERLINK|ГИПЕРССЫЛКА)\s*\(\s*(["'])([^"']+)\1/i);
    if (mHyp) push(mHyp[2]);
  }
  
  // Text parsing
  try {
    var cleaned = cleanTextForUrlsV2_(String(textVal || ''));
    
    // HTTP/HTTPS URLs
    (cleaned.match(/https?:\/\/[^\s<>\)\]"]+/g) || []).forEach(function(s) {
      push(s.replace(/[),.;]+$/, ''));
    });
    
    // Specific domains без протокола
    (cleaned.match(/(?:^|\s)(?:vk\.com|drive\.google\.com|docs\.google\.com|yadi\.sk|disk\.yandex\.(?:ru|com)|dropbox\.com|script\.google\.com|script\.googleusercontent\.com)\/[^\r\n\s<>\)\]"]+/gi) || [])
      .forEach(function(s) {
        push(String(s).trim());
      });
      
  } catch (e) {
    addSystemLog('extractSourcesV2_: text scan error: ' + e.message, 'WARN', 'OCR');
  }
  
  // Deduplication
  var seen = {};
  list = list.filter(function(s) {
    var k = s.kind + ':' + (s.url || s.id);
    if (seen[k]) return false;
    seen[k] = true;
    return true;
  });
  
  return list;
}

/**
 * Clean text for URL extraction
 */
function cleanTextForUrlsV2_(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Удаляем HTML теги
  var cleaned = text.replace(/<[^>]+>/g, ' ');
  
  // Удаляем лишние пробелы
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  return cleaned;
}

/**
 * Normalize URL
 */
function normalizeUrlV2_(u) {
  try {
    var s = String(u || '').trim();
    if (!s) return '';
    
    // Убираем HTML теги
    s = cleanTextForUrlsV2_(s);
    
    // Убираем угловые скобки
    s = s.replace(/^<+|>+$/g, '');
    
    // Уже есть протокол
    if (/^https?:\/\//i.test(s)) return s;
    
    // www.
    if (/^www\./i.test(s)) return 'https://' + s;
    
    // Известные домены без протокола
    if (/^(vk\.com|drive\.google\.com|yadi\.sk|disk\.yandex\.(?:ru|com)|dropbox\.com|script\.google\.com|script\.googleusercontent\.com)\//i.test(s)) {
      return 'https://' + s;
    }
    
    return s;
    
  } catch (e) {
    return String(u || '');
  }
}

/**
 * Classify URL by type
 */
function classifyV2_(u) {
  // VK patterns
  if (/vk\.com\/reviews-\d+/i.test(u)) return { kind: 'vk-reviews', url: u };
  if (/vk\.com\/album-?\d+_\d+/i.test(u)) return { kind: 'vk-album', url: u };
  if (/vk\.com\/topic-?\d+_\d+/i.test(u)) return { kind: 'vk-topic', url: u };
  
  // Google Apps Script URLs (VK parser)
  if (/script\.google(?:usercontent)?\.com\//i.test(u)) {
    var act = getParamV2_(u, 'action');
    var inner = getParamV2_(u, 'url');
    
    if (act && inner) {
      var innerUrl = decodeURIComponent(inner);
      if (/^parseAlbum$/i.test(act)) return { kind: 'vk-album', url: innerUrl };
      if (/^parseDiscussion$/i.test(act)) return { kind: 'vk-topic', url: innerUrl };
      if (/^parseReviews$/i.test(act)) return { kind: 'vk-reviews', url: innerUrl };
    }
    
    // Web JSON endpoint
    return { kind: 'vk-webjson', url: u };
  }
  
  // Google Drive
  var gd = detectDriveLinkV2_(u);
  if (gd && gd.type === 'folder') return { kind: 'drive-folder', id: gd.id };
  if (gd && gd.type === 'file') return { kind: 'drive-file', id: gd.id };
  
  // Yandex Disk
  if (/yadi\.sk\//i.test(u) || /disk\.yandex\.(ru|com)\//i.test(u)) {
    return { kind: 'yadisk', url: u };
  }
  
  // Dropbox
  if (/dropbox\.com\//i.test(u)) return { kind: 'dropbox-file', url: u };
  
  // Generic URL
  return { kind: 'url', url: u };
}

/**
 * Get URL parameter
 */
function getParamV2_(url, name) {
  try {
    var re = new RegExp('[?&]' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^&#]*)', 'i');
    var m = String(url).match(re);
    return m ? m[1] : '';
  } catch (e) {
    return '';
  }
}

/**
 * Detect Google Drive link type
 */
function detectDriveLinkV2_(url) {
  try {
    var u = String(url || '');
    
    // Folder link
    var m1 = u.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/);
    if (m1) return { type: 'folder', id: m1[1] };
    
    // File link
    var m2 = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m2) return { type: 'file', id: m2[1] };
    
    // ID parameter
    var m3 = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m3) return { type: 'file', id: m3[1] };
    
    // docs.google.com
    if (/docs\.google\.com\//i.test(u)) {
      var md = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (md) return { type: 'file', id: md[1] };
    }
    
    return null;
    
  } catch (e) {
    return null;
  }
}

/**
 * Collect images/texts from source
 * ИЗ old/ocrRunV2_client.txt строки 218-250
 */
function collectFromSourceV2_(src, cap) {
  cap = cap || OCR2_BATCH_LIMIT;
  
  try {
    switch (src.kind) {
      case 'vk-webjson':
        return collectVkWebJsonV2_(src.url, cap);
        
      case 'vk-album':
        return collectVkAlbumViaWebV2_(src.url, 0, cap);
        
      case 'vk-topic':
        return collectVkDiscussionViaWebV2_(src.url, 0, cap);
        
      case 'vk-reviews':
        return collectVkReviewsViaWebV2_(src.url, 0, cap);
        
      case 'drive-folder':
        return enumerateDriveFolderImagesV2_(src.id, 0, cap);
        
      case 'drive-file':
        try {
          var file = DriveApp.getFileById(src.id);
          var blob = file.getBlob();
          var mt = String(blob.getContentType() || '').toLowerCase();
          
          if (mt.indexOf('image/') !== 0) {
            addSystemLog('Drive file not image: ' + mt, 'WARN', 'OCR');
            return { images: [], texts: [], hasMore: false, nextOffset: 1 };
          }
          
          return {
            images: [{
              mimeType: blob.getContentType() || 'image/png',
              data: Utilities.base64Encode(blob.getBytes())
            }],
            texts: [],
            hasMore: false,
            nextOffset: 1
          };
          
        } catch (e) {
          throw new Error('Drive file error: ' + e.message);
        }
        
      case 'yadisk':
        return collectYandexPublicV2_(src.url, 0, cap);
        
      case 'dropbox-file':
        var dl = toDropboxDirectV2_(src.url);
        var resp = UrlFetchApp.fetch(dl, { muteHttpExceptions: true, followRedirects: true });
        
        if (resp.getResponseCode() >= 300) {
          throw new Error('Dropbox HTTP ' + resp.getResponseCode());
        }
        
        var bb = resp.getBlob();
        return {
          images: [{
            mimeType: bb.getContentType() || 'image/png',
            data: Utilities.base64Encode(bb.getBytes())
          }],
          texts: [],
          hasMore: false,
          nextOffset: 1
        };
        
      case 'url':
        var bl = fetchImageToBlobWithHeadersV2_(src.url);
        
        if (!bl) {
          throw new Error('HTTP_FETCH_FAILED');
        }
        
        var urlMt = String(bl.getContentType() || '').toLowerCase();
        
        if (urlMt.indexOf('image/') !== 0) {
          addSystemLog('URL not image: ' + urlMt + ' url=' + src.url.slice(0, 80), 'DEBUG', 'OCR');
          return { images: [], texts: [], hasMore: false, nextOffset: 0 };
        }
        
        return {
          images: [{
            mimeType: bl.getContentType() || 'image/png',
            data: Utilities.base64Encode(bl.getBytes())
          }],
          texts: [],
          hasMore: false,
          nextOffset: 1
        };
        
      default:
        return { images: [], texts: [], hasMore: false, nextOffset: 0 };
    }
    
  } catch (e) {
    addSystemLog('collectFromSourceV2_ error: ' + e.message, 'ERROR', 'OCR');
    throw e;
  }
}

/**
 * Get VK Parser Base URL
 */
function getVkParserBaseV2_() {
  // Try function first
  try {
    if (typeof getVkParserUrl_ === 'function') {
      return String(getVkParserUrl_()).replace(/\/$/, '');
    }
  } catch (e) {}
  
  // Try constant
  try {
    // VK API теперь встроен в сервер через VkImportService.gs
    // Используем SERVER_URL для всех серверных запросов
    if (typeof SERVER_URL !== 'undefined' && SERVER_URL) {
      return String(SERVER_URL).replace(/\/$/, '');
    }
  } catch (e) {}
  
  throw new Error('SERVER_URL not configured');
}

/**
 * Collect VK Web JSON
 */
function collectVkWebJsonV2_(url, cap) {
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
  var code = resp.getResponseCode();
  
  if (code >= 300) {
    throw new Error('VK webjson HTTP ' + code);
  }
  
  var data = null;
  try {
    data = JSON.parse(resp.getContentText());
  } catch (e) {
    throw new Error('VK webjson parse error');
  }
  
  var images = [];
  var texts = [];
  
  // Process images
  if (data && data.images && data.images.length) {
    for (var i = 0; i < data.images.length && images.length < cap; i++) {
      try {
        var u = data.images[i].url || data.images[i];
        var b = fetchImageToBlobWithHeadersV2_(u);
        
        if (!b) {
          addSystemLog('VK webjson image fetch failed: ' + String(u).slice(0, 160), 'WARN', 'OCR');
          continue;
        }
        
        var mt = String(b.getContentType() || '').toLowerCase();
        if (mt.indexOf('image/') !== 0) {
          addSystemLog('VK webjson non-image: ' + mt, 'WARN', 'OCR');
          continue;
        }
        
        images.push({
          mimeType: b.getContentType() || 'image/jpeg',
          data: Utilities.base64Encode(b.getBytes())
        });
        
      } catch (e) {
        addSystemLog('VK webjson image error: ' + e.message, 'WARN', 'OCR');
      }
    }
  }
  
  // Process texts
  if (data && data.texts && data.texts.length) {
    texts = data.texts
      .map(function(t) { return String(t || '').trim(); })
      .filter(Boolean)
      .slice(0, cap);
  }
  
  return {
    images: images,
    texts: texts,
    hasMore: false,
    nextOffset: 0
  };
}

/**
 * Collect VK Album via Web
 */
function collectVkAlbumViaWebV2_(albumUrl, offset, limit) {
  var base = getVkParserBaseV2_();
  var take = Math.max(1, Math.min(OCR2_BATCH_LIMIT, limit || OCR2_BATCH_LIMIT));
  
  var req = base + '?action=parseAlbum&url=' + encodeURIComponent(albumUrl) + '&limit=' + take + '&offset=' + (offset || 0);
  
  addSystemLog('VK album request: ' + req, 'DEBUG', 'OCR');
  
  var resp = UrlFetchApp.fetch(req, { muteHttpExceptions: true, followRedirects: true });
  var code = resp.getResponseCode();
  
  if (code >= 300) {
    throw new Error('VK album HTTP ' + code);
  }
  
  var data = JSON.parse(resp.getContentText());
  var imgs = [];
  
  if (data && data.images && data.images.length) {
    for (var i = 0; i < data.images.length && imgs.length < take; i++) {
      try {
        var u = data.images[i].url || data.images[i];
        
        if (i < 3) {
          addSystemLog('VK album image[' + i + '] url=' + String(u).slice(0, 200), 'DEBUG', 'OCR');
        }
        
        var b = fetchImageToBlobWithHeadersV2_(u);
        
        if (!b) {
          addSystemLog('VK album image fetch failed: ' + String(u).slice(0, 200), 'WARN', 'OCR');
          continue;
        }
        
        var mt = String(b.getContentType() || '').toLowerCase();
        if (mt.indexOf('image/') !== 0) {
          addSystemLog('VK album non-image: ' + mt, 'WARN', 'OCR');
          continue;
        }
        
        imgs.push({
          mimeType: b.getContentType() || 'image/jpeg',
          data: Utilities.base64Encode(b.getBytes())
        });
        
      } catch (ei) {
        addSystemLog('VK album image error: ' + ei.message, 'WARN', 'OCR');
      }
    }
  } else {
    addSystemLog('VK album: 0 images from web-app for url=' + albumUrl, 'WARN', 'OCR');
  }
  
  return {
    images: imgs,
    texts: [],
    hasMore: !!(data && data.hasMore),
    nextOffset: (data && data.nextOffset != null) ? data.nextOffset : 0
  };
}

/**
 * Collect VK Discussion via Web
 */
function collectVkDiscussionViaWebV2_(topicUrl, offset, limit) {
  var base = getVkParserBaseV2_();
  var take = Math.max(1, Math.min(OCR2_BATCH_LIMIT, limit || OCR2_BATCH_LIMIT));
  
  var req = base + '?action=parseDiscussion&url=' + encodeURIComponent(topicUrl) + '&limit=' + take + '&offset=' + (offset || 0);
  
  addSystemLog('VK topic request: ' + req, 'DEBUG', 'OCR');
  
  var resp = UrlFetchApp.fetch(req, { muteHttpExceptions: true, followRedirects: true });
  var code = resp.getResponseCode();
  
  if (code >= 300) {
    throw new Error('VK topic HTTP ' + code);
  }
  
  var data = JSON.parse(resp.getContentText());
  var texts = (data && data.texts) || [];
  
  texts = texts
    .map(function(t) { return String(t || '').trim(); })
    .filter(Boolean)
    .slice(0, take);
  
  if (!texts.length) {
    addSystemLog('VK topic: 0 texts from web-app for url=' + topicUrl, 'WARN', 'OCR');
  }
  
  return {
    images: [],
    texts: texts,
    hasMore: !!(data && data.hasMore),
    nextOffset: (data && data.nextOffset != null) ? data.nextOffset : 0
  };
}

/**
 * Collect VK Reviews via Web
 */
function collectVkReviewsViaWebV2_(reviewsUrl, offset, limit) {
  var base = getVkParserBaseV2_();
  var take = Math.max(1, Math.min(OCR2_BATCH_LIMIT, limit || OCR2_BATCH_LIMIT));
  
  var req = base + '?action=parseReviews&url=' + encodeURIComponent(reviewsUrl) + '&limit=' + take + '&offset=' + (offset || 0);
  
  addSystemLog('VK reviews request: ' + req, 'DEBUG', 'OCR');
  
  var resp = UrlFetchApp.fetch(req, { muteHttpExceptions: true, followRedirects: true });
  var code = resp.getResponseCode();
  
  if (code >= 300) {
    throw new Error('VK reviews HTTP ' + code);
  }
  
  var data = JSON.parse(resp.getContentText());
  var texts = (data && data.texts) || [];
  
  texts = texts
    .map(function(t) { return String(t || '').trim(); })
    .filter(Boolean)
    .slice(0, take);
  
  if (!texts.length) {
    addSystemLog('VK reviews: 0 texts from web-app for url=' + reviewsUrl, 'WARN', 'OCR');
  }
  
  return {
    images: [],
    texts: texts,
    hasMore: !!(data && data.hasMore),
    nextOffset: (data && data.nextOffset != null) ? data.nextOffset : 0
  };
}

/**
 * Enumerate Google Drive folder images
 */
function enumerateDriveFolderImagesV2_(folderId, offset, limit) {
  try {
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFiles();
    var images = [];
    var count = 0;
    
    // Skip offset
    for (var i = 0; i < offset && files.hasNext(); i++) {
      files.next();
      count++;
    }
    
    // Collect images
    while (files.hasNext() && images.length < limit) {
      try {
        var file = files.next();
        var mt = String(file.getMimeType() || '').toLowerCase();
        
        if (mt.indexOf('image/') === 0) {
          var blob = file.getBlob();
          images.push({
            mimeType: blob.getContentType() || 'image/png',
            data: Utilities.base64Encode(blob.getBytes())
          });
        }
        
        count++;
        
      } catch (e) {
        addSystemLog('Drive folder file error: ' + e.message, 'WARN', 'OCR');
      }
    }
    
    return {
      images: images,
      texts: [],
      hasMore: files.hasNext(),
      nextOffset: offset + images.length
    };
    
  } catch (e) {
    throw new Error('Drive folder error: ' + e.message);
  }
}

/**
 * Collect Yandex Disk public folder
 */
function collectYandexPublicV2_(url, offset, limit) {
  // Simplified placeholder - full implementation requires Yandex API
  addSystemLog('Yandex Disk not fully implemented yet', 'WARN', 'OCR');
  return { images: [], texts: [], hasMore: false, nextOffset: 0 };
}

/**
 * Convert Dropbox share link to direct download
 */
function toDropboxDirectV2_(url) {
  var u = String(url);
  
  // Replace www.dropbox.com with dl.dropboxusercontent.com
  u = u.replace(/www\.dropbox\.com/i, 'dl.dropboxusercontent.com');
  
  // Remove ?dl=0 parameter
  u = u.replace(/[?&]dl=0/i, '');
  
  // Ensure dl=1
  u = u + (u.indexOf('?') >= 0 ? '&' : '?') + 'dl=1';
  
  return u;
}

/**
 * Fetch image to blob with headers
 */
function fetchImageToBlobWithHeadersV2_(url) {
  try {
    var options = {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    var resp = UrlFetchApp.fetch(url, options);
    var code = resp.getResponseCode();
    
    if (code >= 300) {
      addSystemLog('Image fetch HTTP ' + code + ' for url=' + String(url).slice(0, 100), 'WARN', 'OCR');
      return null;
    }
    
    return resp.getBlob();
    
  } catch (e) {
    addSystemLog('Image fetch error: ' + e.message + ' for url=' + String(url).slice(0, 100), 'ERROR', 'OCR');
    return null;
  }
}

/**
 * Split text by separator
 */
function splitBySeparatorV2_(text) {
  if (!text || typeof text !== 'string') return [];
  
  // Split by ____ (4+ underscores)
  var parts = text.split(/_{4,}/);
  
  // Clean and filter
  parts = parts
    .map(function(p) { return String(p || '').trim(); })
    .filter(Boolean);
  
  return parts;
}
