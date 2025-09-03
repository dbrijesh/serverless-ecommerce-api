const sanitizeError = (error) => {
  // Remove sensitive information from error objects
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  
  if (typeof error === 'string') {
    let sanitized = error;
    sensitiveFields.forEach(field => {
      const regex = new RegExp(`${field}[':"\\s]*[^\\s,}]+`, 'gi');
      sanitized = sanitized.replace(regex, `${field}: [REDACTED]`);
    });
    return sanitized;
  }
  
  if (error && typeof error === 'object') {
    const sanitized = { ...error };
    
    // Remove sensitive fields from error object
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    // Sanitize error message
    if (sanitized.message) {
      sanitized.message = sanitizeError(sanitized.message);
    }
    
    // Remove stack trace in production
    if (process.env.NODE_ENV === 'production') {
      delete sanitized.stack;
    }
    
    return sanitized;
  }
  
  return error;
};

const logError = (context, error, additionalInfo = {}) => {
  const timestamp = new Date().toISOString();
  const sanitizedError = sanitizeError(error);
  const sanitizedInfo = sanitizeError(additionalInfo);
  
  const logEntry = {
    timestamp,
    level: 'ERROR',
    context,
    error: sanitizedError,
    ...sanitizedInfo
  };
  
  console.error(JSON.stringify(logEntry));
};

const logWarn = (context, message, additionalInfo = {}) => {
  const timestamp = new Date().toISOString();
  const sanitizedInfo = sanitizeError(additionalInfo);
  
  const logEntry = {
    timestamp,
    level: 'WARN',
    context,
    message: sanitizeError(message),
    ...sanitizedInfo
  };
  
  console.warn(JSON.stringify(logEntry));
};

const logInfo = (context, message, additionalInfo = {}) => {
  const timestamp = new Date().toISOString();
  const sanitizedInfo = sanitizeError(additionalInfo);
  
  const logEntry = {
    timestamp,
    level: 'INFO',
    context,
    message,
    ...sanitizedInfo
  };
  
  console.log(JSON.stringify(logEntry));
};

module.exports = {
  logError,
  logWarn,
  logInfo,
  sanitizeError,
};