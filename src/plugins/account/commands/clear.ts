/**
 * Account Clear Command Handler
 * Handles clearing all accounts using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { ZustandAccountStateHelper } from '../zustand-state-helper';

function clearAccountsHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const accountState = new ZustandAccountStateHelper(api.state, logger);

  logger.log('Clearing all accounts...');

  try {
    const accounts = accountState.listAccounts();
    const count = accounts.length;

    // Clear all accounts
    accountState.clearAccounts();

    logger.log(`✅ Cleared ${count} account(s) from the address book`);

    process.exit(0);
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to clear accounts', error));
    process.exit(1);
  }
}

export default clearAccountsHandler;
