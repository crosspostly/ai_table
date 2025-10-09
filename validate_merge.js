#!/usr/bin/env node

/**
 * Validation script after merge conflict resolution
 */

const fs = require('fs');
const path = require('path');

function validateMerge() {
  console.log('🔍 VALIDATING MERGE RESOLUTION...\n');
  
  const issues = [];
  
  function checkFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for unresolved merge conflict markers (ignore comments)
      const lines = content.split('\n');
      let hasRealConflicts = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip comment lines and strings
        if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) {
          continue;
        }
        
        // Check for actual conflict markers
        if (line.startsWith('<<<<<<<') || line.startsWith('=======') || line.startsWith('>>>>>>>')) {
          hasRealConflicts = true;
          break;
        }
      }
      
      if (hasRealConflicts) {
        issues.push(`❌ ${filePath}: Unresolved merge conflict markers found`);
      }
      
      // Check for logger issues in production files
      if (!filePath.includes('/tests/') && !filePath.includes('/archive/')) {
        if (content.includes('logger.') && !content.includes('Logger.log') && !content.includes('// ')) {
          issues.push(`❌ ${filePath}: Found logger. references`);
        }
      }
      
    } catch (error) {
      issues.push(`❌ ${filePath}: Error reading file - ${error.message}`);
    }
  }
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.')) {
        scanDirectory(fullPath);
      } else if (file.endsWith('.gs')) {
        checkFile(fullPath);
      }
    });
  }
  
  scanDirectory('.');
  
  console.log('📊 MERGE VALIDATION RESULTS:\n');
  
  if (issues.length === 0) {
    console.log('✅ MERGE RESOLVED SUCCESSFULLY!');
    console.log('✅ No conflict markers found');
    console.log('✅ No logger issues detected');
    console.log('✅ All files are clean');
    console.log('\n🎉 READY FOR PUSH!');
    return true;
  } else {
    console.log(`❌ Found ${issues.length} issues:`);
    issues.forEach(issue => console.log(`  ${issue}`));
    console.log('\n❌ NEED TO FIX ISSUES BEFORE PUSH!');
    return false;
  }
}

const success = validateMerge();
process.exit(success ? 0 : 1);