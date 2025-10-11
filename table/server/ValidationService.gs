/**
 * Validation Service
 * Input validation and sanitization
 */

/**
 * Validate and sanitize inputs
 */
function validateAndSanitizeInputs(sourceUrl, count, platform) {
  try {
    var cleanSourceUrl = validateSourceUrl(sourceUrl);
    var cleanCount = validateCount(count);
    var cleanPlatform = platform || '';
    
    return {
      isValid: true,
      sourceUrl: cleanSourceUrl,
      count: cleanCount,
      platform: cleanPlatform
    };
  } catch (e) {
    return {
      isValid: false,
      error: e.message,
      sourceUrl: sourceUrl || '',
      count: 10,
      platform: platform || ''
    };
  }
}

/**
 * Validate source URL
 */
function validateSourceUrl(sourceUrl) {
  if (!sourceUrl || typeof sourceUrl !== 'string') {
    throw new Error('URL is required');
  }
  
  var cleanUrl = String(sourceUrl).trim();
  
  if (cleanUrl.length === 0) {
    throw new Error('URL cannot be empty');
  }
  
  if (cleanUrl.length > 2048) {
    throw new Error('URL is too long');
  }
  
  // Check for dangerous protocols
  var lowerUrl = cleanUrl.toLowerCase();
  var dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
  
  for (var i = 0; i < dangerousSchemes.length; i++) {
    if (lowerUrl.startsWith(dangerousSchemes[i])) {
      throw new Error('Dangerous protocol detected');
    }
  }
  
  // Check for HTML/JS injection
  if (cleanUrl.indexOf('<') !== -1 || cleanUrl.indexOf('>') !== -1) {
    throw new Error('URL contains invalid characters');
  }
  
  // Validate if it's a full URL
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    try {
      // Basic URL validation
      if (!cleanUrl.match(/^https?:\/\/[^\s]+$/)) {
        throw new Error('Invalid URL format');
      }
    } catch (e) {
      throw new Error('Invalid URL: ' + e.message);
    }
  }
  
  return cleanUrl;
}

/**
 * Validate count parameter
 */
function validateCount(count) {
  var num = Number(count);
  
  if (isNaN(num) || num < 1) {
    return 10; // default
  }
  
  if (num > 100) {
    return 100; // max
  }
  
  return Math.floor(num);
}
