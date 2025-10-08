const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all .gs files
const findGsFiles = (dir) => {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findGsFiles(fullPath));
    } else if (item.name.endsWith('.gs')) {
      files.push(fullPath);
    }
  }
  
  return files;
};

const checkSyntax = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for invalid characters
    const invalidChars = content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g);
    if (invalidChars) {
      console.log(`❌ ${filePath}: contains invalid control characters`);
      return false;
    }
    
    // Check for BOM
    if (content.charCodeAt(0) === 0xFEFF) {
      console.log(`⚠️  ${filePath}: has BOM`);
    }
    
    // Basic JavaScript syntax check (won't catch Apps Script specific issues)
    try {
      new Function(content);
      console.log(`✅ ${filePath}: OK`);
      return true;
    } catch (e) {
      console.log(`❌ ${filePath}: ${e.message}`);
      return false;
    }
  } catch (e) {
    console.log(`❌ ${filePath}: Failed to read - ${e.message}`);
    return false;
  }
};

const files = findGsFiles('table');
console.log(`Found ${files.length} .gs files\n`);

let errors = 0;
for (const file of files) {
  if (!checkSyntax(file)) {
    errors++;
  }
}

console.log(`\n${errors} files with errors`);
process.exit(errors > 0 ? 1 : 0);
