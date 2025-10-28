/**
 * State Management Plugin Manifest
 * A plugin for managing state data across all plugins
 */
import { PluginManifest } from '../../core';
import { listHandler } from './commands/list';
import { clearHandler } from './commands/clear';
import { infoHandler } from './commands/info';

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
      options: [
        { name: 'namespace', short: 'n', type: 'string', required: false },
      ],
      handler: listHandler,
    },
    {
      name: 'clear',
      summary: 'Clear state data',
      description: 'Clear state data for a specific namespace or all data',
      options: [
        { name: 'namespace', short: 'n', type: 'string', required: false },
        { name: 'confirm', short: 'c', type: 'boolean', required: false },
      ],
      handler: clearHandler,
    },
    {
      name: 'info',
      summary: 'Show state information',
      description: 'Display information about stored state data',
      handler: infoHandler,
    },
  ],
};

export default stateManagementManifest;
