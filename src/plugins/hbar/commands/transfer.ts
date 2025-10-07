import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { ZustandAccountStateHelper } from '../../account/zustand-state-helper';
import enquirerUtils from '../../../utils/enquirer';

export default async function transferHandler({
  args,
  api,
  logger,
}: CommandHandlerArgs): Promise<void> {
  const amount = Number(args.balance);
  let to = String(args.to || '');
  let from = String(args.from || '');
  const memo = String(args.memo || '');

  logger.log('[HBAR] Transfer command invoked');
  // Basic validation
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid balance: provide a positive number of tinybars');
  }

  // Prepare account selection when needed
  const helper = new ZustandAccountStateHelper(api.state, api.logger);
  const network = api.network.getCurrentNetwork();
  const accounts = helper.getAccountsByNetwork(network);

  if (!from) {
    // Fallback: default credentials as sender if available
    const creds = await api.credentials.getDefaultCredentials();
    if (creds && creds.accountId) {
      from = creds.accountId;
    }

    if (accounts.length === 0) {
      if (!from) {
        throw new Error(
          'No accounts found to transfer from. Provide --from or create/import an account.',
        );
      }
    }
    if (!from && accounts.length > 0) {
      const selection = await enquirerUtils.createPrompt(
        accounts.map((a) => a.name),
        'Choose account to transfer hbar from:',
      );
      from = selection;
    }
  }

  if (!to) {
    if (accounts.length === 0) {
      throw new Error(
        'No accounts found to transfer to. Create or import an account first.',
      );
    }
    const selection = await enquirerUtils.createPrompt(
      accounts.map((a) => a.name),
      'Choose account to transfer hbar to:',
    );
    to = selection;
  }

  if (from === to) {
    throw new Error('Cannot transfer to the same account');
  }

  if (!from || !to) {
    throw new Error(
      'Both --from and --to must be provided or selected interactively',
    );
  }

  if (api.hbar) {
    const result = await api.hbar.transferTinybar({ amount, from, to, memo });
    logger.log(`[HBAR] Submitted transfer, txId=${result.transactionId}`);
  } else {
    logger.log('[HBAR] Core API hbar module not available yet');
  }
}
