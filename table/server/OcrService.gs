/**
 * OCR Service - Optical Character Recognition using Gemini API
 * Processes images and extracts text content
 */

/**
 * Main OCR processing function
 * @param {Object} request - {email, token, geminiApiKey, cellData, options}
 * @returns {Object} - {ok, data, traceId, stats}
 */
function processOcrRequest(request) {
  var traceId = 'ocr_' + Date.now().toString(36);
  var startTime = Date.now();
  
  try {
    // Validate request
    if (!request.email || !request.token || !request.geminiApiKey || !request.cellData) {
      return {ok: false, error: 'Missing required fields', traceId: traceId};
    }
    
    // Extract images from cell data (URLs, etc)
    var images = extractImagesFromCell(request.cellData);
    
    if (images.length === 0) {
      return {ok: false, error: 'No images found', traceId: traceId};
    }
    
    // Process images with Gemini
    var results = processImagesWithGemini(images, request.geminiApiKey, request.options || {});
    
    return {
      ok: true,
      data: results,
      traceId: traceId,
      stats: {
        imageCount: images.length,
        resultCount: results.length,
        processingTime: Date.now() - startTime
      }
    };
    
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      traceId: traceId
    };
  }
}

/**
 * Extract image URLs from cell data
 */
function extractImagesFromCell(cellData) {
  var images = [];
  
  // Try to find URLs in the cell data
  var urlPattern = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|bmp|webp))/gi;
  var matches = String(cellData).match(urlPattern);
  
  if (matches) {
    matches.forEach(function(url) {
      images.push({url: url});
    });
  }
  
  return images;
}

/**
 * Process images using Gemini API
 */
function processImagesWithGemini(images, apiKey, options) {
  var results = [];
  var chunkSize = 5;
  
  // Process in chunks
  for (var i = 0; i < images.length; i += chunkSize) {
    var chunk = images.slice(i, Math.min(i + chunkSize, images.length));
    
    try {
      var chunkResults = processImageChunk(chunk, apiKey, options);
      results = results.concat(chunkResults);
    } catch (error) {
      // Try processing individually on error
      chunk.forEach(function(img) {
        try {
          var single = processSingleImage(img, apiKey, options);
          if (single) results.push(single);
        } catch (e) {
          // Skip failed images
        }
      });
    }
  }
  
  return results;
}

/**
 * Process a chunk of images
 */
function processImageChunk(images, apiKey, options) {
  var instruction = 'Extract all text from these images. Return clean text only.';
  if (options.language) instruction += ' Language: ' + options.language;
  
  var parts = [{text: instruction}];
  
  // Add image blobs
  images.forEach(function(img) {
    try {
      var blob = UrlFetchApp.fetch(img.url).getBlob();
      parts.push({
        inlineData: {
          mimeType: blob.getContentType() || 'image/jpeg',
          data: Utilities.base64Encode(blob.getBytes())
        }
      });
    } catch (e) {
      // Skip images that fail to load
    }
  });
  
  var response = UrlFetchApp.fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey,
    {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify({
        contents: [{parts: parts}],
        generationConfig: {maxOutputTokens: 4096, temperature: 0}
      }),
      muteHttpExceptions: true
    }
  );
  
  var data = JSON.parse(response.getContentText());
  
  if (response.getResponseCode() !== 200) {
    throw new Error('Gemini API error: ' + (data.error ? data.error.message : 'Unknown'));
  }
  
  var text = data.candidates && data.candidates[0] && 
             data.candidates[0].content && data.candidates[0].content.parts &&
             data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
  
  if (!text) return [];
  
  // Split by delimiter (____) or double newlines
  return text.split(/_{4,}|\n\n+/).map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t.length > 0;
  });
}

/**
 * Process a single image
 */
function processSingleImage(img, apiKey, options) {
  try {
    var blob = UrlFetchApp.fetch(img.url).getBlob();
    var instruction = 'Extract all text from this image. Return clean text only.';
    
    var response = UrlFetchApp.fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify({
          contents: [{
            parts: [
              {text: instruction},
              {
                inlineData: {
                  mimeType: blob.getContentType() || 'image/jpeg',
                  data: Utilities.base64Encode(blob.getBytes())
                }
              }
            ]
          }],
          generationConfig: {maxOutputTokens: 2048, temperature: 0}
        }),
        muteHttpExceptions: true
      }
    );
    
    var data = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() !== 200) return null;
    
    return data.candidates && data.candidates[0] && 
           data.candidates[0].content && data.candidates[0].content.parts &&
           data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
           
  } catch (e) {
    return null;
  }
}
