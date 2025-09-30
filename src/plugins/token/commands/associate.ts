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

  // Extract command arguments
  const tokenId = args.args['token-id'] as string;
  const accountIdOrName = args.args['account-id'] as string;

  logger.log(`Associating token ${tokenId} with account ${accountIdOrName}`);

  try {
    // 1. Resolve account ID from name if needed
    // For now, we'll assume the input is already an account ID
    // In a full implementation, you'd resolve names to IDs using the account state
    const accountId = accountIdOrName;

    // 2. Create association transaction using Core API
    const associateTransaction =
      await api.tokenTransactions.createTokenAssociationTransaction({
        tokenId,
        accountId,
      });

    // 3. Sign and execute transaction
    // Note: In a real implementation, you'd need to get the private key for the account
    // For now, we'll use a placeholder signing process
    const result = await api.signing.signAndExecute(associateTransaction);

    if (result.success) {
      logger.log(`✅ Token association successful!`);
      logger.log(`   Token ID: ${tokenId}`);
      logger.log(`   Account ID: ${accountId}`);
      logger.log(`   Transaction ID: ${result.transactionId}`);

      // 4. Update token state with association
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
