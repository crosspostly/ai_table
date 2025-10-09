// Standalone OCR runner (do not touch review.gs)
// Exported function to assign on a drawing button: ocrRun

var OCR2_BATCH_LIMIT = 50;
var OCR2_CHUNK_SIZE = 8; // разовая порция картинок на один запрос к модели (уменьшает риск усечения ответа)

function ocrRun() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('Отзывы');
  if (!sh) { ui.alert('Лист "Отзывы" не найден'); return; }

  var lastRow = Math.max(2, sh.getLastRow());
  var processed = 0, empty = 0, errors = 0, skipped = 0;
  var overwrite = (typeof getOcrOverwrite_ === 'function') ? getOcrOverwrite_() : false;
  log_('▶️ V2 start: rows=' + lastRow + ', overwrite=' + overwrite + ', limit=' + OCR2_BATCH_LIMIT, 'INFO');

  for (var r = 2; r <= lastRow; r++) {
    try {
      var rangeA = sh.getRange(r, 1);
      var textVal = String(rangeA.getDisplayValue() || '').trim();
      var formula = String(rangeA.getFormula() || '');
      var rich = null, richUrl = '';
      try { rich = rangeA.getRichTextValue(); richUrl = firstLinkFromRichV2_(rich); } catch (_) {}
      log_('V2 row ' + r + ': A-text="' + String(textVal).slice(0,120) + '" richUrl="' + richUrl + '" formula="' + String(formula).slice(0,120) + '"', 'DEBUG');

      if (!textVal && !formula && !richUrl) { empty++; continue; }

      var bVal = String(sh.getRange(r, 2).getDisplayValue() || '').trim();
      if (!overwrite && bVal) { skipped++; continue; }

      var sources = extractSourcesV2_(textVal, formula, richUrl);
      log_('V2 row ' + r + ': sources=' + (sources.map(function(s){return s.kind+':' + (s.id||s.url||'');}).join(' | ') || 'none'), 'DEBUG');
      if (!sources.length) { log_('⚠️ V2: нет источников в A' + r, 'WARN'); empty++; continue; }

      var writeRow = bVal ? findNextWriteRowV2_(sh, r) : r;
      var remainingCap = OCR2_BATCH_LIMIT;
      var batchImages = [];
      var texts = [];

      for (var i = 0; i < sources.length && remainingCap > 0; i++) {
        var src = sources[i];
        log_('V2 row ' + r + ': collect kind=' + src.kind + ' key=' + (src.id||src.url||'') + ' cap=' + remainingCap, 'DEBUG');
        try {
          var part = collectFromSourceV2_(src, remainingCap);
          var addedText = 0;
          if (part.texts && part.texts.length) { texts = texts.concat(part.texts); addedText = part.texts.length; }
          remainingCap = Math.max(0, remainingCap - addedText);
          if (part.images && part.images.length) {
            var imageRoom = Math.max(0, OCR2_BATCH_LIMIT - texts.length - batchImages.length);
            if (imageRoom > 0) {
              var toTake = Math.min(imageRoom, part.images.length);
              batchImages = batchImages.concat(part.images.slice(0, toTake));
            }
          }
        } catch (e) { errors++; log_('❌ V2 collect error row ' + r + ': ' + e.message, 'ERROR'); }
      }

      if (!texts.length && !batchImages.length) { log_('V2 row ' + r + ': nothing collected', 'DEBUG'); empty++; continue; }

      var remainingOut = Math.max(0, OCR2_BATCH_LIMIT - texts.length);
      if (batchImages.length && remainingOut > 0) {
        try {
          var imgs = batchImages.slice(0, remainingOut);
          for (var p = 0; p < imgs.length && remainingOut > 0; p += OCR2_CHUNK_SIZE) {
            var sub = imgs.slice(p, Math.min(p + OCR2_CHUNK_SIZE, imgs.length));
            var out = serverGmOcrBatchV2_(sub, 'ru');
            var arr = splitBySeparatorV2_(out);
            if (!arr || !arr.length) {
              // хард-фоллбек: по одному в чанке
              log_('V2 row ' + r + ': chunk ' + (p/OCR2_CHUNK_SIZE) + ' empty → fallback per-image (' + sub.length + ' imgs)', 'WARN');
              for (var si = 0; si < sub.length && remainingOut > 0; si++) {
                try {
                  var bb = Utilities.newBlob(Utilities.base64Decode(sub[si].data), sub[si].mimeType || 'image/png', 'img');
                  var tt = gmOcrFromBlobV2_(bb, 'ru');
                  tt = String(tt||'').trim();
                  if (tt) { texts.push(tt); remainingOut--; }
                } catch (e4) { log_('V2 row ' + r + ': per-image fallback error: ' + e4.message, 'ERROR'); }
              }
            } else {
              var take = Math.min(remainingOut, arr.length);
              texts = texts.concat(arr.slice(0, take));
              remainingOut -= take;
              log_('V2 row ' + r + ': chunk size=' + sub.length + ' → got ' + arr.length + ' parts, taken=' + take + ', cap left=' + remainingOut, 'DEBUG');
            }
          }
        } catch (e2) {
          errors++; log_('❌ V2 OCR batch error row ' + r + ': ' + e2.message, 'ERROR');
          // fallback по одному
          try {
            for (var j = 0; j < Math.min(remainingOut, batchImages.length); j++) {
              var b = Utilities.newBlob(Utilities.base64Decode(batchImages[j].data), batchImages[j].mimeType || 'image/png', 'img');
              var t = gmOcrFromBlobV2_(b, 'ru');
              if (t && String(t).trim()) texts.push(String(t).trim());
            }
          } catch (e3) { log_('❌ V2 OCR fallback error row ' + r + ': ' + e3.message, 'ERROR'); }
        }
      }

      if (!texts.length) { log_('V2 row ' + r + ': texts empty after OCR', 'DEBUG'); empty++; continue; }

      if (texts.length > 1) { sh.insertRowsAfter(writeRow, texts.length - 1); lastRow += (texts.length - 1); }
      var matrix = texts.map(function(x){ return [x]; });
      sh.getRange(writeRow, 2, texts.length, 1).setValues(matrix);
      if (texts.length > 1 && writeRow === r) { r += (texts.length - 1); }
      processed++;
      log_('V2 row ' + r + ': wrote ' + texts.length + ' lines to B, next start row calc ok', 'DEBUG');
      Utilities.sleep(120);
    } catch (e) {
      errors++; log_('❌ V2 row error ' + r + ': ' + e.message, 'ERROR');
    }
  }

  ui.alert('OCR V2 завершён', 'Строк обработано: ' + processed + '\nПропущено (B уже заполнено): ' + skipped + '\nПустых: ' + empty + '\nОшибок: ' + errors + '\n\nЛимит: ' + OCR2_BATCH_LIMIT + ' за запуск.', ui.ButtonSet.OK);
}

// ---------- Helpers ----------
function log_(msg, level) { try { if (typeof addLog === 'function') addLog(msg, level || 'INFO'); else console.log((level||'INFO')+': '+msg); } catch (_) {} }

function findNextWriteRowV2_(sh, r) {
  try {
    var last = Math.max(r, sh.getLastRow());
    var row = r;
    var b0 = String(sh.getRange(row, 2).getDisplayValue() || '').trim();
    if (!b0) return row; row++;
    while (row <= last) {
      var a = String(sh.getRange(row, 1).getDisplayValue() || '').trim();
      var b = String(sh.getRange(row, 2).getDisplayValue() || '').trim();
      if (a) break; if (b) row++; else break;
    }
    return row;
  } catch (e) { return r; }
}

function firstLinkFromRichV2_(rich) {
  try {
    if (!rich) return '';
    var idxs = rich.getTextStyleIndices();
    if (idxs && idxs.length) {
      for (var i = 0; i < idxs.length; i++) {
        var st = rich.getTextStyle(idxs[i]);
        var lu = st && st.getLinkUrl && st.getLinkUrl();
        if (lu) return String(lu).trim();
      }
    }
    var lu2 = rich.getLinkUrl && rich.getLinkUrl();
    if (lu2) return String(lu2).trim();
    var ts = rich.getTextStyle && rich.getTextStyle();
    var lu3 = ts && ts.getLinkUrl && ts.getLinkUrl();
    if (lu3) return String(lu3).trim();
  } catch (e) {}
  return '';
}

function extractSourcesV2_(textVal, formula, richUrl) {
  var list = [];
  function push(u){ if (!u) return; var n = normalizeUrlV2_(u); if (!n) return; list.push(classifyV2_(n)); }

  if (richUrl) push(richUrl);

  if (formula) {
    var f = String(formula).trim();
    var mImg = f.match(/^=\s*(?:IMAGE|ИЗОБРАЖЕНИЕ)\s*\(\s*(["'])([^"']+)\1/i);
    if (mImg) push(mImg[2]);
    var mHyp = f.match(/^=\s*(?:HYPERLINK|ГИПЕРССЫЛКА)\s*\(\s*(["'])([^"']+)\1/i);
    if (mHyp) push(mHyp[2]);
  }

  try {
    var cleaned = cleanTextForUrlsV2_(String(textVal||''));
    (cleaned.match(/https?:\/\/[^\s<>\)\]"]+/g) || []).forEach(function(s){ push(s.replace(/[),.;]+$/, '')); });
    (cleaned.match(/(?:^|\s)(?:vk\.com|drive\.google\.com|docs\.google\.com|yadi\.sk|disk\.yandex\.(?:ru|com)|dropbox\.com|script\.google\.com|script\.googleusercontent\.com)\/[^
\s<>\)\]"]+/gi) || [])
      .forEach(function(s){ push(String(s).trim()); });
  } catch (e) { log_('V2 extract: text scan error: ' + e.message, 'WARN'); }

  // uniq
  var seen = {};
  list = list.filter(function(s){ var k = s.kind+':' + (s.url||s.id); if (seen[k]) return false; seen[k]=true; return true; });
  return list;
}

function normalizeUrlV2_(u){
  try {
    var s = String(u||'').trim(); if (!s) return '';
    // убрать любые html-теги, если затесались
    s = cleanTextForUrlsV2_(s);
    // убрать явные угловые скобки по краям
    s = s.replace(/^<+|>+$/g, '');
    if (/^https?:\/\//i.test(s)) return s;
    if (/^www\./i.test(s)) return 'https://'+s;
    if (/^(vk\.com|drive\.google\.com|yadi\.sk|disk\.yandex\.(?:ru|com)|dropbox\.com|script\.google\.com|script\.googleusercontent\.com)\//i.test(s)) return 'https://'+s;
    return s;
  } catch(e){ return String(u||''); }
}

function classifyV2_(u){
  // direct VK
  if (/vk\.com\/reviews-\d+/i.test(u)) return { kind: 'vk-reviews', url: u };
  if (/vk\.com\/album-?\d+_\d+/i.test(u)) return { kind: 'vk-album', url: u };
  if (/vk\.com\/topic-?\d+_\d+/i.test(u)) return { kind: 'vk-topic', url: u };
  // parser webapp URLs
  if (/script\.google(?:usercontent)?\.com\//i.test(u)) {
    var act = getParamV2_(u, 'action');
    var inner = getParamV2_(u, 'url');
    if (act && inner) {
      var innerUrl = decodeURIComponent(inner);
      if (/^parseAlbum$/i.test(act)) return { kind: 'vk-album', url: innerUrl };
      if (/^parseDiscussion$/i.test(act)) return { kind: 'vk-topic', url: innerUrl };
      if (/^parseReviews$/i.test(act)) return { kind: 'vk-reviews', url: innerUrl };
    }
    // иначе попробуем забрать JSON как готовый результат
    return { kind: 'vk-webjson', url: u };
  }
  // Google Drive
  var gd = detectDriveLinkV2_(u);
  if (gd && gd.type === 'folder') return { kind: 'drive-folder', id: gd.id };
  if (gd && gd.type === 'file') return { kind: 'drive-file', id: gd.id };
  // Yandex / Dropbox
  if (/yadi\.sk\//i.test(u) || /disk\.yandex\.(ru|com)\//i.test(u)) return { kind: 'yadisk', url: u };
  if (/dropbox\.com\//i.test(u)) return { kind: 'dropbox-file', url: u };
  return { kind: 'url', url: u };
}

function getParamV2_(url, name){ try { var re = new RegExp('[?&]'+name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')+'=([^&#]*)','i'); var m = String(url).match(re); return m?m[1]:''; } catch(e){ return ''; } }

function detectDriveLinkV2_(url){
  try {
    var u = String(url||'');
    var m1 = u.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/); if (m1) return { type:'folder', id:m1[1] };
    var m2 = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/); if (m2) return { type:'file', id:m2[1] };
    var m3 = u.match(/[?&]id=([a-zA-Z0-9_-]+)/); if (m3) return { type:'file', id:m3[1] };
    // docs.google.com/uc?export=download&id=... или open?id=...
    if (/docs\.google\.com\//i.test(u)) {
      var md = u.match(/[?&]id=([a-zA-Z0-9_-]+)/); if (md) return { type:'file', id: md[1] };
    }
    return null;
  } catch(e){ return null; }
}

function collectFromSourceV2_(src, cap){
  if (src.kind === 'vk-webjson') return collectVkWebJsonV2_(src.url, cap);
  if (src.kind === 'vk-album') return collectVkAlbumViaWebV2_(src.url, 0, cap);
  if (src.kind === 'vk-topic') return collectVkDiscussionViaWebV2_(src.url, 0, cap);
  if (src.kind === 'vk-reviews') return collectVkReviewsViaWebV2_(src.url, 0, cap);
  if (src.kind === 'drive-folder') return enumerateDriveFolderImagesV2_(src.id, 0, cap);
  if (src.kind === 'drive-file') {
    try {
      var file = DriveApp.getFileById(src.id);
      var blob = file.getBlob();
      var mt = String(blob.getContentType()||'').toLowerCase();
      if (mt.indexOf('image/') !== 0) { log_('V2 drive-file not image, contentType=' + mt, 'WARN'); return { images: [], texts: [], hasMore:false, nextOffset:1 }; }
      return { images: [{ mimeType: blob.getContentType()||'image/png', data: Utilities.base64Encode(blob.getBytes()) }], texts: [], hasMore:false, nextOffset:1 };
    } catch (e) {
      throw new Error('Drive file error: ' + e.message);
    }
  }
  if (src.kind === 'yadisk') return collectYandexPublicV2_(src.url, 0, cap);
  if (src.kind === 'dropbox-file') {
    var dl = toDropboxDirectV2_(src.url); var resp = UrlFetchApp.fetch(dl, { muteHttpExceptions: true, followRedirects: true });
    if (resp.getResponseCode() >= 300) throw new Error('Dropbox HTTP ' + resp.getResponseCode());
    var bb = resp.getBlob();
    return { images: [{ mimeType: bb.getContentType()||'image/png', data: Utilities.base64Encode(bb.getBytes()) }], texts: [], hasMore:false, nextOffset:1 };
  }
  if (src.kind === 'url') {
    var bl = fetchImageToBlobWithHeadersV2_(src.url);
    if (!bl) throw new Error('HTTP_FETCH_FAILED');
    var mt = String(bl.getContentType()||'').toLowerCase();
    if (mt.indexOf('image/') !== 0) { log_('V2 url not image, contentType=' + mt + ' url=' + src.url.slice(0,80), 'DEBUG'); return { images: [], texts: [], hasMore:false, nextOffset:0 }; }
    return { images: [{ mimeType: bl.getContentType()||'image/png', data: Utilities.base64Encode(bl.getBytes()) }], texts: [], hasMore:false, nextOffset:1 };
  }
  return { images: [], texts: [], hasMore:false, nextOffset:0 };
}

// ----- VK via Web JSON (direct link to web-app/echo)
function collectVkWebJsonV2_(url, cap){
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions:true, followRedirects:true });
  var code = resp.getResponseCode(); if (code >= 300) throw new Error('VK webjson HTTP '+code);
  var data = null; try { data = JSON.parse(resp.getContentText()); } catch(e){ throw new Error('VK webjson parse'); }
  var images = []; var texts = [];
  if (data && data.images && data.images.length) {
    for (var i=0;i<data.images.length && images.length<cap;i++) {
      try {
        var u = data.images[i].url || data.images[i];
        var b = fetchImageToBlobWithHeadersV2_(u);
        if (!b) { log_('V2 VK webjson image fetch failed for url=' + String(u).slice(0,160), 'WARN'); continue; }
        var mt = String(b.getContentType()||'').toLowerCase();
        if (mt.indexOf('image/') !== 0) { log_('V2 VK webjson non-image contentType=' + mt, 'WARN'); continue; }
        images.push({ mimeType: b.getContentType()||'image/jpeg', data: Utilities.base64Encode(b.getBytes()) });
      } catch (_) {}
    }
  }
  if (data && data.texts && data.texts.length) {
    texts = data.texts.map(function(t){ return String(t||'').trim(); }).filter(Boolean).slice(0, cap);
  }
  return { images: images, texts: texts, hasMore: false, nextOffset: 0 };
}

function getVkParserBaseV2_(){
  try { if (typeof getVkParserUrl_ === 'function') return String(getVkParserUrl_()).replace(/\/$/, ''); } catch(e){}
  try { if (typeof VK_PARSER_URL !== 'undefined' && VK_PARSER_URL) return String(VK_PARSER_URL).replace(/\/$/, ''); } catch(e){}
  throw new Error('Не задан VK_PARSER_URL');
}
function collectVkAlbumViaWebV2_(albumUrl, offset, limit){
  var base = getVkParserBaseV2_(); var take = Math.max(1, Math.min(OCR2_BATCH_LIMIT, limit||OCR2_BATCH_LIMIT));
  var req = base + '?action=parseAlbum&url=' + encodeURIComponent(albumUrl) + '&limit=' + take + '&offset=' + (offset||0);
  log_('V2 VK album request: ' + req, 'DEBUG');
  var resp = UrlFetchApp.fetch(req, { muteHttpExceptions:true, followRedirects:true });
  var code = resp.getResponseCode(); if (code >= 300) throw new Error('VK album HTTP '+code);
  var data = JSON.parse(resp.getContentText());
  var imgs = [];
  if (data && data.images && data.images.length) {
    for (var i=0;i<data.images.length && imgs.length<take;i++){
      try {
        var u = data.images[i].url || data.images[i];
        if (i < 3) log_('V2 VK album image['+i+'] url=' + String(u).slice(0,200), 'DEBUG');
        var b = fetchImageToBlobWithHeadersV2_(u);
        if (!b) { log_('V2 VK album image fetch failed for url=' + String(u).slice(0,200), 'WARN'); continue; }
        var mt = String(b.getContentType()||'').toLowerCase();
        if (mt.indexOf('image/') !== 0) { log_('V2 VK album non-image contentType=' + mt, 'WARN'); continue; }
        imgs.push({ mimeType: b.getContentType()||'image/jpeg', data: Utilities.base64Encode(b.getBytes()) });
      } catch(ei){ log_('V2 VK album image error: ' + ei.message, 'WARN'); }
    }
  } else {
    log_('V2 VK album: 0 images from web-app for url=' + albumUrl, 'WARN');
  }
  return { images: imgs, texts: [], hasMore: !!(data && data.hasMore), nextOffset: (data && data.nextOffset != null) ? data.nextOffset : 0 };
}
function collectVkDiscussionViaWebV2_(topicUrl, offset, limit){
  var base = getVkParserBaseV2_(); var take = Math.max(1, Math.min(OCR2_BATCH_LIMIT, limit||OCR2_BATCH_LIMIT));
  var req = base + '?action=parseDiscussion&url=' + encodeURIComponent(topicUrl) + '&limit=' + take + '&offset=' + (offset||0);
  log_('V2 VK topic request: ' + req, 'DEBUG');
  var resp = UrlFetchApp.fetch(req, { muteHttpExceptions:true, followRedirects:true });
  var code = resp.getResponseCode(); if (code >= 300) throw new Error('VK topic HTTP '+code);
  var data = JSON.parse(resp.getContentText());
  var texts = (data && data.texts) || [];
  texts = texts.map(function(t){ return String(t||'').trim(); }).filter(Boolean).slice(0, take);
  if (!texts.length) log_('V2 VK topic: 0 texts from web-app for url=' + topicUrl, 'WARN');
  return { images: [], texts: texts, hasMore: !!(data && data.hasMore), nextOffset: (data && data.nextOffset != null) ? data.nextOffset : 0 };
}
function collectVkReviewsViaWebV2_(reviewsUrl, offset, limit){
  var base = getVkParserBaseV2_(); var take = Math.max(1, Math.min(OCR2_BATCH_LIMIT, limit||OCR2_BATCH_LIMIT));
  var req = base + '?action=parseReviews&url=' + encodeURIComponent(reviewsUrl) + '&limit=' + take + '&offset=' + (offset||0);
  log_('V2 VK reviews request: ' + req, 'DEBUG');
  var resp = UrlFetchApp.fetch(req, { muteHttpExceptions:true, followRedirects:true });
  var code = resp.getResponseCode(); if (code >= 300) throw new Error('VK reviews HTTP '+code);
  var data = JSON.parse(resp.getContentText());
  var texts = (data && data.texts) || [];
  texts = texts.map(function(t){ return String(t||'').trim(); }).filter(Boolean).slice(0, take);
  if (!texts.length) log_('V2 VK reviews: 0 texts from web-app for url=' + reviewsUrl, 'WARN');
  return { images: [], texts: texts, hasMore: !!(data && data.hasMore), nextOffset: (data && data.nextOffset != null) ? data.nextOffset : 0 };
}

// ----- Drive helpers (local)
function enumerateDriveFolderImagesV2_(folderId, offset, limit){
  var folder = DriveApp.getFolderById(folderId); var it = folder.getFiles();
  var images = []; var imgIndex = 0;
  while (it.hasNext()) { var f = it.next(); var mt = String(f.getMimeType()||'').toLowerCase(); if (mt.indexOf('image/') !== 0) continue; if (imgIndex < (offset||0)) { imgIndex++; continue; } var blob=f.getBlob(); images.push({ mimeType: blob.getContentType()||'image/png', data: Utilities.base64Encode(blob.getBytes()) }); imgIndex++; if (images.length >= limit) break; }
  var hasMore = it.hasNext(); var nextOffset = (offset||0) + images.length; log_('V2 Drive folder: collected ' + images.length + ' images (offset='+(offset||0)+', limit='+limit+')', 'DEBUG'); return { images: images, texts: [], hasMore: hasMore, nextOffset: nextOffset };
}

// ----- Yandex / Dropbox helpers (local)
function collectYandexPublicV2_(publicUrl, offset, limit){
  var base='https://cloud-api.yandex.net/v1/disk/public/resources'; var download='https://cloud-api.yandex.net/v1/disk/public/resources/download'; var images=[];
  try {
    var res = UrlFetchApp.fetch(base+'?public_key='+encodeURIComponent(publicUrl), { muteHttpExceptions:true, followRedirects:true }); var code = res.getResponseCode(); var data = JSON.parse(res.getContentText()); if (code >= 300) throw new Error('Yandex meta HTTP '+code);
    if (data && data.type==='file') { if (offset && offset>0) return { images:[], texts:[], hasMore:false, nextOffset:offset }; var dl=UrlFetchApp.fetch(download+'?public_key='+encodeURIComponent(publicUrl)).getContentText(); var link=JSON.parse(dl).href; var f=UrlFetchApp.fetch(link,{ muteHttpExceptions:true, followRedirects:true }); var blob=f.getBlob(); images.push({ mimeType: blob.getContentType()||'image/png', data: Utilities.base64Encode(blob.getBytes()) }); return { images:images, texts:[], hasMore:false, nextOffset:1 }; }
    if (data && data.type==='dir') { var pageOffset=0, imgSeen=0, take=Math.max(0, limit||OCR2_BATCH_LIMIT); while (images.length<take){ var meta=UrlFetchApp.fetch(base+'?public_key='+encodeURIComponent(publicUrl)+'&limit=200&offset='+pageOffset,{ muteHttpExceptions:true, followRedirects:true }); var md=JSON.parse(meta.getContentText()); var items=(md && md._embedded && md._embedded.items)||[]; if (!items.length) break; for (var i=0;i<items.length && images.length<take;i++){ var it=items[i]; if (it.type!=='file') continue; var mime=String(it.mime_type||'').toLowerCase(); if (mime.indexOf('image/')!==0) continue; if (imgSeen < (offset||0)) { imgSeen++; continue; } var dl2=UrlFetchApp.fetch(download+'?public_key='+encodeURIComponent(publicUrl)+'&path='+encodeURIComponent(it.path)).getContentText(); var link2=JSON.parse(dl2).href; var f2=UrlFetchApp.fetch(link2,{ muteHttpExceptions:true, followRedirects:true }); var blob2=f2.getBlob(); images.push({ mimeType: blob2.getContentType()||'image/png', data: Utilities.base64Encode(blob2.getBytes()) }); imgSeen++; } pageOffset += items.length; if (items.length<200) break; } var hasMore = images.length >= take; var nextOffset = (offset||0) + images.length; return { images:images, texts:[], hasMore:hasMore, nextOffset:nextOffset }; }
  } catch (e) { log_('⚠️ Yandex error: ' + e.message, 'WARN'); }
  return { images: images, texts: [], hasMore:false, nextOffset:(offset||0)+images.length };
}
function toDropboxDirectV2_(u){ try { var url = u.replace('www.dropbox.com','dl.dropboxusercontent.com'); if (url.indexOf('?dl=0')>=0) url=url.replace('?dl=0','?dl=1'); if (url.indexOf('?dl=1')<0 && url.indexOf('?')<0) url += '?dl=1'; return url; } catch(e){ return u; } }

// ----- Local OCR fallbacks
function gmOcrFromBlobV2_(blob, lang){
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'); if (!apiKey) throw new Error('Не задан GEMINI_API_KEY');
  var mime = blob.getContentType()||'image/png'; var b64 = Utilities.base64Encode(blob.getBytes());
  var instruction = 'Транскрибируй текст на изображении БЕЗ добавления от себя. Верни только чистый текст. Если изображений несколько — разделяй отзывы строкой из четырёх подчёркиваний: ____ .'+(lang?(' Язык: '+lang+'.'):'');
  var body = { contents: [{ parts: [{ text: instruction }, { inlineData: { mimeType: mime, data: b64 } }] }], generationConfig: { maxOutputTokens: 2048, temperature: 0 } };
  var resp = UrlFetchApp.fetch(GEMINI_API_URL + '?key=' + apiKey, { method:'post', contentType:'application/json', payload: JSON.stringify(body), muteHttpExceptions:true });
  var code = resp.getResponseCode(); var data = JSON.parse(resp.getContentText()); if (code !== 200) { var msg=(data&&data.error&&data.error.message)||('HTTP_'+code); throw new Error('Gemini OCR: '+msg); }
  var cand = data.candidates && data.candidates[0]; var part = cand && cand.content && cand.content.parts && cand.content.parts[0]; var text = part && part.text ? part.text : '';
  return (typeof processGeminiResponse === 'function') ? processGeminiResponse(text) : text;
}
function splitBySeparatorV2_(text){
  var s = String(text||'').trim(); if (!s) return [];
  // основной способ: маркер ____ (четыре и более подчёркиваний) отдельной строкой или в тексте
  var parts = s.split(/\n?_{4,}\n?/g).map(function(x){ return String(x||'').trim(); }).filter(Boolean);
  if (parts.length > 1) return parts;
  // запасной: параграфы
  var parts2 = s.split(/\n{2,}/g).map(function(x){ return String(x||'').trim(); }).filter(Boolean);
  return parts2.length > 1 ? parts2 : [s];
}

function cleanTextForUrlsV2_(s){
  try {
    var t = String(s||'');
    // убрать все теги вида <...>
    t = t.replace(/<[^>]*>/g, ' ');
    // простая декодировка HTML-сущностей для популярных случаев
    t = t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return t;
  } catch (e) { return String(s||''); }
}

// Локальная версия server OCR call с делимитером "____" (не затрагивает review.gs)
function serverGmOcrBatchV2_(images, lang){
  var email = (typeof getLicenseEmail === 'function') ? getLicenseEmail() : '';
  var token = (typeof getLicenseToken === 'function') ? getLicenseToken() : '';
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  var payload = { action: 'gm_image', email: email, token: token, apiKey: apiKey, images: images, lang: lang || 'ru', delimiter: '____' };
  var resp = UrlFetchApp.fetch(SERVER_URL, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true });
  var code = resp.getResponseCode();
  var data = JSON.parse(resp.getContentText());
  if (code !== 200 || !data || !data.ok) throw new Error((data && data.error) || ('HTTP_' + code));
  return data.data || '';
}

// Fetch image with browser-like headers to preserve query string semantics (VK CDN)
function fetchImageToBlobWithHeadersV2_(url) {
  try {
    var opts = {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Referer': 'https://vk.com/'
      }
    };
    var res = UrlFetchApp.fetch(url, opts);
    var code = res.getResponseCode();
    if (code >= 300) return null;
    return res.getBlob();
  } catch (e) {
    return null;
  }
}
