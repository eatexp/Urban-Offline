/**
 * Logger Utility for Urban-Offline
 * 
 * Provides structured logging with levels and optional persistence.
 * In production, verbose logs are suppressed.
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

// Determine log level based on environment
const isProduction = import.meta.env.PROD;
const MIN_LOG_LEVEL = isProduction ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

// Color codes for console
const COLORS = {
    DEBUG: '#6b7280', // gray
    INFO: '#3b82f6',  // blue
    WARN: '#f59e0b',  // amber
    ERROR: '#ef4444'  // red
};

/**
 * Format log message with timestamp and context
 */
function formatMessage(level, context, message) {
    const timestamp = new Date().toISOString().substr(11, 12);
    return `[${timestamp}] [${level}] ${context ? `[${context}] ` : ''}${message}`;
}

/**
 * Log to console with styling
 */
function logToConsole(level, context, message, data) {
    if (LOG_LEVELS[level] < MIN_LOG_LEVEL) return;

    const formatted = formatMessage(level, context, message);
    const style = `color: ${COLORS[level]}; font-weight: bold;`;

    switch (level) {
        case 'DEBUG':
            if (data !== undefined) {
                console.debug(`%c${formatted}`, style, data);
            } else {
                console.debug(`%c${formatted}`, style);
            }
            break;
        case 'INFO':
            if (data !== undefined) {
                console.info(`%c${formatted}`, style, data);
            } else {
                console.info(`%c${formatted}`, style);
            }
            break;
        case 'WARN':
            if (data !== undefined) {
                console.warn(`%c${formatted}`, style, data);
            } else {
                console.warn(`%c${formatted}`, style);
            }
            break;
        case 'ERROR':
            if (data !== undefined) {
                console.error(`%c${formatted}`, style, data);
            } else {
                console.error(`%c${formatted}`, style);
            }
            break;
    }
}

/**
 * Create a logger instance with optional context
 */
export function createLogger(context = '') {
    return {
        debug: (message, data) => logToConsole('DEBUG', context, message, data),
        info: (message, data) => logToConsole('INFO', context, message, data),
        warn: (message, data) => logToConsole('WARN', context, message, data),
        error: (message, data) => logToConsole('ERROR', context, message, data),
        
        // Group related logs
        group: (label) => {
            if (LOG_LEVELS.DEBUG >= MIN_LOG_LEVEL) {
                console.group(`[${context}] ${label}`);
            }
        },
        groupEnd: () => {
            if (LOG_LEVELS.DEBUG >= MIN_LOG_LEVEL) {
                console.groupEnd();
            }
        },
        
        // Time operations
        time: (label) => {
            if (LOG_LEVELS.DEBUG >= MIN_LOG_LEVEL) {
                console.time(`[${context}] ${label}`);
            }
        },
        timeEnd: (label) => {
            if (LOG_LEVELS.DEBUG >= MIN_LOG_LEVEL) {
                console.timeEnd(`[${context}] ${label}`);
            }
        }
    };
}

// Default logger instance
export const logger = createLogger('App');

export default logger;


