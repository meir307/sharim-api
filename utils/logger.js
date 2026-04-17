const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist (with error handling)
const logsDir = path.resolve(__dirname, '../logs');

// Ensure logs directory exists
function ensureLogsDirectory() {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log(`Logs directory created at: ${logsDir}`);
    }
    // Test write permissions
    const testFile = path.join(logsDir, '.test');
    try {
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (writeError) {
      console.error(`Warning: Cannot write to logs directory: ${logsDir}`, writeError.message);
    }
  } catch (error) {
    console.error('Failed to create logs directory:', error.message);
    console.error('Logs directory path:', logsDir);
    // Continue anyway - winston will handle the error
  }
}

// Create directory immediately
ensureLogsDirectory();

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define log format for console (more readable)
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

// Create logger with error handling
let logger;

try {
  // Only create file transports if directory exists and is writable
  const transports = [];
  
  // Always add console transport first
  transports.push(new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' 
      ? winston.format.simple() 
      : consoleFormat,
    handleExceptions: true,
    handleRejections: true,
  }));

  // Only add file transports if directory exists
  if (fs.existsSync(logsDir)) {
    try {
      // Test write permissions
      const testFile = path.join(logsDir, '.test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      // Add file transports
      transports.push(
        // Write all logs to combined.log
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          handleExceptions: true,
          handleRejections: true,
        }),
        // Write errors to error.log
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          handleExceptions: true,
          handleRejections: true,
        })
      );
    } catch (fileError) {
      console.warn('Cannot write to logs directory, using console only:', fileError.message);
    }
  } else {
    console.warn(`Logs directory does not exist: ${logsDir}. Using console logging only.`);
  }

  logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'memunim-server' },
    transports: transports,
    // Handle uncaught exceptions and rejections (only if directory exists)
    ...(fs.existsSync(logsDir) && {
      exceptionHandler: new winston.transports.File({
        filename: path.join(logsDir, 'exceptions.log')
      }),
      rejectionHandler: new winston.transports.File({
        filename: path.join(logsDir, 'rejections.log')
      })
    })
  });

} catch (error) {
  // Fallback to console if winston fails
  console.error('Failed to initialize winston logger:', error);
  logger = {
    error: (...args) => {
      const msg = args.length > 0 ? args[0] : 'Error';
      const meta = args.length > 1 ? args[1] : {};
      console.error('[LOGGER ERROR]', msg, meta);
    },
    warn: (...args) => {
      const msg = args.length > 0 ? args[0] : 'Warning';
      const meta = args.length > 1 ? args[1] : {};
      console.warn('[LOGGER WARN]', msg, meta);
    },
    info: (...args) => {
      const msg = args.length > 0 ? args[0] : 'Info';
      const meta = args.length > 1 ? args[1] : {};
      console.log('[LOGGER INFO]', msg, meta);
    },
    debug: (...args) => {
      const msg = args.length > 0 ? args[0] : 'Debug';
      const meta = args.length > 1 ? args[1] : {};
      console.log('[LOGGER DEBUG]', msg, meta);
    },
  };
}

module.exports = logger;

