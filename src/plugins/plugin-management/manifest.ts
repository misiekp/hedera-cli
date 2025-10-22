/**
 * Plugin Management Plugin Manifest
 * A plugin for managing other plugins
 */
import { PluginManifest } from '../../core/plugins/plugin.interface';

const pluginManagementManifest: PluginManifest = {
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
      handler: 'commands/add',
    },
    {
      name: 'remove',
      summary: 'Remove a plugin',
      description: 'Remove a plugin from the system',
      options: [{ name: 'name', short: 'n', type: 'string', required: true }],
      handler: 'commands/remove',
    },
    {
      name: 'list',
      summary: 'List all plugins',
      description: 'Show all loaded plugins',
      handler: 'commands/list',
    },
    {
      name: 'info',
      summary: 'Get plugin information',
      description: 'Show detailed information about a specific plugin',
      options: [{ name: 'name', short: 'n', type: 'string', required: true }],
      handler: 'commands/info',
    },
  ],
};

export default pluginManagementManifest;
