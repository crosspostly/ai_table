/**
 * Smart Prompt Processor v2.0
 * Умная обработка промптов с автоматическим преобразованием в формулы
 * 
 * Функционал:
 * - Автоматическое обнаружение ключевого слова "Промпт:"
 * - Преобразование естественного языка в формулы GM/GM_STATIC
 * - Интеграция с системой правил для подстановки данных
 */

/**
 * Основная функция обработки умных промптов
 * @param {string} cellValue - содержимое ячейки
 * @param {string} cellAddress - адрес ячейки (A1 нотация)
 * @return {string} - преобразованная формула или оригинальный текст
 */
function processSmartPrompt(cellValue, cellAddress) {
  addSystemLog('→ processSmartPrompt: ' + cellAddress + ' = "' + (cellValue ? cellValue.slice(0, 60) + '...' : 'пусто') + '"', 'INFO', 'SMART_PROMPTS');
  
  try {
    // Проверяем наличие ключевого слова "Промпт:"
    if (!isSmartPrompt(cellValue)) {
      return cellValue; // Не промпт - возвращаем как есть
    }
    
    // Извлекаем чистый промпт без ключевого слова
    var cleanPrompt = extractPromptText(cellValue);
    
    // Применяем правила замены для превращения естественного языка в ссылки на данные
    var enrichedPrompt = applySmartRules(cleanPrompt);
    
    // Определяем тип формулы (статичная или динамичная)
    var isStatic = shouldUseStaticFormula(cellValue);
    var formulaType = isStatic ? 'GM_STATIC' : 'GM';
    
    // Формируем итоговую формулу
    var formula = '=' + formulaType + '("' + escapeBracketsForFormula(enrichedPrompt) + '")';
    
    addSystemLog('✓ Умный промпт преобразован: ' + cellAddress + ' → ' + formulaType, 'INFO', 'SMART_PROMPTS');
    
    return formula;
    
  } catch (error) {
    addSystemLog('✗ Ошибка обработки умного промпта в ' + cellAddress + ': ' + error.message, 'ERROR', 'SMART_PROMPTS');
    return cellValue; // При ошибке возвращаем оригинал
  }
}

/**
 * Проверяет, является ли текст умным промптом
 * @param {string} text - проверяемый текст
 * @return {boolean}
 */
function isSmartPrompt(text) {
  if (!text || typeof text !== 'string') return false;
  
  // Ищем ключевые слова (регистронезависимо)
  var keywords = ['промпт:', 'prompt:', 'запрос:', 'гемини:'];
  var lowerText = text.toLowerCase().trim();
  
  return keywords.some(function(keyword) {
    return lowerText.indexOf(keyword) === 0;
  });
}

/**
 * Извлекает чистый текст промпта без ключевых слов
 * @param {string} text - исходный текст
 * @return {string}
 */
function extractPromptText(text) {
  if (!text) return '';
  
  var keywords = ['промпт:', 'prompt:', 'запрос:', 'гемини:'];
  var result = text.trim();
  
  // Удаляем ключевое слово в начале
  for (var i = 0; i < keywords.length; i++) {
    var keyword = keywords[i];
    var regex = new RegExp('^' + keyword.replace(':', '\\:'), 'i');
    if (regex.test(result)) {
      result = result.replace(regex, '').trim();
      break;
    }
  }
  
  return result;
}

/**
 * Применяет умные правила замены для превращения естественного языка в ссылки
 * @param {string} prompt - исходный промпт
 * @return {string} - промпт с подставленными ссылками на данные
 */
function applySmartRules(prompt) {
  try {
    // Получаем правила из системы RulesEngine
    var rules = getRulesFromSheet();
    
    var result = prompt;
    
    // Применяем каждое правило
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (!rule.keyword || !rule.reference) continue;
      
      // Создаем регулярное выражение для поиска ключевого слова (регистронезависимо)
      var regex = new RegExp('\\b' + escapeRegExp(rule.keyword) + '\\b', 'gi');
      
      // Заменяем найденные вхождения на ссылку с конкатенацией
      if (regex.test(result)) {
        result = result.replace(regex, '" & ' + rule.reference + ' & "');
        addSystemLog('Применено правило: "' + rule.keyword + '" → ' + rule.reference, 'INFO', 'SMART_RULES');
      }
    }
    
    // Очищаем лишние пустые конкатенации
    result = cleanupConcatenations(result);
    
    return result;
    
  } catch (error) {
    addSystemLog('Ошибка применения умных правил: ' + error.message, 'ERROR', 'SMART_RULES');
    return prompt;
  }
}

/**
 * Определяет, нужно ли использовать статичную формулу
 * @param {string} originalText - оригинальный текст
 * @return {boolean}
 */
function shouldUseStaticFormula(originalText) {
  if (!originalText) return false;
  
  // Ищем индикаторы статичности
  var staticIndicators = ['статичн', 'static', 'сохран', 'зафиксир'];
  var lowerText = originalText.toLowerCase();
  
  return staticIndicators.some(function(indicator) {
    return lowerText.indexOf(indicator) !== -1;
  });
}

/**
 * Экранирует кавычки для использования в формуле
 * @param {string} text - текст для экранирования
 * @return {string}
 */
function escapeBracketsForFormula(text) {
  if (!text) return '';
  
  // Экранируем кавычки для Google Sheets формул
  return text.replace(/"/g, '""');
}

/**
 * Экранирует специальные символы для регулярных выражений
 * @param {string} string - строка для экранирования
 * @return {string}
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Очищает лишние пустые конкатенации в строке
 * @param {string} text - текст для очистки
 * @return {string}
 */
function cleanupConcatenations(text) {
  if (!text) return '';
  
  // Убираем пустые конкатенации типа " & "" & "
  return text
    .replace(/"\s*&\s*""\s*&\s*"/g, '')
    .replace(/^\s*&\s*"?\s*|\s*"?\s*&\s*$/g, '')
    .replace(/"\s*&\s*"/g, '');
}

/**
 * Триггер для автоматической обработки умных промптов при изменении ячеек
 * @param {Event} e - событие изменения ячейки
 */
function onSmartPromptEdit(e) {
  try {
    if (!e || !e.range) return;
    
    var range = e.range;
    var value = range.getValue();
    
    // Проверяем, это умный промпт?
    if (!isSmartPrompt(value)) return;
    
    // Получаем адрес ячейки
    var cellAddress = range.getA1Notation();
    
    addSystemLog('🔄 Автообработка умного промпта в ' + cellAddress, 'INFO', 'AUTO_PROMPTS');
    
    // Обрабатываем промпт
    var formula = processSmartPrompt(value, cellAddress);
    
    // Если формула изменилась, устанавливаем её
    if (formula !== value) {
      range.setFormula(formula);
      addSystemLog('✅ Формула установлена в ' + cellAddress, 'INFO', 'AUTO_PROMPTS');
    }
    
  } catch (error) {
    addSystemLog('Ошибка автообработки умного промпта: ' + error.message, 'ERROR', 'AUTO_PROMPTS');
  }
}

/**
 * Установка триггера для автоматической обработки умных промптов
 */
function setupSmartPromptTrigger() {
  try {
    var ui = SpreadsheetApp.getUi();
    
    // ПРИМЕЧАНИЕ: Smart Prompts использует SIMPLE onEdit trigger
    // Функция onEdit() в коде автоматически вызывается Google Sheets
    // Нет необходимости создавать installable trigger
    
    addSystemLog('✓ Smart Prompts готовы к использованию (simple trigger)', 'INFO', 'SETUP');
    
    ui.alert('✅ Успех', 
      'Умные промпты активированы!\n\n' +
      '📝 КАК ИСПОЛЬЗОВАТЬ:\n\n' +
      '1️⃣ УМНЫЕ ПРОМПТЫ:\n' +
      'Пишите в любой ячейке:\n' +
      '"Промпт: Проанализируй нашу нишу"\n' +
      '→ Нажмите Enter\n' +
      '→ Вручную замените на формулу =GM("...")\n\n' +
      '2️⃣ УМНЫЕ ЦЕПОЧКИ:\n' +
      'Меню: 📊 Анализ данных → 🚀 Запустить анализ\n' +
      '→ Настроит формулы B3..G3\n' +
      '→ Заполните A3 и цепочка запустится!\n\n' +
      '💡 СОВЕТ: Для автоматической обработки промптов\n' +
      'используйте меню "Обработать промпт" после ввода текста.',
      ui.ButtonSet.OK);
    
  } catch (error) {
    addSystemLog('Ошибка настройки Smart Prompts: ' + error.message, 'ERROR', 'SETUP');
    SpreadsheetApp.getUi().alert('❌ Ошибка', 
      'Не удалось настроить Smart Prompts:\n\n' + error.message + 
      '\n\nОднако вы можете вручную создавать формулы GM().',
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Удаление триггера автоматической обработки умных промптов
 */
function removeSmartPromptTrigger() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var removed = 0;
    
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'onSmartPromptEdit') {
        ScriptApp.deleteTrigger(triggers[i]);
        removed++;
      }
    }
    
    addSystemLog('✓ Удалено триггеров умных промптов: ' + removed, 'INFO', 'CLEANUP');
    
  } catch (error) {
    addSystemLog('Ошибка удаления триггеров умных промптов: ' + error.message, 'ERROR', 'CLEANUP');
  }
}