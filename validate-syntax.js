#!/usr/bin/env node

/**
 * Syntax validator for Google Apps Script (.gs) files
 * Validates JavaScript syntax without executing code
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Find all .gs files
function findGsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(findGsFiles(filePath));
    } else if (file.endsWith('.gs')) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Validate JavaScript syntax
function validateSyntax(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  try {
    // For Google Apps Script, we need to wrap in a function context
    // and handle const/let declarations properly
    const wrappedContent = `
      (function() {
        ${content}
      })();
    `;
    new Function(wrappedContent);
    return { valid: true, error: null };
  } catch (e) {
    // Some errors are expected for GAS-specific APIs, only report syntax errors
    if (e instanceof SyntaxError) {
      return { valid: false, error: e.message };
    }
    // Reference errors are OK (GAS APIs not defined in Node)
    return { valid: true, error: null };
  }
}

// Main validation
console.log('🔍 SYNTAX VALIDATION FOR GOOGLE APPS SCRIPT FILES\n');
console.log('=' .repeat(60));

const tableDir = path.join(__dirname, 'table');
const files = findGsFiles(tableDir);

console.log(`\nFound ${files.length} .gs files to validate\n`);

let passed = 0;
let failed = 0;
const errors = [];

files.forEach(file => {
  const relativePath = path.relative(__dirname, file);
  const result = validateSyntax(file);
  
  if (result.valid) {
    console.log(`✅ ${relativePath}`);
    passed++;
  } else {
    console.log(`❌ ${relativePath}`);
    console.log(`   Error: ${result.error}`);
    failed++;
    errors.push({ file: relativePath, error: result.error });
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 VALIDATION SUMMARY:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   📁 Total:  ${files.length}`);

if (failed > 0) {
  console.log(`\n❌ SYNTAX ERRORS FOUND:\n`);
  errors.forEach(({ file, error }) => {
    console.log(`   File: ${file}`);
    console.log(`   Error: ${error}\n`);
  });
  process.exit(1);
} else {
  console.log(`\n✅ ALL FILES HAVE VALID SYNTAX!\n`);
  process.exit(0);
}
