/**
 * Network Plugin Manifest
 * Defines the network plugin
 */
import { PluginManifest } from '../../core/plugins/plugin.interface';
import { listHandler } from './commands/list';
import { useHandler } from './commands/use';
import { setOperatorHandler } from './commands/set-operator';
import { getOperatorHandler } from './commands/get-operator';

export const networkPluginManifest: PluginManifest = {
  name: 'network',
  version: '1.0.0',
  displayName: 'Network Plugin',
  description: 'Plugin for managing Hedera network configurations',
  compatibility: {
    cli: '^1.0.0',
    core: '^1.0.0',
    api: '^1.0.0',
  },
  capabilities: ['state:read', 'state:write', 'config:read'],
  commands: [
    {
      name: 'list',
      summary: 'List all available networks',
      description:
        'List all available networks with their configuration and health status',
      options: [],
      handler: listHandler,
    },
    {
      name: 'use',
      summary: 'Switch to a specific network',
      description: 'Switch the active network to the specified network name',
      options: [
        {
          name: 'network',
          short: 'N',
          type: 'string',
          required: true,
          description: 'Network name (testnet, mainnet, previewnet, localnet)',
        },
      ],
      handler: useHandler,
    },
    {
      name: 'set-operator',
      summary: 'Set operator for a network',
      description:
        'Set operator credentials for signing transactions on a specific network',
      options: [
        {
          name: 'operator',
          short: 'o',
          type: 'string',
          required: true,
          description:
            'Operator credentials: alias or account-id:private-key pair',
        },
        {
          name: 'network',
          short: 'n',
          type: 'string',
          required: false,
          description: 'Target network (defaults to current network)',
        },
      ],
      handler: setOperatorHandler,
    },
    {
      name: 'get-operator',
      summary: 'Get operator for a network',
      description: 'Get operator credentials for a specific network',
      options: [
        {
          name: 'network',
          short: 'n',
          type: 'string',
          required: false,
          description: 'Target network (defaults to current network)',
        },
      ],
      handler: getOperatorHandler,
    },
  ],
};

export default networkPluginManifest;
