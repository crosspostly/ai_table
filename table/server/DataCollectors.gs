// New/server/DataCollectors.gs
// Open/Closed Principle: легко добавлять новые провайдеры без изменения существующих
// Single Responsibility: каждый коллектор отвечает за один тип источника

/**
 * Базовый интерфейс для всех коллекторов
 */
var BaseCollector = {
  /**
   * @param {Object} source - источник данных {type, url, id}
   * @param {number} limit - лимит элементов
   * @returns {Object} {images: [], texts: [], hasMore: boolean}
   */
  collect: function(source, limit) {
    throw new Error('collect() must be implemented');
  }
};

/**
 * VK Коллектор - 🔥 ИНТЕГРИРОВАННЫЙ VK API (вместо внешнего VK_PARSER)
 */
var VkCollector = Object.create(BaseCollector);

// 🔥 НОВАЯ ФУНКЦИЯ: collectPosts для прямого импорта постов VK
VkCollector.collectPosts = function(owner, count, traceId) {
  try {
    // Используем интегрированную функцию handleWallGet_ из VkImportService.gs
    var posts = handleWallGet_(owner, count);
    
    return {
      ok: true,
      data: posts,
      count: posts.length,
      traceId: traceId || 'vk-' + Date.now()
    };
    
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      data: [],
      count: 0,
      traceId: traceId || 'vk-error-' + Date.now()
    };
  }
};

// 🔧 СТАРАЯ ФУНКЦИЯ: collect для альбомов/обсуждений/отзывов  
// ⚠️ DEPRECATED: Нужно мигрировать на прямой VK API
VkCollector.collect = function(source, limit) {
  // FIXME: Migrate to direct VK API
  throw new Error('VK альбомы/обсуждения/отзывы не поддерживаются. Используйте importVkPosts() для постов.');
  var endpoint = this.getEndpointForType(source.type);
  
  if (!endpoint) {
    throw new Error('Unsupported VK source type: ' + source.type);
  }
  
  var requestUrl = baseUrl + '?action=' + endpoint + 
                   '&url=' + encodeURIComponent(source.url) + 
                   '&limit=' + Math.min(limit || 50, 100) + 
                   '&offset=0';
  
  var response = UrlFetchApp.fetch(requestUrl, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://vk.com/'
    }
  });
  
  if (response.getResponseCode() >= 300) {
    throw new Error('VK API error: HTTP ' + response.getResponseCode());
  }
  
  var data = JSON.parse(response.getContentText());
  if (data.error) {
    throw new Error('VK API error: ' + data.error);
  }
  
  return this.processVkResponse(data, source.type, limit);
};

VkCollector.getEndpointForType = function(type) {
  var mapping = {
    'vk-album': 'parseAlbum',
    'vk-topic': 'parseDiscussion', 
    'vk-reviews': 'parseReviews'
  };
  return mapping[type];
};

VkCollector.processVkResponse = function(data, sourceType, limit) {
  var result = {images: [], texts: [], hasMore: false};
  
  if (sourceType === 'vk-album' && data.images) {
    // Загружаем изображения с правильными заголовками
    for (var i = 0; i < data.images.length && result.images.length < limit; i++) {
      try {
        var imageUrl = data.images[i].url || data.images[i];
        var blob = this.fetchImageWithHeaders(imageUrl);
        if (blob) {
          result.images.push({
            mimeType: blob.getContentType() || 'image/jpeg',
            data: Utilities.base64Encode(blob.getBytes())
          });
        }
      } catch (e) {
        // Пропускаем проблемные изображения
      }
    }
  } else if (data.texts) {
    // Тексты из обсуждений/отзывов
    result.texts = data.texts
      .map(function(t) { return String(t || '').trim(); })
      .filter(function(t) { return t.length > 0; })
      .slice(0, limit);
  }
  
  result.hasMore = !!(data.hasMore);
  return result;
};

VkCollector.fetchImageWithHeaders = function(url) {
  try {
    var response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://vk.com/'
      }
    });
    
    if (response.getResponseCode() >= 300) return null;
    return response.getBlob();
  } catch (e) {
    return null;
  }
};

/**
 * Yandex Disk Коллектор
 */
var YandexCollector = Object.create(BaseCollector);
YandexCollector.collect = function(source, limit) {
  var apiBase = 'https://cloud-api.yandex.net/v1/disk/public/resources';
  var downloadApi = 'https://cloud-api.yandex.net/v1/disk/public/resources/download';
  
  var metaResponse = UrlFetchApp.fetch(
    apiBase + '?public_key=' + encodeURIComponent(source.url),
    {muteHttpExceptions: true, followRedirects: true}
  );
  
  if (metaResponse.getResponseCode() >= 300) {
    throw new Error('Yandex API error: HTTP ' + metaResponse.getResponseCode());
  }
  
  var metaData = JSON.parse(metaResponse.getContentText());
  var result = {images: [], texts: [], hasMore: false};
  
  if (metaData.type === 'file') {
    // Один файл
    var downloadResponse = UrlFetchApp.fetch(
      downloadApi + '?public_key=' + encodeURIComponent(source.url)
    );
    var downloadData = JSON.parse(downloadResponse.getContentText());
    
    var fileResponse = UrlFetchApp.fetch(downloadData.href, {
      muteHttpExceptions: true,
      followRedirects: true
    });
    
    if (fileResponse.getResponseCode() < 300) {
      var blob = fileResponse.getBlob();
      result.images.push({
        mimeType: blob.getContentType() || 'image/png',
        data: Utilities.base64Encode(blob.getBytes())
      });
    }
  } else if (metaData.type === 'dir') {
    // Папка - берем только изображения
    var items = (metaData._embedded && metaData._embedded.items) || [];
    
    for (var i = 0; i < items.length && result.images.length < limit; i++) {
      var item = items[i];
      if (item.type !== 'file') continue;
      
      var mimeType = String(item.mime_type || '').toLowerCase();
      if (mimeType.indexOf('image/') !== 0) continue;
      
      try {
        var itemDownloadResponse = UrlFetchApp.fetch(
          downloadApi + '?public_key=' + encodeURIComponent(source.url) + 
          '&path=' + encodeURIComponent(item.path)
        );
        var itemDownloadData = JSON.parse(itemDownloadResponse.getContentText());
        
        var itemFileResponse = UrlFetchApp.fetch(itemDownloadData.href, {
          muteHttpExceptions: true,
          followRedirects: true
        });
        
        if (itemFileResponse.getResponseCode() < 300) {
          var itemBlob = itemFileResponse.getBlob();
          result.images.push({
            mimeType: itemBlob.getContentType() || 'image/png',
            data: Utilities.base64Encode(itemBlob.getBytes())
          });
        }
      } catch (e) {
        // Пропускаем проблемные файлы
      }
    }
    
    result.hasMore = items.length > limit;
  }
  
  return result;
};

/**
 * Dropbox Коллектор
 */
var DropboxCollector = Object.create(BaseCollector);
DropboxCollector.collect = function(source, limit) {
  var directUrl = this.toDirectUrl(source.url);
  
  var response = UrlFetchApp.fetch(directUrl, {
    muteHttpExceptions: true,
    followRedirects: true
  });
  
  if (response.getResponseCode() >= 300) {
    throw new Error('Dropbox error: HTTP ' + response.getResponseCode());
  }
  
  var blob = response.getBlob();
  return {
    images: [{
      mimeType: blob.getContentType() || 'image/png',
      data: Utilities.base64Encode(blob.getBytes())
    }],
    texts: [],
    hasMore: false
  };
};

DropboxCollector.toDirectUrl = function(url) {
  try {
    var directUrl = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    if (directUrl.indexOf('?dl=0') >= 0) {
      directUrl = directUrl.replace('?dl=0', '?dl=1');
    } else if (directUrl.indexOf('?dl=1') < 0 && directUrl.indexOf('?') < 0) {
      directUrl += '?dl=1';
    }
    return directUrl;
  } catch (e) {
    return url;
  }
};

/**
 * Generic URL Коллектор
 */
var UrlCollector = Object.create(BaseCollector);
UrlCollector.collect = function(source, limit) {
  var response = UrlFetchApp.fetch(source.url, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  if (response.getResponseCode() >= 300) {
    throw new Error('URL fetch error: HTTP ' + response.getResponseCode());
  }
  
  var blob = response.getBlob();
  var contentType = String(blob.getContentType() || '').toLowerCase();
  
  if (contentType.indexOf('image/') !== 0) {
    throw new Error('URL is not an image: ' + contentType);
  }
  
  return {
    images: [{
      mimeType: blob.getContentType() || 'image/png',
      data: Utilities.base64Encode(blob.getBytes())
    }],
    texts: [],
    hasMore: false
  };
};

/**
 * Фабрика коллекторов (Factory Pattern)
 */
function createCollector(sourceType) {
  var collectors = {
    'vk-album': VkCollector,
    'vk-topic': VkCollector,
    'vk-reviews': VkCollector,
    'yandex': YandexCollector,
    'dropbox': DropboxCollector,
    'url': UrlCollector
  };
  
  var collector = collectors[sourceType];
  if (!collector) {
    throw new Error('Unsupported source type: ' + sourceType);
  }
  
  return collector;
}

/**
 * 🔥 UPDATED: VK API теперь встроен в VkImportService.gs
 * Получение URL VK API - direct access, no external parser
 */
function getVkApiUrl() {
  // VK API используется напрямую через VkImportService.gs::handleWallGet_()
  // Токен берётся из Script Properties: VK_TOKEN
  return 'https://api.vk.com/method/wall.get';
}

/**
 * 🔥 НОВАЯ ФУНКЦИЯ: Создание коллектора данных по типу источника
 * Поддерживает интегрированный VK API для постов
 */
function createDataCollector(sourceType) {
  switch(sourceType) {
    case 'vk':
    case IMAGE_SOURCES.VK:
      return VkCollector;
    case 'yandex':
      return YandexCollector;
    case 'dropbox':
      return DropboxCollector;
    case 'url':
      return UrlCollector;
    default:
      throw new Error('Неподдерживаемый тип источника: ' + sourceType);
  }
}