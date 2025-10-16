/**
 * State Management Plugin Manifest
 * A plugin for managing state data across all plugins
 */
import { PluginManifest } from '../../core/plugins/plugin.interface';

const stateManagementManifest: PluginManifest = {
  name: 'state-management',
  version: '1.0.0',
  displayName: 'State Management',
  description: 'Manage state data for all plugins',
  compatibility: {
    cli: '>=1.0.0',
    core: '>=1.0.0',
    api: '>=1.0.0',
  },
  capabilities: ['state:manage', 'state:backup', 'state:restore'],
  commands: [
    {
      name: 'list',
      summary: 'List all state data',
      description: 'Show all stored state data across plugins',
      options: [{ name: 'namespace', type: 'string', required: false }],
      handler: 'commands/list',
    },
    {
      name: 'clear',
      summary: 'Clear state data',
      description: 'Clear state data for a specific namespace or all data',
      options: [
        { name: 'namespace', type: 'string', required: false },
        { name: 'confirm', type: 'boolean', required: false },
      ],
      handler: 'commands/clear',
    },
    {
      name: 'info',
      summary: 'Show state information',
      description: 'Display information about stored state data',
      handler: 'commands/info',
    },
  ],
};

export default stateManagementManifest;
