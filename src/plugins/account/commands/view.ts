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
  const accountIdOrName = args.args['accountIdOrName'] as string;

  logger.log(`Viewing account details: ${accountIdOrName}`);

  try {
    // Check if it's a name (stored in state) or account ID
    let accountId = accountIdOrName;
    const account = accountState.loadAccount(accountIdOrName);

    if (account) {
      accountId = account.accountId;
      logger.log(`Found account in state: ${account.name}`);
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
