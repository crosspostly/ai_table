#!/usr/bin/env node

/**
 * Создание всех test runners для локального тестирования
 */

const fs = require('fs');
const path = require('path');

console.log('🛠️  Создание test runners...\n');

// 1. run-syntax-check.js
const syntaxCheckContent = `#!/usr/bin/env node

/**
 * Проверка синтаксиса всех .gs файлов
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

console.log('\\n╔════════════════════════════════════════════════════════╗');
console.log('║  ПРОВЕРКА СИНТАКСИСА ВСЕХ .gs ФАЙЛОВ                  ║');
console.log('╚════════════════════════════════════════════════════════╝\\n');

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

console.log('📂 Найдено файлов:', files.length, '\\n');

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
      checks.push(\`Несбалансированные фигурные скобки: { (\${openBraces}) vs } (\${closeBraces})\`);
    }
    
    const openParens = (content.match(/\\(/g) || []).length;
    const closeParens = (content.match(/\\)/g) || []).length;
    if (openParens !== closeParens) {
      checks.push(\`Несбалансированные круглые скобки: ( (\${openParens}) vs ) (\${closeParens})\`);
    }
    
    // Проверка function declarations
    const functionMatches = content.match(/function\\s+\\w+/g);
    const functionCount = functionMatches ? functionMatches.length : 0;
    
    if (checks.length === 0) {
      results.passed++;
      console.log(\`✅ (\${index + 1}/\${files.length}) \${file} - Функций: \${functionCount}\`);
      results.details.push({ file, status: 'OK', functions: functionCount });
    } else {
      results.failed++;
      console.log(\`❌ (\${index + 1}/\${files.length}) \${file}\`);
      checks.forEach(c => console.log(\`   └─ \${c}\`));
      results.details.push({ file, status: 'FAILED', errors: checks });
    }
    
  } catch (e) {
    results.failed++;
    console.log(\`❌ (\${index + 1}/\${files.length}) \${file} - Ошибка чтения: \${e.message}\`);
    results.details.push({ file, status: 'ERROR', error: e.message });
  }
});

results.total = files.length;

console.log('\\n╔════════════════════════════════════════════════════════╗');
console.log('║  РЕЗУЛЬТАТЫ ПРОВЕРКИ СИНТАКСИСА                        ║');
console.log('╚════════════════════════════════════════════════════════╝\\n');
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
  console.log('🎉 ВСЕ ФАЙЛЫ ПРОШЛИ ПРОВЕРКУ СИНТАКСИСА!\\n');
  process.exit(0);
} else {
  console.log('⚠️  ЕСТЬ ОШИБКИ СИНТАКСИСА!\\n');
  process.exit(1);
}
`;

// 2. run-structure-analysis.js
const structureAnalysisContent = `#!/usr/bin/env node

/**
 * Анализ структуры проекта
 */

const fs = require('fs');
const path = require('path');

console.log('\\n╔════════════════════════════════════════════════════════╗');
console.log('║  АНАЛИЗ СТРУКТУРЫ ПРОЕКТА                              ║');
console.log('╚════════════════════════════════════════════════════════╝\\n');

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
    const functions = (content.match(/function\\s+\\w+/g) || []).length;
    const lines = content.split('\\n').length;
    
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

console.log('✅ Анализ структуры завершён!\\n');
`;

// 3. run-all-local-tests.js
const allLocalTestsContent = `#!/usr/bin/env node

/**
 * Запуск всех локальных тестов
 */

const { execSync } = require('child_process');

console.log('');
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  ЗАПУСК ВСЕХ ЛОКАЛЬНЫХ ТЕСТОВ                          ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');

const tests = [
  { name: 'Анализ структуры', script: 'run-structure-analysis.js' },
  { name: 'Проверка синтаксиса', script: 'run-syntax-check.js' },
  { name: 'Мок-тесты исправлений', script: 'run-mock-tests.js' }
];

const results = [];

tests.forEach((test, index) => {
  console.log(\`\\n[\${index + 1}/\${tests.length}] Запуск: \${test.name}...\\n\`);
  console.log('═══════════════════════════════════════════════════════════');
  
  try {
    execSync(\`node \${test.script}\`, { stdio: 'inherit' });
    results.push({ test: test.name, status: 'PASSED' });
  } catch (e) {
    results.push({ test: test.name, status: 'FAILED' });
  }
  
  console.log('═══════════════════════════════════════════════════════════');
});

console.log('');
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  ИТОГОВАЯ СВОДКА                                       ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');

results.forEach(r => {
  const icon = r.status === 'PASSED' ? '✅' : '❌';
  console.log(\`\${icon} \${r.test}: \${r.status}\`);
});

const passed = results.filter(r => r.status === 'PASSED').length;
const failed = results.filter(r => r.status === 'FAILED').length;

console.log('');
console.log(\`Всего: \${results.length} | Прошли: \${passed} | Провалены: \${failed}\`);
console.log('');

if (failed === 0) {
  console.log('🎉🎉🎉 ВСЕ ЛОКАЛЬНЫЕ ТЕСТЫ ПРОШЛИ! 🎉🎉🎉');
  console.log('');
  process.exit(0);
} else {
  console.log('⚠️⚠️⚠️ ЕСТЬ ПРОВАЛЕННЫЕ ТЕСТЫ! ⚠️⚠️⚠️');
  console.log('');
  process.exit(1);
}
`;

// Записываем файлы
const runners = [
  { name: 'run-syntax-check.js', content: syntaxCheckContent },
  { name: 'run-structure-analysis.js', content: structureAnalysisContent },
  { name: 'run-all-local-tests.js', content: allLocalTestsContent }
];

runners.forEach(runner => {
  fs.writeFileSync(runner.name, runner.content, { mode: 0o755 });
  console.log('✅ Создан:', runner.name);
});

console.log('\\n🎉 Все test runners созданы!\\n');
console.log('Запустите:');
console.log('  node run-all-local-tests.js');
console.log('');
