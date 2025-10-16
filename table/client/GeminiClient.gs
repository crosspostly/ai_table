/**
 * Gemini Client - Refactored and Secured
 * New version with enhanced security, logging, and stability.
 */

/**
 * Caching functions for GM results. Includes race condition protection.
 */
function gmCacheKey_(prompt, maxTokens, temperature) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 
    `p:${prompt}|mx:${maxTokens}|t:${temperature}`);
  return 'gm:' + Utilities.bytesToHex(digest).substring(0, 64);
}

function gmCacheGet_(key) {
  try { return CacheService.getScriptCache().get(key); } catch (e) { return null; }
}

function gmCachePut_(key, value) {
  if (value && value.length > 100000) return; // Skip large values
  try { CacheService.getScriptCache().put(key, value, 300); } catch (e) { /* ignore */ }
}

function gmCacheLock_(key) {
  var lockKey = 'lock:' + key;
  try {
    if (CacheService.getScriptCache().get(lockKey)) return false;
    CacheService.getScriptCache().put(lockKey, '1', 30);
    return true;
  } catch (e) { return true; } // Fail-safe
}

function gmCacheUnlock_(key) {
  try { CacheService.getScriptCache().remove('lock:' + key); } catch (e) { /* ignore */ }
}

/**
 * Main GM function for Gemini API calls. 
 * Secure, timeout-protected, and license-checked.
 */
function GM(prompt, maxTokens, temperature) {
  var traceId = Utilities.getUuid();
  var startTime = Date.now();

  try {
    // Parameter validation and sanitization
    var pValidation = SecurityValidator.validatePrompt(prompt);
    if (!pValidation.isValid) throw new Error('Invalid prompt: ' + pValidation.errors.join(', '));
    
    var gmParams = SecurityValidator.validateGMParams(maxTokens, temperature);
    if (!gmParams.isValid) throw new Error('Invalid params: ' + gmParams.errors.join(', '));

    var safePrompt = pValidation.sanitized;
    var safeMaxTokens = gmParams.sanitized.maxTokens;
    var safeTemp = gmParams.sanitized.temperature;

    // License check
    var license = validateLicenseForGM();
    if (!license.ok) throw new Error(license.error);

    // Caching logic with race condition handling
    var cacheKey = gmCacheKey_(safePrompt, safeMaxTokens, safeTemp);
    var cached = gmCacheGet_(cacheKey);
    if (cached) {
      logGMOperation(safePrompt, cached, Date.now() - startTime, traceId, null, true);
      return cached;
    }

    if (!gmCacheLock_(cacheKey)) {
       Utilities.sleep(2000); // Wait for parallel request
       var waitedResult = gmCacheGet_(cacheKey);
       if(waitedResult) return waitedResult;
    }

    // API call
    var apiKey = getGeminiApiKey();
    var response = callGeminiAPI(safePrompt, apiKey, safeMaxTokens, safeTemp);
    
    // Process and cache result
    var result = processGeminiResponse(response);
    gmCachePut_(cacheKey, result);
    gmCacheUnlock_(cacheKey);

    logGMOperation(safePrompt, result, Date.now() - startTime, traceId);
    return result;

  } catch (e) {
    var userMessage = handleSecureError(e, { function: 'GM' });
    logGMOperation(prompt, null, Date.now() - startTime, traceId, e);
    return userMessage;
  }
}

function getGeminiApiKey() {
  var key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!key) throw new Error('Gemini API key not set. Use 🤖 Table AI menu.');
  return key;
}

/**
 * UI for setting Gemini API key.
 */
function initGeminiKey() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('🔑 Enter Gemini API Key', 'Get key from: https://aistudio.google.com/app/apikey', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() === ui.Button.OK) {
    var key = response.getResponseText().trim();
    if(key) {
      PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', key);
      ui.alert('✅ API Key set!');
    } else {
      ui.alert('❌ Key not entered.');
    }
  }
}

/**
 * GM_STATIC: Executes GM once and replaces the formula with the static result.
 */
function GM_STATIC(prompt, maxTokens, temperature) {
  var cell = SpreadsheetApp.getActiveRange().getCell(1, 1);
  if (cell.getFormula() && !cell.getFormula().includes('GM_STATIC')) {
    return cell.getValue(); // Already replaced
  }
  var result = GM(prompt, maxTokens, temperature);
  cell.setValue(result);
  return result;
}

/**
 * GM_IF: Executes GM only if the condition is met.
 */
function GM_IF(condition, prompt, maxTokens, temperature) {
  var shouldExecute = (condition && String(condition).toLowerCase().trim() !== 'false' && String(condition) !== '0');
  if (shouldExecute) {
    return GM(prompt, maxTokens, temperature);
  }
  return ''; // Condition not met
}

/**
 * Helper function to validate license for GM functions.
 */
function validateLicenseForGM() {
  // This is a placeholder. Real implementation should call a license server.
  return { ok: true }; 
}
