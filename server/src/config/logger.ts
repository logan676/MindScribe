import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logDir = process.env.LOG_DIR || 'logs';

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// JSON format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport for all environments
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info',
  })
);

// File transports for production
if (process.env.NODE_ENV === 'production') {
  // Combined log file with rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
      level: 'info',
    })
  );

  // Error log file with rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat,
      level: 'error',
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  transports,
  exitOnError: false,
});

// Helper methods for common logging patterns
export const logRequest = (method: string, url: string, userId?: string) => {
  logger.info('HTTP Request', {
    method,
    url,
    userId,
    timestamp: new Date().toISOString(),
  });
};

export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

export const logApiCall = (
  service: string,
  endpoint: string,
  duration: number,
  success: boolean
) => {
  logger.info('External API call', {
    service,
    endpoint,
    duration,
    success,
  });
};

export const logDatabaseQuery = (
  query: string,
  duration: number,
  rowCount?: number
) => {
  logger.debug('Database query', {
    query: query.substring(0, 100), // Truncate long queries
    duration,
    rowCount,
  });
};

export const logAudit = (
  action: string,
  userId: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, any>
) => {
  logger.info('Audit event', {
    action,
    userId,
    resourceType,
    resourceId,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

export default logger;
