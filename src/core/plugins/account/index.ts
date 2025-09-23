import { PluginManifest } from '../../interfaces';
import { balanceCommand } from './balance.command';

export const accountPlugin: PluginManifest = {
  name: 'Account Plugin',
  cliName: 'account',
  description: 'Perform operations across your Hedera account.',
  capabilities: [],
  commands: [balanceCommand],
  compatibility: {
    api: '0.1',
    cli: '0.1',
    core: '0.1',
  },
  version: '1.0',
  stateSchemas: [],
};
