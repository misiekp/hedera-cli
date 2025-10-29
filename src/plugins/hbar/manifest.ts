/**
 * HBAR Plugin Manifest
 * Defines the hbar plugin and its commands
 */
import { PluginManifest } from '../../core/plugins/plugin.interface';
import { hbarTransferHandler } from './commands/transfer';

export const hbarPluginManifest: PluginManifest = {
  name: 'hbar',
  version: '1.0.0',
  displayName: 'HBAR Plugin',
  description: 'HBAR related commands (transfer etc.)',
  compatibility: {
    cli: '^1.0.0',
    core: '^1.0.0',
    api: '^1.0.0',
  },
  capabilities: ['tx-execution:use', 'network:read'],
  commands: [
    {
      name: 'transfer',
      summary: 'Transfer tinybars between accounts',
      description: 'Transfer HBAR (tinybars) from one account to another',
      options: [
        {
          name: 'balance',
          short: 'b',
          type: 'string',
          required: true,
          description:
            'Amount in HBAR (display units by default, add "t" for tinybar). Default: display units. Example: "1" = 1 HBAR, "100t" = 100 tinybar',
        },
        {
          name: 'to-id-or-name-or-alias',
          short: 't',
          type: 'string',
          required: true,
          description: 'Account ID, name, or alias to transfer to',
        },
        {
          name: 'from-id-or-name-or-alias',
          short: 'f',
          type: 'string',
          required: false,
          description:
            'Account ID, name, or alias to transfer from (defaults to operator from env)',
        },
        {
          name: 'memo',
          short: 'm',
          type: 'string',
          required: false,
          description: 'Memo for the transfer',
        },
      ],
      handler: hbarTransferHandler,
    },
  ],
};

export default hbarPluginManifest;
