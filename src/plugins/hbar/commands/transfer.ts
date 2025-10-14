import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';

export default async function transferHandler(
  args: CommandHandlerArgs,
): Promise<void> {
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

  // Basic validation
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid balance: provide a positive number of tinybars');
  }

  if (!to) {
    throw new Error('--to-id-or-name-or-alias is required');
  }

  // Fallback to default operator from env if from not provided
  if (!from) {
    const defaultOp =
      api.credentialsState.getOperator() ||
      api.credentialsState.ensureDefaultFromEnv();
    if (defaultOp) {
      from = defaultOp.accountId;
      logger.log(`[HBAR] Using default operator as from: ${from}`);
    } else {
      throw new Error(
        'No --from provided and no default operator found in env (TESTNET_OPERATOR_ID/KEY)',
      );
    }
  }

  if (from === to) {
    throw new Error('Cannot transfer to the same account');
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

  if (api.hbar) {
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
      ? await api.signing.signAndExecuteWith(transferResult.transaction, {
          keyRefId: fromKeyRefId,
        })
      : await api.signing.signAndExecute(transferResult.transaction);

    if (result.success) {
      logger.log(
        `[HBAR] Transfer submitted successfully, txId=${result.transactionId}`,
      );
    } else {
      logger.error(`[HBAR] Transfer failed: ${result.receipt?.status.status}`);
      process.exit(1);
    }
  } else {
    logger.log('[HBAR] Core API hbar module not available yet');
  }
}
