/**
 * Plugin Management Plugin Manifest
 * A plugin for managing other plugins
 */
import { PluginManifest } from '../../core/plugins/plugin.interface';
import {
  AddPluginOutputSchema,
  ADD_PLUGIN_TEMPLATE,
} from './commands/add/output';
import {
  RemovePluginOutputSchema,
  REMOVE_PLUGIN_TEMPLATE,
} from './commands/remove/output';
import {
  ListPluginsOutputSchema,
  LIST_PLUGINS_TEMPLATE,
} from './commands/list/output';
import {
  PluginInfoOutputSchema,
  PLUGIN_INFO_TEMPLATE,
} from './commands/info/output';

export const pluginManagementManifest: PluginManifest = {
  name: 'plugin-management',
  version: '1.0.0',
  displayName: 'Plugin Management',
  description: 'Manage plugins (add, remove, list, info)',
  compatibility: {
    cli: '>=1.0.0',
    core: '>=1.0.0',
    api: '>=1.0.0',
  },
  capabilities: ['plugin:manage', 'plugin:list', 'plugin:info'],
  commands: [
    {
      name: 'add',
      summary: 'Add a plugin from path',
      description: 'Add a new plugin to the system from a file path',
      options: [{ name: 'path', short: 'p', type: 'string', required: true }],
      handler: './commands/add/handler',
      output: {
        schema: AddPluginOutputSchema,
        humanTemplate: ADD_PLUGIN_TEMPLATE,
      },
    },
    {
      name: 'remove',
      summary: 'Remove a plugin',
      description: 'Remove a plugin from the system',
      options: [{ name: 'name', short: 'n', type: 'string', required: true }],
      handler: './commands/remove/handler',
      output: {
        schema: RemovePluginOutputSchema,
        humanTemplate: REMOVE_PLUGIN_TEMPLATE,
      },
    },
    {
      name: 'list',
      summary: 'List all plugins',
      description: 'Show all loaded plugins',
      handler: './commands/list/handler',
      output: {
        schema: ListPluginsOutputSchema,
        humanTemplate: LIST_PLUGINS_TEMPLATE,
      },
    },
    {
      name: 'info',
      summary: 'Get plugin information',
      description: 'Show detailed information about a specific plugin',
      options: [{ name: 'name', short: 'n', type: 'string', required: true }],
      handler: './commands/info/handler',
      output: {
        schema: PluginInfoOutputSchema,
        humanTemplate: PLUGIN_INFO_TEMPLATE,
      },
    },
  ],
};

export default pluginManagementManifest;
