/**
 * Simple logging utility with proper log levels
 *
 * Levels: debug, info, warn, error
 *
 * In production, debug logs are suppressed unless DEBUG=true
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const isProduction = process.env.NODE_ENV === 'production';
const isDebugEnabled = process.env.DEBUG === 'true';

// Minimum log level: debug in dev, info in production (unless DEBUG=true)
const minLevel = isProduction && !isDebugEnabled ? LOG_LEVELS.info : LOG_LEVELS.debug;

function formatMessage(level, prefix, message) {
  const timestamp = new Date().toISOString();
  const prefixStr = prefix ? `[${prefix}]` : '';
  return `${timestamp} [${level.toUpperCase()}]${prefixStr} ${message}`;
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= minLevel;
}

/**
 * Create a logger instance with an optional prefix
 * @param {string} prefix - Optional prefix for log messages (e.g., 'QueueManager')
 * @returns {Object} Logger instance with debug, info, warn, error methods
 */
export function createLogger(prefix = '') {
  return {
    debug(message, ...args) {
      if (shouldLog('debug')) {
        console.log(formatMessage('debug', prefix, message), ...args);
      }
    },

    info(message, ...args) {
      if (shouldLog('info')) {
        console.log(formatMessage('info', prefix, message), ...args);
      }
    },

    warn(message, ...args) {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', prefix, message), ...args);
      }
    },

    error(message, ...args) {
      if (shouldLog('error')) {
        console.error(formatMessage('error', prefix, message), ...args);
      }
    }
  };
}

// Default logger instance without prefix
const logger = createLogger();

export default logger;
