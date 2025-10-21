#!/usr/bin/env node

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

import { program } from 'commander';
import { setColorEnabled } from './utils/color';
import { installGlobalErrorHandlers } from './utils/errors';
import { Logger } from './utils/logger';
import { setGlobalOutputMode } from './utils/output';
import { PluginManager } from './core/plugins/plugin-manager';
import { createCoreAPI } from './core/core-api';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../package.json') as { version?: string };
const logger = Logger.getInstance();

program
  .version(pkg.version || '0.0.0')
  .description('A CLI tool for managing Hedera environments')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-q, --quiet', 'Quiet mode (only errors)')
  .option('--debug', 'Enable debug logging')
  .option(
    '--json',
    'Machine-readable JSON output (deprecated, use --format json)',
  )
  .option('--format <type>', 'Output format: human (default) or json')
  .option('--no-color', 'Disable ANSI colors');

// Apply logging options and store format preference
let globalFormat: 'human' | 'json' = 'human';

// Store coreAPI instance to access in preAction hook
let coreAPIInstance: ReturnType<typeof createCoreAPI> | null = null;

program.hook('preAction', () => {
  const opts = program.opts();

  if (opts.debug) process.env.HCLI_DEBUG = 'true';
  if (opts.verbose) logger.setLevel('verbose');
  if (opts.quiet) logger.setLevel('quiet');

  setColorEnabled(opts.color !== false);

  // Handle --json flag (deprecated) and --format flag
  const formatOption = opts.format as string | undefined;
  const format: string = formatOption || (opts.json ? 'json' : 'human');
  globalFormat = format as 'human' | 'json';
  setGlobalOutputMode({ json: format === 'json' });

  // Update output format on coreAPI if available
  if (coreAPIInstance) {
    coreAPIInstance.output.setFormat(globalFormat);
  }
});

export function getGlobalFormat(): 'human' | 'json' {
  return globalFormat;
}

// Initialize the simplified plugin system
async function initializeCLI() {
  try {
    console.error('🚀 Starting Hedera CLI...');

    // Create plugin manager
    const coreAPI = createCoreAPI();
    coreAPIInstance = coreAPI;

    // Set initial output format
    coreAPI.output.setFormat(globalFormat);

    const pluginManager = new PluginManager(coreAPI);

    // Set default plugins
    pluginManager.setDefaultPlugins([
      './dist/plugins/account', // Default account plugin
      './dist/plugins/token', // Token management plugin
      './dist/plugins/network', // Network plugin
      './dist/plugins/plugin-management', // Plugin management plugin
      './dist/plugins/credentials', // Credentials management plugin
      './dist/plugins/state-management', // State management plugin
      './dist/plugins/topic', // Topic management plugin
      './dist/plugins/hbar', // HBAR plugin
    ]);

    // Initialize plugins
    await pluginManager.initialize();

    // Register plugin commands
    pluginManager.registerCommands(program);

    console.error('✅ CLI ready');

    // Parse arguments and execute command
    installGlobalErrorHandlers();
    await program.parseAsync(process.argv);
    process.exit(0);
  } catch (error) {
    console.error('❌ CLI initialization failed:', error);
    process.exit(1);
  }
}

// Start the CLI
initializeCLI().catch((error) => {
  console.error('❌ CLI startup failed:', error);
  process.exit(1);
});
