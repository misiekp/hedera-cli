/**
 * Credentials Management Plugin Manifest
 * A plugin for managing operator credentials
 */
import { PluginManifest } from '../../core/plugins/plugin.interface';
import { setHandler } from './commands/set';
import { listHandler } from './commands/list';
import { removeHandler } from './commands/remove';

const credentialsManifest: PluginManifest = {
  name: 'credentials',
  version: '1.0.0',
  displayName: 'Credentials Management',
  description: 'Manage operator credentials and keys',
  compatibility: {
    cli: '>=1.0.0',
    core: '>=1.0.0',
    api: '>=1.0.0',
  },
  capabilities: ['credentials:manage', 'credentials:set', 'credentials:list'],
  stateSchemas: [
    {
      namespace: 'credentials',
      version: 1,
      jsonSchema: {
        type: 'object',
        properties: {
          accountId: { type: 'string' },
          privateKey: { type: 'string' },
          network: { type: 'string' },
          isDefault: { type: 'boolean' },
          createdAt: { type: 'string' },
        },
        required: [
          'accountId',
          'privateKey',
          'network',
          'isDefault',
          'createdAt',
        ],
        additionalProperties: false,
      },
      scope: 'profile',
    },
  ],
  commands: [
    {
      name: 'set',
      summary: 'Set operator credentials',
      description:
        'Set the default operator credentials for signing transactions',
      options: [
        { name: 'account-id', short: 'a', type: 'string', required: true },
        { name: 'private-key', short: 'p', type: 'string', required: true },
        { name: 'network', short: 'n', type: 'string', required: false },
      ],
      handler: setHandler,
    },
    {
      name: 'list',
      summary: 'List all credentials',
      description: 'Show all stored credentials',
      handler: listHandler,
    },
    {
      name: 'remove',
      summary: 'Remove credentials',
      description: 'Remove credentials for a specific keyRefId',
      options: [
        { name: 'key-ref-id', short: 'k', type: 'string', required: true },
      ],
      handler: removeHandler,
    },
  ],
};

export default credentialsManifest;
