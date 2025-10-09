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
  .option('--json', 'Machine-readable JSON output')
  .option('--no-color', 'Disable ANSI colors');

// Apply logging options
program.hook('preAction', () => {
  const opts = program.opts();

  if (opts.debug) process.env.HCLI_DEBUG = 'true';
  if (opts.verbose) logger.setLevel('verbose');
  if (opts.quiet) logger.setLevel('quiet');

  setColorEnabled(opts.color !== false);
  setGlobalOutputMode({ json: Boolean(opts.json) });
});

// Initialize the simplified plugin system
async function initializeCLI() {
  try {
    console.log('🚀 Starting Hedera CLI...');

    // Create plugin manager
    const coreAPI = createCoreAPI();
    const pluginManager = new PluginManager(coreAPI);

    // Set default plugins
    pluginManager.setDefaultPlugins([
      './dist/plugins/setup', // Setup and initialization plugin (must be first for auto-setup)
      './dist/plugins/account', // Default account plugin
      './dist/plugins/plugin-management', // Plugin management plugin
      './dist/plugins/credentials', // Credentials management plugin
      './dist/plugins/state-management', // State management plugin
    ]);

    // Initialize plugins
    await pluginManager.initialize();

    // Register plugin commands
    pluginManager.registerCommands(program);

    console.log('✅ CLI ready');

    // Parse arguments and execute command
    installGlobalErrorHandlers();
    await program.parseAsync(process.argv);
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
