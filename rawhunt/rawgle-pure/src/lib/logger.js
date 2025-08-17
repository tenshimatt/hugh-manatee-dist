// Logging utilities

class Logger {
  constructor(env = {}) {
    this.logLevel = env.LOG_LEVEL || 'info';
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }
  
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }
  
  formatMessage(level, message, metadata = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      metadata,
      service: 'rawgle-api'
    });
  }
  
  error(message, metadata = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, metadata));
    }
  }
  
  warn(message, metadata = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, metadata));
    }
  }
  
  info(message, metadata = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, metadata));
    }
  }
  
  debug(message, metadata = {}) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, metadata));
    }
  }
}

export const logger = new Logger();