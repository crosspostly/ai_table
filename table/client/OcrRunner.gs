/**
 * OCR Runner - Полная логика OCR с pagination из old/ocrRunV2_client.txt
 * АККУРАТНО восстановлено со старой версии
 */

/**
 * Удаляет эмодзи и смайлики из текста (локальная копия)
 * @param {string} text - Исходный текст
 * @return {string} - Текст без эмодзи
 */
function removeEmojis(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  var emojiPattern = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]|[\u2300-\u23FF]|[\u2B50]|[\uFE00-\uFE0F]|[\u200D]|[\u20E3]/g;
  var cleaned = text.replace(emojiPattern, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

// Constants
var OCR2_BATCH_LIMIT = 50;  // Максимум изображений за прогон
var OCR2_CHUNK_SIZE = 8;    // Размер чанка для batch OCR

/**
 * Главная функция OCR - ПОЛНАЯ ЛОГИКА
 * Восстановлено из old/ocrRunV2_client.txt строки 7-100
 */
function ocrRun() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('Отзывы');
  
  if (!sh) {
    ui.alert('Ошибка', 'Лист "Отзывы" не найден. Создайте лист с именем "Отзывы".', ui.ButtonSet.OK);
    return;
  }

  var lastRow = Math.max(2, sh.getLastRow());
  var processed = 0, empty = 0, errors = 0, skipped = 0;
  
  // Получаем флаг перезаписи
  var overwrite = getOcrOverwrite_();
  
  addSystemLog('▶️ OCR V2 start: rows=' + lastRow + ', overwrite=' + overwrite + ', limit=' + OCR2_BATCH_LIMIT, 'INFO', 'OCR');

  // ОСНОВНОЙ ЦИКЛ по строкам
  for (var r = 2; r <= lastRow; r++) {
    try {
      // Читаем ячейку A
      var rangeA = sh.getRange(r, 1);
      var textVal = String(rangeA.getDisplayValue() || '').trim();
      var formula = String(rangeA.getFormula() || '');
      
      // Извлекаем Rich Text ссылку
      var rich = null, richUrl = '';
      try {
        rich = rangeA.getRichTextValue();
        richUrl = extractFirstLink(rich);  // Используем функцию из ThinClient
      } catch (e) {
        // Игнорируем ошибки rich text
      }
      
      addSystemLog('OCR row ' + r + ': text="' + String(textVal).slice(0, 60) + '..." richUrl="' + richUrl + '"', 'DEBUG', 'OCR');

      // Пропускаем пустые строки
      if (!textVal && !formula && !richUrl) {
        empty++;
        continue;
      }

      // Проверяем есть ли уже результат в B
      var bVal = String(sh.getRange(r, 2).getDisplayValue() || '').trim();
      if (!overwrite && bVal) {
        addSystemLog('OCR row ' + r + ': skipped (already has result in B)', 'DEBUG', 'OCR');
        skipped++;
        continue;
      }

      // ИЗВЛЕКАЕМ ИСТОЧНИКИ
      var sources = extractSourcesV2_(textVal, formula, richUrl);
      addSystemLog('OCR row ' + r + ': sources=' + (sources.map(function(s) {
        return s.kind + ':' + (s.id || s.url || '');
      }).join(' | ') || 'none'), 'DEBUG', 'OCR');
      
      if (!sources.length) {
        addSystemLog('⚠️ OCR row ' + r + ': no sources found', 'WARN', 'OCR');
        empty++;
        continue;
      }

      // Определяем куда писать результат
      var writeRow = bVal ? findNextWriteRow_(sh, r) : r;
      
      // Инициализация для сбора данных
      var remainingCap = OCR2_BATCH_LIMIT;
      var batchImages = [];
      var texts = [];

      // СБОР ДАННЫХ ИЗ ВСЕХ ИСТОЧНИКОВ
      for (var i = 0; i < sources.length && remainingCap > 0; i++) {
        var src = sources[i];
        addSystemLog('OCR row ' + r + ': collect kind=' + src.kind + ' key=' + (src.id || src.url || '') + ' cap=' + remainingCap, 'DEBUG', 'OCR');
        
        try {
          // КЛЮЧЕВАЯ ФУНКЦИЯ: собираем из источника
          var part = collectFromSourceV2_(src, remainingCap);
          
          var addedText = 0;
          
          // Добавляем готовые тексты
          if (part.texts && part.texts.length) {
            texts = texts.concat(part.texts);
            addedText = part.texts.length;
            addSystemLog('OCR row ' + r + ': collected ' + addedText + ' texts from ' + src.kind, 'DEBUG', 'OCR');
          }
          
          // Обновляем capacity
          remainingCap = Math.max(0, remainingCap - addedText);
          
          // Добавляем изображения
          if (part.images && part.images.length) {
            var imageRoom = Math.max(0, OCR2_BATCH_LIMIT - texts.length - batchImages.length);
            if (imageRoom > 0) {
              var toTake = Math.min(imageRoom, part.images.length);
              batchImages = batchImages.concat(part.images.slice(0, toTake));
              addSystemLog('OCR row ' + r + ': collected ' + toTake + ' images from ' + src.kind, 'DEBUG', 'OCR');
            }
          }
          
        } catch (e) {
          errors++;
          addSystemLog('❌ OCR collect error row ' + r + ': ' + e.message, 'ERROR', 'OCR');
        }
      }

      // Проверяем что собрали хоть что-то
      if (!texts.length && !batchImages.length) {
        addSystemLog('OCR row ' + r + ': nothing collected', 'DEBUG', 'OCR');
        empty++;
        continue;
      }

      // ОБРАБОТКА ИЗОБРАЖЕНИЙ через Gemini
      var remainingOut = Math.max(0, OCR2_BATCH_LIMIT - texts.length);
      
      if (batchImages.length && remainingOut > 0) {
        addSystemLog('OCR row ' + r + ': processing ' + batchImages.length + ' images (capacity=' + remainingOut + ')', 'INFO', 'OCR');
        
        try {
          var imgs = batchImages.slice(0, remainingOut);
          
          // Обрабатываем чанками по OCR2_CHUNK_SIZE
          for (var p = 0; p < imgs.length && remainingOut > 0; p += OCR2_CHUNK_SIZE) {
            var sub = imgs.slice(p, Math.min(p + OCR2_CHUNK_SIZE, imgs.length));
            
            addSystemLog('OCR row ' + r + ': processing chunk ' + (Math.floor(p / OCR2_CHUNK_SIZE) + 1) + ' (' + sub.length + ' images)', 'DEBUG', 'OCR');
            
            // Вызываем сервер для batch OCR
            var out = serverGmOcrBatch_(sub, 'ru');
            
            // Разделяем результат по delimiter
            var arr = splitBySeparatorV2_(out);
            
            if (!arr || !arr.length) {
              // FALLBACK: Если batch не сработал - обрабатываем по одному
              addSystemLog('⚠️ OCR row ' + r + ': chunk empty → fallback per-image (' + sub.length + ' imgs)', 'WARN', 'OCR');
              
              for (var si = 0; si < sub.length && remainingOut > 0; si++) {
                try {
                  // Создаем blob из base64
                  var bb = Utilities.newBlob(
                    Utilities.base64Decode(sub[si].data),
                    sub[si].mimeType || 'image/png',
                    'img'
                  );
                  
                  // OCR одного изображения (local fallback)
                  var tt = gmOcrFromBlob_(bb, 'ru');
                  tt = String(tt || '').trim();
                  
                  if (tt) {
                    texts.push(tt);
                    remainingOut--;
                  }
                } catch (e4) {
                  addSystemLog('❌ OCR row ' + r + ': per-image fallback error: ' + e4.message, 'ERROR', 'OCR');
                }
              }
            } else {
              // Batch OCR успешен
              var take = Math.min(remainingOut, arr.length);
              texts = texts.concat(arr.slice(0, take));
              remainingOut -= take;
              addSystemLog('✅ OCR row ' + r + ': chunk size=' + sub.length + ' → got ' + arr.length + ' parts, taken=' + take + ', cap left=' + remainingOut, 'DEBUG', 'OCR');
            }
          }
          
        } catch (e2) {
          errors++;
          addSystemLog('❌ OCR batch error row ' + r + ': ' + e2.message, 'ERROR', 'OCR');
          
          // FINAL FALLBACK: обрабатываем все по одному
          try {
            addSystemLog('⚠️ OCR row ' + r + ': trying final fallback per-image', 'WARN', 'OCR');
            
            for (var j = 0; j < Math.min(remainingOut, batchImages.length); j++) {
              var b = Utilities.newBlob(
                Utilities.base64Decode(batchImages[j].data),
                batchImages[j].mimeType || 'image/png',
                'img'
              );
              var t = gmOcrFromBlob_(b, 'ru');
              if (t && String(t).trim()) {
                texts.push(String(t).trim());
              }
            }
          } catch (e3) {
            addSystemLog('❌ OCR final fallback error row ' + r + ': ' + e3.message, 'ERROR', 'OCR');
          }
        }
      }

      // Проверяем что получили результаты
      if (!texts.length) {
        addSystemLog('OCR row ' + r + ': texts empty after OCR', 'DEBUG', 'OCR');
        empty++;
        continue;
      }

      // ЗАПИСЬ РЕЗУЛЬТАТОВ В ТАБЛИЦУ
      
      // Если результатов больше 1 - вставляем дополнительные строки
      if (texts.length > 1) {
        sh.insertRowsAfter(writeRow, texts.length - 1);
        lastRow += (texts.length - 1);
        addSystemLog('OCR row ' + r + ': inserted ' + (texts.length - 1) + ' additional rows', 'DEBUG', 'OCR');
      }
      
      // Записываем все результаты (с удалением эмодзи)
      var matrix = texts.map(function(x) { 
        return [removeEmojis(x)];  // Удаляем эмодзи из расшифрованного текста
      });
      sh.getRange(writeRow, 2, texts.length, 1).setValues(matrix);
      
      // Если записывали в ту же строку и добавили строки - сдвигаем счетчик
      if (texts.length > 1 && writeRow === r) {
        r += (texts.length - 1);
      }
      
      processed++;
      addSystemLog('✅ OCR row ' + r + ': processed successfully (' + texts.length + ' results)', 'INFO', 'OCR');
      
    } catch (e) {
      errors++;
      addSystemLog('❌ OCR row ' + r + ': critical error: ' + e.message, 'ERROR', 'OCR');
    }
  }

  // ФИНАЛЬНЫЙ ОТЧЕТ
  var summary = '✅ OCR завершен!\n\n' +
               'Обработано строк: ' + processed + '\n' +
               'Пропущено (пусто): ' + empty + '\n' +
               'Пропущено (есть результат): ' + skipped + '\n' +
               'Ошибок: ' + errors;
  
  addSystemLog('▶️ OCR V2 complete: processed=' + processed + ', empty=' + empty + ', skipped=' + skipped + ', errors=' + errors, 'INFO', 'OCR');
  
  ui.alert('OCR завершен', summary, ui.ButtonSet.OK);
}

/**
 * Найти следующую пустую строку для записи (если B уже занята)
 */
function findNextWriteRow_(sheet, startRow) {
  var lastRow = sheet.getLastRow();
  
  // Ищем первую пустую ячейку B начиная со startRow
  for (var r = startRow; r <= lastRow + 100; r++) {
    var val = sheet.getRange(r, 2).getValue();
    if (!val || String(val).trim() === '') {
      return r;
    }
  }
  
  // Если не нашли - вернем следующую после последней
  return lastRow + 1;
}

/**
 * Local OCR fallback через Gemini (для per-image processing)
 */
function gmOcrFromBlob_(blob, lang) {
  try {
    var credentials = getClientCredentials();
    if (!credentials.ok || !credentials.apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    
    var apiKey = credentials.apiKey;
    var mime = blob.getContentType() || 'image/png';
    var b64 = Utilities.base64Encode(blob.getBytes());
    
    var instruction = 'Транскрибируй текст на изображении БЕЗ добавления от себя. Верни только чистый текст. ' +
                     (lang ? ('Язык: ' + lang + '.') : '');
    
    var body = {
      contents: [{
        parts: [
          { text: instruction },
          { inlineData: { mimeType: mime, data: b64 } }
        ]
      }],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0
      }
    };
    
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + apiKey;
    
    var resp = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(body),
      muteHttpExceptions: true
    });
    
    var code = resp.getResponseCode();
    var data = JSON.parse(resp.getContentText());
    
    if (code !== 200) {
      var msg = (data && data.error && data.error.message) || ('HTTP_' + code);
      throw new Error('Gemini OCR: ' + msg);
    }
    
    var cand = data.candidates && data.candidates[0];
    var part = cand && cand.content && cand.content.parts && cand.content.parts[0];
    var text = part && part.text ? part.text : '';
    
    // Удаляем эмодзи из распознанного текста
    return removeEmojis(text);
    
  } catch (e) {
    addSystemLog('gmOcrFromBlob_ error: ' + e.message, 'ERROR', 'OCR');
    throw e;
  }
}
