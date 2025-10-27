/**
 * Account View Command Handler
 * Handles viewing account details using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { ZustandAccountStateHelper } from '../zustand-state-helper';

export async function viewAccountHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const accountState = new ZustandAccountStateHelper(api.state, logger);

  // Extract command arguments
  const accountIdOrNameOrAlias = args.args['account'] as string;

  logger.log(`Viewing account details: ${accountIdOrNameOrAlias}`);

  try {
    // Resolve account identifier (could be name, account ID, or alias)
    let accountId = accountIdOrNameOrAlias;

    // First check if it's a stored account name
    const account = accountState.loadAccount(accountIdOrNameOrAlias);
    if (account) {
      accountId = account.accountId;
      logger.log(`Found account in state: ${account.name}`);
    } else {
      // For now, assume it's an account ID
      // TODO: Add proper alias resolution here
      logger.log(`Using as account ID: ${accountIdOrNameOrAlias}`);
    }

    // Get account info from mirror node
    const accountInfo = await api.mirror.getAccount(accountId);

    logger.log(`📋 Account Details:`);
    logger.log(`   Account ID: ${accountInfo.accountId}`);
    logger.log(`   Balance: ${accountInfo.balance.balance} tinybars`);
    logger.log(`   EVM Address: ${accountInfo.evmAddress || 'N/A'}`);
    logger.log(`   Public Key: ${accountInfo.accountPublicKey || 'N/A'}`);
    logger.log(`   Balance Timestamp: ${accountInfo.balance.timestamp}`);

    process.exit(0);
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to view account', error));
    process.exit(1);
  }
}
