/**
 * Auto-Setup Hook Service
 *
 * Automatically triggers CLI setup when credentials are missing.
 * This hook runs before every command execution.
 */
import { Command } from 'commander';
import { CoreAPI } from '../../../core/core-api/core-api.interface';
import { PluginContext } from '../../../core/plugins/plugin.interface';
import { runInteractiveSetup } from './interactive-setup';

/**
 * Commands that should skip auto-setup check
 */
const SKIP_SETUP_COMMANDS = [
  'setup',
  'plugin',
  'help',
  '--help',
  '-h',
  '--version',
  '-v',
];

/**
 * Check if credentials exist for any network
 */
async function checkCredentialsExist(api: CoreAPI): Promise<boolean> {
  try {
    const credentials = await api.credentials.getDefaultCredentials();
    return credentials !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Check if command should skip auto-setup
 */
function shouldSkipSetup(command: Command): boolean {
  const cmdName = command.name();
  const args = command.args || [];

  // Skip if it's a setup-related command
  if (
    SKIP_SETUP_COMMANDS.some(
      (skip) =>
        cmdName.includes(skip) ||
        args.some((arg) => String(arg).includes(skip)),
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Create the auto-setup hook function
 */
export function createAutoSetupHook(context: PluginContext) {
  const { api, logger } = context;

  return async (command: Command): Promise<void> => {
    // Skip setup check for certain commands
    if (shouldSkipSetup(command)) {
      logger.debug(
        `[AUTO-SETUP] Skipping setup check for command: ${command.name()}`,
      );
      return;
    }

    // Check if credentials are configured
    const hasCredentials = await checkCredentialsExist(api);

    if (!hasCredentials) {
      logger.log('\n👋 Welcome to Hedera CLI!');
      logger.log("No operator credentials found. Let's set up your CLI...\n");

      try {
        // Trigger interactive setup
        await runInteractiveSetup(api, logger);

        logger.log('\n✅ Setup complete! Continuing with your command...\n');
      } catch (error) {
        logger.error(
          `❌ Setup failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        logger.log('\n💡 You can also set up credentials manually:');
        logger.log(
          '   1. Create a .env file with TESTNET_OPERATOR_ID and TESTNET_OPERATOR_KEY',
        );
        logger.log('   2. Run: hcli setup reload');
        logger.log('   3. Or run: hcli setup configure\n');
        process.exit(1);
      }
    } else {
      logger.debug('[AUTO-SETUP] Credentials found, continuing...');
    }
  };
}
