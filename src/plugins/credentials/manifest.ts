/**
 * Credentials Management Plugin Manifest
 * A plugin for managing operator credentials
 */
import { PluginManifest } from '../../core/plugins/plugin.interface';

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
        { name: 'accountId', type: 'string', required: true },
        { name: 'privateKey', type: 'string', required: true },
        { name: 'network', type: 'string', required: false },
      ],
      handler: 'commands/set',
    },
    {
      name: 'get',
      summary: 'Get default operator',
      description:
        'Show the default operator credentials for a specific network',
      options: [
        {
          name: 'network',
          type: 'string',
          required: false,
          description: 'Network name (defaults to current network)',
        },
      ],
      handler: 'commands/get',
    },
    {
      name: 'list',
      summary: 'List all credentials',
      description: 'Show all stored credentials',
      handler: 'commands/list',
    },
    {
      name: 'remove',
      summary: 'Remove credentials',
      description: 'Remove credentials for a specific keyRefId',
      options: [{ name: 'keyRefId', type: 'string', required: true }],
      handler: 'commands/remove',
    },
  ],
};

export default credentialsManifest;
