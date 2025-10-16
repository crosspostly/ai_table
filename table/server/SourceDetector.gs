/**
 * Source Detection Service - Refactored for Stability
 * Extracts and classifies data sources from cell content
 */

/**
 * Extract sources from cell data
 */
function extractSources(cellData, cellMeta) {
  var sources = [];
  
  if (cellMeta && cellMeta.richTextUrl) {
    var normalized = normalizeUrl(cellMeta.richTextUrl);
    if (normalized) sources.push(classifySource(normalized));
  }
  
  if (cellMeta && cellMeta.formula) {
    var urlFromFormula = extractUrlFromFormula(cellMeta.formula);
    if (urlFromFormula) {
      var normalized = normalizeUrl(urlFromFormula);
      if (normalized) sources.push(classifySource(normalized));
    }
  }
  
  var textUrls = extractUrlsFromText(cellData || '');
  textUrls.forEach(function(url) {
    var normalized = normalizeUrl(url);
    if (normalized) sources.push(classifySource(normalized));
  });
  
  return deduplicateSources(sources);
}

/**
 * Normalize URL for classification
 */
function normalizeUrl(url) {
  var cleaned = String(url || '').trim().replace(/<[^>]*>/g, ' ').replace(/^<+|>+$/g, '');
  if (!cleaned) return '';
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  if (/^www\.|^(vk|drive)\.google\.com/i.test(cleaned)) return 'https://' + cleaned;
  return cleaned;
}

/**
 * Classify source by known URL patterns
 */
function classifySource(url) {
  if (/vk\.com/i.test(url)) return {type: 'vk', url: url};
  if (/drive\.google\.com/i.test(url)) return {type: 'drive', url: url};
  return {type: 'url', url: url};
}

/**
 * CORRECTED: Extract URL from a formula like =IMAGE("...") or =HYPERLINK("...")
 */
function extractUrlFromFormula(formula) {
  if (!formula) return '';
  // Matches =IMAGE("URL") or =HYPERLINK("URL", ...)
  var match = String(formula).match(/^=\s*(?:IMAGE|HYPERLINK)\s*\(\s*["']([^"']+)["'][^)]*\)/i);
  return match ? match[1] : '';
}

/**
 * Extract URLs from plain text
 */
function extractUrlsFromText(text) {
  return text.match(/https?:\/\/[^\s<>]+/g) || [];
}

/**
 * Deduplicate a list of sources
 */
function deduplicateSources(sources) {
  var seen = {};
  return sources.filter(function(source) {
    var key = source.type + ':' + source.url;
    return seen.hasOwnProperty(key) ? false : (seen[key] = true);
  });
}
