import { Logger } from '../utils/logger';
import { program } from 'commander';
import { setColorEnabled } from '../utils/color';
import { setGlobalOutputMode } from '../utils/output';
import * as fs from 'node:fs';
import * as path from 'node:path';

const pkgPath = path.join(__dirname, '../../package.json');
const pkg = fs.readFileSync(pkgPath, 'utf-8') as { version?: string };
const logger = Logger.getInstance();

export function setupCmd() {
  program
    .version(pkg.version || '0.0.0')
    .description('A CLI tool for managing Hedera environments')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-q, --quiet', 'Quiet mode (only errors)')
    .option(
      '--debug',
      'Enable debug logging (shows API URLs, network info, etc.)',
    )
    .option('--json', 'Machine-readable JSON output where supported')
    .option('--no-color', 'Disable ANSI colors in output')
    .option(
      '--log-mode <mode>',
      'Explicit log mode (normal|verbose|quiet|silent)',
    );

  // Ensure logging mode is applied before any command action executes.
  program.hook('preAction', () => {
    const opts = program.opts<{
      verbose?: boolean;
      quiet?: boolean;
      debug?: boolean;
      logMode?: string;
      json?: boolean;
      color?: boolean; // from --no-color inverse boolean option
    }>();

    // Handle debug flag (highest priority)
    if (opts.debug) {
      process.env.HCLI_DEBUG = 'true';
    }

    if (opts.logMode) {
      const mode = opts.logMode as 'verbose' | 'quiet' | 'normal' | 'silent';
      if (mode === 'silent') logger.setMode('silent');
      else if (mode === 'verbose' || mode === 'quiet' || mode === 'normal')
        logger.setLevel(mode);
    } else if (opts.verbose) logger.setLevel('verbose');
    else if (opts.quiet) logger.setLevel('quiet');
    setColorEnabled(opts.color !== false);
    setGlobalOutputMode({ json: Boolean(opts.json) });
  });

  return program;
}
