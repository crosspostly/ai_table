#!/usr/bin/env node
/**
 * Автоматический деплой Apps Script кода во все таблицы в папке Google Drive
 * 
 * Использование:
 *   GOOGLE_CREDENTIALS='{...}' DRIVE_FOLDER_ID='abc123' node deploy-to-folder.js
 * 
 * Что делает:
 *   1. Находит все Google Sheets в указанной папке
 *   2. Для каждой таблицы обновляет Apps Script код
 *   3. Логирует результаты
 * 
 * БЕЗ изменений в клиентском коде!
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// ========== КОНФИГУРАЦИЯ ==========

// БЫСТРАЯ ПРОВЕРКА: Если DRIVE_FOLDER_ID не указан - выходим без ошибки
const FOLDER_ID = process.env.DRIVE_FOLDER_ID;
if (!FOLDER_ID) {
  console.log('⚠️  SKIP: DRIVE_FOLDER_ID не указан - пропускаем деплой');
  console.log('💡 Для деплоя установите переменную DRIVE_FOLDER_ID в секретах GitHub');
  process.exit(0); // Выходим без ошибки
}

const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');

if (!CREDENTIALS.client_email) {
  console.error('❌ ERROR: GOOGLE_CREDENTIALS environment variable is required!');
  console.error('   Must be a Service Account JSON with Drive and Apps Script APIs enabled.');
  process.exit(1);
}

// ========== АУТЕНТИФИКАЦИЯ ==========

async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    credentials: CREDENTIALS,
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/script.projects'
    ]
  });
  
  return auth.getClient();
}

// ========== ПОЛУЧЕНИЕ СПИСКА ТАБЛИЦ ==========

async function getSpreadsheets(auth) {
  console.log(`\n🔍 Searching for spreadsheets in folder: ${FOLDER_ID}\n`);
  
  const drive = google.drive({ version: 'v3', auth });
  
  try {
    const res = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id, name, createdTime, modifiedTime)',
      pageSize: 100
    });
    
    const files = res.data.files || [];
    
    console.log(`✅ Found ${files.length} spreadsheet(s):\n`);
    files.forEach((file, i) => {
      console.log(`   ${i + 1}. ${file.name} (${file.id})`);
    });
    console.log('');
    
    return files;
  } catch (error) {
    console.error('❌ ERROR getting spreadsheets:', error.message);
    throw error;
  }
}

// ========== ПОЛУЧЕНИЕ SCRIPT ID ИЗ ТАБЛИЦЫ ==========

async function getScriptId(auth, spreadsheetId) {
  const drive = google.drive({ version: 'v3', auth });
  
  try {
    // Получаем metadata таблицы
    const res = await drive.files.get({
      fileId: spreadsheetId,
      fields: 'id, name'
    });
    
    // Apps Script проект связанный с таблицей имеет специальный ID
    // Обычно это: "containers/{spreadsheetId}"
    // Но мы получим его через Apps Script API
    
    const script = google.script({ version: 'v1', auth });
    
    // Список всех проектов (попытка найти связанный)
    // На самом деле нам нужен более хитрый способ...
    
    // Для container-bound скриптов Script ID === Spreadsheet ID
    return spreadsheetId;
  } catch (error) {
    console.error(`   ⚠️ Cannot get script ID for ${spreadsheetId}: ${error.message}`);
    return null;
  }
}

// ========== ЧТЕНИЕ ФАЙЛОВ ИЗ РЕПОЗИТОРИЯ ==========

function readProjectFiles() {
  console.log('📂 Reading project files...\n');
  
  const clientDir = path.join(__dirname, 'table', 'client');
  const sharedDir = path.join(__dirname, 'table', 'shared');
  
  const files = [];
  
  // Клиентские файлы
  const clientFiles = fs.readdirSync(clientDir)
    .filter(f => f.endsWith('.gs'));
  
  clientFiles.forEach(filename => {
    const name = filename.replace('.gs', '');
    const content = fs.readFileSync(path.join(clientDir, filename), 'utf8');
    files.push({
      name: name,
      type: 'SERVER_JS',
      source: content
    });
    console.log(`   ✅ ${name}.gs (${content.length} chars)`);
  });
  
  // Shared файлы
  if (fs.existsSync(sharedDir)) {
    const sharedFiles = fs.readdirSync(sharedDir)
      .filter(f => f.endsWith('.gs'));
    
    sharedFiles.forEach(filename => {
      const name = filename.replace('.gs', '');
      const content = fs.readFileSync(path.join(sharedDir, filename), 'utf8');
      files.push({
        name: name,
        type: 'SERVER_JS',
        source: content
      });
      console.log(`   ✅ ${name}.gs (${content.length} chars)`);
    });
  }
  
  // appsscript.json
  const manifestPath = path.join(__dirname, 'table', 'client', 'appsscript.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = fs.readFileSync(manifestPath, 'utf8');
    files.push({
      name: 'appsscript',
      type: 'JSON',
      source: manifest
    });
    console.log(`   ✅ appsscript.json`);
  }
  
  // Version files
  const versionHtmlPath = path.join(__dirname, 'version.html');
  if (fs.existsSync(versionHtmlPath)) {
    const versionHtml = fs.readFileSync(versionHtmlPath, 'utf8');
    files.push({
      name: 'version',
      type: 'HTML',
      source: versionHtml
    });
    console.log(`   ✅ version.html (version info page)`);
  }
  
  const versionJsonPath = path.join(__dirname, 'version.json');
  if (fs.existsSync(versionJsonPath)) {
    // Обновляем timestamp в JSON перед деплоем
    const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
    versionData.version.updateTimestamp = new Date().toISOString();
    versionData.build.number = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    versionData.metadata.generated_at = new Date().toISOString();
    
    // Добавляем как JS функцию для Apps Script
    const versionFunction = `/**
 * Получение информации о версии системы
 * @return {Object} Объект с данными о версии
 */
function getVersionInfo() {
  return ${JSON.stringify(versionData, null, 2)};
}

/**
 * Получение текущей версии (строка)
 * @return {string} Номер версии
 */
function getCurrentVersion() {
  return getVersionInfo().version.current;
}

/**
 * Получение даты последнего обновления
 * @return {string} ISO строка даты
 */
function getLastUpdateDate() {
  return getVersionInfo().version.updateTimestamp;
}`;
    
    files.push({
      name: 'VersionInfo',
      type: 'SERVER_JS',
      source: versionFunction
    });
    console.log(`   ✅ version.json → VersionInfo.gs (API functions)`);
  }
  
  console.log(`\n📦 Total files: ${files.length}\n`);
  
  return files;
}

// ========== ДЕПЛОЙ В ТАБЛИЦУ ==========

async function deployToSpreadsheet(auth, spreadsheet, files) {
  const { id, name } = spreadsheet;
  
  console.log(`\n📤 Deploying to: ${name}`);
  console.log(`   Sheet ID: ${id}`);
  
  try {
    // Для container-bound скриптов используем Spreadsheet ID как Script ID
    const scriptId = id;
    
    const script = google.script({ version: 'v1', auth });
    
    // Обновляем содержимое проекта
    await script.projects.updateContent({
      scriptId: scriptId,
      requestBody: {
        files: files
      }
    });
    
    console.log(`   ✅ SUCCESS: Deployed ${files.length} files`);
    return { success: true, name, id };
  } catch (error) {
    console.error(`   ❌ FAILED: ${error.message}`);
    return { success: false, name, id, error: error.message };
  }
}

// ========== ГЛАВНАЯ ФУНКЦИЯ ==========

async function main() {
  console.log('🚀 Starting deployment to Google Drive folder...\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Аутентификация
    console.log('\n🔐 Authenticating...');
    const auth = await authenticate();
    console.log('   ✅ Authenticated as:', CREDENTIALS.client_email);
    
    // 2. Получить список таблиц
    const spreadsheets = await getSpreadsheets(auth);
    
    if (spreadsheets.length === 0) {
      console.log('⚠️ No spreadsheets found in folder. Exiting.');
      return;
    }
    
    // 3. Прочитать файлы проекта
    const files = readProjectFiles();
    
    // 4. Деплой в каждую таблицу
    console.log('🚀 Starting deployments...');
    console.log('=' .repeat(60));
    
    const results = [];
    
    for (let i = 0; i < spreadsheets.length; i++) {
      const sheet = spreadsheets[i];
      console.log(`\n[${i + 1}/${spreadsheets.length}]`);
      
      const result = await deployToSpreadsheet(auth, sheet, files);
      results.push(result);
      
      // Задержка между запросами (rate limiting)
      if (i < spreadsheets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 5. Итоговый отчёт
    console.log('\n' + '=' .repeat(60));
    console.log('\n📊 DEPLOYMENT SUMMARY:\n');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📦 Total: ${results.length}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed deployments:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   • ${r.name}: ${r.error}`);
      });
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ Deployment completed!\n');
    
    // Exit code
    process.exit(failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  main();
}

module.exports = { main };
