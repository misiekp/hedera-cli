/**
 * Template Formatter
 * Formats output data using Handlebars templates
 */
import * as Handlebars from 'handlebars';

export class TemplateFormatter {
  constructor() {
    this.registerHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    // Helper for equality comparison
    Handlebars.registerHelper('eq', function (a: unknown, b: unknown) {
      return a === b;
    });

    // Helper for adding 1 (for 1-based indexing)
    Handlebars.registerHelper('add1', function (value: number) {
      return value + 1;
    });

    // Helper for conditional rendering
    Handlebars.registerHelper(
      'if_eq',
      function (
        this: unknown,
        a: unknown,
        b: unknown,
        opts: Handlebars.HelperOptions,
      ) {
        if (a === b) {
          return opts.fn(this);
        }
        return opts.inverse(this);
      },
    );
  }

  /**
   * Format data using a Handlebars template
   */
  format(data: unknown, templateString: string): string {
    try {
      const template = Handlebars.compile(templateString);
      return template(data);
    } catch (error) {
      throw new Error(
        `Failed to render template: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Format data with default template (simple JSON representation)
   */
  formatDefault(data: unknown): string {
    // Default fallback: pretty-print the data in a readable format
    return this.formatAsKeyValue(data);
  }

  /**
   * Format data as key-value pairs (fallback when no template provided)
   */
  private formatAsKeyValue(data: unknown, indent = 0): string {
    const spaces = ' '.repeat(indent);

    if (data === null || data === undefined) {
      return `${spaces}${String(data)}`;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return `${spaces}[]`;
      }
      return data
        .map(
          (item, idx) =>
            `${spaces}[${idx}]\n${this.formatAsKeyValue(item, indent + 2)}`,
        )
        .join('\n');
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data);
      if (entries.length === 0) {
        return `${spaces}{}`;
      }
      return entries
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return `${spaces}${key}:\n${this.formatAsKeyValue(value, indent + 2)}`;
          }
          return `${spaces}${key}: ${String(value)}`;
        })
        .join('\n');
    }

    return `${spaces}${String(data)}`;
  }
}
