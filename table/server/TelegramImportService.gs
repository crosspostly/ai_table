/**
 * Telegram Import Service v1.0 
 * Простые и изящные решения для парсинга Telegram каналов
 */

/**
 * Импорт постов из Telegram канала (публичного)
 * @param {string} channelName - имя канала без @
 * @param {number} limit - лимит постов (по умолчанию 20)
 * @return {Array} - массив постов
 */
function importTelegramPosts(channelName, limit) {
  limit = Math.min(limit || 20, 50); // Максимум 50 постов за раз
  
  addSystemLog('→ Импорт Telegram канала: ' + channelName, 'INFO', 'TELEGRAM_IMPORT');
  
  // Метод 1: RSS подход (если доступен)
  try {
    var rssPosts = importTelegramFromRSS(channelName, limit);
    if (rssPosts && rssPosts.length > 0) {
      addSystemLog('✅ RSS метод успешен: ' + rssPosts.length + ' постов', 'INFO', 'TELEGRAM_IMPORT');
      return rssPosts;
    }
  } catch (e) {
    addSystemLog('⚠️ RSS метод недоступен: ' + e.message, 'WARN', 'TELEGRAM_IMPORT');
  }
  
  // Метод 2: Web-версия t.me/s/ (основной)
  try {
    var webPosts = importTelegramFromWeb(channelName, limit);
    if (webPosts && webPosts.length > 0) {
      addSystemLog('✅ Web метод успешен: ' + webPosts.length + ' постов', 'INFO', 'TELEGRAM_IMPORT');
      return webPosts;
    }
  } catch (e) {
    addSystemLog('❌ Web метод ошибка: ' + e.message, 'ERROR', 'TELEGRAM_IMPORT');
  }
  
  // Метод 3: Embed preview (резервный)
  try {
    var embedPosts = importTelegramFromEmbed(channelName, limit);
    if (embedPosts && embedPosts.length > 0) {
      addSystemLog('✅ Embed метод успешен: ' + embedPosts.length + ' постов', 'INFO', 'TELEGRAM_IMPORT');
      return embedPosts;
    }
  } catch (e) {
    addSystemLog('⚠️ Embed метод недоступен: ' + e.message, 'WARN', 'TELEGRAM_IMPORT');
  }
  
  throw new Error('Не удалось получить посты из Telegram канала: ' + channelName);
}

/**
 * Метод 1: Импорт через RSS (RSSHub или аналоги)
 */
function importTelegramFromRSS(channelName, limit) {
  var rssUrls = [
    'https://rsshub.app/telegram/channel/' + channelName,
    'https://tg.i-c-a.su/rss/' + channelName,
    // Добавить другие RSS провайдеры
  ];
  
  for (var i = 0; i < rssUrls.length; i++) {
    try {
      var response = UrlFetchApp.fetch(rssUrls[i], {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GoogleAppsScript)'
        },
        muteHttpExceptions: true
      });
      
      if (response.getResponseCode() === 200) {
        return parseRSSFeed(response.getContentText(), limit);
      }
    } catch (e) {
      continue; // Пробуем следующий RSS провайдер
    }
  }
  
  return null;
}

/**
 * Метод 2: Импорт через веб-версию t.me/s/channelname
 */
function importTelegramFromWeb(channelName, limit) {
  var url = 'https://t.me/s/' + channelName;
  
  var options = {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache'
    },
    muteHttpExceptions: true
  };
  
  var response = UrlFetchApp.fetch(url, options);
  
  if (response.getResponseCode() !== 200) {
    throw new Error('Telegram канал недоступен: HTTP ' + response.getResponseCode());
  }
  
  var html = response.getContentText();
  return parseTelegramHTML(html, limit);
}

/**
 * Метод 3: Импорт через embed preview 
 */
function importTelegramFromEmbed(channelName, limit) {
  var url = 'https://t.me/' + channelName + '?embed=1&mode=tme';
  
  var response = UrlFetchApp.fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 TelegramBot',
      'Accept': '*/*'
    },
    muteHttpExceptions: true
  });
  
  if (response.getResponseCode() !== 200) {
    throw new Error('Embed preview недоступен: HTTP ' + response.getResponseCode());
  }
  
  var html = response.getContentText();
  return parseTelegramEmbedHTML(html, limit);
}

/**
 * Парсинг RSS фида
 */
function parseRSSFeed(rssText, limit) {
  try {
    // Простой парсинг RSS без XML библиотек
    var posts = [];
    var itemMatches = rssText.match(/<item[^>]*>([\s\S]*?)<\/item>/g) || [];
    
    for (var i = 0; i < Math.min(itemMatches.length, limit); i++) {
      var item = itemMatches[i];
      
      var titleMatch = item.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
      var linkMatch = item.match(/<link[^>]*>([\s\S]*?)<\/link>/);
      var descMatch = item.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
      var dateMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/);
      
      var post = {
        platform: 'telegram',
        text: titleMatch ? titleMatch[1].trim() : '',
        link: linkMatch ? linkMatch[1].trim() : '',
        date: dateMatch ? new Date(dateMatch[1]) : new Date(),
        id: extractTelegramId(linkMatch ? linkMatch[1] : ''),
        likes: 0, // RSS обычно не содержит лайки
        comments: 0
      };
      
      // Если есть описание, добавляем его к тексту
      if (descMatch && descMatch[1]) {
        var cleanDesc = descMatch[1].replace(/<[^>]*>/g, '').trim();
        if (cleanDesc && cleanDesc !== post.text) {
          post.text += '

' + cleanDesc;
        }
      }
      
      posts.push(post);
    }
    
    return posts;
  } catch (e) {
    throw new Error('Ошибка парсинга RSS: ' + e.message);
  }
}

/**
 * Парсинг HTML веб-версии Telegram
 */
function parseTelegramHTML(html, limit) {
  try {
    var posts = [];
    
    // Ищем блоки постов в HTML
    var postMatches = html.match(/<div class="tgme_widget_message_wrap[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g) || [];
    
    for (var i = 0; i < Math.min(postMatches.length, limit); i++) {
      var postHtml = postMatches[i];
      
      // Извлекаем данные поста
      var textMatch = postHtml.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      var linkMatch = postHtml.match(/data-post="([^"]+)"/);
      var timeMatch = postHtml.match(/<time[^>]*datetime="([^"]+)"/);
      var viewsMatch = postHtml.match(/<span class="tgme_widget_message_views[^"]*">([^<]+)<\/span>/);
      
      var post = {
        platform: 'telegram',
        text: textMatch ? cleanTelegramHTML(textMatch[1]) : '',
        link: linkMatch ? 'https://t.me/' + linkMatch[1] : '',
        date: timeMatch ? new Date(timeMatch[1]) : new Date(),
        id: linkMatch ? extractTelegramId(linkMatch[1]) : '',
        likes: 0, // Telegram не показывает лайки в веб-версии
        comments: 0,
        views: viewsMatch ? parseViews(viewsMatch[1]) : 0
      };
      
      posts.push(post);
    }
    
    return posts;
  } catch (e) {
    throw new Error('Ошибка парсинга HTML: ' + e.message);
  }
}

/**
 * Парсинг embed HTML
 */
function parseTelegramEmbedHTML(html, limit) {
  // Упрощённый парсинг для embed версии
  // Обычно содержит меньше информации
  return parseTelegramHTML(html, limit);
}

/**
 * Очистка HTML тегов из текста Telegram
 */
function cleanTelegramHTML(htmlText) {
  return htmlText
    .replace(/<br\s*\/?>/gi, '
')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Извлечение ID поста из ссылки
 */
function extractTelegramId(link) {
  var match = link.match(/\/([^/]+)\/(\d+)$/);
  return match ? match[2] : '';
}

/**
 * Парсинг количества просмотров 
 */
function parseViews(viewsText) {
  try {
    var text = viewsText.toLowerCase().replace(/[^0-9kmb.]/g, '');
    var num = parseFloat(text);
    
    if (text.includes('k')) return Math.round(num * 1000);
    if (text.includes('m')) return Math.round(num * 1000000);
    if (text.includes('b')) return Math.round(num * 1000000000);
    
    return Math.round(num || 0);
  } catch (e) {
    return 0;
  }
}

/**
 * Проверка доступности Telegram канала
 */
function checkTelegramChannel(channelName) {
  try {
    var url = 'https://t.me/s/' + channelName;
    var response = UrlFetchApp.fetch(url, {
      method: 'HEAD',
      muteHttpExceptions: true
    });
    
    return {
      available: response.getResponseCode() === 200,
      statusCode: response.getResponseCode(),
      channelName: channelName
    };
  } catch (e) {
    return {
      available: false,
      error: e.message,
      channelName: channelName
    };
  }
}

/**
 * Получение информации о Telegram канале
 */
function getTelegramChannelInfo(channelName) {
  try {
    var url = 'https://t.me/s/' + channelName;
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    
    if (response.getResponseCode() !== 200) {
      throw new Error('Канал недоступен');
    }
    
    var html = response.getContentText();
    
    var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    var descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    var imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    var membersMatch = html.match(/(\d+(?:[,\s]\d+)*) members/);
    
    return {
      channelName: channelName,
      title: titleMatch ? titleMatch[1] : channelName,
      description: descMatch ? descMatch[1] : '',
      image: imageMatch ? imageMatch[1] : '',
      members: membersMatch ? parseInt(membersMatch[1].replace(/[^0-9]/g, '')) : 0,
      available: true
    };
    
  } catch (e) {
    return {
      channelName: channelName,
      available: false,
      error: e.message
    };
  }
}