/**
 * Emoji Remover Utility
 * Утилита для удаления эмодзи и смайликов из текста
 * Используется в VK постах и OCR отзывах
 */

/**
 * Удаляет эмодзи и смайлики из текста
 * @param {string} text - Исходный текст
 * @return {string} - Текст без эмодзи
 */
function removeEmojis(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  // Regex для удаления эмодзи:
  // - \uD800-\uDBFF\uDC00-\uDFFF - Surrogate pairs (большинство эмодзи)
  // - \u2600-\u27BF - Dingbats (символы типа ☀️, ⭐, etc.)
  // - \uD83C-\uD83E[\uDC00-\uDFFF] - Эмодзи (расширенные Unicode блоки)
  // - \u2300-\u23FF - Разные технические символы
  // - \u2B50 - Звезда и подобные
  // - \uFE00-\uFE0F - Вариационные селекторы
  // - \u200D - Zero-width joiner (объединяет эмодзи)
  // - \u20E3 - Combining Enclosing Keycap (цифры в квадратах)
  var emojiPattern = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]|[\u2300-\u23FF]|[\u2B50]|[\uFE00-\uFE0F]|[\u200D]|[\u20E3]/g;
  
  var cleaned = text.replace(emojiPattern, '');
  
  // Удаляем множественные пробелы, которые остались после удаления эмодзи
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Проверяет содержит ли текст эмодзи
 * @param {string} text - Текст для проверки
 * @return {boolean} - true если содержит эмодзи
 */
function containsEmojis(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  var emojiPattern = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]|[\u2300-\u23FF]|[\u2B50]|[\uFE00-\uFE0F]|[\u200D]|[\u20E3]/;
  
  return emojiPattern.test(text);
}

/**
 * Подсчитывает количество эмодзи в тексте
 * @param {string} text - Текст для анализа
 * @return {number} - Количество найденных эмодзи
 */
function countEmojis(text) {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  var emojiPattern = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]|[\u2300-\u23FF]|[\u2B50]|[\uFE00-\uFE0F]|[\u200D]|[\u20E3]/g;
  
  var matches = text.match(emojiPattern);
  return matches ? matches.length : 0;
}
