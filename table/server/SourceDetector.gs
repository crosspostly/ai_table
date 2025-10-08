/**
 * Source Detection Service
 * Extracts and classifies data sources from cell content
 */

/**
 * Extract sources from cell data
 */
function extractSources(cellData, cellMeta) {
  var sources = [];
  
  // Rich text URL
  if (cellMeta && cellMeta.richTextUrl) {
    var normalized = normalizeUrl(cellMeta.richTextUrl);
    if (normalized) {
      sources.push(classifySource(normalized));
    }
  }
  
  // Formula URLs
  if (cellMeta && cellMeta.formula) {
    var urlFromFormula = extractUrlFromFormula(cellMeta.formula);
    if (urlFromFormula) {
      var normalized = normalizeUrl(urlFromFormula);
      if (normalized) {
        sources.push(classifySource(normalized));
      }
    }
  }
  
  // URLs in text
  var textUrls = extractUrlsFromText(cellData || '');
  textUrls.forEach(function(url) {
    var normalized = normalizeUrl(url);
    if (normalized) {
      sources.push(classifySource(normalized));
    }
  });
  
  return deduplicateSources(sources);
}

/**
 * Normalize URL
 */
function normalizeUrl(url) {
  try {
    var cleaned = String(url || '').trim();
    if (!cleaned) return '';
    
    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, ' ').replace(/^<+|>+$/g, '');
    
    // Add protocol if needed
    if (/^https?:\/\//i.test(cleaned)) return cleaned;
    if (/^www\./i.test(cleaned)) return 'https://' + cleaned;
    if (/^(vk\.com|drive\.google\.com)/i.test(cleaned)) {
      return 'https://' + cleaned;
    }
    
    return cleaned;
  } catch (e) {
    return String(url || '');
  }
}

/**
 * Classify source by URL
 */
function classifySource(url) {
  var u = String(url);
  
  if (/vk\.com/i.test(u)) return {type: 'vk', url: u};
  if (/drive\.google\.com/i.test(u)) return {type: 'drive', url: u};
  
  return {type: 'url', url: u};
}

/**
 * Extract URL from formula
 */
function extractUrlFromFormula(formula) {
  if (!formula) return '';
  
  var f = String(formula).trim();
  
  var imageMatch = f.match(/^=\s*IMAGE\s*\(\s*["']([^"']+)["']/i);
  if (imageMatch) return imageMatch[1];
  
  var linkMatch = f.match(/^=\s*HYPERLINK\s*\(\s*["']([^"']+)["']/i);
  if (linkMatch) return linkMatch[1];
  
  return '';
}

/**
 * Extract URLs from text
 */
function extractUrlsFromText(text) {
  var urls = [];
  
  try {
    var httpMatches = text.match(/https?:\/\/[^\s<>)]+/g) || [];
    urls = urls.concat(httpMatches);
  } catch (e) {
    // Ignore
  }
  
  return urls;
}

/**
 * Deduplicate sources
 */
function deduplicateSources(sources) {
  var seen = {};
  return sources.filter(function(source) {
    var key = source.type + ':' + (source.url || '');
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}
