/**
 * Token Plugin Manifest
 * Defines the token plugin according to ADR-001
 */
import { PluginManifest } from '../../core/plugins/plugin.interface';
import { TOKEN_JSON_SCHEMA, TOKEN_NAMESPACE } from './schema';

export const tokenPluginManifest: PluginManifest = {
  name: 'token',
  version: '1.0.0',
  displayName: 'Token Plugin',
  description: 'Plugin for managing Hedera tokens',
  compatibility: {
    cli: '^1.0.0',
    core: '^1.0.0',
    api: '^1.0.0',
  },
  capabilities: [
    `state:namespace:${TOKEN_NAMESPACE}`,
    'network:read',
    'network:write',
    'tx-execution:use',
  ],
  commands: [
    {
      name: 'transfer',
      summary: 'Transfer a fungible token',
      description: 'Transfer a fungible token from one account to another',
      options: [
        {
          name: 'token',
          type: 'string',
          required: true,
          description: 'Token: either a token alias or token-id',
        },
        {
          name: 'to',
          type: 'string',
          required: true,
          description: 'Destination account: either an alias or account-id',
        },
        {
          name: 'from',
          type: 'string',
          required: true,
          description:
            'Source account: either an alias or account-id:private-key pair',
        },
        { name: 'balance', type: 'number', required: true },
      ],
      handler: './commands/transfer',
    },
    {
      name: 'create',
      summary: 'Create a new fungible token',
      description: 'Create a new fungible token with specified properties',
      options: [
        { name: 'name', type: 'string', required: true },
        { name: 'symbol', type: 'string', required: true },
        {
          name: 'treasury',
          type: 'string',
          required: false,
          description:
            'Treasury account: either an alias or treasury-id:treasury-key pair',
        },
        { name: 'decimals', type: 'number', required: false, default: 0 },
        {
          name: 'initial-supply',
          type: 'number',
          required: false,
          default: 1000000,
        },
        {
          name: 'supply-type',
          type: 'string',
          required: false,
          default: 'INFINITE',
        },
        { name: 'max-supply', type: 'number', required: false },
        { name: 'admin-key', type: 'string', required: false },
        {
          name: 'alias',
          type: 'string',
          required: false,
          description: 'Optional alias to register for the token',
        },
      ],
      handler: './commands/create',
    },
    {
      name: 'associate',
      summary: 'Associate a token with an account',
      description: 'Associate a token with an account to enable transfers',
      options: [
        {
          name: 'token',
          type: 'string',
          required: true,
          description: 'Token: either a token alias or token-id',
        },
        {
          name: 'account',
          type: 'string',
          required: true,
          description:
            'Account: either an alias or account-id:account-key pair',
        },
      ],
      handler: './commands/associate',
    },
    {
      name: 'create-from-file',
      summary: 'Create a new token from a file',
      description:
        'Create a new token from a JSON file definition with advanced features',
      options: [
        { name: 'file', type: 'string', required: true },
        { name: 'args', type: 'string', required: false },
      ],
      handler: './commands/createFromFile',
    },
    {
      name: 'list',
      summary: 'List all tokens',
      description:
        'List all tokens stored in state for the current network or a specified network',
      options: [
        {
          name: 'keys',
          type: 'boolean',
          required: false,
          default: false,
          description: 'Show token key information (admin, supply, wipe, etc.)',
        },
        {
          name: 'network',
          type: 'string',
          required: false,
          description:
            'Filter tokens by network (defaults to current active network)',
        },
      ],
      handler: './commands/list',
    },
  ],
  stateSchemas: [
    {
      namespace: TOKEN_NAMESPACE,
      version: 1,
      jsonSchema: TOKEN_JSON_SCHEMA,
      scope: 'profile',
    },
  ],
  init: () => {
    console.log('[TOKEN PLUGIN] Initializing token plugin...');
    // Plugin initialization logic
  },
  teardown: () => {
    console.log('[TOKEN PLUGIN] Tearing down token plugin...');
    // Plugin cleanup logic
  },
};

export default tokenPluginManifest;
