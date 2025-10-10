/**
 * Network Plugin Manifest
 * Defines the network plugin
 */
import { PluginManifest } from '../../core/plugins/plugin.interface';

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
      handler: './commands/list',
    },
    {
      name: 'use',
      summary: 'Switch to a specific network',
      description: 'Switch the active network to the specified network name',
      arguments: '<name>',
      handler: './commands/use',
    },
  ],
  init: () => {
    console.log('[NETWORK PLUGIN] Initializing network plugin...');
  },
  teardown: () => {
    console.log('[NETWORK PLUGIN] Tearing down network plugin...');
  },
};

export default networkPluginManifest;
