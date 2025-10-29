/**
 * Token Transfer Command Handler
 * Handles token transfer operations using the Core API
 */
import { CommandHandlerArgs } from '../../../core';
import { safeValidateTokenTransferParams } from '../schema';
import {
  resolveAccountParameter,
  resolveDestinationAccountParameter,
  resolveTokenParameter,
} from '../resolver-helper';
import { formatError } from '../../../utils/errors';
import { processBalanceInput } from '../../../core/utils/process-balance-input';
import { ZustandTokenStateHelper } from '../zustand-state-helper';

export async function transferTokenHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  const tokenState = new ZustandTokenStateHelper(api.state, logger);

  // Validate command parameters
  const validationResult = safeValidateTokenTransferParams(args.args);
  if (!validationResult.success) {
    logger.error('❌ Invalid command parameters:');
    validationResult.error.errors.forEach((error) => {
      logger.error(`   - ${error.path.join('.')}: ${error.message}`);
    });
    process.exit(1);
    return; // Ensure execution stops (for testing with mocked process.exit)
  }

  // Use validated parameters
  const validatedParams = validationResult.data;
  const tokenIdOrAlias = validatedParams.token;
  const from = validatedParams.from;
  const to = validatedParams.to;

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

  // Get token decimals from API (needed for balance conversion)
  let tokenDecimals = 0;
  const userBalanceInput = validatedParams.balance;

  // Only fetch decimals if user input doesn't have 't' suffix (raw units)
  const isRawUnits = String(userBalanceInput).trim().endsWith('t');
  if (!isRawUnits) {
    try {
      const tokenInfoStorage = tokenState.getToken(tokenId);

      if (tokenInfoStorage) {
        tokenDecimals = tokenInfoStorage.decimals;
      } else {
        const tokenInfoMirror = await api.mirror.getTokenInfo(tokenId);
        tokenDecimals = parseInt(tokenInfoMirror.decimals) || 0;
      }

      const tokenInfo = await api.mirror.getTokenInfo(tokenId);
      tokenDecimals = parseInt(tokenInfo.decimals) || 0;
    } catch (error) {
      logger.error(`Failed to fetch token decimals for ${tokenId}`);
      process.exit(1);
    }
  }

  // Convert balance input: display units (default) or raw units (with 't' suffix)
  const rawAmount = processBalanceInput(userBalanceInput, tokenDecimals);

  // Resolve from parameter (alias or account-id:private-key) if provided

  let resolvedFromAccount = resolveAccountParameter(from, api, network);

  // If from account wasn't provided, use operator as default
  if (!resolvedFromAccount) {
    const operator = api.network.getOperator(network);

    if (!operator) {
      throw new Error('No from account provided and no default operator set.');
    }

    const operatorPublicKey = api.kms.getPublicKey(operator.keyRefId);

    if (!operatorPublicKey) {
      // This should not happen - credentials state should ensure operator keys exist
      throw new Error(
        'No from account provided and cant resolve public key of default operator set.',
      );
    }

    logger.log("No 'from' account provided, using default operator account.");

    resolvedFromAccount = {
      accountId: operator.accountId,
      accountKeyRefId: operator.keyRefId,
      accountPublicKey: operatorPublicKey,
    };
  }

  // Use resolved from account from alias or account-id:private-key
  const fromAccountId = resolvedFromAccount.accountId;
  const signerKeyRefId = resolvedFromAccount.accountKeyRefId;

  logger.log(`🔑 Using from account: ${fromAccountId}`);
  logger.log(`🔑 Will sign with from account key`);

  // Resolve to parameter (alias or account-id)
  const resolvedToAccount = resolveDestinationAccountParameter(
    to,
    api,
    network,
  );

  // To account was explicitly provided - it MUST resolve or fail
  if (!resolvedToAccount) {
    throw new Error(
      `Failed to resolve to account parameter: ${to}. ` +
        `Expected format: account-alias OR account-id`,
    );
  }

  const toAccountId = resolvedToAccount.accountId;

  logger.log(
    `Transferring ${rawAmount.toString()} tokens of ${tokenId} from ${fromAccountId} to ${toAccountId}`,
  );

  try {
    // 1. Create transfer transaction using Core API
    // Convert display units to base token units
    const transferTransaction = api.token.createTransferTransaction({
      tokenId,
      fromAccountId,
      toAccountId,
      amount: rawAmount.toNumber(),
    });

    // 2. Sign and execute transaction using the from account key
    logger.debug(`Using key ${signerKeyRefId} for signing transaction`);
    const result = await api.txExecution.signAndExecuteWith(
      transferTransaction,
      {
        keyRefId: signerKeyRefId,
      },
    );

    if (result.success) {
      logger.log(`✅ Token transfer successful!`);
      logger.log(`   Token ID: ${tokenId}`);
      logger.log(`   From: ${fromAccountId}`);
      logger.log(`   To: ${toAccountId}`);
      logger.log(`   Amount: ${rawAmount.toString()}`);
      logger.log(`   Transaction ID: ${result.transactionId}`);

      // 3. Optionally update token state if needed
      // (e.g., update associations, balances, etc.)

      process.exit(0);
    } else {
      throw new Error('Token transfer failed');
    }
  } catch (error) {
    logger.error(formatError('❌ Failed to transfer token', error));
    process.exit(1);
  }
}

export default transferTokenHandler;
