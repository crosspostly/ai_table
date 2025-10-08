/**
 * Social Media Import Service v2.1
 * Универсальный импорт постов из VK, Instagram и Telegram
 * Поддерживает: ID, username, полные ссылки, @каналы
 */

/**
 * Универсальный импорт постов из социальных сетей
 * Теперь с input validation, retry logic и улучшенной обработкой ошибок
 */
function importSocialPosts() {
  addSystemLog('→ Запуск универсального импорта соцсетей v2.1', 'INFO', 'SOCIAL_IMPORT');
  
  try {
    var ss = SpreadsheetApp.getActive();
    var params = ss.getSheetByName('Параметры');
    
    if (!params) {
      throw createCustomError('Лист "Параметры" не найден! Создайте лист с именем "Параметры" для настроек.');
    }
    
    // Чтение параметров с валидацией
    var sourceValue = String(params.getRange('B1').getValue() || '').trim();
    var countValue = params.getRange('B2').getValue() || 50;
    var platformValue = String(params.getRange('C1').getValue() || '').trim();
    
    // КРИТИЧЕСКАЯ ВАЛИДАЦИЯ входных данных
    addSystemLog('🛡️ Валидация входных данных...', 'INFO', 'SOCIAL_IMPORT');
    var validatedInput = validateAndSanitizeInputs(sourceValue, countValue, platformValue);
    
    var cleanSourceUrl = validatedInput.sourceUrl;
    var count = validatedInput.count;
    var explicitPlatform = normalizePlatformName(validatedInput.platform);
  
    addSystemLog('📊 Параметры: source=' + cleanSourceUrl + ', count=' + count + (explicitPlatform ? ', platform=' + explicitPlatform : ''), 'INFO', 'SOCIAL_IMPORT');
    
    // Определяем тип источника и платформу
    var sourceInfo = parseSource(cleanSourceUrl, explicitPlatform);
    addSystemLog('📊 Источник: ' + sourceInfo.platform + ', тип: ' + sourceInfo.type, 'INFO', 'SOCIAL_IMPORT');
    
    var posts = [];
    
    // Импортируем с обработкой ошибок для каждой платформы
    switch (sourceInfo.platform) {
      case 'vk':
        posts = executeWithErrorHandling(
          function() { return importVkPostsAdvanced(sourceInfo.value, count); },
          { operation: 'social_import', platform: 'vk', username: sourceInfo.value }
        );
        break;
      case 'instagram':
        posts = executeWithErrorHandling(
          function() { return importInstagramPosts(sourceInfo.value, count); },
          { operation: 'social_import', platform: 'instagram', username: sourceInfo.value }
        );
        break;
      case 'telegram':
        posts = executeWithErrorHandling(
          function() { return importTelegramPosts(sourceInfo.value, count); },
          { operation: 'social_import', platform: 'telegram', username: sourceInfo.value }
        );
        break;
      default:
        throw createCustomError('Неподдерживаемая платформа: ' + sourceInfo.platform);
    }
    
    if (posts && posts.length > 0) {
      writePostsToSheet(posts, 'посты');
      addSystemLog('✅ Импортировано постов: ' + posts.length, 'INFO', 'SOCIAL_IMPORT');
      return { success: true, count: posts.length, platform: sourceInfo.platform };
    } else {
      throw createCustomError('Не удалось получить посты из ' + sourceInfo.platform + '. Проверьте доступность источника.');
    }
    
  } catch (error) {
    // Создаем user-friendly ошибку
    var friendlyError = createUserFriendlyError(error, {
      operation: 'social_import',
      platform: error.context?.platform || 'unknown',
      username: error.context?.username || cleanSourceUrl,
      url: cleanSourceUrl
    });
    
    addSystemLog('❌ Импорт неуспешен: ' + friendlyError.message, 'ERROR', 'SOCIAL_IMPORT');
    throw friendlyError;
  }
}



/**
 * Нормализация названий платформ
 * @param {string} platform - введенное название платформы
 * @return {string|null} - стандартное название или null
 */
function normalizePlatformName(platform) {
  if (!platform) return null;
  
  var platformStr = platform.toLowerCase().trim();
  
  // Instagram
  if (['instagram', 'инста', 'инстаграм', 'ig', 'insta'].includes(platformStr)) {
    return 'instagram';
  }
  
  // Telegram
  if (['telegram', 'телеграм', 'тг', 'tg', 't'].includes(platformStr)) {
    return 'telegram';
  }
  
  // VK
  if (['vk', 'вк', 'вконтакте', 'vkontakte', 'v'].includes(platformStr)) {
    return 'vk';
  }
  
  return null;
}

/**
 * Парсинг источника для определения платформы
 * @param {string} source - ID, username или ссылка
 * @param {string} explicitPlatform - явно указанная платформа (приоритет)
 * @return {Object} - информация об источнике
 */
function parseSource(source, explicitPlatform) {
  var sourceStr = String(source).trim();
  
  // 1. ПРИОРИТЕТ: Если платформа указана явно - используем её для ЛЮБОГО формата
  if (explicitPlatform && ['vk', 'instagram', 'telegram'].includes(explicitPlatform)) {
    // Очищаем source для конкретной платформы
    var cleanValue = sourceStr;
    
    // Для VK: извлекаем из ссылки vk.com/username → username
    if (explicitPlatform === 'vk' && sourceStr.match(/vk\.com\/([^\/\?]+)/i)) {
      var vkMatch = sourceStr.match(/vk\.com\/([^\/\?]+)/i);
      cleanValue = vkMatch[1];
      
      // Преобразуем club123/public123 → -123
      if (cleanValue.match(/^(club|public)(\d+)$/)) {
        var numMatch = cleanValue.match(/^(club|public)(\d+)$/);
        cleanValue = '-' + numMatch[2];
      }
    }
    
    // Для Telegram: извлекаем из ссылки t.me/username → username
    if (explicitPlatform === 'telegram' && sourceStr.match(/(?:t\.me|telegram\.me)\/([^\/\?]+)/i)) {
      var tgMatch = sourceStr.match(/(?:t\.me|telegram\.me)\/([^\/\?]+)/i);
      cleanValue = tgMatch[1].replace(/^@/, '');
    }
    
    // Для Instagram: извлекаем из ссылки instagram.com/username → username
    if (explicitPlatform === 'instagram' && sourceStr.match(/instagram\.com\/([^\/\?]+)/i)) {
      var instaMatch = sourceStr.match(/instagram\.com\/([^\/\?]+)/i);
      cleanValue = instaMatch[1];
    }
    
    // Убираем @ для всех платформ
    cleanValue = cleanValue.replace(/^@/, '');
    
    return {
      platform: explicitPlatform,
      type: 'explicit',
      value: cleanValue,
      original: sourceStr
    };
  }
  
  // 2. АВТООПРЕДЕЛЕНИЕ: Только ПОЛНЫЕ https:// ссылки
  
  // Instagram ссылки
  if (sourceStr.match(/https?:\/\/(?:www\.)?instagram\.com\/([^\/\?]+)/i)) {
    var match = sourceStr.match(/https?:\/\/(?:www\.)?instagram\.com\/([^\/\?]+)/i);
    return {
      platform: 'instagram',
      type: 'url', 
      value: match[1],
      original: sourceStr
    };
  }
  
  // Telegram ссылки
  if (sourceStr.match(/https?:\/\/(?:www\.)?(?:t\.me|telegram\.me)\/([^\/\?]+)/i)) {
    var match = sourceStr.match(/https?:\/\/(?:www\.)?(?:t\.me|telegram\.me)\/([^\/\?]+)/i);
    return {
      platform: 'telegram',
      type: 'url',
      value: match[1].replace(/^@/, ''),
      original: sourceStr
    };
  }
  
  // VK ссылки
  if (sourceStr.match(/https?:\/\/(?:www\.)?vk\.com\/([^\/\?]+)/i)) {
    var match = sourceStr.match(/https?:\/\/(?:www\.)?vk\.com\/([^\/\?]+)/i);
    var vkId = match[1];
    
    // Преобразуем club123/public123 → -123
    if (vkId.match(/^(club|public)(\d+)$/)) {
      var numMatch = vkId.match(/^(club|public)(\d+)$/);
      vkId = '-' + numMatch[2];
    }
    
    return {
      platform: 'vk',
      type: 'url',
      value: vkId,
      original: sourceStr
    };
  }
  
  // 3. ВСЁ ОСТАЛЬНОЕ требует указания платформы в C1
  // Примеры: -123456, @durov, durov, vk.com/durov (без https)
  
  throw new Error('Для "' + sourceStr + '" укажите платформу в ячейке C1 (тг/вк/инста).\n\nАвтоматически распознаются только полные ссылки:\n• https://instagram.com/username\n• https://t.me/channel\n• https://vk.com/username');
}

/**
 * Улучшенный импорт VK постов с поддержкой ссылок
 */
function importVkPostsAdvanced(source, count) {
  try {
    addSystemLog('→ Импорт VK постов: ' + source, 'INFO', 'VK_IMPORT');
    
    var url = VK_PARSER_URL + '?owner=' + encodeURIComponent(source) + '&count=' + encodeURIComponent(count);
    
    // Используем fetchSocialApiWithRetry вместо прямого UrlFetchApp.fetch
    var response = fetchSocialApiWithRetry('vk', url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT
      }
    });
    
    addSystemLog('← VK API ответ: HTTP ' + response.getResponseCode(), 'DEBUG', 'VK_IMPORT');
    
    if (response.getResponseCode() !== 200) {
      throw new Error('VK API недоступен: HTTP ' + response.getResponseCode());
    }
    
    var data = JSON.parse(response.getContentText());
    
    if (data.error) {
      throw new Error('VK API ошибка: ' + data.error);
    }
    
    var posts = data.posts || [];
    addSystemLog('📊 Получено VK постов: ' + posts.length, 'INFO', 'VK_IMPORT');
    
    return posts.map(function(post) {
      return {
        platform: 'vk',
        date: new Date(post.date * 1000),
        text: post.text || '',
        link: 'https://vk.com/wall' + post.owner_id + '_' + post.id,
        id: post.id,
        likes: post.likes || 0,
        comments: post.comments || 0
      };
    });
    
  } catch (error) {
    addSystemLog('❌ Ошибка импорта VK: ' + error.message, 'ERROR', 'VK_IMPORT');
    throw error;
  }
}

/**
 * Импорт постов Instagram с пагинацией
 */
function importInstagramPosts(username, limit) {
  try {
    addSystemLog('→ Импорт Instagram постов: ' + username, 'INFO', 'INSTAGRAM_IMPORT');
    
    // Первичный запрос профиля с retry логикой
    var profileUrl = 'https://www.instagram.com/api/v1/users/web_profile_info/?username=' + encodeURIComponent(username);
    
    var response = fetchSocialApiWithRetry('instagram', profileUrl, {
      method: 'GET',
      headers: {
        'X-IG-App-ID': '936619743392459' // Хардкод ок для веб-приложения
      }
    });
    addSystemLog('← Instagram API ответ: HTTP ' + response.getResponseCode(), 'DEBUG', 'INSTAGRAM_IMPORT');
    
    if (response.getResponseCode() !== 200) {
      throw new Error('Instagram API недоступен: HTTP ' + response.getResponseCode());
    }
    
    var json = JSON.parse(response.getContentText());
    
    if (!json.data || !json.data.user) {
      throw new Error('Instagram пользователь не найден: ' + username);
    }
    
    var user = json.data.user;
    var edges = user.edge_owner_to_timeline_media.edges;
    var pageInfo = user.edge_owner_to_timeline_media.page_info;
    
    var posts = [];
    posts = posts.concat(edges);
    
    // Пагинация через GraphQL, пока есть страницы и не достигнут лимит
    var queryHash = "003056d32c2554def87228bc3fd9668a";
    var attempts = 0;
    var maxAttempts = 5; // Максимум 5 запросов пагинации
    
    while (pageInfo.has_next_page && posts.length < limit && attempts < maxAttempts) {
      attempts++;
      addSystemLog('📄 Instagram пагинация: попытка ' + attempts, 'DEBUG', 'INSTAGRAM_IMPORT');
      
      var vars = {
        id: user.id,
        first: 12,
        after: pageInfo.end_cursor
      };
      
      var gqlUrl = 'https://www.instagram.com/api/graphql/query/?query_hash=' + queryHash + 
                   '&variables=' + encodeURIComponent(JSON.stringify(vars));
      
      // Пауза для избежания блокировок
      Utilities.sleep(2000);
      
      var response2 = UrlFetchApp.fetch(gqlUrl, options);
      
      if (response2.getResponseCode() !== 200) {
        addSystemLog('⚠️ Instagram пагинация прервана: HTTP ' + response2.getResponseCode(), 'WARN', 'INSTAGRAM_IMPORT');
        break;
      }
      
      var data2 = JSON.parse(response2.getContentText());
      
      if (!data2.data || !data2.data.user) {
        addSystemLog('⚠️ Instagram пагинация: нет данных', 'WARN', 'INSTAGRAM_IMPORT');
        break;
      }
      
      var media = data2.data.user.edge_owner_to_timeline_media;
      posts = posts.concat(media.edges);
      pageInfo = media.page_info;
    }
    
    // Ограничиваем до лимита и преобразуем в стандартный формат
    var limitedPosts = posts.slice(0, limit);
    addSystemLog('📊 Получено Instagram постов: ' + limitedPosts.length, 'INFO', 'INSTAGRAM_IMPORT');
    
    return limitedPosts.map(function(edge) {
      var node = edge.node;
      var caption = '';
      
      if (node.edge_media_to_caption.edges && node.edge_media_to_caption.edges[0]) {
        caption = node.edge_media_to_caption.edges[0].node.text;
      }
      
      return {
        platform: 'instagram',
        date: new Date(node.taken_at_timestamp * 1000),
        text: caption,
        link: 'https://www.instagram.com/p/' + node.shortcode + '/',
        id: node.shortcode,
        likes: node.edge_media_preview_like.count || 0,
        comments: node.edge_media_to_comment.count || 0
      };
    });
    
  } catch (error) {
    addSystemLog('❌ Ошибка импорта Instagram: ' + error.message, 'ERROR', 'INSTAGRAM_IMPORT');
    throw error;
  }
}

/**
 * Запись постов в лист с улучшенным форматированием
 */
function writePostsToSheet(posts, sheetName) {
  try {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      addSystemLog('✨ Создан лист: ' + sheetName, 'INFO', 'SOCIAL_IMPORT');
    }
    
    // Очищаем лист
    sheet.clear();
    
    // Заголовки с платформой
    var headers = [
      'Платформа', 'Дата', 'Ссылка на пост', 'Текст поста', 'ID поста', 
      'Лайки', 'Комментарии', 'Стоп-слова', 'Отфильтрованные посты', 
      'Новый номер', 'Позитивные слова', 'Посты с позитивными словами',
      'Новый номер (позитивные)', 'Анализ постов'  // K колонка для анализа
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Форматируем заголовки
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#4285f4').setFontColor('white').setFontWeight('bold');
    
    // Записываем данные постов
    if (posts.length > 0) {
      var data = posts.map(function(post, index) {
        return [
          post.platform.toUpperCase(), // A - платформа  
          post.date,                   // B - дата
          post.link,                   // C - ссылка
          post.text,                   // D - текст
          post.id,                     // E - ID
          post.likes || 0,             // F - лайки  
          post.comments || 0,          // G - комментарии
          '',                          // H - стоп-слова (для заполнения пользователем)
          '',                          // I - отфильтрованные
          index + 1,                   // J - новый номер
          '',                          // K - позитивные слова
          '',                          // L - посты с позитивными 
          '',                          // M - новый номер (позитивные)
          ''                           // N - анализ постов
        ];
      });
      
      sheet.getRange(2, 1, data.length, headers.length).setValues(data);
    }
    
    // Автоширина колонок
    sheet.autoResizeColumns(1, headers.length);
    
    // Применяем фильтрацию (если еще не настроена)
    if (posts.length > 0) {
      createAdvancedFilters(sheet, posts.length + 1);
    }
    
    addSystemLog('✅ Посты записаны в лист ' + sheetName, 'INFO', 'SOCIAL_IMPORT');
    
  } catch (error) {
    addSystemLog('❌ Ошибка записи в лист: ' + error.message, 'ERROR', 'SOCIAL_IMPORT');
    throw error;
  }
}

/**
 * Создает расширенные формулы фильтрации для соцсетей
 */
function createAdvancedFilters(sheet, totalRows) {
  try {
    // Создаем формулы фильтрации в колонке I (отфильтрованные посты)
    for (var i = 2; i <= totalRows; i++) {
      // Формула проверки стоп-слов в H колонке против текста в D колонке
      var stopWordsFormula = '=IF(AND(D' + i + '<>"", H' + i + '<>""), IF(ISERROR(SEARCH(H' + i + ', D' + i + ')), D' + i + ', ""), D' + i + ')';
      sheet.getRange('I' + i).setFormula(stopWordsFormula);
      
      // Формула для позитивных слов в L колонке
      var positiveWordsFormula = '=IF(AND(D' + i + '<>"", K' + i + '<>""), IF(NOT(ISERROR(SEARCH(K' + i + ', D' + i + '))), D' + i + ', ""), "")';
      sheet.getRange('L' + i).setFormula(positiveWordsFormula);
    }
    
    addSystemLog('✅ Созданы формулы фильтрации для ' + (totalRows - 1) + ' постов', 'INFO', 'SOCIAL_IMPORT');
    
  } catch (error) {
    addSystemLog('❌ Ошибка создания фильтров: ' + error.message, 'ERROR', 'SOCIAL_IMPORT');
  }
}