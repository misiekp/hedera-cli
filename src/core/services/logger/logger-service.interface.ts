/**
 * Interface for logging operations
 * Provides consistent logging interface for plugins
 */
export interface Logger {
  /**
   * Log a message
   */
  log(message: string): void;

  /**
   * Log a verbose message (debug level)
   */
  verbose(message: string): void;

  /**
   * Log an error message
   */
  error(message: string): void;

  /**
   * Log a warning message
   */
  warn(message: string): void;

  /**
   * Log a debug message
   */
  debug(message: string): void;
}
