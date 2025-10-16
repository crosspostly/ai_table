/**
 * Import VK posts using the server-side service.
 */
function importVkPosts() {
  addSystemLog('→ Client-side VK import initiated', 'INFO');
  // Using google.script.run to call the server-side function
  google.script.run
    .withSuccessHandler(function() {
      addSystemLog('✅ Server-side VK import successful', 'INFO');
      SpreadsheetApp.getUi().alert('VK posts have been imported and processed successfully.');
    })
    .withFailureHandler(function(error) {
      addSystemLog('❌ Server-side VK import failed: ' + error.message, 'ERROR');
      SpreadsheetApp.getUi().alert('Failed to import VK posts: ' + error.message);
    })
    .importVkPosts();
}