#!/usr/bin/env node

/**
 * Проверка синтаксиса всех .gs файлов
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║  ПРОВЕРКА СИНТАКСИСА ВСЕХ .gs ФАЙЛОВ                  ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

// Получаем все .gs файлы
const files = [
  ...fs.readdirSync(path.join(__dirname, 'table/client')).filter(f => f.endsWith('.gs')).map(f => 'table/client/' + f),
  ...fs.readdirSync(path.join(__dirname, 'table/server')).filter(f => f.endsWith('.gs')).map(f => 'table/server/' + f),
  ...fs.readdirSync(path.join(__dirname, 'table/shared')).filter(f => f.endsWith('.gs')).map(f => 'table/shared/' + f),
  ...fs.readdirSync(path.join(__dirname, 'table/tests')).filter(f => f.endsWith('.gs')).map(f => 'table/tests/' + f),
  ...fs.readdirSync(path.join(__dirname, 'table/web')).filter(f => f.endsWith('.gs')).map(f => 'table/web/' + f)
];

console.log('📂 Найдено файлов:', files.length, '\n');

files.forEach((file, index) => {
  const filePath = path.join(__dirname, file);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Базовые проверки синтаксиса
    const checks = [];
    
    // Проверка балансировки скобок
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      checks.push(`Несбалансированные фигурные скобки: { (${openBraces}) vs } (${closeBraces})`);
    }
    
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      checks.push(`Несбалансированные круглые скобки: ( (${openParens}) vs ) (${closeParens})`);
    }
    
    // Проверка function declarations
    const functionMatches = content.match(/function\s+\w+/g);
    const functionCount = functionMatches ? functionMatches.length : 0;
    
    if (checks.length === 0) {
      results.passed++;
      console.log(`✅ (${index + 1}/${files.length}) ${file} - Функций: ${functionCount}`);
      results.details.push({ file, status: 'OK', functions: functionCount });
    } else {
      results.failed++;
      console.log(`❌ (${index + 1}/${files.length}) ${file}`);
      checks.forEach(c => console.log(`   └─ ${c}`));
      results.details.push({ file, status: 'FAILED', errors: checks });
    }
    
  } catch (e) {
    results.failed++;
    console.log(`❌ (${index + 1}/${files.length}) ${file} - Ошибка чтения: ${e.message}`);
    results.details.push({ file, status: 'ERROR', error: e.message });
  }
});

results.total = files.length;

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║  РЕЗУЛЬТАТЫ ПРОВЕРКИ СИНТАКСИСА                        ║');
console.log('╚════════════════════════════════════════════════════════╝\n');
console.log('Всего файлов:', results.total);
console.log('✅ Прошли:', results.passed);
console.log('❌ Провалены:', results.failed);
console.log('');

// Сохраняем отчёт
if (!fs.existsSync('test-results')) {
  fs.mkdirSync('test-results');
}
fs.writeFileSync('test-results/syntax-report.json', JSON.stringify(results, null, 2));

if (results.failed === 0) {
  console.log('🎉 ВСЕ ФАЙЛЫ ПРОШЛИ ПРОВЕРКУ СИНТАКСИСА!\n');
  process.exit(0);
} else {
  console.log('⚠️  ЕСТЬ ОШИБКИ СИНТАКСИСА!\n');
  process.exit(1);
}
