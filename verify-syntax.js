#!/usr/bin/env node
/**
 * ТОЧНАЯ ПРОВЕРКА СИНТАКСИСА - парсим как JavaScript
 */

const fs = require('fs');
const vm = require('vm');

const files = [
  'table/client/GeminiClient.gs',
  'table/client/ClientUtilities.gs',
  'table/server/SmartChainService.gs',
  'table/client/OcrHelpers.gs',
  'table/server/SourceDetector.gs',
  'table/shared/Utils.gs',
  'table/client/ComprehensiveTestSuite.gs'
];

console.log('🔍 ПРОВЕРКА СИНТАКСИСА ЧЕРЕЗ NODE.JS VM\n');

files.forEach(file => {
  console.log(`📁 ${file}...`);
  
  if (!fs.existsSync(file)) {
    console.log(`   ❌ Файл не найден\n`);
    return;
  }
  
  const content = fs.readFileSync(file, 'utf8');
  
  try {
    // Пытаемся создать Script объект - это проверит синтаксис
    new vm.Script(content, { filename: file });
    console.log(`   ✅ СИНТАКСИС ПРАВИЛЬНЫЙ\n`);
  } catch (error) {
    console.log(`   ❌ SYNTAX ERROR:`);
    console.log(`   Line: ${error.stack.split(':')[1]}`);
    console.log(`   Error: ${error.message}`);
    console.log('');
  }
});
