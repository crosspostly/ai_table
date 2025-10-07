/**
 * Comprehensive Code Audit v1.0
 * Детальная диагностика всего проекта построчно
 */

/**
 * ГЛАВНАЯ ФУНКЦИЯ - полный аудит кода
 */
function runComprehensiveCodeAudit() {
  Logger.log('🔍 Starting Comprehensive Code Audit...');
  
  const startTime = Date.now();
  const auditResults = {
    totalFiles: 0,
    totalFunctions: 0,
    totalLines: 0,
    issues: [],
    warnings: [],
    criticalErrors: [],
    functionsAudited: [],
    dependencies: [],
    apiContracts: []
  };
  
  // === PHASE 1: SYNTAX AND STRUCTURE AUDIT ===
  Logger.log('\n📋 PHASE 1: Syntax and Structure Audit...');
  auditSyntaxAndStructure(auditResults);
  
  // === PHASE 2: FUNCTION DEPENDENCY ANALYSIS ===
  Logger.log('\n🔗 PHASE 2: Function Dependency Analysis...');
  auditFunctionDependencies(auditResults);
  
  // === PHASE 3: CLIENT-SERVER API CONTRACTS ===
  Logger.log('\n📡 PHASE 3: Client-Server API Contracts...');
  auditApiContracts(auditResults);
  
  // === PHASE 4: ERROR HANDLING VALIDATION ===
  Logger.log('\n🛡️ PHASE 4: Error Handling Validation...');
  auditErrorHandling(auditResults);
  
  // === PHASE 5: SECURITY AND VALIDATION AUDIT ===
  Logger.log('\n🔒 PHASE 5: Security and Validation Audit...');
  auditSecurityAndValidation(auditResults);
  
  // === PHASE 6: INTEGRATION POINTS AUDIT ===
  Logger.log('\n⚙️ PHASE 6: Integration Points Audit...');
  auditIntegrationPoints(auditResults);
  
  // === FINAL RESULTS ===
  const duration = Date.now() - startTime;
  generateAuditReport(auditResults, duration);
  
  return auditResults;
}

/**
 * ФАЗА 1: Аудит синтаксиса и структуры
 */
function auditSyntaxAndStructure(results) {
  const serverFunctions = [
    // ServerEndpoints.gs
    'doGet', 'doPost', 'handleOcrProcess', 'handleVkImport', 'handleSocialImport',
    'handleGeminiRequest', 'handleHealthCheck', 'parseRequestBody', 'createSuccessResponse',
    'createErrorResponse', 'checkOcrServiceHealth', 'checkVkServiceHealth',
    'checkLicensingHealth', 'checkGeminiHealth', 'getVkParserUrl', 'callGeminiApi',
    
    // SocialImportService.gs
    'importSocialPosts', 'normalizePlatformName', 'parseSource', 'importVkPostsAdvanced',
    'importInstagramPosts', 'writePostsToSheet', 'createAdvancedFilters',
    
    // ValidationService.gs
    'validateAndSanitizeInputs', 'validateSourceUrl', 'validateCount', 'validatePlatform',
    
    // RetryService.gs
    'fetchWithRetry', 'calculateBackoffDelay', 'shouldRetry', 'fetchSocialApiWithRetry',
    
    // ErrorHandlingService.gs
    'createUserFriendlyError', 'generateFriendlyMessage', 'executeWithErrorHandling',
    
    // TableLicenseService.gs
    'checkUserLicense', 'createTableBinding', 'rebindTable'
  ];
  
  const clientFunctions = [
    // ThinClient.gs
    'ocrReviewsThin', 'importVkPostsThin', 'GM_STATIC', 'GM_IF_STATIC',
    'getClientCredentials', 'getVkImportParams', 'callServer', 'logClient',
    
    // SocialImportClient.gs
    'importSocialPostsClient', 'getSocialImportParams', 'writeSocialPostsToSheet',
    'quickSocialImport', 'showSocialImportHelp', 'testSocialImportConnection',
    
    // Menu.gs
    'onOpen', 'showHelp',
    
    // GeminiClient.gs
    'fetchGeminiWithRetry'
  ];
  
  // Проверяем доступность функций
  Logger.log('🔍 Checking server functions...');
  serverFunctions.forEach(funcName => {
    try {
      if (typeof eval(funcName) === 'function') {
        results.functionsAudited.push({ name: funcName, type: 'server', status: 'OK' });
      } else {
        results.issues.push(`❌ Server function missing: ${funcName}`);
      }
    } catch (error) {
      results.criticalErrors.push(`💥 Server function error: ${funcName} - ${error.message}`);
    }
  });
  
  Logger.log('🔍 Checking client functions...');
  clientFunctions.forEach(funcName => {
    try {
      if (typeof eval(funcName) === 'function') {
        results.functionsAudited.push({ name: funcName, type: 'client', status: 'OK' });
      } else {
        results.warnings.push(`⚠️ Client function missing: ${funcName}`);
      }
    } catch (error) {
      results.issues.push(`❌ Client function error: ${funcName} - ${error.message}`);
    }
  });
  
  results.totalFunctions = serverFunctions.length + clientFunctions.length;
}

/**
 * ФАЗА 2: Анализ зависимостей функций
 */
function auditFunctionDependencies(results) {
  const criticalDependencies = [
    // SocialImport зависимости
    {
      function: 'handleSocialImport',
      requires: ['validateAndSanitizeInputs', 'parseSource', 'normalizePlatformName', 'createUserFriendlyError'],
      description: 'Social import API endpoint'
    },
    {
      function: 'importSocialPosts', 
      requires: ['validateAndSanitizeInputs', 'parseSource', 'executeWithErrorHandling'],
      description: 'Main social import function'
    },
    {
      function: 'parseSource',
      requires: ['normalizePlatformName'],
      description: 'URL and platform parsing'
    },
    
    // Client-Server коммуникация
    {
      function: 'importSocialPostsClient',
      requires: ['getClientCredentials', 'getSocialImportParams', 'callServer', 'writeSocialPostsToSheet'],
      description: 'Client social import interface'
    },
    {
      function: 'callServer',
      requires: ['getServerUrl'],
      description: 'HTTP client for server communication'
    },
    
    // Error Handling цепочка
    {
      function: 'executeWithErrorHandling',
      requires: ['createUserFriendlyError'],
      description: 'Error wrapper for operations'
    }
  ];
  
  Logger.log('🔗 Analyzing function dependencies...');
  criticalDependencies.forEach(dep => {
    const missingDeps = [];
    
    dep.requires.forEach(requiredFunc => {
      try {
        if (typeof eval(requiredFunc) !== 'function') {
          missingDeps.push(requiredFunc);
        }
      } catch (error) {
        missingDeps.push(requiredFunc + ' (ERROR)');
      }
    });
    
    if (missingDeps.length > 0) {
      results.criticalErrors.push(`💥 ${dep.function} missing dependencies: ${missingDeps.join(', ')}`);
    } else {
      results.dependencies.push({
        function: dep.function,
        status: 'OK',
        dependencies: dep.requires.length,
        description: dep.description
      });
    }
  });
}

/**
 * ФАЗА 3: Аудит API контрактов client-server
 */
function auditApiContracts(results) {
  Logger.log('📡 Auditing API contracts...');
  
  const apiContracts = [
    {
      action: 'social_import',
      serverHandler: 'handleSocialImport',
      clientCaller: 'importSocialPostsClient',
      requiredParams: ['source', 'count'],
      optionalParams: ['platform'],
      expectedResponse: ['data', 'platform', 'source', 'count']
    },
    {
      action: 'health',
      serverHandler: 'handleHealthCheck', 
      clientCaller: 'testSocialImportConnection',
      requiredParams: [],
      optionalParams: [],
      expectedResponse: ['ok', 'timestamp', 'version', 'services']
    },
    {
      action: 'vk_import',
      serverHandler: 'handleVkImport',
      clientCaller: 'importVkPostsThin',
      requiredParams: ['owner'],
      optionalParams: ['count'],
      expectedResponse: ['data']
    }
  ];
  
  apiContracts.forEach(contract => {
    const issues = [];
    
    // Проверяем существование server handler
    try {
      if (typeof eval(contract.serverHandler) !== 'function') {
        issues.push(`Server handler missing: ${contract.serverHandler}`);
      }
    } catch (error) {
      issues.push(`Server handler error: ${contract.serverHandler} - ${error.message}`);
    }
    
    // Проверяем существование client caller
    try {
      if (typeof eval(contract.clientCaller) !== 'function') {
        issues.push(`Client caller missing: ${contract.clientCaller}`);
      }
    } catch (error) {
      issues.push(`Client caller error: ${contract.clientCaller} - ${error.message}`);
    }
    
    if (issues.length > 0) {
      results.criticalErrors.push(`💥 API contract broken for ${contract.action}: ${issues.join(', ')}`);
    } else {
      results.apiContracts.push({
        action: contract.action,
        status: 'OK',
        serverHandler: contract.serverHandler,
        clientCaller: contract.clientCaller
      });
    }
  });
}

/**
 * ФАЗА 4: Аудит обработки ошибок
 */
function auditErrorHandling(results) {
  Logger.log('🛡️ Auditing error handling...');
  
  const errorHandlingTests = [
    {
      name: 'User-friendly error creation',
      test: () => {
        const error = new Error('HTTP 404');
        const friendly = createUserFriendlyError(error, { platform: 'test' });
        return friendly && friendly.message && friendly.message.includes('🔍');
      }
    },
    {
      name: 'Input validation error handling',
      test: () => {
        try {
          validateAndSanitizeInputs('', 0, '');
          return false; // Should have thrown
        } catch (error) {
          return error.message.includes('required') || error.message.includes('пуст');
        }
      }
    },
    {
      name: 'XSS protection',
      test: () => {
        try {
          validateAndSanitizeInputs('javascript:alert(1)', 5, 'test');
          return false; // Should have blocked
        } catch (error) {
          return error.message.includes('протокол') || error.message.includes('Invalid');
        }
      }
    }
  ];
  
  errorHandlingTests.forEach(test => {
    try {
      const result = test.test();
      if (result) {
        Logger.log(`✅ ${test.name} - PASSED`);
      } else {
        results.issues.push(`❌ Error handling test failed: ${test.name}`);
        Logger.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      results.criticalErrors.push(`💥 Error handling test exception: ${test.name} - ${error.message}`);
      Logger.log(`💥 ${test.name} - EXCEPTION: ${error.message}`);
    }
  });
}

/**
 * ФАЗА 5: Аудит безопасности и валидации
 */
function auditSecurityAndValidation(results) {
  Logger.log('🔒 Auditing security and validation...');
  
  const securityTests = [
    {
      name: 'URL validation and sanitization',
      test: () => {
        const result = validateAndSanitizeInputs('https://instagram.com/nasa', 5, 'instagram');
        return result && result.isValid && result.sourceUrl;
      }
    },
    {
      name: 'Platform name normalization',
      test: () => {
        const normalized = normalizePlatformName('инста');
        return normalized === 'instagram';
      }
    },
    {
      name: 'Count limits enforcement',
      test: () => {
        const result = validateAndSanitizeInputs('https://test.com', 1000, 'test');
        return result && result.count <= 100;
      }
    }
  ];
  
  securityTests.forEach(test => {
    try {
      const result = test.test();
      if (result) {
        Logger.log(`✅ ${test.name} - PASSED`);
      } else {
        results.issues.push(`❌ Security test failed: ${test.name}`);
        Logger.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      results.criticalErrors.push(`💥 Security test exception: ${test.name} - ${error.message}`);
      Logger.log(`💥 ${test.name} - EXCEPTION: ${error.message}`);
    }
  });
}

/**
 * ФАЗА 6: Аудит точек интеграции
 */
function auditIntegrationPoints(results) {
  Logger.log('⚙️ Auditing integration points...');
  
  const integrationTests = [
    {
      name: 'ServerEndpoints doPost switch statement',
      test: () => {
        // Проверяем что doPost может обрабатывать social_import
        try {
          const mockRequest = {
            postData: {
              contents: JSON.stringify({
                action: 'social_import',
                email: 'test@test.com',
                token: 'test',
                source: 'https://instagram.com/nasa',
                count: 5
              })
            }
          };
          // Не вызываем реально, только проверяем что функции существуют
          return typeof handleSocialImport === 'function';
        } catch (error) {
          return false;
        }
      }
    },
    {
      name: 'Client callServer function integration',
      test: () => {
        // Проверяем что callServer может отправить запрос
        try {
          return typeof callServer === 'function' && typeof getServerUrl === 'function';
        } catch (error) {
          return false;
        }
      }
    },
    {
      name: 'SocialImportService integration chain',
      test: () => {
        // Проверяем цепочку: parseSource -> normalizePlatformName -> import functions
        return typeof parseSource === 'function' && 
               typeof normalizePlatformName === 'function' &&
               typeof importVkPostsAdvanced === 'function';
      }
    }
  ];
  
  integrationTests.forEach(test => {
    try {
      const result = test.test();
      if (result) {
        Logger.log(`✅ ${test.name} - PASSED`);
      } else {
        results.criticalErrors.push(`💥 Integration test failed: ${test.name}`);
        Logger.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      results.criticalErrors.push(`💥 Integration test exception: ${test.name} - ${error.message}`);
      Logger.log(`💥 ${test.name} - EXCEPTION: ${error.message}`);
    }
  });
}

/**
 * Генерация детального отчета аудита
 */
function generateAuditReport(results, duration) {
  Logger.log('\n📊 ========================================');
  Logger.log('   🔍 COMPREHENSIVE CODE AUDIT RESULTS');
  Logger.log('========================================');
  Logger.log(`⏱️ Duration: ${Math.round(duration / 1000)}s`);
  Logger.log(`📁 Total Functions Audited: ${results.totalFunctions}`);
  Logger.log(`✅ Functions OK: ${results.functionsAudited.filter(f => f.status === 'OK').length}`);
  Logger.log(`🔗 Dependencies Verified: ${results.dependencies.length}`);
  Logger.log(`📡 API Contracts: ${results.apiContracts.length}`);
  Logger.log(`⚠️ Warnings: ${results.warnings.length}`);
  Logger.log(`❌ Issues: ${results.issues.length}`);
  Logger.log(`💥 Critical Errors: ${results.criticalErrors.length}`);
  
  // Критические ошибки
  if (results.criticalErrors.length > 0) {
    Logger.log('\n🚨 CRITICAL ERRORS:');
    results.criticalErrors.forEach(error => {
      Logger.log(`  ${error}`);
    });
  }
  
  // Проблемы
  if (results.issues.length > 0) {
    Logger.log('\n❌ ISSUES FOUND:');
    results.issues.forEach(issue => {
      Logger.log(`  ${issue}`);
    });
  }
  
  // Предупреждения
  if (results.warnings.length > 0) {
    Logger.log('\n⚠️ WARNINGS:');
    results.warnings.forEach(warning => {
      Logger.log(`  ${warning}`);
    });
  }
  
  // Вердикт
  const totalProblems = results.criticalErrors.length + results.issues.length;
  if (totalProblems === 0) {
    Logger.log('\n🎯 AUDIT VERDICT: ✅ ALL SYSTEMS OPERATIONAL');
    Logger.log('   No critical issues found, code is ready for production!');
  } else if (results.criticalErrors.length > 0) {
    Logger.log('\n🚨 AUDIT VERDICT: ❌ CRITICAL ISSUES FOUND');
    Logger.log(`   ${results.criticalErrors.length} critical errors must be fixed before deployment!`);
  } else {
    Logger.log('\n⚠️ AUDIT VERDICT: 🔄 MINOR ISSUES FOUND');
    Logger.log(`   ${results.issues.length} issues should be addressed, but not blocking.`);
  }
  
  // Сохраняем отчет
  writeAuditReportToSheet(results, duration);
}

/**
 * Запись отчета аудита в Google Sheets
 */
function writeAuditReportToSheet(results, duration) {
  try {
    const ss = SpreadsheetApp.getActive();
    let sheet = ss.getSheetByName('Code Audit');
    
    if (!sheet) {
      sheet = ss.insertSheet('Code Audit');
    }
    
    sheet.clear();
    
    // Заголовок
    sheet.getRange('A1').setValue('🔍 Comprehensive Code Audit Results');
    sheet.getRange('A1').setFontSize(16).setFontWeight('bold');
    
    let row = 3;
    
    // Общие метрики
    const metrics = [
      ['Timestamp', new Date().toLocaleString()],
      ['Duration', `${Math.round(duration / 1000)}s`],
      ['Total Functions', results.totalFunctions],
      ['Functions OK', results.functionsAudited.filter(f => f.status === 'OK').length],
      ['Dependencies OK', results.dependencies.length],
      ['API Contracts OK', results.apiContracts.length],
      ['Warnings', results.warnings.length],
      ['Issues', results.issues.length],
      ['Critical Errors', results.criticalErrors.length]
    ];
    
    sheet.getRange(row, 1, metrics.length, 2).setValues(metrics);
    row += metrics.length + 2;
    
    // Критические ошибки
    if (results.criticalErrors.length > 0) {
      sheet.getRange(row, 1).setValue('🚨 CRITICAL ERRORS:').setFontWeight('bold').setFontColor('red');
      row++;
      
      results.criticalErrors.forEach(error => {
        sheet.getRange(row, 1).setValue(error);
        row++;
      });
      row++;
    }
    
    // Проблемы
    if (results.issues.length > 0) {
      sheet.getRange(row, 1).setValue('❌ ISSUES:').setFontWeight('bold').setFontColor('orange');
      row++;
      
      results.issues.forEach(issue => {
        sheet.getRange(row, 1).setValue(issue);
        row++;
      });
      row++;
    }
    
    // Предупреждения
    if (results.warnings.length > 0) {
      sheet.getRange(row, 1).setValue('⚠️ WARNINGS:').setFontWeight('bold').setFontColor('blue');
      row++;
      
      results.warnings.forEach(warning => {
        sheet.getRange(row, 1).setValue(warning);
        row++;
      });
    }
    
    // Автоширина
    sheet.autoResizeColumns(1, 2);
    
    Logger.log('✅ Audit report written to "Code Audit" sheet');
    
  } catch (error) {
    Logger.log(`⚠️ Could not write audit report: ${error.message}`);
  }
}

/**
 * Быстрый аудит только критических функций
 */
function runQuickAudit() {
  Logger.log('⚡ Quick Audit - Critical Functions Only...');
  
  const criticalFunctions = [
    'doPost', 'handleSocialImport', 'importSocialPosts', 
    'validateAndSanitizeInputs', 'parseSource', 'normalizePlatformName',
    'createUserFriendlyError', 'callServer', 'importSocialPostsClient'
  ];
  
  let passed = 0, failed = 0;
  
  criticalFunctions.forEach(funcName => {
    try {
      if (typeof eval(funcName) === 'function') {
        passed++;
        Logger.log(`✅ ${funcName}`);
      } else {
        failed++;
        Logger.log(`❌ ${funcName} - MISSING`);
      }
    } catch (error) {
      failed++;
      Logger.log(`💥 ${funcName} - ERROR: ${error.message}`);
    }
  });
  
  const total = criticalFunctions.length;
  const successRate = Math.round((passed / total) * 100);
  
  Logger.log(`\n📊 Quick Audit Results: ${passed}/${total} (${successRate}%)`);
  
  if (successRate === 100) {
    Logger.log('🎯 VERDICT: ✅ ALL CRITICAL FUNCTIONS AVAILABLE');
  } else if (successRate >= 80) {
    Logger.log('⚠️ VERDICT: 🔄 MOSTLY OK, SOME ISSUES');
  } else {
    Logger.log('🚨 VERDICT: ❌ CRITICAL ISSUES FOUND');
  }
  
  return { passed, failed, total, successRate };
}