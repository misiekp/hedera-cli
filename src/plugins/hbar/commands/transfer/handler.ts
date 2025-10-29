/**
 * HBAR Transfer Command Handler
 * Handles HBAR transfers using the Core API
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { formatError } from '../../../../utils/errors';
import {
  AccountIdKeyPairSchema,
  EntityIdSchema,
} from '../../../../core/schemas/common-schemas';
import { Status } from '../../../../core/shared/constants';
import { TransferInputSchema } from '../../schema';
import { TransferOutput } from './output';
import { AliasRecord } from '../../../../core/services/alias/alias-service.interface';

/**
 * Parse and validate an account-id:private-key pair
 *
 * @param idKeyPair - The colon-separated account-id:private-key string
 * @param api - Core API instance for importing the key
 * @returns Object with accountId, keyRefId, and publicKey
 * @throws Error if the format is invalid or account ID doesn't match expected pattern
 */
function parseAccountIdKeyPair(
  idKeyPair: string,
  api: CommandHandlerArgs['api'],
): { accountId: string; keyRefId: string; publicKey: string } {
  const parts = idKeyPair.split(':');
  if (parts.length !== 2) {
    throw new Error(
      'Invalid account format. Expected either an alias or account-id:account-key',
    );
  }

  const [accountId, privateKey] = parts;

  // Validate account ID format
  const accountIdPattern = /^0\.0\.\d+$/;
  if (!accountIdPattern.test(accountId)) {
    throw new Error(
      `Invalid account ID format: ${accountId}. Expected format: 0.0.123456`,
    );
  }

  // Import the private key
  const imported = api.kms.importPrivateKey(privateKey);

  return {
    accountId,
    keyRefId: imported.keyRefId,
    publicKey: imported.publicKey,
  };
}

export async function transferHandler(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api, logger } = args;

  logger.log('[HBAR] Transfer command invoked');

  try {
    const validationResult = TransferInputSchema.safeParse(args.args);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      if (firstError.path[0] === 'balance') {
        return {
          status: Status.Failure,
          errorMessage:
            'Invalid balance: provide a positive number of tinybars',
        };
      }
      if (firstError.path[0] === 'to') {
        return {
          status: Status.Failure,
          errorMessage: '--to is required',
        };
      }
      return {
        status: Status.Failure,
        errorMessage: 'Invalid input',
      };
    }

    const validatedInput = validationResult.data;
    const amount = validatedInput.balance;
    const to = validatedInput.to;
    const fromInput = validatedInput.from;
    const memo = validatedInput.memo;

    if (fromInput && fromInput === to) {
      return {
        status: Status.Failure,
        errorMessage: 'Cannot transfer to the same account',
      };
    }

    let from = fromInput;
    if (!from) {
      const currentNetwork = api.network.getCurrentNetwork();
      const operator = api.network.getOperator(currentNetwork);
      if (operator) {
        from = operator.accountId;
        logger.log(`[HBAR] Using default operator as from: ${from}`);
      } else {
        return {
          status: Status.Failure,
          errorMessage:
            `No --from provided and no default operator configured for network ${currentNetwork}. ` +
            'Provide --from <accountId|name|alias> for the current network.',
        };
      }
    }

    const currentNetwork = api.network.getCurrentNetwork();

    let fromAccountId: string | undefined;
    let toAccountId = to;
    let fromAlias: AliasRecord | null;
    let fromKeyRefId: string | undefined;

    // Check if it's an account-id:private-key pair
    if (AccountIdKeyPairSchema.safeParse(from).success) {
      try {
        const parsed = parseAccountIdKeyPair(from, api);
        fromAccountId = parsed.accountId;
        fromKeyRefId = parsed.keyRefId;
        logger.log(
          `[HBAR] Using from as account ID with private key: ${fromAccountId}`,
        );
      } catch (error) {
        return {
          status: Status.Failure,
          errorMessage: `Invalid from account format: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    } else {
      fromAlias = api.alias.resolve(from, 'account', currentNetwork);
      fromAccountId = fromAlias?.entityId;
      fromKeyRefId = fromAlias?.keyRefId;
      if (!fromAccountId || !fromKeyRefId) {
        return {
          status: Status.Failure,
          errorMessage: `Invalid from account: ${from} is neither a valid account-id:private-key pair, nor a known account name`,
        };
      }
      logger.log(`[HBAR] Resolved from alias: ${from} -> ${fromAccountId}`);
    }

    if (EntityIdSchema.safeParse(to).success) {
      toAccountId = to;
      logger.log(`[HBAR] Using to as account ID: ${to}`);
    } else {
      const toAlias = api.alias.resolve(to, 'account', currentNetwork);
      if (toAlias) {
        toAccountId = toAlias.entityId || to;
        logger.log(`[HBAR] Resolved to alias: ${to} -> ${toAccountId}`);
      } else {
        return {
          status: Status.Failure,
          errorMessage: `Invalid to account: ${to} is neither a valid account ID nor a known alias`,
        };
      }
    }

    logger.log(
      `[HBAR] Transferring ${amount} tinybars from ${fromAccountId} to ${toAccountId}`,
    );

    const transferResult = await api.hbar.transferTinybar({
      amount,
      from: fromAccountId,
      to: toAccountId,
      memo,
    });

    const result = fromKeyRefId
      ? await api.txExecution.signAndExecuteWith(transferResult.transaction, {
          keyRefId: fromKeyRefId,
        })
      : await api.txExecution.signAndExecute(transferResult.transaction);

    if (!result.success) {
      return {
        status: Status.Failure,
        errorMessage: `Transfer failed: ${result.receipt?.status?.status ?? 'UNKNOWN'}`,
      };
    }

    logger.log(
      `[HBAR] Transfer submitted successfully, txId=${result.transactionId}`,
    );

    const outputData: TransferOutput = {
      transactionId: result.transactionId || '',
      fromAccountId,
      toAccountId,
      amountTinybar: BigInt(amount),
      network: currentNetwork,
      ...(memo && { memo }),
      ...(result.receipt?.status && {
        status: result.receipt.status.status,
      }),
    };

    return {
      status: Status.Success,
      outputJson: JSON.stringify(outputData, (_key: string, value: unknown) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    };
  } catch (error) {
    return {
      status: Status.Failure,
      errorMessage: formatError('Transfer failed', error),
    };
  }
}
