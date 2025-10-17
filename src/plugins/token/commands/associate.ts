/**
 * Token Associate Command Handler
 * Handles token association operations using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { ZustandTokenStateHelper } from '../zustand-state-helper';
import { safeValidateTokenAssociateParams } from '../schema';
import {
  resolveAccountParameter,
  resolveTokenParameter,
} from '../resolver-helper';
import { formatError } from '../../../utils/errors';

export async function associateTokenHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Validate command parameters
  const validationResult = safeValidateTokenAssociateParams(args.args);
  if (!validationResult.success) {
    logger.error('❌ Invalid command parameters:');
    validationResult.error.errors.forEach((error) => {
      logger.error(`   - ${error.path.join('.')}: ${error.message}`);
    });
    process.exit(1);
    return; // Ensure execution stops (for testing with mocked process.exit)
  }

  // Initialize token state helper
  const tokenState = new ZustandTokenStateHelper(api.state, logger);

  // Use validated parameters
  const validatedParams = validationResult.data;
  const tokenIdOrAlias = validatedParams.tokenId;
  const account = validatedParams.account;

  const network = api.network.getCurrentNetwork();

  // Resolve token ID from alias if provided
  const resolvedToken = resolveTokenParameter(tokenIdOrAlias, api, network);

  if (!resolvedToken) {
    throw new Error(
      `Failed to resolve token parameter: ${tokenIdOrAlias}. ` +
        `Expected format: token-alias OR token-id`,
    );
  }

  const tokenId = resolvedToken.tokenId;

  // Resolve account parameter (alias or account-id:account-key) if provided

  const resolvedAccount = resolveAccountParameter(account, api, network);

  // Account was explicitly provided - it MUST resolve or fail
  if (!resolvedAccount) {
    throw new Error(
      `Failed to resolve account parameter: ${account}. ` +
        `Expected format: account-alias OR account-id:account-key`,
    );
  }

  // Use resolved account from alias or account-id:account-key
  const accountId = resolvedAccount.accountId;
  const accountKeyRefId = resolvedAccount.accountKeyRefId;

  // Get the account name for state storage
  // If it's an alias, use the alias name; if it's account-id:key format, use account ID
  const accountName = account.includes(':') ? accountId : account;

  logger.log(`🔑 Using account: ${accountId}`);
  logger.log(`🔑 Will sign with account key`);

  logger.log(`Associating token ${tokenId} with account ${accountId}`);

  try {
    // 1. Create association transaction using Core API
    const associateTransaction = api.token.createTokenAssociationTransaction({
      tokenId,
      accountId,
    });

    // 2. Sign and execute transaction using the account key
    logger.debug(`Using key ${accountKeyRefId} for signing transaction`);
    const result = await api.signing.signAndExecuteWith(associateTransaction, {
      keyRefId: accountKeyRefId,
    });

    if (result.success) {
      logger.log(`✅ Token association successful!`);
      logger.log(`   Token ID: ${tokenId}`);
      logger.log(`   Account ID: ${accountId}`);
      logger.log(`   Transaction ID: ${result.transactionId}`);

      // 3. Update token state with association
      tokenState.addTokenAssociation(tokenId, accountId, accountName);
      logger.log(`   Association saved to token state`);

      process.exit(0);
    } else {
      throw new Error('Token association failed');
    }
  } catch (error) {
    logger.error(formatError('❌ Failed to associate token', error));
    process.exit(1);
  }
}

export default associateTokenHandler;
