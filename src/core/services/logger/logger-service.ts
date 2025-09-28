/**
 * Mock implementation of Logger Service
 * This is a placeholder implementation for testing the architecture
 */
import { Logger } from './logger-service.interface';

export class MockLoggerService implements Logger {
  /**
   * Log a message (mock implementation)
   */
  log(message: string): void {
    console.log(`[MOCK LOG] ${message}`);
  }

  /**
   * Log a verbose message (debug level) (mock implementation)
   */
  verbose(message: string): void {
    console.log(`[MOCK VERBOSE] ${message}`);
  }

  /**
   * Log an error message (mock implementation)
   */
  error(message: string): void {
    console.error(`[MOCK ERROR] ${message}`);
  }

  /**
   * Log a warning message (mock implementation)
   */
  warn(message: string): void {
    console.warn(`[MOCK WARN] ${message}`);
  }

  /**
   * Log a debug message (mock implementation)
   */
  debug(message: string): void {
    console.log(`[MOCK DEBUG] ${message}`);
  }
}
