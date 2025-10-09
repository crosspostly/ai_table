#!/usr/bin/env node

/**
 * Анализ структуры проекта
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║  АНАЛИЗ СТРУКТУРЫ ПРОЕКТА                              ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const analysis = {
  client: { files: 0, functions: 0, lines: 0 },
  server: { files: 0, functions: 0, lines: 0 },
  shared: { files: 0, functions: 0, lines: 0 },
  tests: { files: 0, functions: 0, lines: 0 },
  web: { files: 0, functions: 0, lines: 0 }
};

function analyzeDirectory(dir, category) {
  const dirPath = path.join(__dirname, 'table', dir);
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.gs'));
  
  analysis[category].files = files.length;
  
  files.forEach(file => {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
    const functions = (content.match(/function\s+\w+/g) || []).length;
    const lines = content.split('\n').length;
    
    analysis[category].functions += functions;
    analysis[category].lines += lines;
  });
}

analyzeDirectory('client', 'client');
analyzeDirectory('server', 'server');
analyzeDirectory('shared', 'shared');
analyzeDirectory('tests', 'tests');
analyzeDirectory('web', 'web');

console.log('📂 CLIENT:');
console.log('   Файлов:', analysis.client.files);
console.log('   Функций:', analysis.client.functions);
console.log('   Строк кода:', analysis.client.lines);
console.log('');

console.log('📂 SERVER:');
console.log('   Файлов:', analysis.server.files);
console.log('   Функций:', analysis.server.functions);
console.log('   Строк кода:', analysis.server.lines);
console.log('');

console.log('📂 SHARED:');
console.log('   Файлов:', analysis.shared.files);
console.log('   Функций:', analysis.shared.functions);
console.log('   Строк кода:', analysis.shared.lines);
console.log('');

console.log('📂 TESTS:');
console.log('   Файлов:', analysis.tests.files);
console.log('   Функций:', analysis.tests.functions);
console.log('   Строк кода:', analysis.tests.lines);
console.log('');

console.log('📂 WEB:');
console.log('   Файлов:', analysis.web.files);
console.log('   Функций:', analysis.web.functions);
console.log('   Строк кода:', analysis.web.lines);
console.log('');

const total = {
  files: analysis.client.files + analysis.server.files + analysis.shared.files + analysis.tests.files + analysis.web.files,
  functions: analysis.client.functions + analysis.server.functions + analysis.shared.functions + analysis.tests.functions + analysis.web.functions,
  lines: analysis.client.lines + analysis.server.lines + analysis.shared.lines + analysis.tests.lines + analysis.web.lines
};

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  ВСЕГО                                                 ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('Файлов:', total.files);
console.log('Функций:', total.functions);
console.log('Строк кода:', total.lines);
console.log('');

// Сохраняем отчёт
if (!fs.existsSync('test-results')) {
  fs.mkdirSync('test-results');
}
fs.writeFileSync('test-results/structure-analysis.json', JSON.stringify({ analysis, total }, null, 2));

console.log('✅ Анализ структуры завершён!\n');
