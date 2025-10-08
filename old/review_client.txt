// ====== OCR отзывов (изображения/ссылки в A → текст в B) через Gemini (одного GEMINI_API_KEY достаточно) ======
var OCR_LANGUAGE = 'ru';
var MAX_FOLDER_IMAGES = 50; // для GDrive и локальных итераторов
var OCR_BATCH_LIMIT = 50;   // общий лимит изображений/отзывов за один прогон по строке

function ocrGetStateKey_(row){ return 'OCRQ:row:' + row; }
function ocrGetState_(row) {
  try {
    var s = PropertiesService.getScriptProperties().getProperty(ocrGetStateKey_(row));
    return s ? JSON.parse(s) : null;
  } catch (e) { return null; }
}
function ocrSetState_(row, state) {
  try { PropertiesService.getScriptProperties().setProperty(ocrGetStateKey_(row), JSON.stringify(state||{})); } catch (e) {}
}
function ocrClearState_(row) {
  try { PropertiesService.getScriptProperties().deleteProperty(ocrGetStateKey_(row)); } catch (e) {}
}
function ocrSignature_(textVal, formula){ return String(textVal||'') + '|' + String(formula||''); }

function ocrFindNextRow_(sh, r) {
  try {
    var last = Math.max(r, sh.getLastRow());
    var row = r;
    var b0 = String(sh.getRange(row, 2).getDisplayValue() || '').trim();
    if (!b0) return row;
    row++;
    while (row <= last) {
      var a = String(sh.getRange(row, 1).getDisplayValue() || '').trim();
      var b = String(sh.getRange(row, 2).getDisplayValue() || '').trim();
      if (a) break; // встретили следующую запись в A → предыдущий блок завершён
      if (b) row++; else break; // продолжаем, пока B занято и A пусто
    }
    return row; // первая пустая строка после блока
  } catch (e) { return r; }
}

function ocrReviews() {
  try {
    // Лицензия (если сервер недоступен — в DEV_MODE продолжаем)
    try {
      if (typeof serverStatus_ === 'function') {
        var st = serverStatus_();
        if (!st.ok && !(typeof DEV_MODE !== 'undefined' && DEV_MODE)) {
          SpreadsheetApp.getUi().alert('Лицензия', '❌ Лицензия не активна или сервер недоступен', SpreadsheetApp.getUi().ButtonSet.OK);
          return;
        }
      }
    } catch (e) { /* игнорируем в DEV */ }

    var ss = SpreadsheetApp.getActive();
    var sh = ss.getSheetByName('Отзывы');
    if (!sh) { SpreadsheetApp.getUi().alert('Лист "Отзывы" не найден'); return; }
    var lastRow = Math.max(2, sh.getLastRow());
    var processed = 0, empty = 0, errors = 0, skipped = 0;
    var overwrite = getOcrOverwrite_();

    for (var r = 2; r <= lastRow; r++) {
      var rangeA = sh.getRange(r, 1);
      var textVal = String(rangeA.getDisplayValue() || '').trim();
      var formula = String(rangeA.getFormula() || '');
      var richUrl = '';
      try {
        var rich = rangeA.getRichTextValue();
        if (rich) {
          // 1) По сегментам
          var runs = rich.getRuns && rich.getRuns();
          if (runs && runs.length) {
            for (var ri = 0; ri < runs.length; ri++) {
              var st = runs[ri].getTextStyle && runs[ri].getTextStyle();
              var lu = st && st.getLinkUrl && st.getLinkUrl();
              if (lu) { richUrl = String(lu).trim(); break; }
            }
          }
          // 2) Ссылка на всю ячейку
          if (!richUrl && typeof rich.getLinkUrl === 'function') {
            var ru = rich.getLinkUrl();
            if (ru) richUrl = String(ru).trim();
          }
          // 3) Через стиль всей ячейки
          if (!richUrl && rich.getTextStyle) {
            var ts = rich.getTextStyle();
            var lu2 = ts && ts.getLinkUrl && ts.getLinkUrl();
            if (lu2) richUrl = String(lu2).trim();
          }
        }
      } catch (e) {}
      if (!textVal && !formula && !richUrl) { empty++; continue; }

      // Политика перезаписи: если B уже заполнено и overwrite=false — пропускаем строку,
      // но если есть активная очередь по этой строке (signature совпадает) — продолжаем
      var sig = ocrSignature_(textVal, formula);
      var state = ocrGetState_(r);
      var hasActiveQueue = !!(state && state.signature === sig);
      var bVal = String(sh.getRange(r, 2).getDisplayValue() || '').trim();
      if (!overwrite && bVal && !hasActiveQueue) { skipped++; continue; }

      var sources = parseSourcesFromCell_(textVal, formula, richUrl);
      if (!sources.length) {
        addLog('⚠️ Нет источников в A' + r + ': text="' + String(textVal).slice(0,120) + '" formula="' + String(formula).slice(0,120) + '" link="' + richUrl + '"', 'WARN');
        empty++;
        continue;
      }

      // Инициализация состояния очереди по строке
      if (!state || state.signature !== sig) {
        state = { signature: sig, sources: {} };
      }

      // Куда писать: если B уже есть (и мы не пересоздаём), дописываем ниже блока
      var writeRow = bVal ? ocrFindNextRow_(sh, r) : r;

      // Собираем изображения и тексты из источников с учётом offset и общего лимита по строке
      var batchImages = [];
      var collectedTexts = [];
      var remainingCap = OCR_BATCH_LIMIT;
      var hasMoreAny = false;
      for (var i = 0; i < sources.length && remainingCap > 0; i++) {
        var src = sources[i];
        var key = src.kind + ':' + (src.id || src.url || '');
        var srcState = state.sources[key] || { offset: 0, done: false };
        if (srcState.done) continue;
        var part = { images: [], texts: [], hasMore: false, nextOffset: srcState.offset };
        try { part = ocrSource_(src, OCR_LANGUAGE, srcState.offset, remainingCap) || part; }
        catch (e1) { errors++; addLog('❌ OCR parse error (row ' + r + '): ' + e1.message, 'ERROR'); }
        var added = 0;
        if (part.texts && part.texts.length) { collectedTexts = collectedTexts.concat(part.texts); added += part.texts.length; }
        if (added < remainingCap && part.images && part.images.length) { batchImages = batchImages.concat(part.images); added += part.images.length; }
        remainingCap = Math.max(0, remainingCap - added);
        if (part.hasMore) { hasMoreAny = true; srcState.offset = part.nextOffset || (srcState.offset + added); }
        else { srcState.done = true; srcState.offset = part.nextOffset || srcState.offset; }
        state.sources[key] = srcState;
      }
      if (!batchImages.length && !collectedTexts.length) { empty++; continue; }

      var reviews = [];
      // Сначала используем тексты (если это обсуждение VK и т.п.)
      // Лимитируем общий выпуск по строке до OCR_BATCH_LIMIT
      if (collectedTexts.length) {
        reviews = collectedTexts.slice(0, OCR_BATCH_LIMIT);
      }
      var remaining = Math.max(0, OCR_BATCH_LIMIT - reviews.length);
      if (remaining > 0 && batchImages.length) {
        // Ограничим количество изображений
        var limitedImages = batchImages.slice(0, remaining);
        try {
          var out = serverGmOcrBatch_(limitedImages, OCR_LANGUAGE);
          var arr = splitNumberedReviews_(out);
          if (arr.length <= 1) {
            var alt = (out || '').split(/\n{2,}/).map(function(s){ return String(s||'').trim(); }).filter(function(s){ return !!s; });
            arr = alt.length > 1 ? alt : [out];
          }
          reviews = reviews.concat(arr);
        } catch (e2) {
          errors++;
          addLog('❌ OCR batch error (row ' + r + '): ' + e2.message, 'ERROR');
          // fallback: по одному изображению
          try {
            for (var j = 0; j < limitedImages.length; j++) {
              var b = Utilities.newBlob(Utilities.base64Decode(limitedImages[j].data), limitedImages[j].mimeType || 'image/png', 'img');
              var t = gmOcrFromBlob_(b, OCR_LANGUAGE);
              if (t && String(t).trim()) reviews.push(String(t).trim());
            }
          } catch (e3) { addLog('❌ OCR fallback error (row ' + r + '): ' + e3.message, 'ERROR'); }
        }
      }

      if (!reviews.length) { empty++; continue; }
      if (reviews.length > 1) {
        sh.insertRowsAfter(writeRow, reviews.length - 1);
        lastRow += (reviews.length - 1);
      }
      var matrix = reviews.map(function(x){ return [x]; });
      sh.getRange(writeRow, 2, reviews.length, 1).setValues(matrix);
      if (reviews.length > 1 && writeRow === r) {
        r += (reviews.length - 1); // пропустим только что вставленные строки, если писали в текущую строку
      }

      // Сохраняем/очищаем состояние очереди
      if (hasMoreAny || remainingCap === 0) {
        ocrSetState_(r, state);
      } else {
        ocrClearState_(r);
      }

      processed++;
      Utilities.sleep(150); // чуть притормозим, чтобы не упереться в квоты
    }
    SpreadsheetApp.getUi().alert('OCR завершён', 'Строк обработано: ' + processed + '\nПропущено (B уже заполнено): ' + skipped + '\nПустых: ' + empty + '\nОшибок: ' + errors + '\n\nЛимит: ' + OCR_BATCH_LIMIT + ' за запуск. Если остались элементы — запустите ещё раз.', SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    addLog('❌ OCR авария: ' + e.message, 'ERROR');
    SpreadsheetApp.getUi().alert('Ошибка OCR: ' + e.message);
  }
}

function getOcrOverwrite_() {
  try {
    var v = PropertiesService.getScriptProperties().getProperty('OCR_OVERWRITE');
    if (!v) return false; // по умолчанию НЕ перезаписываем
    v = String(v).toLowerCase().trim();
    return v === '1' || v === 'true' || v === 'yes' || v === 'да';
  } catch (e) { return false; }
}

function parseSourcesFromCell_(textVal, formula, richUrl) {
  var arr = [];
  // 0) Гиперссылка на ячейке
  if (richUrl) {
    var norm = normalizeUrl_(richUrl);
    if (norm) arr.push(classifyUrlSource_(norm));
  }
  // 1) IMAGE("...")
  var urlFromImage = parseImageFormulaUrl_(formula);
  if (urlFromImage) arr.push(classifyUrlSource_(normalizeUrl_(urlFromImage)));
  // 1.1) HYPERLINK("...")
  var urlFromHyper = parseHyperlinkFormulaUrl_(formula);
  if (urlFromHyper) arr.push(classifyUrlSource_(normalizeUrl_(urlFromHyper)));

  // 2) Явные ссылки в тексте (может быть несколько через перевод строки/пробел)
  var urls = [];
  try {
    // a) http/https
    (textVal.match(/https?:\/\/\S+/g) || []).forEach(function(s){ urls.push(s); });
    // b) без схемы (vk.com/…, drive.google.com/…, yadi.sk/…, disk.yandex.ru/…, dropbox.com/…)
    (textVal.match(/(?:^|\s)(?:vk\.com|drive\.google\.com|yadi\.sk|disk\.yandex\.(?:ru|com)|dropbox\.com)\/\S+/gi) || [])
      .forEach(function(s){ urls.push(s.trim()); });
  } catch (e) {}
  urls = urls.map(function(s){ return normalizeUrl_(s.replace(/[),.;]+$/, '')); });
  urls.forEach(function(u){
    arr.push(classifyUrlSource_(u));
  });

  // Уникализируем источники
  var seen = {};
  arr = arr.filter(function(s){
    var k = s.kind + ':' + (s.url || s.id);
    if (seen[k]) return false; seen[k] = true; return true;
  });
  return arr;
}

function classifyUrlSource_(u) {
  // VK album/topic
  var vk = detectVkLink_(u);
  if (vk) return vk; // { kind: 'vk-album'|'vk-topic', url }
  // Google Drive
  var g = detectDriveLink_(u);
  if (g && g.type === 'folder') return { kind: 'drive-folder', id: g.id };
  if (g && g.type === 'file') return { kind: 'drive-file', id: g.id };
  // Yandex Disk (public)
  if (isYandexPublic_(u)) return { kind: 'yadisk', url: u };
  // Dropbox file share
  if (isDropboxLink_(u)) return { kind: 'dropbox-file', url: u };
  // Generic URL (пытаемся скачать как картинку)
  return { kind: 'url', url: u };
}

function parseImageFormulaUrl_(formula) {
  if (!formula) return '';
  var f = String(formula).trim();
  // Поддержка локализованных имён функций: IMAGE / ИЗОБРАЖЕНИЕ; кавычки ' или "
  var m = f.match(/^=\s*(?:IMAGE|ИЗОБРАЖЕНИЕ)\s*\(\s*(["'])([^"']+)\1/i);
  return m ? m[2] : '';
}

function parseHyperlinkFormulaUrl_(formula) {
  if (!formula) return '';
  var f = String(formula).trim();
  // Поддержка локализованных имён функций: HYPERLINK / ГИПЕРССЫЛКА; кавычки ' или "
  var m = f.match(/^=\s*(?:HYPERLINK|ГИПЕРССЫЛКА)\s*\(\s*(["'])([^"']+)\1/i);
  return m ? m[2] : '';
}

function normalizeUrl_(u) {
  try {
    var s = String(u || '').trim();
    if (!s) return '';
    // если завернут в <...> — уберём
    s = s.replace(/^<+|>+$/g, '');
    if (/^https?:\/\//i.test(s)) return s;
    if (/^www\./i.test(s)) return 'https://' + s;
    if (/^(vk\.com|drive\.google\.com|yadi\.sk|disk\.yandex\.(?:ru|com)|dropbox\.com)\//i.test(s)) return 'https://' + s;
    return s;
  } catch (e) { return String(u || ''); }
}

function detectDriveLink_(url) {
  try {
    var u = String(url || '');
    var m1 = u.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
    if (m1) return { type: 'folder', id: m1[1] };
    var m2 = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m2) return { type: 'file', id: m2[1] };
    var m3 = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m3) return { type: 'file', id: m3[1] };
    return null;
  } catch (e) { return null; }
}

function ocrSource_(src, lang, offset, limit) {
  // Возвращаем объект { images: [inlineData...], texts: [ ... ] }
  if (src.kind === 'drive-folder') {
    return enumerateDriveFolderImages_(src.id, offset || 0, Math.max(0, limit || OCR_BATCH_LIMIT));
  } else if (src.kind === 'drive-file') {
    var file = DriveApp.getFileById(src.id);
    if (offset && offset > 0) return { images: [], texts: [], hasMore: false, nextOffset: offset };
    return { images: [{ mimeType: file.getBlob().getContentType() || 'image/png', data: Utilities.base64Encode(file.getBlob().getBytes()) }], texts: [], hasMore: false, nextOffset: 1 };
  } else if (src.kind === 'url') {
    var resp = UrlFetchApp.fetch(src.url, { muteHttpExceptions: true, followRedirects: true });
    if (resp.getResponseCode() >= 300) throw new Error('HTTP ' + resp.getResponseCode() + ' по URL');
    var blob = resp.getBlob();
    if (offset && offset > 0) return { images: [], texts: [], hasMore: false, nextOffset: offset };
    return { images: [{ mimeType: blob.getContentType() || 'image/png', data: Utilities.base64Encode(blob.getBytes()) }], texts: [], hasMore: false, nextOffset: 1 };
  } else if (src.kind === 'yadisk') {
    return collectYandexPublic_(src.url, offset || 0, Math.max(0, limit || OCR_BATCH_LIMIT));
  } else if (src.kind === 'dropbox-file') {
    var dl = toDropboxDirect_(src.url);
    var resp2 = UrlFetchApp.fetch(dl, { muteHttpExceptions: true, followRedirects: true });
    if (resp2.getResponseCode() >= 300) throw new Error('Dropbox HTTP ' + resp2.getResponseCode());
    var blob2 = resp2.getBlob();
    if (offset && offset > 0) return { images: [], texts: [], hasMore: false, nextOffset: offset };
    return { images: [{ mimeType: blob2.getContentType() || 'image/png', data: Utilities.base64Encode(blob2.getBytes()) }], texts: [], hasMore: false, nextOffset: 1 };
  } else if (src.kind === 'vk-album') {
    return collectVkAlbum_(src.url, offset || 0, Math.max(0, limit || OCR_BATCH_LIMIT));
  } else if (src.kind === 'vk-topic') {
    return collectVkDiscussion_(src.url, offset || 0, Math.max(0, limit || OCR_BATCH_LIMIT));
  } else if (src.kind === 'vk-reviews') {
    return collectVkReviews_(src.url, offset || 0, Math.max(0, limit || OCR_BATCH_LIMIT));
  }
  return { images: [], texts: [], hasMore: false, nextOffset: offset || 0 };
}

function ocrDriveFolder_(folderId, lang) {
  var folder = DriveApp.getFolderById(folderId);
  var texts = [];
  var it = folder.getFiles();
  var n = 0;
  while (it.hasNext()) {
    var f = it.next();
    // фильтруем по типу
    var mt = String(f.getMimeType() || '').toLowerCase();
    if (mt.indexOf('image/') !== 0) continue;
    try {
      var blob = f.getBlob();
      var t = gmOcrFromBlob_(blob, lang);
      if (t && String(t).trim()) texts.push(String(t).trim());
    } catch (e) {
      addLog('⚠️ OCR по файлу из папки: ' + f.getName() + ' → ' + e.message, 'WARN');
    }
    n++; if (n >= MAX_FOLDER_IMAGES) break;
    Utilities.sleep(150);
  }
  return texts.join('\n\n');
}

function collectDriveFolderImages_(folderId) {
  var folder = DriveApp.getFolderById(folderId);
  var list = [];
  var it = folder.getFiles();
  var n = 0;
  while (it.hasNext()) {
    var f = it.next();
    var mt = String(f.getMimeType() || '').toLowerCase();
    if (mt.indexOf('image/') !== 0) continue;
    var blob = f.getBlob();
    list.push({ mimeType: blob.getContentType() || 'image/png', data: Utilities.base64Encode(blob.getBytes()) });
    n++; if (n >= MAX_FOLDER_IMAGES) break;
  }
  return list;
}

function enumerateDriveFolderImages_(folderId, offset, limit) {
  var folder = DriveApp.getFolderById(folderId);
  var it = folder.getFiles();
  var images = [];
  var imgIndex = 0;
  while (it.hasNext()) {
    var f = it.next();
    var mt = String(f.getMimeType() || '').toLowerCase();
    if (mt.indexOf('image/') !== 0) continue;
    if (imgIndex < offset) { imgIndex++; continue; }
    var blob = f.getBlob();
    images.push({ mimeType: blob.getContentType() || 'image/png', data: Utilities.base64Encode(blob.getBytes()) });
    imgIndex++;
    if (images.length >= limit) break;
  }
  var hasMore = it.hasNext();
  var nextOffset = offset + images.length;
  return { images: images, texts: [], hasMore: hasMore, nextOffset: nextOffset };
}

function gmOcrFromBlob_(blob, lang) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) throw new Error('Не задан GEMINI_API_KEY');
  var mime = blob.getContentType() || 'image/png';
  var b64 = Utilities.base64Encode(blob.getBytes());
  var instruction = 'Задача: транскрибируй текст на изображении БЕЗ добавления от себя. Верни только чистый текст. Если на вход подается несколько изображений — разделяй отзывы нумерацией (1., 2., 3.).' + (lang ? ' Язык исходного текста: ' + lang + '.' : '');
  var body = {
    contents: [{
      parts: [
        { text: instruction },
        { inlineData: { mimeType: mime, data: b64 } }
      ]
    }],
    generationConfig: { maxOutputTokens: 2048, temperature: 0 }
  };
  var resp = UrlFetchApp.fetch(GEMINI_API_URL + '?key=' + apiKey, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true
  });
  var code = resp.getResponseCode();
  var data = JSON.parse(resp.getContentText());
  if (code !== 200) {
    var msg = (data && data.error && data.error.message) || ('HTTP_' + code);
    throw new Error('Gemini OCR: ' + msg);
  }
  var candidate = data.candidates && data.candidates[0];
  var content = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
  var text = content && content.text ? content.text : '';
  if (typeof processGeminiResponse === 'function') {
    return processGeminiResponse(text);
  }
  return text;
}

function serverGmOcrBatch_(images, lang) {
  var email = (typeof getLicenseEmail === 'function') ? getLicenseEmail() : '';
  var token = (typeof getLicenseToken === 'function') ? getLicenseToken() : '';
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  var payload = { action: 'gm_image', email: email, token: token, apiKey: apiKey, images: images, lang: lang || 'ru' };
  var resp = UrlFetchApp.fetch(SERVER_URL, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true });
  var code = resp.getResponseCode();
  var data = JSON.parse(resp.getContentText());
  if (code !== 200 || !data || !data.ok) throw new Error((data && data.error) || ('HTTP_' + code));
  return data.data || '';
}

function splitNumberedReviews_(text) {
  var s = String(text || '').trim();
  if (!s) return [];
  // Ищем паттерн нумерации 1. ... 2. ... 3. ... (в начале строки)
  var parts = s.split(/\n\s*(?=\d+\.)/g).map(function(x){ return String(x||'').trim(); }).filter(function(x){ return !!x; });
  // Если первая часть не начинается с "1.", не считаем это нумерацией
  if (!/^\d+\.\s/.test(parts[0])) return [s];
  // Убираем префиксы "N."
  parts = parts.map(function(x){ return x.replace(/^\d+\.\s*/, ''); });
  return parts;
}

// ===== Провайдеры: Yandex Disk (публичный), Dropbox-file, VK (album/topic через ваше веб-приложение) =====
function isYandexPublic_(u) {
  return /yadi\.sk\//i.test(u) || /disk\.yandex\.(ru|com)\//i.test(u);
}
function isDropboxLink_(u) {
  return /dropbox\.com\//i.test(u);
}
function toDropboxDirect_(u) {
  try {
    var url = u.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    if (url.indexOf('?dl=0') >= 0) url = url.replace('?dl=0', '?dl=1');
    if (url.indexOf('?dl=1') < 0 && url.indexOf('?') < 0) url += '?dl=1';
    return url;
  } catch (e) { return u; }
}

function collectYandexPublic_(publicUrl, offset, limit) {
  // public/resources может отдавать как файл, так и папку. Для папки пройдёмся children и возьмём только image/* (до OCR_BATCH_LIMIT)
  var base = 'https://cloud-api.yandex.net/v1/disk/public/resources';
  var download = 'https://cloud-api.yandex.net/v1/disk/public/resources/download';
  var images = [];
  try {
    var res = UrlFetchApp.fetch(base + '?public_key=' + encodeURIComponent(publicUrl), { muteHttpExceptions: true, followRedirects: true });
    var code = res.getResponseCode();
    var data = JSON.parse(res.getContentText());
    if (code >= 300) throw new Error('Yandex public meta HTTP ' + code);
    if (data && data.type === 'file') {
      if (offset && offset > 0) return { images: [], texts: [], hasMore: false, nextOffset: offset };
      var dl = UrlFetchApp.fetch(download + '?public_key=' + encodeURIComponent(publicUrl)).getContentText();
      var link = JSON.parse(dl).href;
      var f = UrlFetchApp.fetch(link, { muteHttpExceptions: true, followRedirects: true });
      var blob = f.getBlob();
      images.push({ mimeType: blob.getContentType() || 'image/png', data: Utilities.base64Encode(blob.getBytes()) });
      return { images: images, texts: [], hasMore: false, nextOffset: 1 };
    } else if (data && data.type === 'dir') {
      // Скан по страницам до набора limit изображений, учитывая image-offset
      var pageOffset = 0;
      var imgSeen = 0;
      var takeLimit = Math.max(0, limit || OCR_BATCH_LIMIT);
      while (images.length < takeLimit) {
        var meta = UrlFetchApp.fetch(base + '?public_key=' + encodeURIComponent(publicUrl) + '&limit=200&offset=' + pageOffset, { muteHttpExceptions: true, followRedirects: true });
        var md = JSON.parse(meta.getContentText());
        var items = (md && md._embedded && md._embedded.items) || [];
        if (!items.length) break;
        for (var i = 0; i < items.length && images.length < takeLimit; i++) {
          var it = items[i];
          if (it.type !== 'file') continue;
          var mime = String(it.mime_type || '').toLowerCase();
          if (mime.indexOf('image/') !== 0) continue;
          if (imgSeen < (offset || 0)) { imgSeen++; continue; }
          var dl2 = UrlFetchApp.fetch(download + '?public_key=' + encodeURIComponent(publicUrl) + '&path=' + encodeURIComponent(it.path)).getContentText();
          var link2 = JSON.parse(dl2).href;
          var f2 = UrlFetchApp.fetch(link2, { muteHttpExceptions: true, followRedirects: true });
          var blob2 = f2.getBlob();
          images.push({ mimeType: blob2.getContentType() || 'image/png', data: Utilities.base64Encode(blob2.getBytes()) });
          imgSeen++;
        }
        pageOffset += items.length;
        if (items.length < 200) break;
      }
      var hasMore = images.length >= takeLimit; // грубая оценка
      var nextOffset = (offset || 0) + images.length;
      return { images: images, texts: [], hasMore: hasMore, nextOffset: nextOffset };
    }
  } catch (e) {
    addLog('⚠️ Yandex public error: ' + e.message, 'WARN');
  }
  return { images: images, texts: [], hasMore: false, nextOffset: (offset || 0) + images.length };
}

function detectVkLink_(u) {
  var s = String(u||'');
  // album-123_456 или album123_456
  if (/vk\.com\/(reviews-?\d+)/i.test(s)) return { kind: 'vk-reviews', url: u };
  if (/vk\.com\/(album-?\d+_\d+)/i.test(s)) return { kind: 'vk-album', url: u };
  if (/vk\.com\/(topic-?\d+_\d+)/i.test(s)) return { kind: 'vk-topic', url: u };
  return null;
}

function getVkWebAppUrl_() {
  if (typeof VK_PARSER_URL === 'undefined' || !VK_PARSER_URL) {
    throw new Error('Не задан VK_PARSER_URL');
  }
  return String(VK_PARSER_URL).replace(/\/$/, '');
}

function getVkTokenLocal_() {
  return PropertiesService.getScriptProperties().getProperty('VK_TOKEN') || '';
}

function collectVkAlbum_(albumUrl, offset, limit) {
  var base = getVkWebAppUrl_();
  var take = Math.max(0, limit || OCR_BATCH_LIMIT);
  var url = base + '?action=parseAlbum&url=' + encodeURIComponent(albumUrl) + '&limit=' + take + '&offset=' + (offset || 0);
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
  var code = resp.getResponseCode();
  var data = null;
  try { data = JSON.parse(resp.getContentText()); } catch (e) {}
  if (code >= 300 || (data && data.error)) {
    addLog('VK album via web-app failed: HTTP ' + code + (data && data.error ? ('; error=' + data.error) : ''), 'WARN');
    var hasLocalToken = !!getVkTokenLocal_();
    if (hasLocalToken) {
      addLog('Attempt direct photos.get fallback (local VK_TOKEN present)', 'INFO');
      return fetchVkAlbumDirect_(albumUrl, offset || 0, take);
    } else {
      addLog('Skip direct fallback: VK_TOKEN not set in this script — web app is authoritative', 'INFO');
      return { images: [], texts: [], hasMore: false, nextOffset: offset || 0 };
    }
  }
  var imgs = [];
  if (data && data.images && data.images.length) {
    for (var i = 0; i < data.images.length && imgs.length < take; i++) {
      try {
        var u = data.images[i].url || data.images[i];
        var f = UrlFetchApp.fetch(u, { muteHttpExceptions: true, followRedirects: true });
        if (f.getResponseCode() >= 300) continue;
        var b = f.getBlob();
        imgs.push({ mimeType: b.getContentType() || 'image/jpeg', data: Utilities.base64Encode(b.getBytes()) });
      } catch (e) {}
    }
  }
  var hasMore = !!(data && data.hasMore);
  var nextOffset = (data && data.nextOffset != null) ? data.nextOffset : ((offset || 0) + (data && data.images ? data.images.length : 0));
  return { images: imgs, texts: [], hasMore: hasMore, nextOffset: nextOffset };
}

function fetchVkAlbumDirect_(albumUrl, offset, limit) {
  var token = getVkTokenLocal_();
  if (!token) {
    addLog('VK album direct fallback requires VK_TOKEN in Script Properties', 'ERROR');
    return { images: [], texts: [], hasMore: false, nextOffset: offset };
  }
  var m = String(albumUrl).match(/vk\.com\/album(-?\d+)_([0-9]+)/i);
  if (!m) { addLog('VK album URL parse failed: ' + albumUrl, 'ERROR'); return { images: [], texts: [], hasMore: false, nextOffset: offset }; }
  var ownerId = parseInt(m[1], 10);
  var albumId = parseInt(m[2], 10);
  var v = '5.131';
  var take = Math.max(1, Math.min(1000, limit || OCR_BATCH_LIMIT));
  var api = 'https://api.vk.com/method/photos.get'
    + '?owner_id=' + ownerId
    + '&album_id=' + albumId
    + '&count=' + take
    + '&offset=' + Math.max(0, offset || 0)
    + '&photo_sizes=1'
    + '&access_token=' + encodeURIComponent(token)
    + '&v=' + v;
  try {
    var r = UrlFetchApp.fetch(api, { muteHttpExceptions: true });
    var code = r.getResponseCode();
    var js = JSON.parse(r.getContentText());
    if (code !== 200 || js.error) {
      addLog('VK photos.get error: HTTP ' + code + (js && js.error ? ('; ' + js.error.error_msg) : ''), 'ERROR');
      return { images: [], texts: [], hasMore: false, nextOffset: offset };
    }
    var resp = js.response || {};
    var items = resp.items || [];
    var total = resp.count || (offset + items.length);
    var images = [];
    for (var i = 0; i < items.length && images.length < take; i++) {
      var ph = items[i];
      var sizes = ph.sizes || [];
      var best = null;
      for (var k = 0; k < sizes.length; k++) {
        var s = sizes[k];
        if (!best || (s.width * s.height > best.width * best.height)) best = s;
      }
      if (best && best.url) {
        try {
          var f = UrlFetchApp.fetch(best.url, { muteHttpExceptions: true, followRedirects: true });
          if (f.getResponseCode() >= 300) continue;
          var b = f.getBlob();
          images.push({ mimeType: b.getContentType() || 'image/jpeg', data: Utilities.base64Encode(b.getBytes()) });
        } catch (e) {}
      }
    }
    var hasMore = (offset + items.length) < total;
    var nextOffset = (offset || 0) + items.length;
    return { images: images, texts: [], hasMore: hasMore, nextOffset: nextOffset };
  } catch (e) {
    addLog('VK album direct fallback exception: ' + e.message, 'ERROR');
    return { images: [], texts: [], hasMore: false, nextOffset: offset };
  }
}

function collectVkDiscussion_(topicUrl, offset, limit) {
  var base = getVkWebAppUrl_();
  var take = Math.max(0, limit || OCR_BATCH_LIMIT);
  var resp = UrlFetchApp.fetch(base + '?action=parseDiscussion&url=' + encodeURIComponent(topicUrl) + '&limit=' + take + '&offset=' + (offset || 0), { muteHttpExceptions: true, followRedirects: true });
  var code = resp.getResponseCode();
  if (code >= 300) { addLog('VK topic HTTP ' + code, 'WARN'); return { images: [], texts: [], hasMore: false, nextOffset: offset || 0 }; }
  var data = JSON.parse(resp.getContentText());
  var texts = (data && data.texts) || [];
  texts = texts.map(function(t){ return String(t||'').trim(); }).filter(function(t){ return !!t; }).slice(0, take);
  var hasMore = !!(data && data.hasMore);
  var nextOffset = (data && data.nextOffset != null) ? data.nextOffset : ((offset || 0) + texts.length);
  return { images: [], texts: texts, hasMore: hasMore, nextOffset: nextOffset };
}

function collectVkReviews_(reviewsUrl, offset, limit) {
  var base = getVkWebAppUrl_();
  var take = Math.max(0, limit || OCR_BATCH_LIMIT);
  var resp = UrlFetchApp.fetch(base + '?action=parseReviews&url=' + encodeURIComponent(reviewsUrl) + '&limit=' + take + '&offset=' + (offset || 0), { muteHttpExceptions: true, followRedirects: true });
  var code = resp.getResponseCode();
  if (code >= 300) { addLog('VK reviews HTTP ' + code, 'WARN'); return { images: [], texts: [], hasMore: false, nextOffset: offset || 0 }; }
  var data = JSON.parse(resp.getContentText());
  var texts = (data && data.texts) || [];
  texts = texts.map(function(t){ return String(t||'').trim(); }).filter(function(t){ return !!t; }).slice(0, take);
  var hasMore = !!(data && data.hasMore);
  var nextOffset = (data && data.nextOffset != null) ? data.nextOffset : ((offset || 0) + texts.length);
  return { images: [], texts: texts, hasMore: hasMore, nextOffset: nextOffset };
}
