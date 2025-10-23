/**
 * 🚪 Authorization Helper: triggers consent for required scopes
 * Adds user-friendly prompts to authorize when needed.
 */

/**
 * Triggers a lightweight call that requires userinfo.email scope,
 * which forces the Apps Script consent screen when missing.
 */
function authorizeAccess() {
  try {
    // This call requires https://www.googleapis.com/auth/userinfo.email
    var email = Session.getActiveUser().getEmail();
    var masked = (typeof maskEmail === 'function') ? maskEmail(email) : (email || 'unknown');
    addSystemLog('Authorization check passed for ' + masked, 'INFO', 'AUTH');
    SpreadsheetApp.getUi().alert('✅ Доступ уже авторизован. Пользователь: ' + (email || 'unknown'));
  } catch (e) {
    // First run will open consent when executed from UI menu
    addSystemLog('Triggering authorization consent: ' + e.message, 'INFO', 'AUTH');
    SpreadsheetApp.getUi().alert(
      '🔑 Требуется авторизация доступа (email).\n\n' +
      'Пожалуйста, подтвердите разрешения в открывшемся окне и повторите действие.'
    );
    // Attempt a second call post-consent (no-op if still unauthorized)
    try { Session.getActiveUser().getEmail(); } catch (_ignored) {}
  }
}

/**
 * Shows a non-blocking tip if email scope seems missing.
 * Safe to call from onOpen().
 */
function maybeNotifyAuthorizationNeeded(optionalError) {
  try {
    var email = Session.getActiveUser().getEmail();
    if (!email) {
      SpreadsheetApp.getUi().alert(
        'ℹ️ Требуется авторизация',
        'Некоторые функции требуют разрешения на чтение вашего email. ' +
        'Откройте: 🤖 Table AI → ⚙️ Настройки → "🔑 Авторизоваться"',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
  } catch (e) {
    // Only notify once per session using Cache
    try {
      var cache = CacheService.getUserCache();
      var key = 'auth_tip_shown';
      if (!cache.get(key)) {
        cache.put(key, '1', 3600); // 1h TTL
        SpreadsheetApp.getUi().alert(
          'ℹ️ Требуется авторизация',
          'Ошибка: ' + (optionalError || e.message) + '\n' +
          'Откройте: 🤖 Table AI → ⚙️ Настройки → "🔑 Авторизоваться"',
          SpreadsheetApp.getUi().ButtonSet.OK
        );
      }
    } catch (_ignored) {}
  }
}
