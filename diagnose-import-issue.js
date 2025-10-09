#!/usr/bin/env node
/**
 * ДИАГНОСТИКА ПРОБЛЕМЫ "NULL" ПРИ ИМПОРТЕ ПОСТОВ
 * Находит все места где может возвращаться null
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  ДИАГНОСТИКА ПРОБЛЕМЫ "NULL" ПРИ ИМПОРТЕ ПОСТОВ       ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const filesToCheck = [
  'table/server/SocialImportService.gs',
  'table/server/VkImportService.gs',
  'table/server/ServerEndpoints.gs',
  'table/client/SocialImportClient.gs',
  'table/client/ClientUtilities.gs',
  'table/shared/Constants.gs'
];

const issues = {
  returnNull: [],
  returnUndefined: [],
  missingValidation: [],
  missingErrorHandling: []
};

console.log('🔍 Проверяем файлы на потенциальные источники null...\n');

filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${file} - НЕ НАЙДЕН`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Проверка 1: return null
    if (trimmed.match(/return\s+null/i)) {
      issues.returnNull.push({
        file,
        line: lineNum,
        code: trimmed
      });
    }
    
    // Проверка 2: return undefined
    if (trimmed.match(/return\s+undefined/i) || trimmed === 'return;') {
      issues.returnUndefined.push({
        file,
        line: lineNum,
        code: trimmed
      });
    }
    
    // Проверка 3: Функции без валидации входных параметров
    if (trimmed.match(/^function\s+\w+\(/) && !trimmed.includes('//')) {
      const nextFewLines = lines.slice(index + 1, index + 10).join('\n');
      if (!nextFewLines.match(/if\s*\(!.*\)/)) {
        issues.missingValidation.push({
          file,
          line: lineNum,
          code: trimmed
        });
      }
    }
    
    // Проверка 4: Вызовы без try-catch
    if (trimmed.match(/(handleWallGet_|importVkPostsAdvanced|callServer)\(/)) {
      // Проверяем окружающий контекст
      const context = lines.slice(Math.max(0, index - 5), index + 5).join('\n');
      if (!context.match(/try\s*\{/) && !context.match(/catch\s*\(/)) {
        issues.missingErrorHandling.push({
          file,
          line: lineNum,
          code: trimmed
        });
      }
    }
  });
  
  console.log(`✅ ${file} - проверен`);
});

console.log('\n═══════════════════════════════════════════════════════\n');
console.log('📊 РЕЗУЛЬТАТЫ ДИАГНОСТИКИ:\n');

// Отчет по return null
if (issues.returnNull.length > 0) {
  console.log(`❌ НАЙДЕНО ${issues.returnNull.length} СЛУЧАЕВ ВОЗВРАТА NULL:\n`);
  issues.returnNull.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue.file}:${issue.line}`);
    console.log(`      ${issue.code}`);
    console.log('');
  });
} else {
  console.log('✅ return null - не найдено\n');
}

// Отчет по return undefined
if (issues.returnUndefined.length > 0) {
  console.log(`⚠️  НАЙДЕНО ${issues.returnUndefined.length} СЛУЧАЕВ ВОЗВРАТА UNDEFINED:\n`);
  issues.returnUndefined.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue.file}:${issue.line}`);
    console.log(`      ${issue.code}`);
    console.log('');
  });
} else {
  console.log('✅ return undefined - не найдено\n');
}

// Отчет по отсутствию валидации
if (issues.missingValidation.length > 5) {
  console.log(`⚠️  НАЙДЕНО ${issues.missingValidation.length} ФУНКЦИЙ БЕЗ ВАЛИДАЦИИ (показаны первые 5):\n`);
  issues.missingValidation.slice(0, 5).forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue.file}:${issue.line}`);
    console.log(`      ${issue.code}`);
    console.log('');
  });
}

// Отчет по отсутствию error handling
if (issues.missingErrorHandling.length > 0) {
  console.log(`⚠️  НАЙДЕНО ${issues.missingErrorHandling.length} ВЫЗОВОВ БЕЗ TRY-CATCH (показаны первые 5):\n`);
  issues.missingErrorHandling.slice(0, 5).forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue.file}:${issue.line}`);
    console.log(`      ${issue.code}`);
    console.log('');
  });
}

console.log('═══════════════════════════════════════════════════════\n');

// Специфические проверки для null при импорте
console.log('🎯 СПЕЦИФИЧЕСКАЯ ДИАГНОСТИКА ДЛЯ ИМПОРТА:\n');

const socialImportService = fs.readFileSync('table/server/SocialImportService.gs', 'utf8');
const vkImportService = fs.readFileSync('table/server/VkImportService.gs', 'utf8');

// Проверка 1: importVkPostsAdvanced возвращает результат?
if (socialImportService.includes('function importVkPostsAdvanced')) {
  const funcMatch = socialImportService.match(/function importVkPostsAdvanced[\s\S]*?^}/m);
  if (funcMatch) {
    const funcBody = funcMatch[0];
    if (funcBody.includes('return posts.map')) {
      console.log('✅ importVkPostsAdvanced возвращает mapped posts');
    } else if (funcBody.includes('return posts')) {
      console.log('✅ importVkPostsAdvanced возвращает posts');
    } else if (!funcBody.includes('return')) {
      console.log('❌ importVkPostsAdvanced НЕ ВОЗВРАЩАЕТ РЕЗУЛЬТАТ!');
    }
  }
}

// Проверка 2: handleWallGet_ возвращает результат?
if (vkImportService.includes('function handleWallGet_')) {
  const funcMatch = vkImportService.match(/function handleWallGet_[\s\S]*?^}/m);
  if (funcMatch) {
    const funcBody = funcMatch[0];
    if (funcBody.includes('return posts')) {
      console.log('✅ handleWallGet_ возвращает posts');
    } else if (!funcBody.includes('return')) {
      console.log('❌ handleWallGet_ НЕ ВОЗВРАЩАЕТ РЕЗУЛЬТАТ!');
    }
  }
}

// Проверка 3: SYSTEM_LOGS_NAME определена?
const constants = fs.readFileSync('table/shared/Constants.gs', 'utf8');
if (constants.includes('SYSTEM_LOGS_NAME')) {
  console.log('✅ SYSTEM_LOGS_NAME определена в Constants.gs');
} else {
  console.log('❌ SYSTEM_LOGS_NAME НЕ ОПРЕДЕЛЕНА!');
}

// Проверка 4: callServer обрабатывает ошибки?
const clientUtils = fs.readFileSync('table/client/ClientUtilities.gs', 'utf8');
if (clientUtils.includes('function callServer')) {
  const funcMatch = clientUtils.match(/function callServer[\s\S]*?^}/m);
  if (funcMatch) {
    const funcBody = funcMatch[0];
    if (funcBody.includes('catch')) {
      console.log('✅ callServer имеет обработку ошибок');
    } else {
      console.log('❌ callServer НЕ ИМЕЕТ ОБРАБОТКИ ОШИБОК!');
    }
  }
}

console.log('\n═══════════════════════════════════════════════════════\n');

// Ключевые рекомендации
console.log('💡 КЛЮЧЕВЫЕ РЕКОМЕНДАЦИИ:\n');
console.log('1. Проверьте что VK_TOKEN настроен в Script Properties');
console.log('2. Проверьте что лист "Параметры" содержит:');
console.log('   - B1: источник (URL или username)');
console.log('   - B2: количество постов');
console.log('   - C1: платформа (опционально)');
console.log('3. Проверьте логи Google Apps Script для детальной ошибки');
console.log('4. Используйте функцию masterSystemCheck() для диагностики');
console.log('5. Проверьте что SERVER_API_URL правильный в Constants.gs\n');

console.log('═══════════════════════════════════════════════════════\n');

const totalIssues = issues.returnNull.length + 
                     issues.returnUndefined.length +
                     issues.missingValidation.length +
                     issues.missingErrorHandling.length;

if (totalIssues === 0) {
  console.log('🎉 НЕТ КРИТИЧЕСКИХ ПРОБЛЕМ С NULL!\n');
  console.log('Проблема "null" скорее всего связана с:');
  console.log('• Отсутствием VK_TOKEN в Script Properties');
  console.log('• Невалидными данными в листе "Параметры"');
  console.log('• Проблемами с сетевым соединением к VK API\n');
} else {
  console.log(`⚠️  НАЙДЕНО ${totalIssues} ПОТЕНЦИАЛЬНЫХ ПРОБЛЕМ\n`);
  console.log('Рекомендуется исправить найденные проблемы.\n');
}
