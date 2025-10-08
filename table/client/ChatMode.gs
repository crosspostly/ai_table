/**
 * Chat Mode v2.0
 * Интерактивный режим общения с Gemini прямо в таблице
 * 
 * Функционал:
 * - Режим чата в ячейках A1 (пользователь) и B1 (ассистент)
 * - Сохранение истории общения
 * - Автоматические ответы при изменении ячейки пользователя
 * - Интеграция с контекстом и умными промптами
 */

/**
 * Настройки режима чата
 */
var CHAT_SETTINGS = {
  USER_CELL: 'A2',           // Ячейка пользователя
  ASSISTANT_CELL: 'B2',      // Ячейка ассистента
  CHAT_SHEET_NAME: 'Чат',    // Название листа для чата
  SESSION_ID: 'chat',        // ID сессии для контекста
  AUTO_RESPOND: true,        // Автоматические ответы
  MAX_RESPONSE_LENGTH: 2000  // Максимальная длина ответа для ячейки
};

/**
 * Инициализация режима чата
 * Создает лист \"Чат\" если его нет, настраивает ячейки
 */
function initializeChatMode() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var chatSheet = spreadsheet.getSheetByName(CHAT_SETTINGS.CHAT_SHEET_NAME);
    
    if (!chatSheet) {
      chatSheet = createChatSheet(spreadsheet);
      addSystemLog('✨ Создан лист чата: ' + CHAT_SETTINGS.CHAT_SHEET_NAME, 'INFO', 'CHAT_MODE');
    }
    
    // Настраиваем ячейки
    setupChatCells(chatSheet);
    
    // Устанавливаем триггер для автоответов
    setupChatTrigger();
    
    addSystemLog('🚀 Режим чата инициализирован', 'INFO', 'CHAT_MODE');
    
    // Показываем приветствие
    showChatWelcome();
    
  } catch (error) {
    addSystemLog('Ошибка инициализации режима чата: ' + error.message, 'ERROR', 'CHAT_MODE');
    throw error;
  }
}

/**
 * Создает лист для чата с базовой структурой
 * @param {Spreadsheet} spreadsheet - таблица
 * @return {Sheet}
 */
function createChatSheet(spreadsheet) {
  try {
    var sheet = spreadsheet.insertSheet(CHAT_SETTINGS.CHAT_SHEET_NAME);
    
    // Настраиваем заголовки
    sheet.getRange('A1').setValue('💬 Ваше сообщение (пишите здесь):');
    sheet.getRange('B1').setValue('🤖 Ответ ассистента:');
    
    // Форматируем заголовки
    sheet.getRange('A1').setBackground('#e3f2fd').setFontWeight('bold');
    sheet.getRange('B1').setBackground('#f1f8e9').setFontWeight('bold');
    
    // Настраиваем размеры колонок
    sheet.setColumnWidth(1, 400); // Колонка пользователя
    sheet.setColumnWidth(2, 500); // Колонка ассистента
    
    // Добавляем инструкции
    sheet.getRange('A3').setValue('📝 ИНСТРУКЦИЯ:');
    sheet.getRange('A4').setValue('1. Напишите ваш вопрос или промпт в ячейку A2');
    sheet.getRange('A5').setValue('2. Нажмите Enter - ассистент автоматически ответит в B2');
    sheet.getRange('A6').setValue('3. История сохраняется автоматически');
    sheet.getRange('A7').setValue('4. Поддерживаются умные промпты (\"Промпт: текст\")');
    
    // Форматируем инструкции
    var instructionRange = sheet.getRange('A3:A7');
    instructionRange.setFontStyle('italic').setBackground('#fff3e0');
    
    // Добавляем кнопки управления
    sheet.getRange('D1').setValue('🧹 Очистить чат');
    sheet.getRange('D2').setValue('📋 Экспорт истории');
    sheet.getRange('D3').setValue('⚙️ Настройки контекста');
    
    // Форматируем кнопки
    var buttonsRange = sheet.getRange('D1:D3');
    buttonsRange.setBackground('#e8f5e8').setFontWeight('bold');
    
    return sheet;
    
  } catch (error) {
    addSystemLog('Ошибка создания листа чата: ' + error.message, 'ERROR', 'CHAT_MODE');
    throw error;
  }
}

/**
 * Настраивает ячейки чата
 * @param {Sheet} chatSheet - лист чата
 */
function setupChatCells(chatSheet) {
  try {
    // Ячейка пользователя (A2)
    var userCell = chatSheet.getRange('A2');
    userCell.setValue('');
    userCell.setNote('Напишите здесь ваш вопрос или промпт и нажмите Enter');
    userCell.setBackground('#ffffff');
    userCell.setWrap(true);
    
    // Ячейка ассистента (B2)
    var assistantCell = chatSheet.getRange('B2');
    assistantCell.setValue('Добро пожаловать! Напишите ваш вопрос в ячейку A2.');
    assistantCell.setBackground('#f8f9fa');
    assistantCell.setWrap(true);
    
    addSystemLog('✅ Ячейки чата настроены', 'INFO', 'CHAT_MODE');
    
  } catch (error) {
    addSystemLog('Ошибка настройки ячеек чата: ' + error.message, 'ERROR', 'CHAT_MODE');
  }
}

/**
 * Обработчик изменений в режиме чата
 * @param {Event} e - событие изменения ячейки
 */
function onChatEdit(e) {
  try {
    if (!e || !e.range) return;
    
    var range = e.range;
    var sheet = range.getSheet();
    
    // Проверяем, что это лист чата
    if (sheet.getName() !== CHAT_SETTINGS.CHAT_SHEET_NAME) return;
    
    // Проверяем, что изменена ячейка пользователя (A2)
    if (range.getA1Notation() !== 'A2') return;
    
    var userMessage = range.getValue();
    
    // Пропускаем пустые сообщения
    if (!userMessage || String(userMessage).trim() === '') return;
    
    addSystemLog('💬 Новое сообщение в чате: ' + String(userMessage).slice(0, 50) + '...', 'INFO', 'CHAT_MODE');
    
    // Обрабатываем сообщение
    processChatMessage(userMessage, sheet);
    
  } catch (error) {
    addSystemLog('Ошибка обработки чата: ' + error.message, 'ERROR', 'CHAT_MODE');
  }
}

/**
 * Обрабатывает сообщение пользователя в чате
 * @param {string} userMessage - сообщение пользователя
 * @param {Sheet} chatSheet - лист чата
 */
function processChatMessage(userMessage, chatSheet) {
  try {
    if (!CHAT_SETTINGS.AUTO_RESPOND) return;
    
    // Показываем индикатор загрузки
    var assistantCell = chatSheet.getRange('B2');
    assistantCell.setValue('🤔 Думаю...');
    
    // Добавляем сообщение пользователя в контекст
    addToContextHistory('user', userMessage, CHAT_SETTINGS.SESSION_ID);
    
    // Обрабатываем умные промпты если нужно
    var processedPrompt = userMessage;
    if (isSmartPrompt(userMessage)) {
      processedPrompt = extractPromptText(userMessage);
      processedPrompt = applySmartRules(processedPrompt);
    }
    
    // Создаем контекстный промпт
    var contextualPrompt = buildContextualPrompt(processedPrompt, CHAT_SETTINGS.SESSION_ID);
    
    // Отправляем запрос к Gemini
    var response = callGeminiWithContext(contextualPrompt);
    
    // Обрезаем ответ если он слишком длинный для ячейки
    if (response.length > CHAT_SETTINGS.MAX_RESPONSE_LENGTH) {
      response = response.substring(0, CHAT_SETTINGS.MAX_RESPONSE_LENGTH - 3) + '...';
    }
    
    // Устанавливаем ответ
    assistantCell.setValue(response);
    
    // Добавляем ответ в контекст
    addToContextHistory('assistant', response, CHAT_SETTINGS.SESSION_ID);
    
    addSystemLog('✅ Ответ в чате сгенерирован (' + response.length + ' симв.)', 'INFO', 'CHAT_MODE');
    
  } catch (error) {
    var errorMsg = 'Ошибка: ' + error.message;
    chatSheet.getRange('B2').setValue(errorMsg);
    addSystemLog('Ошибка обработки сообщения чата: ' + error.message, 'ERROR', 'CHAT_MODE');
  }
}

/**
 * Вызывает Gemini с учетом контекста
 * @param {string} prompt - промпт для отправки
 * @return {string} - ответ от Gemini
 */
function callGeminiWithContext(prompt) {
  try {
    // Используем существующую GM функцию
    return GM(prompt, 2000, 0.7);
  } catch (error) {
    addSystemLog('Ошибка вызова Gemini в чате: ' + error.message, 'ERROR', 'CHAT_MODE');
    return 'Извините, произошла ошибка при обращении к Gemini. Попробуйте еще раз.';
  }
}

/**
 * Очищает чат
 */
function clearChat() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var chatSheet = spreadsheet.getSheetByName(CHAT_SETTINGS.CHAT_SHEET_NAME);
    
    if (!chatSheet) {
      throw new Error('Лист чата не найден');
    }
    
    // Очищаем ячейки
    chatSheet.getRange('A2').setValue('');
    chatSheet.getRange('B2').setValue('Чат очищен. Напишите новое сообщение.');
    
    // Очищаем контекст
    clearContextHistory(CHAT_SETTINGS.SESSION_ID);
    
    addSystemLog('🧹 Чат очищен', 'INFO', 'CHAT_MODE');
    
    SpreadsheetApp.getUi().alert('Чат очищен', 'История сообщений удалена.', SpreadsheetApp.getUi().ButtonSet.OK);
    
  } catch (error) {
    addSystemLog('Ошибка очистки чата: ' + error.message, 'ERROR', 'CHAT_MODE');
    SpreadsheetApp.getUi().alert('Ошибка', 'Не удалось очистить чат: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Экспортирует историю чата
 */
function exportChatHistory() {
  try {
    var history = exportContextHistory(CHAT_SETTINGS.SESSION_ID);
    
    if (history === 'История контекста пуста.') {
      SpreadsheetApp.getUi().alert('История пуста', 'История чата пуста.', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    // Показываем историю в диалоге
    var ui = SpreadsheetApp.getUi();
    var result = ui.alert(
      'Экспорт истории чата',
      'История будет скопирована в новый лист. Продолжить?',
      ui.ButtonSet.OK_CANCEL
    );
    
    if (result === ui.Button.OK) {
      // Создаем новый лист для истории
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy_HH-mm');
      var historySheet = spreadsheet.insertSheet('История_чата_' + timestamp);
      
      // Записываем историю
      historySheet.getRange('A1').setValue(history);
      historySheet.getRange('A1').setWrap(true);
      historySheet.setColumnWidth(1, 800);
      
      addSystemLog('📋 История чата экспортирована в лист: ' + historySheet.getName(), 'INFO', 'CHAT_MODE');
      
      ui.alert('Экспорт завершен', 'История сохранена в лист: ' + historySheet.getName(), ui.ButtonSet.OK);
    }
    
  } catch (error) {
    addSystemLog('Ошибка экспорта истории чата: ' + error.message, 'ERROR', 'CHAT_MODE');
    SpreadsheetApp.getUi().alert('Ошибка экспорта', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Показывает настройки контекста для чата
 */
function showChatContextSettings() {
  try {
    var stats = getContextStatistics();
    
    var message = 'НАСТРОЙКИ КОНТЕКСТА ЧАТА\
\
';
    message += 'Контекст: ' + (stats.enabled ? '✅ Включен' : '❌ Выключен') + '\
';
    
    if (stats.enabled) {
      message += 'Элементов в истории: ' + (stats.sessions.chat ? stats.sessions.chat.items : 0) + '\
';
      message += 'Размер контекста: ' + (stats.sessions.chat ? stats.sessions.chat.size : 0) + ' символов\
\
';
      message += 'Для изменения настроек отредактируйте ячейку Параметры!C1:\
';
      message += '• \"✓\" или \"да\" = включено\
';
      message += '• пусто или \"нет\" = выключено';
    } else {
      message += '\
Для включения контекста поставьте \"✓\" в ячейку Параметры!C1';
    }
    
    SpreadsheetApp.getUi().alert('Настройки контекста', message, SpreadsheetApp.getUi().ButtonSet.OK);
    
  } catch (error) {
    addSystemLog('Ошибка показа настроек контекста чата: ' + error.message, 'ERROR', 'CHAT_MODE');
    SpreadsheetApp.getUi().alert('Ошибка', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Устанавливает триггер для режима чата
 */
function setupChatTrigger() {
  try {
    // Удаляем существующие триггеры чата
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'onChatEdit') {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    }
    
    // Создаем новый триггер
    ScriptApp.newTrigger('onChatEdit')
      .onEdit()
      .create();
      
    addSystemLog('✓ Триггер режима чата установлен', 'INFO', 'CHAT_MODE');
    
  } catch (error) {
    addSystemLog('Ошибка установки триггера чата: ' + error.message, 'ERROR', 'CHAT_MODE');
  }
}

/**
 * Удаляет триггер режима чата
 */
function removeChatTrigger() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var removed = 0;
    
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'onChatEdit') {
        ScriptApp.deleteTrigger(triggers[i]);
        removed++;
      }
    }
    
    addSystemLog('✓ Удалено триггеров чата: ' + removed, 'INFO', 'CHAT_MODE');
    
  } catch (error) {
    addSystemLog('Ошибка удаления триггеров чата: ' + error.message, 'ERROR', 'CHAT_MODE');
  }
}

/**
 * Показывает приветственное сообщение
 */
function showChatWelcome() {
  try {
    var ui = SpreadsheetApp.getUi();
    
    var message = '🎉 РЕЖИМ ЧАТА АКТИВИРОВАН!\
\
';
    message += '💬 Как использовать:\
';
    message += '1. Перейдите на лист \"Чат\"\
';
    message += '2. Напишите вопрос в ячейку A2\
';
    message += '3. Нажмите Enter - получите ответ в B2\
\
';
    message += '✨ Возможности:\
';
    message += '• Умные промпты (\"Промпт: текст\")\
';
    message += '• Сохранение контекста разговора\
';
    message += '• Автоматические ответы\
';
    message += '• Экспорт истории общения\
\
';
    message += 'Приятного общения! 🤖';
    
    ui.alert('Режим чата готов!', message, ui.ButtonSet.OK);
    
  } catch (error) {
    addSystemLog('Ошибка показа приветствия чата: ' + error.message, 'ERROR', 'CHAT_MODE');
  }
}"