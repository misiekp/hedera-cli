/**
 * Token Plugin Manifest
 * Defines the token plugin according to ADR-001
 */
import { PluginManifest } from '../../core/plugins/plugin.interface';
import { TOKEN_JSON_SCHEMA, TOKEN_NAMESPACE } from './schema';
import { transferTokenHandler } from './commands/transfer';
import { createTokenHandler } from './commands/create';
import { associateTokenHandler } from './commands/associate';
import { createTokenFromFileHandler } from './commands/createFromFile';
import { listTokensHandler } from './commands/list';

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
          short: 't',
          type: 'string',
          required: true,
          description: 'Token: either a token alias or token-id',
        },
        {
          name: 'to',
          short: 'T',
          type: 'string',
          required: true,
          description: 'Destination account: either an alias or account-id',
        },
        {
          name: 'from',
          short: 'f',
          type: 'string',
          required: false,
          description:
            'Source account: either a name or account-id:private-key pair',
        },
        {
          name: 'balance',
          short: 'b',
          type: 'string',
          required: true,
          description:
            'Amount to transfer. Default: display units (with decimals applied). Append "t" for raw base units (e.g., "100t")',
        },
      ],
      handler: transferTokenHandler,
    },
    {
      name: 'create',
      summary: 'Create a new fungible token',
      description: 'Create a new fungible token with specified properties',
      options: [
        { name: 'token-name', short: 'N', type: 'string', required: true },
        { name: 'symbol', short: 's', type: 'string', required: true },
        {
          name: 'treasury',
          short: 't',
          type: 'string',
          required: false,
          description:
            'Treasury account: either an alias or treasury-id:treasury-key pair',
        },
        {
          name: 'decimals',
          short: 'd',
          type: 'number',
          required: false,
          default: 0,
        },
        {
          name: 'initial-supply',
          short: 'i',
          type: 'string',
          required: false,
          default: 1000000,
          description:
            'Initial supply amount. Default: display units (with decimals applied). Append "t" for raw base units (e.g., "1000t")',
        },
        {
          name: 'supply-type',
          type: 'string',
          short: 'S',
          required: false,
          default: 'INFINITE',
          description: 'Set supply type: INFINITE(default) or FINITE',
        },
        { name: 'max-supply', short: 'm', type: 'string', required: false },
        { name: 'admin-key', short: 'a', type: 'string', required: false },
        {
          name: 'name',
          short: 'n',
          type: 'string',
          required: false,
          description: 'Optional name to register for the token',
        },
      ],
      handler: createTokenHandler,
    },
    {
      name: 'associate',
      summary: 'Associate a token with an account',
      description: 'Associate a token with an account to enable transfers',
      options: [
        {
          name: 'token',
          short: 't',
          type: 'string',
          required: true,
          description: 'Token: either a token alias or token-id',
        },
        {
          name: 'account',
          short: 'a',
          type: 'string',
          required: true,
          description:
            'Account: either an alias or account-id:account-key pair',
        },
      ],
      handler: associateTokenHandler,
    },
    {
      name: 'create-from-file',
      summary: 'Create a new token from a file',
      description:
        'Create a new token from a JSON file definition with advanced features',
      options: [
        { name: 'file', short: 'f', type: 'string', required: true },
        { name: 'args', short: 'a', type: 'string', required: false },
      ],
      handler: createTokenFromFileHandler,
    },
    {
      name: 'list',
      summary: 'List all tokens',
      description:
        'List all tokens stored in state for the current network or a specified network',
      options: [
        {
          name: 'keys',
          short: 'k',
          type: 'boolean',
          required: false,
          default: false,
          description: 'Show token key information (admin, supply, wipe, etc.)',
        },
        {
          name: 'network',
          short: 'N',
          type: 'string',
          required: false,
          description:
            'Filter tokens by network (defaults to current active network)',
        },
      ],
      handler: listTokensHandler,
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
