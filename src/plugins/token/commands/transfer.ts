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

  // Extract command arguments
  const tokenId = args.args['tokenId'] as string;
  const toAccountIdOrName = args.args['to'] as string;
  const fromAccountIdOrName = args.args['from'] as string;
  const amount = args.args['balance'] as number;

  // Debug: Log all arguments
  logger.log(`[DEBUG] All args: ${JSON.stringify(args.args)}`);
  logger.log(`[DEBUG] token-id: ${tokenId}`);
  logger.log(`[DEBUG] to: ${toAccountIdOrName}`);
  logger.log(`[DEBUG] from: ${fromAccountIdOrName}`);
  logger.log(`[DEBUG] balance: ${amount}`);

  logger.log(
    `Transferring ${amount} tokens of ${tokenId} from ${fromAccountIdOrName} to ${toAccountIdOrName}`,
  );

  try {
    // 1. Resolve account IDs from names if needed
    // For now, we'll assume the input is already account IDs
    // In a full implementation, you'd resolve names to IDs using the account state
    const fromAccountId = fromAccountIdOrName;
    const toAccountId = toAccountIdOrName;

    // 2. Create transfer transaction using Core API
    const transferTransaction =
      await api.tokenTransactions.createTransferTransaction({
        tokenId,
        fromAccountId,
        toAccountId,
        amount,
      });

    // 3. Sign and execute transaction
    // Note: In a real implementation, you'd need to get the private key for the from account
    // For now, we'll use a placeholder signing process
    const result = await api.signing.signAndExecute(transferTransaction);

    if (result.success) {
      logger.log(`✅ Token transfer successful!`);
      logger.log(`   Token ID: ${tokenId}`);
      logger.log(`   From: ${fromAccountId}`);
      logger.log(`   To: ${toAccountId}`);
      logger.log(`   Amount: ${amount}`);
      logger.log(`   Transaction ID: ${result.transactionId}`);

      // 4. Optionally update token state if needed
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
