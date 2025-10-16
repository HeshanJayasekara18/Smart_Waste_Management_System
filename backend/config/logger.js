const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, align, errors } = format;
const path = require('path');
const fs = require('fs');
const DailyRotateFile = require('winston-daily-rotate-file');

// Create logs directory if it doesn't exist
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Custom format for console
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  const log = `${timestamp} [${level}]: ${stack || message}`;
  return log;
});

// Custom format for files
const fileFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  return JSON.stringify({
    timestamp,
    level,
    message: stack || message,
    ...meta
  });
});

// Logger configuration
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV === 'production' 
      ? format.json() 
      : combine(colorize(), align(), consoleFormat)
  ),
  transports: [
    // Console transport
    new transports.Console(),

    // Daily rotate file transport for all logs
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(timestamp(), fileFormat)
    }),

    // Error logs
    new DailyRotateFile({
      level: 'error',
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: combine(timestamp(), fileFormat)
    })
  ],
  exitOnError: false
});

// Morgan stream for HTTP request logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Handle unhandled exceptions
logger.exceptions.handle(
  new transports.File({ 
    filename: path.join(logDir, 'exceptions.log'),
    format: combine(timestamp(), fileFormat)
  })
);

module.exports = logger;