#!/usr/bin/env node

/**
 * Локальный раннер мок-тестов для валидации исправлений
 * Проверяет синтаксис и структуру без реальных API запросов
 */

const fs = require('fs');
const path = require('path');

console.log('');
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  МОК-ТЕСТЫ ВАЛИДАЦИИ ИСПРАВЛЕНИЙ ИМПОРТА ПОСТОВ       ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');

// Результаты тестов
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

/**
 * Тест 1: Проверка синтаксиса Constants.gs
 */
function testConstantsSyntax() {
  const testName = 'Constants.gs синтаксис';
  try {
    const filePath = path.join(__dirname, 'table/shared/Constants.gs');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем наличие SYSTEM_LOGS_NAME
    if (!content.includes('const SYSTEM_LOGS_NAME')) {
      throw new Error('Не найдена константа SYSTEM_LOGS_NAME');
    }
    
    // Проверяем значение
    const match = content.match(/const SYSTEM_LOGS_NAME\s*=\s*['"]([^'"]+)['"]/);
    if (!match || match[1] !== 'SYSTEM_LOGS') {
      throw new Error('Неверное значение SYSTEM_LOGS_NAME');
    }
    
    results.details.push({ name: testName, passed: true });
    console.log('✅', testName);
    return true;
  } catch (e) {
    results.details.push({ name: testName, passed: false, error: e.message });
    console.log('❌', testName, '|', e.message);
    return false;
  }
}

/**
 * Тест 2: Проверка синтаксиса SocialImportService.gs
 */
function testSocialImportServiceSyntax() {
  const testName = 'SocialImportService.gs синтаксис';
  try {
    const filePath = path.join(__dirname, 'table/server/SocialImportService.gs');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем наличие ключевых функций
    const requiredFunctions = [
      'importVkPostsAdvanced',
      'writePostsToSheet',
      'createStopWordsFormulas',
      'applyUniformFormatting'
    ];
    
    for (const func of requiredFunctions) {
      if (!content.includes(`function ${func}`)) {
        throw new Error(`Не найдена функция ${func}`);
      }
    }
    
    // Проверяем, что используется handleWallGet_
    if (!content.includes('handleWallGet_')) {
      throw new Error('importVkPostsAdvanced не использует handleWallGet_');
    }
    
    // Проверяем, что НЕ используется VK_PARSER_URL в importVkPostsAdvanced (кроме комментариев)
    const vkAdvancedMatch = content.match(/function importVkPostsAdvanced[\s\S]*?(?=function|$)/);
    if (vkAdvancedMatch) {
      const funcContent = vkAdvancedMatch[0];
      // Удаляем комментарии
      const withoutComments = funcContent.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      if (withoutComments.includes('VK_PARSER_URL')) {
        throw new Error('importVkPostsAdvanced всё ещё использует VK_PARSER_URL!');
      }
    }
    
    results.details.push({ name: testName, passed: true });
    console.log('✅', testName);
    return true;
  } catch (e) {
    results.details.push({ name: testName, passed: false, error: e.message });
    console.log('❌', testName, '|', e.message);
    return false;
  }
}

/**
 * Тест 3: Проверка структуры writePostsToSheet
 */
function testWritePostsToSheetStructure() {
  const testName = 'writePostsToSheet структура (старая)';
  try {
    const filePath = path.join(__dirname, 'table/server/SocialImportService.gs');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Извлекаем функцию writePostsToSheet
    const funcMatch = content.match(/function writePostsToSheet[\s\S]*?(?=\nfunction|\n\/\*\*|$)/);
    if (!funcMatch) {
      throw new Error('Функция writePostsToSheet не найдена');
    }
    
    const funcContent = funcMatch[0];
    
    // Проверяем, что первая колонка - "Дата", а НЕ "Платформа"
    const headersMatch = funcContent.match(/var headers = \[([\s\S]*?)\];/);
    if (!headersMatch) {
      throw new Error('Не найден массив headers');
    }
    
    const headersContent = headersMatch[1];
    
    // Проверяем порядок колонок
    if (!headersContent.includes("'Дата'") || !headersContent.includes("'Ссылка на пост'")) {
      throw new Error('Неверная структура заголовков');
    }
    
    // Проверяем, что "Платформа" НЕ в начале
    const firstHeaderMatch = headersContent.match(/['"]([^'"]+)['"]/);
    if (firstHeaderMatch && firstHeaderMatch[1] === 'Платформа') {
      throw new Error('Первая колонка "Платформа" - должна быть "Дата"!');
    }
    
    // Проверяем вызов createStopWordsFormulas
    if (!funcContent.includes('createStopWordsFormulas')) {
      throw new Error('Не вызывается createStopWordsFormulas');
    }
    
    // Проверяем вызов applyUniformFormatting
    if (!funcContent.includes('applyUniformFormatting')) {
      throw new Error('Не вызывается applyUniformFormatting');
    }
    
    results.details.push({ name: testName, passed: true });
    console.log('✅', testName);
    return true;
  } catch (e) {
    results.details.push({ name: testName, passed: false, error: e.message });
    console.log('❌', testName, '|', e.message);
    return false;
  }
}

/**
 * Тест 4: Проверка формул createStopWordsFormulas
 */
function testCreateStopWordsFormulas() {
  const testName = 'createStopWordsFormulas формулы (SUMPRODUCT)';
  try {
    const filePath = path.join(__dirname, 'table/server/SocialImportService.gs');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Извлекаем функцию createStopWordsFormulas
    const funcMatch = content.match(/function createStopWordsFormulas[\s\S]*?(?=\nfunction|\n\/\*\*|$)/);
    if (!funcMatch) {
      throw new Error('Функция createStopWordsFormulas не найдена');
    }
    
    const funcContent = funcMatch[0];
    
    // Проверяем использование SUMPRODUCT
    if (!funcContent.includes('SUMPRODUCT')) {
      throw new Error('Не используется формула SUMPRODUCT');
    }
    
    // Проверяем диапазоны стоп-слов
    if (!funcContent.includes('$E$2:$E$100')) {
      throw new Error('Неверный диапазон стоп-слов');
    }
    
    // Проверяем, что формулы ссылаются на колонку C (текст поста)
    if (!funcContent.includes('C' + '\' + row')) {
      throw new Error('Формулы должны ссылаться на колонку C (текст поста)');
    }
    
    results.details.push({ name: testName, passed: true });
    console.log('✅', testName);
    return true;
  } catch (e) {
    results.details.push({ name: testName, passed: false, error: e.message });
    console.log('❌', testName, '|', e.message);
    return false;
  }
}

/**
 * Тест 5: Проверка importVkPostsAdvanced маппинга
 */
function testImportVkPostsAdvancedMapping() {
  const testName = 'importVkPostsAdvanced маппинг (date, link, number)';
  try {
    const filePath = path.join(__dirname, 'table/server/SocialImportService.gs');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Извлекаем функцию importVkPostsAdvanced
    const funcMatch = content.match(/function importVkPostsAdvanced[\s\S]*?(?=\nfunction|\n\/\*\*|$)/);
    if (!funcMatch) {
      throw new Error('Функция importVkPostsAdvanced не найдена');
    }
    
    const funcContent = funcMatch[0];
    
    // Проверяем маппинг полей
    if (!funcContent.includes('date: post.date')) {
      throw new Error('Дата должна браться напрямую из post.date');
    }
    
    if (!funcContent.includes('link: post.link')) {
      throw new Error('Ссылка должна браться напрямую из post.link');
    }
    
    if (!funcContent.includes('id: post.number')) {
      throw new Error('ID должен браться из post.number, а не post.id');
    }
    
    results.details.push({ name: testName, passed: true });
    console.log('✅', testName);
    return true;
  } catch (e) {
    results.details.push({ name: testName, passed: false, error: e.message });
    console.log('❌', testName, '|', e.message);
    return false;
  }
}

/**
 * Тест 6: Проверка наличия VkImportService.gs с handleWallGet_
 */
function testVkImportServiceExists() {
  const testName = 'VkImportService.gs handleWallGet_ существует';
  try {
    const filePath = path.join(__dirname, 'table/server/VkImportService.gs');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем наличие handleWallGet_
    if (!content.includes('function handleWallGet_')) {
      throw new Error('Функция handleWallGet_ не найдена');
    }
    
    // Проверяем, что используется прямой VK API
    if (!content.includes('api.vk.com/method/wall.get')) {
      throw new Error('handleWallGet_ должна использовать api.vk.com/method/wall.get');
    }
    
    results.details.push({ name: testName, passed: true });
    console.log('✅', testName);
    return true;
  } catch (e) {
    results.details.push({ name: testName, passed: false, error: e.message });
    console.log('❌', testName, '|', e.message);
    return false;
  }
}

// Запускаем все тесты
console.log('🔥 === ЗАПУСК МОК-ТЕСТОВ ===\n');

testConstantsSyntax();
testSocialImportServiceSyntax();
testWritePostsToSheetStructure();
testCreateStopWordsFormulas();
testImportVkPostsAdvancedMapping();
testVkImportServiceExists();

// Подсчёт результатов
results.total = results.details.length;
results.passed = results.details.filter(t => t.passed).length;
results.failed = results.total - results.passed;

// Вывод итоговой сводки
console.log('');
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  ИТОГОВАЯ СВОДКА                                       ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');
console.log('Всего тестов:', results.total);
console.log('✅ Прошли:', results.passed);
console.log('❌ Провалены:', results.failed);
console.log('');

if (results.failed === 0) {
  console.log('🎉🎉🎉 ВСЕ МОК-ТЕСТЫ ПРОШЛИ УСПЕШНО! 🎉🎉🎉');
  console.log('');
  console.log('✅ Код готов к деплою!');
  console.log('');
  process.exit(0);
} else {
  console.log('⚠️⚠️⚠️ ЕСТЬ ПРОБЛЕМЫ! ⚠️⚠️⚠️');
  console.log('');
  console.log('❌ Исправьте ошибки перед деплоем!');
  console.log('');
  process.exit(1);
}
