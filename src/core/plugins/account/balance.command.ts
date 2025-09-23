import { CommandSpec } from '../../interfaces';

export const balanceCommand: CommandSpec = {
  name: 'Balance Command',
  cliName: 'balance',
  description: 'Check balance of your Hedera Account',
  options: [],
  handler: () => {
    console.log('Example command result...');
  },
};
