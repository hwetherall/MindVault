/**
 * Structured logging service
 * Replaces console.log/error/warn with structured logging
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private requestId: string | null = null;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Set request ID for tracking requests across logs
   */
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * Generate a new request ID
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format log message with context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const parts = [
      `[${timestamp}]`,
      `[${level.toUpperCase()}]`,
      this.requestId ? `[${this.requestId}]` : '',
      message
    ].filter(Boolean);

    return parts.join(' ');
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message), context || '');
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage(LogLevel.INFO, message), context || '');
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage(LogLevel.WARN, message), context || '');
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    };

    console.error(this.formatMessage(LogLevel.ERROR, message), errorContext);
    
    // In production, you might want to send to error tracking service
    // Example: Sentry.captureException(error, { extra: errorContext });
  }

  /**
   * Log API call
   */
  apiCall(endpoint: string, method: string, context?: LogContext): void {
    this.info(`API Call: ${method} ${endpoint}`, context);
  }

  /**
   * Log API response
   */
  apiResponse(endpoint: string, status: number, duration?: number, context?: LogContext): void {
    const durationStr = duration ? ` (${duration}ms)` : '';
    this.info(`API Response: ${endpoint} - ${status}${durationStr}`, context);
  }

  /**
   * Log API error
   */
  apiError(endpoint: string, error: Error | unknown, context?: LogContext): void {
    this.error(`API Error: ${endpoint}`, error, context);
  }

  /**
   * Log processing start
   */
  processingStart(operation: string, context?: LogContext): void {
    this.info(`Processing started: ${operation}`, context);
  }

  /**
   * Log processing complete
   */
  processingComplete(operation: string, duration: number, context?: LogContext): void {
    this.info(`Processing complete: ${operation} (${duration}ms)`, context);
  }

  /**
   * Log processing error
   */
  processingError(operation: string, error: Error | unknown, context?: LogContext): void {
    this.error(`Processing error: ${operation}`, error, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export function to create logger with request ID
export function createLogger(requestId?: string): Logger {
  const log = new Logger();
  if (requestId) {
    log.setRequestId(requestId);
  } else {
    log.setRequestId(log.generateRequestId());
  }
  return log;
}

