/**
 * Output Service Interface
 * Handles command output formatting and rendering
 */
import { OutputHandlerOptions } from './types';

export interface OutputService {
  /**
   * Handle command output - parse, validate, format, and output
   */
  handleCommandOutput(options: OutputHandlerOptions): void;

  /**
   * Set the output format (can be overridden by command-line flags)
   */
  setFormat(format: 'human' | 'json'): void;

  /**
   * Get the current output format
   */
  getFormat(): 'human' | 'json';
}
