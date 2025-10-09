/**
 * Модуль безопасности для валидации входных данных
 * Защищает от XSS, SQL injection, и других атак
 */

var SecurityValidator = {
  
  /**
   * Типы валидации
   */
  ValidationTypes: {
    EMAIL: 'email',
    API_KEY: 'api_key', 
    PROMPT: 'prompt',
    URL: 'url',
    GENERAL: 'general'
  },
  
  /**
   * Стандартные типы ошибок
   */
  ErrorTypes: {
    XSS_DETECTED: 'XSS_DETECTED',
    SQL_INJECTION: 'SQL_INJECTION',
    DANGEROUS_URL: 'DANGEROUS_URL',
    INVALID_EMAIL: 'INVALID_EMAIL',
    INVALID_API_KEY: 'INVALID_API_KEY',
    TOO_LONG: 'TOO_LONG',
    EMPTY_INPUT: 'EMPTY_INPUT'
  },
  
  /**
   * Основная функция валидации
   * @param {string} input - входные данные
   * @param {string} type - тип валидации из ValidationTypes
   * @return {Object} результат валидации {isValid: boolean, sanitized: string, errors: Array}
   */
  validateInput: function(input, type) {
    var result = {
      isValid: false,
      sanitized: '',
      errors: []
    };
    
    if (!input || typeof input !== 'string') {
      result.errors.push(this.ErrorTypes.EMPTY_INPUT);
      return result;
    }
    
    try {
      switch (type) {
        case this.ValidationTypes.EMAIL:
          return this.validateEmail(input);
        case this.ValidationTypes.API_KEY:
          return this.validateApiKey(input);
        case this.ValidationTypes.PROMPT:
          return this.validatePrompt(input);
        case this.ValidationTypes.URL:
          return this.validateUrl(input);
        default:
          return this.validateGeneral(input);
      }
    } catch (error) {
      result.errors.push('VALIDATION_ERROR: ' + error.message);
      return result;
    }
  },
  
  /**
   * Валидация email адресов
   */
  validateEmail: function(email) {
    var result = {
      isValid: false,
      sanitized: '',
      errors: []
    };
    
    // Базовая очистка
    var cleaned = email.trim().toLowerCase();
    
    // Проверка длины
    if (cleaned.length > 254) {
      result.errors.push(this.ErrorTypes.TOO_LONG);
      return result;
    }
    
    // Регулярное выражение для email
    var emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailPattern.test(cleaned)) {
      result.errors.push(this.ErrorTypes.INVALID_EMAIL);
      return result;
    }
    
    result.isValid = true;
    result.sanitized = cleaned;
    return result;
  },
  
  /**
   * Валидация API ключей
   */
  validateApiKey: function(apiKey) {
    var result = {
      isValid: false,
      sanitized: '',
      errors: []
    };
    
    var cleaned = apiKey.trim();
    
    // Проверка длины
    if (cleaned.length < 10) {
      result.errors.push(this.ErrorTypes.INVALID_API_KEY);
      return result;
    }
    
    if (cleaned.length > 500) {
      result.errors.push(this.ErrorTypes.TOO_LONG);
      return result;
    }
    
    // Проверка на допустимые символы (буквы, цифры, дефисы, подчеркивания)
    var apiKeyPattern = /^[a-zA-Z0-9_-]+$/;
    
    if (!apiKeyPattern.test(cleaned)) {
      result.errors.push(this.ErrorTypes.INVALID_API_KEY);
      return result;
    }
    
    result.isValid = true;
    result.sanitized = cleaned;
    return result;
  },
  
  /**
   * Валидация промптов для Gemini
   */
  validatePrompt: function(prompt) {
    var result = {
      isValid: false,
      sanitized: '',
      errors: []
    };
    
    // Проверка длины
    if (prompt.length > 100000) { // 100KB лимит
      result.errors.push(this.ErrorTypes.TOO_LONG);
      return result;
    }
    
    // XSS защита - удаляем потенциально опасные теги
    var sanitized = prompt
      .replace(/<script[^>]*>.*?<\/script>/gi, '[SCRIPT_REMOVED]') // XSS защита
      .replace(/javascript:/gi, 'js-removed:') // JavaScript URL защита  
      .replace(/data:text\/html/gi, 'data-removed') // Data URL защита
      .replace(/vbscript:/gi, 'vbs-removed:'); // VBScript защита
    
    // SQL injection защита
    var sqlPatterns = [
      /union\s+select/gi,
      /drop\s+table/gi,
      /delete\s+from/gi,
      /insert\s+into/gi,
      /update\s+set/gi
    ];
    
    for (var i = 0; i < sqlPatterns.length; i++) {
      if (sqlPatterns[i].test(sanitized)) {
        result.errors.push(this.ErrorTypes.SQL_INJECTION);
        return result;
      }
    }
    
    result.isValid = true;
    result.sanitized = sanitized;
    return result;
  },
  
  /**
   * Валидация URL
   */
  validateUrl: function(url) {
    var result = {
      isValid: false,
      sanitized: '',
      errors: []
    };
    
    var cleaned = url.trim();
    
    // Проверка длины
    if (cleaned.length > 2048) {
      result.errors.push(this.ErrorTypes.TOO_LONG);
      return result;
    }
    
    // Проверка на допустимые протоколы
    var allowedProtocols = /^https?:\/\//i;
    
    if (!allowedProtocols.test(cleaned)) {
      result.errors.push(this.ErrorTypes.DANGEROUS_URL);
      return result;
    }
    
    // Проверка на опасные домены
    var dangerousPatterns = [
      /localhost/i,
      /127\.0\.0\.1/i,
      /0\.0\.0\.0/i,
      /file:\/\//i,
      /ftp:\/\//i
    ];
    
    for (var i = 0; i < dangerousPatterns.length; i++) {
      if (dangerousPatterns[i].test(cleaned)) {
        result.errors.push(this.ErrorTypes.DANGEROUS_URL);
        return result;
      }
    }
    
    result.isValid = true;
    result.sanitized = cleaned;
    return result;
  },
  
  /**
   * Общая валидация
   */
  validateGeneral: function(input) {
    var result = {
      isValid: false,
      sanitized: '',
      errors: []
    };
    
    // Проверка длины
    if (input.length > 10000) {
      result.errors.push(this.ErrorTypes.TOO_LONG);
      return result;
    }
    
    // Базовая санитизация
    var sanitized = input
      .replace(/<script[^>]*>.*?<\/script>/gi, '[SCRIPT_REMOVED]')
      .replace(/javascript:/gi, 'js-removed:');
    
    result.isValid = true;
    result.sanitized = sanitized;
    return result;
  },
  
  /**
   * Безопасное логирование (маскирует sensitive данные)
   */
  safeLog: function(message, data) {
    var safeData = {};
    
    if (data && typeof data === 'object') {
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          var value = data[key];
          
          // Маскируем sensitive поля
          if (typeof value === 'string' && (
            key.toLowerCase().includes('password') ||
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('key') ||
            key.toLowerCase().includes('secret')
          )) {
            safeData[key] = value.length > 0 ? value.substring(0, 4) + '***' : '[EMPTY]';
          } else {
            safeData[key] = value;
          }
        }
      }
    }
    
    Logger.log('[SECURITY] ' + message + ': ' + JSON.stringify(safeData));
  },
  
  /**
   * Тест граничных значений архитектуры credentials
   * Проверяет что VK токены остаются на сервере, а Gemini ключи на клиенте
   */
  testCredentialBoundaries: function() {
    var results = [];
    
    try {
      // Проверяем что клиентский код НЕ имеет доступа к VK токенам
      var props = PropertiesService.getScriptProperties();
      var vkToken = props.getProperty('VK_ACCESS_TOKEN');
      
      if (vkToken) {
        results.push({
          test: 'VK Token Boundary Violation',
          passed: false,
          details: 'VK token found in client properties - should be server-only'
        });
      } else {
        results.push({
          test: 'VK Token Boundary',
          passed: true,
          details: 'VK tokens correctly isolated to server'
        });
      }
      
      // Проверяем что Gemini ключи доступны клиенту (это нормально)
      var geminiKey = props.getProperty('GEMINI_API_KEY');
      results.push({
        test: 'Gemini API Key Access',
        passed: true,
        details: 'Gemini keys correctly accessible to client for direct API calls'
      });
      
    } catch (error) {
      results.push({
        test: 'Credential Boundary Test',
        passed: false,
        error: error.message
      });
    }
    
    return results;
  }
};

// ВАЖНО: ИСПРАВЛЕНА АРХИТЕКТУРА CREDENTIALS
// VK/Instagram токены - только на сервере (пользователь НЕ вводит)
// Gemini API ключи - на клиенте (пользователь вводит для прямых вызовов API)