import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';

export default async function transferHandler(
  args: CommandHandlerArgs,
): Promise<void> {
  const { api, logger } = args;

  const amount = Number(args.args.balance);
  const to = args.args.toIdOrNameOrAlias
    ? (args.args.toIdOrNameOrAlias as string)
    : '';
  const from = args.args.fromIdOrNameOrAlias
    ? (args.args.fromIdOrNameOrAlias as string)
    : '';
  const memo = args.args.memo ? (args.args.memo as string) : '';

  logger.log('[HBAR] Transfer command invoked');

  // Basic validation
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid balance: provide a positive number of tinybars');
  }

  if (!from || !to) {
    throw new Error(
      'Both --from-id-or-name-or-alias and --to-id-or-name-or-alias are required',
    );
  }

  if (from === to) {
    throw new Error('Cannot transfer to the same account');
  }

  // Resolve from/to using alias service
  let fromAccountId = from;
  let toAccountId = to;

  // Resolve from account
  const fromAlias = api.alias.resolve(from, 'account');
  if (fromAlias) {
    fromAccountId = fromAlias.entityId || from;
    logger.log(`[HBAR] Resolved from alias: ${from} -> ${fromAccountId}`);
  } else {
    logger.log(`[HBAR] Using from as account ID: ${from}`);
  }

  // Resolve to account
  const toAlias = api.alias.resolve(to, 'account');
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
    // If we have a fromAlias with keyRefId, use it; otherwise use default operator
    const result = fromAlias?.keyRefId
      ? await api.signing.signAndExecuteWith(transferResult.transaction, {
          keyRefId: fromAlias.keyRefId,
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
