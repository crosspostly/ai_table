/**
 * Автоматическое создание кнопок импорта в Google Sheets
 * Создаёт красивые кнопки для импорта из социальных сетей
 */

/**
 * Автоматически создаёт кнопку "Импорт постов" в ячейке A1 активного листа или листа "посты"
 * Вызывается при открытии таблицы или вручную
 */
function createImportButton() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('посты') || ss.getActiveSheet();
    
    // Создаём кнопку в A1
    createButtonInCell(sheet, 'A1', 'Импорт постов', 'importSocialPosts');
    
    addSystemLog('✅ Кнопка импорта создана в A1 листа ' + sheet.getName(), 'INFO', 'AUTO_BUTTON');
    
    return true;
  } catch (error) {
    addSystemLog('❌ Ошибка создания кнопки: ' + error.message, 'ERROR', 'AUTO_BUTTON');
    return false;
  }
}

/**
 * Создаёт кнопку в указанной ячейке с назначенным скриптом
 * @param {Sheet} sheet - Лист Google Sheets
 * @param {string} cellA1 - Адрес ячейки в формате A1
 * @param {string} buttonText - Текст на кнопке
 * @param {string} scriptFunction - Имя функции для вызова
 */
function createButtonInCell(sheet, cellA1, buttonText, scriptFunction) {
  // Получаем ячейку
  var cell = sheet.getRange(cellA1);
  
  // Очищаем ячейку
  cell.clear();
  
  // Создаём рисунок-кнопку
  var drawing = sheet.getParent().newDrawing();
  
  // Создаём прямоугольник с текстом
  var shape = drawing.newShape()
    .setShapeType(SpreadsheetApp.Drawing.ShapeType.RECTANGLE)
    .setBackgroundColor('#1a73e8')  // Синий цвет Google
    .setFontColor('#ffffff')         // Белый текст
    .setFontSize(14)                 // Размер шрифта
    .setFontFamily('Arial')           // Шрифт
    .setText(buttonText)              // Текст кнопки
    .setTextAlignment(SpreadsheetApp.Drawing.TextAlignment.CENTER);
  
  // Устанавливаем размер и позицию
  drawing.addShape(shape);
  drawing.setWidth(180);  // Ширина в пикселях
  drawing.setHeight(36);   // Высота в пикселях
  drawing.setPosition(cell.getRow(), cell.getColumn(), 10, 10);  // Позиция с отступом 10px
  
  // Назначаем функцию
  drawing.setOnAction(scriptFunction);
  
  // Добавляем на лист
  sheet.insertDrawing(drawing.build());
  
  // Увеличиваем высоту строки для кнопки
  sheet.setRowHeight(cell.getRow(), 50);
  
  // Добавляем подпись под кнопкой
  var labelCell = sheet.getRange(cell.getRow() + 1, cell.getColumn());
  labelCell.setValue('↑ Нажмите для импорта');
  labelCell.setFontSize(9);
  labelCell.setFontColor('#666666');
  labelCell.setFontStyle('italic');
}

/**
 * Wrapper функция для кнопки импорта
 * ВАЖНО: Кнопка в A1 вызывает эту функцию
 * ПРЯМОЙ ВЫЗОВ VK ИМПОРТА - БЕЗ УНИВЕРСАЛЬНОГО
 */
function importSocialPosts() {
  try {
    // ПРЯМОЙ ВЫЗОВ VK ИМПОРТА
    if (typeof importVkPosts === 'function') {
      importVkPosts(); 
    } else {
      SpreadsheetApp.getUi().alert(
        '❌ Ошибка',
        'Функция VK импорта не найдена. Попробуйте через меню:\n' +
        '🤖 Table AI → 📱 Социальные сети → 📱 VK импорт',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      '❌ Ошибка импорта',
      'Произошла ошибка: ' + error.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Показывает диалог выбора источника для импорта
 */
function showImportDialog() {
  var ui = SpreadsheetApp.getUi();
  
  var html = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #1a73e8;">📱 Импорт постов из соцсетей</h2>
      
      <div style="margin: 20px 0;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">
          Источник (URL или username):
        </label>
        <input type="text" id="source" placeholder="Например: durov или https://vk.com/durov" 
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div style="margin: 20px 0;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">
          Количество постов:
        </label>
        <input type="number" id="count" value="10" min="1" max="100"
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div style="margin: 20px 0;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">
          Платформа (опционально):
        </label>
        <select id="platform" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="">Автоопределение</option>
          <option value="vk">ВКонтакте</option>
          <option value="instagram">Instagram</option>
          <option value="telegram">Telegram</option>
        </select>
      </div>
      
      <div style="margin-top: 30px; text-align: center;">
        <button onclick="startImport()" 
                style="background: #1a73e8; color: white; padding: 10px 30px; 
                       border: none; border-radius: 4px; font-size: 16px; cursor: pointer;">
          🚀 Начать импорт
        </button>
        <button onclick="google.script.host.close()" 
                style="background: #666; color: white; padding: 10px 30px; 
                       border: none; border-radius: 4px; font-size: 16px; cursor: pointer; margin-left: 10px;">
          Отмена
        </button>
      </div>
      
      <div style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
        <p style="margin: 0; font-size: 12px; color: #666;">
          💡 <b>Совет:</b> Создайте лист "Параметры" и заполните B1 (источник), B2 (количество), C1 (платформа) 
          для автоматического импорта без диалога.
        </p>
      </div>
    </div>
    
    <script>
      function startImport() {
        var source = document.getElementById('source').value;
        var count = document.getElementById('count').value;
        var platform = document.getElementById('platform').value;
        
        if (!source) {
          alert('Укажите источник для импорта');
          return;
        }
        
        google.script.run
          .withSuccessHandler(function() {
            google.script.host.close();
          })
          .withFailureHandler(function(error) {
            alert('Ошибка: ' + error);
          })
          .importWithParams(source, count, platform);
      }
    </script>
  `)
  .setWidth(500)
  .setHeight(450);
  
  ui.showModalDialog(html, '📱 Импорт постов');
}

/**
 * Импорт с параметрами из диалога
 */
function importWithParams(source, count, platform) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Создаём временный лист Параметры если его нет
  var paramsSheet = ss.getSheetByName('Параметры');
  if (!paramsSheet) {
    paramsSheet = ss.insertSheet('Параметры');
  }
  
  // Заполняем параметры
  paramsSheet.getRange('B1').setValue(source);
  paramsSheet.getRange('B2').setValue(count);
  paramsSheet.getRange('C1').setValue(platform || '');
  
  // Вызываем VK импорт
  importVkPosts();
}

/**
 * Создаёт все необходимые кнопки при открытии таблицы
 */
function onOpen() {
  try {
    // Создаём меню
    if (typeof createMenu === 'function') {
      createMenu();
    }
    
    // Создаём кнопку импорта если есть лист "посты"
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var postsSheet = ss.getSheetByName('посты');
    
    if (postsSheet) {
      createButtonInCell(postsSheet, 'A1', 'Импорт постов', 'importSocialPosts');
      addSystemLog('✅ Кнопка импорта создана при открытии', 'INFO', 'AUTO_BUTTON');
    }
    
  } catch (error) {
    console.log('Ошибка onOpen: ' + error.message);
  }
}

/**
 * Создаёт кнопки на всех нужных листах
 */
function createAllButtons() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  
  var created = [];
  
  // Кнопка импорта на листе "посты"
  var postsSheet = ss.getSheetByName('посты');
  if (!postsSheet) {
    postsSheet = ss.insertSheet('посты');
  }
  createButtonInCell(postsSheet, 'A1', 'Импорт постов', 'importSocialPosts');
  created.push('Импорт постов (A1 лист "посты")');
  
  // Кнопка тестов на листе "тест"
  var testSheet = ss.getSheetByName('тест');
  if (testSheet) {
    createButtonInCell(testSheet, 'A1', '🎯 Супер тест', 'superMasterCheck');
    created.push('Супер тест (A1 лист "тест")');
  }
  
  // Кнопка настроек на листе "Параметры"
  var paramsSheet = ss.getSheetByName('Параметры');
  if (paramsSheet) {
    createButtonInCell(paramsSheet, 'D1', '⚙️ Настройки', 'setupAllCredentialsUI');
    created.push('Настройки (D1 лист "Параметры")');
  }
  
  var message = '✅ Кнопки созданы:\\n\\n' + created.join('\\n');
  ui.alert('Создание кнопок', message, ui.ButtonSet.OK);
  
  addSystemLog('Создано кнопок: ' + created.length, 'INFO', 'AUTO_BUTTON');
}

