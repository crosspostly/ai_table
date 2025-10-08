#!/usr/bin/env node

/**
 * 🚨 EMERGENCY SCRIPT: Remove server files from client project
 * 
 * This script connects to Google Apps Script API and DELETES
 * all server/* files from the CLIENT project.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLIENT_SCRIPT_ID = '1DdlYfvo0EfEA1O1nb5DRI0o-WJoIivtfIPNSE1C1bt3IvvWC91sGE6Xs';

// Server files that MUST be deleted from client
const SERVER_FILES_TO_DELETE = [
  'server/RulesEngine',
  'server/ServerEndpoints',
  'server/SimpleLicenseService',
  'server/SmartChainService',
  'server/SocialImportService',
  'server/SourceDetector',
  'server/TableLicenseService',
  'server/TelegramImportService',
  'server/TriggerManager',
  'server/ValidationService',
  'server/VkImportService',
  // Also check for these server files without prefix
  'RulesEngine',
  'ServerEndpoints',
  'SimpleLicenseService',
  'SmartChainService',
  'SocialImportService',
  'SourceDetector',
  'TableLicenseService',
  'TelegramImportService',
  'TriggerManager',
  'ValidationService',
  'VkImportService'
];

// Client files that MUST be kept
const CLIENT_FILES_WHITELIST = [
  'appsscript',
  'ChatMode',
  'ClientUtilities',
  'GeminiClient',
  'Menu',
  'SmartPromptProcessor',
  'SocialImportClient',
  'ThinClient',
  'Constants',
  'LoggingService',
  'Utils',
  'WebInterface'
];

console.log('🚨 EMERGENCY CLEANUP: Removing server files from CLIENT project\n');
console.log('='.repeat(60));

// Check if clasp is installed
try {
  execSync('clasp --version', { stdio: 'ignore' });
  console.log('✅ clasp is installed\n');
} catch (e) {
  console.log('❌ clasp is not installed!');
  console.log('\nInstall clasp first:');
  console.log('  npm install -g @google/clasp\n');
  process.exit(1);
}

// Check if logged in
try {
  const loginStatus = execSync('clasp login --status', { encoding: 'utf8' });
  console.log('✅ clasp is authenticated\n');
} catch (e) {
  console.log('❌ Not logged in to clasp!');
  console.log('\nLogin first:');
  console.log('  clasp login\n');
  process.exit(1);
}

console.log(`📋 Client Script ID: ${CLIENT_SCRIPT_ID}\n`);
console.log('🔍 Step 1: Cloning current project...\n');

// Create temp directory
const tempDir = path.join(__dirname, '.temp-client-clean');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

try {
  // Clone the project
  execSync(`clasp clone ${CLIENT_SCRIPT_ID}`, {
    cwd: tempDir,
    stdio: 'inherit'
  });

  console.log('\n✅ Project cloned\n');
  console.log('📋 Step 2: Analyzing files...\n');

  // List all files
  const files = fs.readdirSync(tempDir)
    .filter(f => f.endsWith('.gs') || f === 'appsscript.json');

  console.log(`Found ${files.length} files:\n`);

  const filesToDelete = [];
  const filesToKeep = [];

  files.forEach(file => {
    const basename = file.replace(/\.(gs|json)$/, '');
    
    // Check if it's a server file
    const isServerFile = SERVER_FILES_TO_DELETE.some(sf => 
      basename === sf || basename.includes('server/') || basename.includes('Server')
    );
    
    // Check if it's a whitelisted client file
    const isClientFile = CLIENT_FILES_WHITELIST.some(cf => basename === cf);
    
    if (isServerFile && !isClientFile) {
      filesToDelete.push(file);
      console.log(`  ❌ DELETE: ${file} [SERVER FILE]`);
    } else {
      filesToKeep.push(file);
      console.log(`  ✅ KEEP:   ${file}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 SUMMARY:`);
  console.log(`   ❌ Files to DELETE: ${filesToDelete.length}`);
  console.log(`   ✅ Files to KEEP:   ${filesToKeep.length}`);

  if (filesToDelete.length === 0) {
    console.log('\n✅ No server files found in client project!\n');
    console.log('Client project is clean.\n');
    
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
    process.exit(0);
  }

  console.log('\n⚠️  WARNING: This will DELETE the following files:\n');
  filesToDelete.forEach(f => console.log(`     - ${f}`));

  console.log('\n🚨 This action CANNOT be undone!\n');
  console.log('Press Ctrl+C to CANCEL or wait 5 seconds to proceed...\n');

  // Wait 5 seconds
  for (let i = 5; i > 0; i--) {
    process.stdout.write(`   ${i}... `);
    execSync('sleep 1');
  }
  console.log('\n');

  console.log('🗑️  Step 3: Deleting server files...\n');

  // Delete server files
  filesToDelete.forEach(file => {
    const filePath = path.join(tempDir, file);
    fs.unlinkSync(filePath);
    console.log(`  ✅ Deleted: ${file}`);
  });

  console.log('\n📤 Step 4: Pushing changes to Google Apps Script...\n');

  // Push changes
  execSync('clasp push -f', {
    cwd: tempDir,
    stdio: 'inherit'
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ SUCCESS! Server files removed from client project!\n');
  console.log('🔍 Verify at:');
  console.log(`   https://script.google.com/home/projects/${CLIENT_SCRIPT_ID}/edit\n`);

  // Cleanup
  console.log('🧹 Cleaning up temp directory...\n');
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log('✅ Done!\n');
  process.exit(0);

} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  
  // Cleanup on error
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  process.exit(1);
}
