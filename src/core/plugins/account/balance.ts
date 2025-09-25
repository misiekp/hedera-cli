import { CommandSpec } from '../../interfaces';

interface GetAccountBalanceOptions {
  accountIdOrName: string;
  onlyHbar: boolean;
  tokenId: string;
}

export const balanceCommand: CommandSpec<GetAccountBalanceOptions> = {
  name: 'Balance Command',
  cliName: 'balance',
  description: 'Retrieve the balance for an account ID or name',
  options: [
    {
      flags: '-a, --account-id-or-name <accountIdOrName>',
      description:
        '(Required) Account ID or account name to retrieve balance for',
      required: true,
    },
    {
      flags: '-h, --only-hbar',
      description: 'Show only Hbar balance',
    },
    {
      flags: '-t, --token-id <tokenId>',
      description: 'Show balance for a specific token ID',
    },
  ],
  async handler(options, { api, errors }) {
    if (options.onlyHbar && options.tokenId) {
      throw new errors.DomainError(
        'You cannot use both --only-hbar and --token-id options at the same time.',
      );
    }

    await api.account.getAccountBalance(
      options.accountIdOrName,
      options.onlyHbar,
      options.tokenId,
    );

    if (api.output.isJsonOutput()) {
      api.output.printOutput('accountBalance', {
        target: options.accountIdOrName,
        onlyHbar: options.onlyHbar || false,
        tokenId: options.tokenId || null,
      });
    }
  },
  config: {
    log: (o) => `Getting balance for ${o.accountIdOrName}`,
  },
};
