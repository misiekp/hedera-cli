/**
 * State Management Plugin Manifest
 * A plugin for managing state data across all plugins
 * Compliant with ADR-003: Result-Oriented Command Handler Contract
 */
import { PluginManifest } from '../../core/plugins/plugin.interface';
import { ListStateOutputSchema, LIST_STATE_TEMPLATE } from './commands/list';
import { ClearStateOutputSchema, CLEAR_STATE_TEMPLATE } from './commands/clear';
import { StateInfoOutputSchema, STATE_INFO_TEMPLATE } from './commands/info';
import {
  StateBackupOutputSchema,
  STATE_BACKUP_TEMPLATE,
} from './commands/backup';
import { StateStatsOutputSchema, STATE_STATS_TEMPLATE } from './commands/stats';

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
      handler: './commands/list/handler',
      output: {
        schema: ListStateOutputSchema,
        humanTemplate: LIST_STATE_TEMPLATE,
      },
    },
    {
      name: 'clear',
      summary: 'Clear state data',
      description: 'Clear state data for a specific namespace or all data',
      options: [
        { name: 'namespace', short: 'n', type: 'string', required: false },
        { name: 'confirm', short: 'c', type: 'boolean', required: false },
      ],
      handler: './commands/clear/handler',
      output: {
        schema: ClearStateOutputSchema,
        humanTemplate: CLEAR_STATE_TEMPLATE,
      },
    },
    {
      name: 'info',
      summary: 'Show state information',
      description: 'Display information about stored state data',
      handler: './commands/info/handler',
      output: {
        schema: StateInfoOutputSchema,
        humanTemplate: STATE_INFO_TEMPLATE,
      },
    },
    {
      name: 'backup',
      summary: 'Create state backup',
      description: 'Create a backup of all state data',
      options: [
        { name: 'output', short: 'o', type: 'string', required: false },
      ],
      handler: './commands/backup/handler',
      output: {
        schema: StateBackupOutputSchema,
        humanTemplate: STATE_BACKUP_TEMPLATE,
      },
    },
    {
      name: 'stats',
      summary: 'Show state statistics',
      description: 'Display detailed statistics about stored state data',
      handler: './commands/stats/handler',
      output: {
        schema: StateStatsOutputSchema,
        humanTemplate: STATE_STATS_TEMPLATE,
      },
    },
  ],
};

export default stateManagementManifest;
