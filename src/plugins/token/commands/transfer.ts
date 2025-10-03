/**
 * Token Transfer Command Handler
 * Handles token transfer operations using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
// import { ZustandTokenStateHelper } from '../zustand-state-helper';

export async function transferTokenHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize token state helper
  // const tokenState = new ZustandTokenStateHelper(api.state, logger);

  // Extract command arguments (using camelCase as passed by the CLI)
  const tokenId = args.args['tokenId'] as string;
  const toAccountId = args.args['to'] as string;
  const fromAccountId = args.args['from'] as string;
  const amount = args.args['balance'] as number;
  const fromKey = args.args['fromKey'] as string;

  // Validate required parameters
  if (!fromKey) {
    throw new Error('From account key is required for token transfer');
  }

  logger.log(`🔑 Using provided from account key for signing`);
  logger.log(
    `Transferring ${amount} tokens of ${tokenId} from ${fromAccountId} to ${toAccountId}`,
  );

  try {
    // 1. Create transfer transaction using Core API
    const transferTransaction =
      await api.tokenTransactions.createTransferTransaction({
        tokenId,
        fromAccountId,
        toAccountId,
        amount,
      });

    // 2. Sign and execute transaction using the provided from account key
    logger.debug(`Using from account key for signing transaction`);
    const result = await api.signing.signAndExecuteWithKey(
      transferTransaction,
      fromKey,
    );

    if (result.success) {
      logger.log(`✅ Token transfer successful!`);
      logger.log(`   Token ID: ${tokenId}`);
      logger.log(`   From: ${fromAccountId}`);
      logger.log(`   To: ${toAccountId}`);
      logger.log(`   Amount: ${amount}`);
      logger.log(`   Transaction ID: ${result.transactionId}`);

      // 3. Optionally update token state if needed
      // (e.g., update associations, balances, etc.)

      process.exit(0);
    } else {
      throw new Error('Token transfer failed');
    }
  } catch (error) {
    logger.error(`❌ Failed to transfer token: ${error}`);
    process.exit(1);
  }
}

export default transferTokenHandler;
