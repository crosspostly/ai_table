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
 */
function extractSourcesV2_(textVal, formula, richUrl) {
  var list = [];
  
  function push(u) {
    if (!u) return;
    var n = normalizeUrlV2_(u);
    if (!n) return;
    list.push(classifyV2_(n));
  }
  
  if (richUrl) push(richUrl);

  if (formula) {
    var f = String(formula).trim();
    var mImg = f.match(/^=\s*(?:IMAGE|ИЗОБРАЖЕНИЕ)\s*\(\s*(["'])([^"']+)\1/i);
    if (mImg) push(mImg[2]);
    var mHyp = f.match(/^=\s*(?:HYPERLINK|ГИПЕРССЫЛКА)\s*\(\s*(["'])([^"']+)\1/i);
    if (mHyp) push(mHyp[2]);
  }
  
  try {
    var cleaned = cleanTextForUrlsV2_(String(textVal || ''));
    (cleaned.match(/https?:\/\/[^\s<>\)\]"]+/g) || []).forEach(function(s) {
      push(s.replace(/[),.;]+$/, ''));
    });
    (cleaned.match(/(?:^|\s)(?:vk\.com|drive\.google\.com|docs\.google\.com|yadi\.sk|disk\.yandex\.(?:ru|com)|dropbox\.com|script\.google\.com|script\.googleusercontent\.com)\/[^\r\n\s<>\)\]"]+/gi) || [])
      .forEach(function(s) {
        push(String(s).trim());
      });
  } catch (e) {
    addSystemLog('extractSourcesV2_: text scan error: ' + e.message, 'WARN', 'OCR');
  }
  
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
  return String(text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Normalize URL
 */
function normalizeUrlV2_(u) {
  try {
    var s = String(u || '').trim().replace(/<+|>+$/g, '');
    if (/^https?:\/\//i.test(s)) return s;
    if (/^www\./i.test(s)) return 'https://' + s;
    if (/^(vk\.com|drive\.google\.com|yadi\.sk|disk\.yandex\.(?:ru|com)|dropbox\.com|script\.google\.com|script\.googleusercontent\.com)\//i.test(s)) {
      return 'https://' + s;
    }
    return s;
  } catch (e) { return String(u || ''); }
}

/**
 * Classify URL by type
 */
function classifyV2_(u) {
  if (/vk\.com\/reviews-\d+/i.test(u)) return { kind: 'vk-reviews', url: u };
  if (/vk\.com\/album-?\d+_\d+/i.test(u)) return { kind: 'vk-album', url: u };
  if (/vk\.com\/topic-?\d+_\d+/i.test(u)) return { kind: 'vk-topic', url: u };
  
  if (/script\.google(?:usercontent)?\.com\//i.test(u)) {
    var act = getParamV2_(u, 'action');
    var inner = getParamV2_(u, 'url');
    if (act && inner) {
      var innerUrl = decodeURIComponent(inner);
      if (/^parseAlbum$/i.test(act)) return { kind: 'vk-album', url: innerUrl };
      if (/^parseDiscussion$/i.test(act)) return { kind: 'vk-topic', url: innerUrl };
      if (/^parseReviews$/i.test(act)) return { kind: 'vk-reviews', url: innerUrl };
    }
    return { kind: 'vk-webjson', url: u };
  }
  
  var gd = detectDriveLinkV2_(u);
  if (gd) return { kind: `drive-${gd.type}`, id: gd.id };
  
  if (/yadi\.sk\//i.test(u) || /disk\.yandex\.(ru|com)\//i.test(u)) return { kind: 'yadisk', url: u };
  if (/dropbox\.com\//i.test(u)) return { kind: 'dropbox-file', url: u };
  return { kind: 'url', url: u };
}

function getParamV2_(url, name) {
  try {
    var m = String(url).match(new RegExp('[?&]' + name + '=([^&#]*)', 'i'));
    return m ? m[1] : '';
  } catch (e) { return ''; }
}

function detectDriveLinkV2_(url) {
  var u = String(url || '');
  var m1 = u.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/);
  if (m1) return { type: 'folder', id: m1[1] };
  var m2 = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m2) return { type: 'file', id: m2[1] };
  var m3 = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m3) return { type: 'file', id: m3[1] };
  return null;
}

// Остальные функции файла остаются без изменений...