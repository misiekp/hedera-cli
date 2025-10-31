/**
 * Token Transfer Command Handler
 * Handles token transfer operations using the Core API
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { Status } from '../../../../core/shared/constants';
import { safeValidateTokenTransferParams } from '../../schema';
import {
  resolveAccountParameter,
  resolveDestinationAccountParameter,
  resolveTokenParameter,
} from '../../resolver-helper';
import { formatError } from '../../../../utils/errors';
import { TransferTokenOutput } from './output';

export default async function transferTokenHandler(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api, logger } = args;

  // Validate command parameters
  const validationResult = safeValidateTokenTransferParams(args.args);
  if (!validationResult.success) {
    const errorMessages = validationResult.error.errors.map(
      (error) => `${error.path.join('.')}: ${error.message}`,
    );
    return {
      status: Status.Failure,
      errorMessage: `Invalid command parameters:\n${errorMessages.join('\n')}`,
    };
  }

  // Use validated parameters
  const validatedParams = validationResult.data;
  const tokenIdOrAlias = validatedParams.token;
  const from = validatedParams.from;
  const to = validatedParams.to;
  const amount = validatedParams.balance;

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
    `Transferring ${amount} tokens of ${tokenId} from ${fromAccountId} to ${toAccountId}`,
  );

  try {
    // 1. Create transfer transaction using Core API
    const transferTransaction = api.token.createTransferTransaction({
      tokenId,
      fromAccountId,
      toAccountId,
      amount,
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
      logger.log(`   Amount: ${amount}`);
      logger.log(`   Transaction ID: ${result.transactionId}`);

      // 3. Optionally update token state if needed
      // (e.g., update associations, balances, etc.)

      // Prepare output data
      const outputData: TransferTokenOutput = {
        transactionId: result.transactionId,
        tokenId,
        from: fromAccountId,
        to: toAccountId,
        amount: BigInt(amount),
      };

      return {
        status: Status.Success,
        outputJson: JSON.stringify(outputData, (key, value): unknown =>
          typeof value === 'bigint' ? value.toString() : value,
        ),
      };
    } else {
      return {
        status: Status.Failure,
        errorMessage: 'Token transfer failed',
      };
    }
  } catch (error: unknown) {
    return {
      status: Status.Failure,
      errorMessage: formatError('Failed to transfer token', error),
    };
  }
}

export { transferTokenHandler };
