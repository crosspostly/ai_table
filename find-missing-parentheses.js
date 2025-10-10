#!/usr/bin/env node
/**
 * НАЙТИ НЕДОСТАЮЩИЕ СКОБКИ
 */

const fs = require('fs');

const files = [
  'table/client/GeminiClient.gs',
  'table/client/ClientUtilities.gs',
  'table/server/SmartChainService.gs',
  'table/client/OcrHelpers.gs',
  'table/server/SourceDetector.gs',
  'table/shared/Utils.gs',
  'table/client/ComprehensiveTestSuite.gs'
];

files.forEach(file => {
  console.log(`\n📁 Checking ${file}...`);
  
  if (!fs.existsSync(file)) {
    console.log(`❌ File not found`);
    return;
  }
  
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  let openCount = 0;
  let closeCount = 0;
  let stack = [];
  let errorLines = [];
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    let lineOpen = 0;
    let lineClose = 0;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '(') {
        openCount++;
        lineOpen++;
        stack.push({line: lineNum, col: i+1});
      } else if (char === ')') {
        closeCount++;
        lineClose++;
        if (stack.length > 0) {
          stack.pop();
        } else {
          errorLines.push({line: lineNum, type: 'extra_close', text: line.trim()});
        }
      }
    }
    
    if (lineOpen !== lineClose && (lineOpen > 0 || lineClose > 0)) {
      const diff = lineOpen - lineClose;
      if (Math.abs(diff) > 1) {
        console.log(`  ⚠️  Line ${lineNum}: ${diff > 0 ? '+' + diff : diff} parentheses`);
        console.log(`      ${line.trim().substring(0, 80)}`);
      }
    }
  });
  
  console.log(`\n📊 Total: ${openCount} ( vs ${closeCount} ) = ${openCount - closeCount}`);
  
  if (stack.length > 0) {
    console.log(`\n❌ ${stack.length} unclosed parentheses:`);
    stack.slice(-5).forEach(item => {
      console.log(`   Line ${item.line}, col ${item.col}`);
      console.log(`   ${lines[item.line - 1].trim().substring(0, 80)}`);
    });
  }
  
  if (errorLines.length > 0) {
    console.log(`\n❌ ${errorLines.length} extra closing parentheses:`);
    errorLines.slice(0, 5).forEach(item => {
      console.log(`   Line ${item.line}: ${item.text.substring(0, 80)}`);
    });
  }
});
