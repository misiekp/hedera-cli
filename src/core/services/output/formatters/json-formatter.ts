/**
 * JSON Formatter
 * Formats output data as JSON
 */

export class JsonFormatter {
  /**
   * Format data as JSON string
   */
  format(data: unknown, pretty = true): string {
    if (pretty) {
      return JSON.stringify(data, null, 2);
    }
    return JSON.stringify(data);
  }
}
