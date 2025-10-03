/**
 * Token Associate Command Handler
 * Handles token association operations using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { ZustandTokenStateHelper } from '../zustand-state-helper';

export async function associateTokenHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize token state helper
  const tokenState = new ZustandTokenStateHelper(api.state, logger);

  // Extract command arguments (using camelCase as passed by the CLI)
  const tokenId = args.args['tokenId'] as string;
  const accountId = args.args['accountId'] as string;
  const accountKey = args.args['accountKey'] as string;

  // Validate required parameters
  if (!accountKey) {
    throw new Error('Account key is required for token association');
  }

  logger.log(`🔑 Using provided account key for signing`);

  logger.log(`Associating token ${tokenId} with account ${accountId}`);

  try {
    // 1. Create association transaction using Core API
    const associateTransaction =
      await api.tokenTransactions.createTokenAssociationTransaction({
        tokenId,
        accountId,
      });

    // 2. Sign and execute transaction using the provided account key
    logger.debug(`Using account key for signing transaction`);
    const result = await api.signing.signAndExecuteWithKey(
      associateTransaction,
      accountKey,
    );

    if (result.success) {
      logger.log(`✅ Token association successful!`);
      logger.log(`   Token ID: ${tokenId}`);
      logger.log(`   Account ID: ${accountId}`);
      logger.log(`   Transaction ID: ${result.transactionId}`);

      // 3. Update token state with association
      // Note: In a real implementation, you'd need to resolve the account name
      // For now, we'll use the account ID as the name
      await tokenState.addTokenAssociation(tokenId, accountId, accountId);
      logger.log(`   Association saved to token state`);

      process.exit(0);
    } else {
      throw new Error('Token association failed');
    }
  } catch (error) {
    logger.error(`❌ Failed to associate token: ${error}`);
    process.exit(1);
  }
}

export default associateTokenHandler;
