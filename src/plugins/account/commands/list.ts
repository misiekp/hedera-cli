/**
 * Account List Command Handler
 * Handles listing all accounts using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { ZustandAccountStateHelper } from '../zustand-state-helper';

export function listAccountsHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const accountState = new ZustandAccountStateHelper(api.state, logger);

  // Extract command arguments
  const showPrivateKeys = (args.args.private as boolean) || false;

  logger.log('Listing all accounts...');

  try {
    const accounts = accountState.listAccounts();

    if (accounts.length === 0) {
      logger.log('📝 No accounts found in the address book');
      process.exit(0);
    }

    logger.log(`📝 Found ${accounts.length} account(s):`);
    logger.log('');

    accounts.forEach((account, index) => {
      logger.log(`${index + 1}. Name: ${account.name}`);
      logger.log(`   Account ID: ${account.accountId}`);
      logger.log(`   Type: ${account.type}`);
      logger.log(`   Network: ${account.network}`);
      logger.log(`   EVM Address: ${account.evmAddress}`);

      if (showPrivateKeys) {
        logger.log(`   Key Reference ID: ${account.keyRefId}`);
      }

      logger.log('');
    });

    process.exit(0);
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to list accounts', error));
    process.exit(1);
  }
}
