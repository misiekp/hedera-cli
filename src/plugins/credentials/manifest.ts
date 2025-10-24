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
      description: 'Set operator credentials for signing transactions.',
      options: [
        {
          name: 'operator',
          short: 'o',
          type: 'string',
          required: true,
          description:
            'Operator credentials: alias or account-id:private-key pair',
        },
        { name: 'network', short: 'n', type: 'string', required: false },
      ],
      handler: 'commands/set',
    },
    {
      name: 'list',
      summary: 'List all credentials',
      description: 'Show all stored credentials',
      handler: 'commands/list',
    },
    {
      name: 'remove',
      summary: 'Remove operator credentials',
      description:
        'Remove operator credentials by keyRefId or for a specific network',
      options: [
        { name: 'key-ref-id', short: 'k', type: 'string', required: false },
        { name: 'network', short: 'N', type: 'string', required: false },
      ],
      handler: 'commands/remove',
    },
  ],
};

export default credentialsManifest;
