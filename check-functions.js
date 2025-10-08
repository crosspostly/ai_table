#!/usr/bin/env node

/**
 * Function Reference Checker for Google Apps Script
 * Verifies that all menu items reference existing functions
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 FUNCTION REFERENCE CHECKER\n');
console.log('='.repeat(60));

// Extract function names from Menu.gs
const menuFile = path.join(__dirname, 'table/client/Menu.gs');
const menuContent = fs.readFileSync(menuFile, 'utf8');

// Find all .addItem() calls
const itemPattern = /\.addItem\('([^']+)',\s*'([^']+)'\)/g;
const menuItems = [];
let match;

while ((match = itemPattern.exec(menuContent)) !== null) {
  menuItems.push({
    label: match[1],
    function: match[2]
  });
}

console.log(`\n📋 Found ${menuItems.length} menu items\n`);

// Find all function declarations in client files
const clientDir = path.join(__dirname, 'table/client');
const clientFiles = fs.readdirSync(clientDir)
  .filter(f => f.endsWith('.gs'))
  .map(f => path.join(clientDir, f));

const webDir = path.join(__dirname, 'table/web');
if (fs.existsSync(webDir)) {
  const webFiles = fs.readdirSync(webDir)
    .filter(f => f.endsWith('.gs'))
    .map(f => path.join(webDir, f));
  clientFiles.push(...webFiles);
}

const declaredFunctions = new Set();

clientFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Match function declarations: function name() { or function name(){
  const funcPattern = /^\s*function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/gm;
  let funcMatch;
  
  while ((funcMatch = funcPattern.exec(content)) !== null) {
    declaredFunctions.add(funcMatch[1]);
  }
});

console.log(`✅ Found ${declaredFunctions.size} declared functions in client files\n`);
console.log('='.repeat(60));
console.log('\n📊 VERIFICATION RESULTS:\n');

let missingCount = 0;
const missing = [];

menuItems.forEach(item => {
  const exists = declaredFunctions.has(item.function);
  
  if (exists) {
    console.log(`✅ ${item.label.padEnd(40)} → ${item.function}()`);
  } else {
    console.log(`❌ ${item.label.padEnd(40)} → ${item.function}() [MISSING]`);
    missingCount++;
    missing.push(item);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📈 SUMMARY:`);
console.log(`   ✅ Valid references: ${menuItems.length - missingCount}`);
console.log(`   ❌ Missing functions: ${missingCount}`);
console.log(`   📁 Total menu items: ${menuItems.length}`);

if (missingCount > 0) {
  console.log(`\n❌ MISSING FUNCTIONS:\n`);
  missing.forEach(item => {
    console.log(`   Function: ${item.function}()`);
    console.log(`   Menu label: ${item.label}\n`);
  });
  process.exit(1);
} else {
  console.log(`\n✅ ALL MENU ITEMS REFERENCE EXISTING FUNCTIONS!\n`);
  
  // Additional check: List declared but unused functions
  const usedFunctions = new Set(menuItems.map(i => i.function));
  usedFunctions.add('onOpen'); // Always used
  usedFunctions.add('onEdit'); // Trigger function
  usedFunctions.add('doGet'); // Web app
  usedFunctions.add('doPost'); // Web app
  
  const unused = Array.from(declaredFunctions).filter(f => !usedFunctions.has(f));
  
  if (unused.length > 0) {
    console.log(`ℹ️  Declared but not in menu (${unused.length} functions):`);
    unused.slice(0, 10).forEach(f => console.log(`   - ${f}()`));
    if (unused.length > 10) {
      console.log(`   ... and ${unused.length - 10} more`);
    }
    console.log();
  }
  
  process.exit(0);
}
