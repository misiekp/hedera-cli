/**
 * HBAR Transfer Command Handler
 * Handles HBAR transfers using the Core API
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { formatError } from '../../../../utils/errors';
import { TransferOutput } from './output';

export async function transferHandler(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api, logger } = args;

  const amount = Number(args.args.balance);
  const to = args.args.toIdOrNameOrAlias
    ? (args.args.toIdOrNameOrAlias as string)
    : '';
  let from = args.args.fromIdOrNameOrAlias
    ? (args.args.fromIdOrNameOrAlias as string)
    : '';
  const memo = args.args.memo ? (args.args.memo as string) : '';

  logger.log('[HBAR] Transfer command invoked');

  try {
    // Basic validation
    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        status: 'failure',
        errorMessage: 'Invalid balance: provide a positive number of tinybars',
      };
    }

    if (!to) {
      return {
        status: 'failure',
        errorMessage: '--to-id-or-name-or-alias is required',
      };
    }

    // Fallback to operator from env if from not provided
    if (!from) {
      const currentNetwork = api.network.getCurrentNetwork();
      const operator = api.network.getOperator(currentNetwork);
      if (operator) {
        from = operator.accountId;
        logger.log(`[HBAR] Using default operator as from: ${from}`);
      } else {
        return {
          status: 'failure',
          errorMessage:
            `No --from provided and no default operator configured for network ${currentNetwork}. ` +
            'Provide --from <accountId|name|alias> for the current network.',
        };
      }
    }

    if (from === to) {
      return {
        status: 'failure',
        errorMessage: 'Cannot transfer to the same account',
      };
    }

    // Get current network for alias resolution
    const currentNetwork = api.network.getCurrentNetwork();

    // Resolve from/to using alias service
    let fromAccountId = from;
    let toAccountId = to;

    // Resolve from account
    const fromAlias = api.alias.resolve(from, 'account', currentNetwork);
    if (fromAlias) {
      fromAccountId = fromAlias.entityId || from;
      logger.log(`[HBAR] Resolved from alias: ${from} -> ${fromAccountId}`);
    } else {
      logger.log(`[HBAR] Using from as account ID: ${from}`);
    }

    // Resolve to account
    const toAlias = api.alias.resolve(to, 'account', currentNetwork);
    if (toAlias) {
      toAccountId = toAlias.entityId || to;
      logger.log(`[HBAR] Resolved to alias: ${to} -> ${toAccountId}`);
    } else {
      logger.log(`[HBAR] Using to as account ID: ${to}`);
    }

    logger.log(
      `[HBAR] Transferring ${amount} tinybars from ${fromAccountId} to ${toAccountId}`,
    );

    if (!api.hbar) {
      return {
        status: 'failure',
        errorMessage: 'Core API hbar module not available',
      };
    }

    // Create the transfer transaction
    const transferResult = await api.hbar.transferTinybar({
      amount,
      from: fromAccountId,
      to: toAccountId,
      memo,
    });

    // Sign and execute the transaction
    // Try to get keyRefId: first from alias, then from state by accountId/name
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
        status: 'failure',
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
      status: 'success',
      outputJson: JSON.stringify(outputData, (_key: string, value: unknown) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    };
  } catch (error) {
    return {
      status: 'failure',
      errorMessage: formatError('Transfer failed', error),
    };
  }
}
