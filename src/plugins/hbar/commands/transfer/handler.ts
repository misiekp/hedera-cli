/**
 * HBAR Transfer Command Handler
 * Handles HBAR transfers using the Core API
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { formatError } from '../../../../utils/errors';
import { EntityIdSchema } from '../../../../core/schemas/common-schemas';
import { Status } from '../../../../core/shared/constants';
import { TransferInputSchema, TransferOutput } from './output';

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
      if (firstError.path[0] === 'toIdOrNameOrAlias') {
        return {
          status: Status.Failure,
          errorMessage: '--to-id-or-name-or-alias is required',
        };
      }
      return {
        status: Status.Failure,
        errorMessage: 'Invalid input',
      };
    }

    const validatedInput = validationResult.data;
    const amount = validatedInput.balance;
    const to = validatedInput.toIdOrNameOrAlias;
    const fromInput = validatedInput.fromIdOrNameOrAlias;
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

    let fromAccountId = from;
    let toAccountId = to;
    let fromAlias;

    if (EntityIdSchema.safeParse(from).success) {
      fromAccountId = from;
      logger.log(`[HBAR] Using from as account ID: ${from}`);
    } else {
      fromAlias = api.alias.resolve(from, 'account', currentNetwork);
      if (fromAlias) {
        fromAccountId = fromAlias.entityId || from;
        logger.log(`[HBAR] Resolved from alias: ${from} -> ${fromAccountId}`);
      } else {
        return {
          status: Status.Failure,
          errorMessage: `Invalid from account: ${from} is neither a valid account ID nor a known alias`,
        };
      }
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

    let fromKeyRefId = fromAlias?.keyRefId;
    if (!fromKeyRefId) {
      const accounts = api.state.list<{
        accountId: string;
        name: string;
        keyRefId?: string;
      }>('account-accounts');
      const account = accounts.find(
        (a) => a.accountId === from || a.name === from,
      );
      fromKeyRefId = account?.keyRefId;
    }

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
