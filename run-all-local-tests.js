#!/usr/bin/env node

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
  console.log(`\n[${index + 1}/${tests.length}] Запуск: ${test.name}...\n`);
  console.log('═══════════════════════════════════════════════════════════');
  
  try {
    execSync(`node ${test.script}`, { stdio: 'inherit' });
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
  console.log(`${icon} ${r.test}: ${r.status}`);
});

const passed = results.filter(r => r.status === 'PASSED').length;
const failed = results.filter(r => r.status === 'FAILED').length;

console.log('');
console.log(`Всего: ${results.length} | Прошли: ${passed} | Провалены: ${failed}`);
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
