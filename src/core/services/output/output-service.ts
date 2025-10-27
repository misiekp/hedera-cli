/**
 * Output Service Implementation
 * Handles command output formatting and rendering using the strategy pattern
 */
import * as fs from 'fs';
import * as path from 'path';
import { OutputService } from './output-service.interface';
import { OutputHandlerOptions, OutputFormat } from './types';
import { OutputFormatterFactory, FormatStrategyOptions } from './strategies';

export class OutputServiceImpl implements OutputService {
  private currentFormat: OutputFormat;

  constructor(format: OutputFormat = 'human') {
    this.currentFormat = format;
  }

  getFormat(): OutputFormat {
    return this.currentFormat;
  }

  handleCommandOutput(options: OutputHandlerOptions): void {
    const { outputJson, template, format, outputPath } = options;

    // Parse the JSON output
    let data: unknown;
    try {
      data = JSON.parse(outputJson);
    } catch (error) {
      throw new Error(
        `Failed to parse output JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // TODO: Validate against schema if provided
    // if (options.schema) {
    //   this.validateOutput(data, options.schema);
    // }

    // Format the data using the appropriate strategy
    const formatter = OutputFormatterFactory.getStrategy(format);
    const formatOptions: FormatStrategyOptions = {
      template,
      pretty: true,
    };

    const formattedOutput = formatter.format(data, formatOptions);

    // Output to destination
    if (outputPath) {
      this.writeToFile(formattedOutput, outputPath);
    } else {
      console.log(formattedOutput);
    }
  }

  private writeToFile(content: string, filePath: string): void {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(
        `Failed to write output to file ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
