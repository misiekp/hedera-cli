/**
 * Account Plugin Manifest
 * Defines the account plugin according to ADR-001
 */
import { PluginManifest } from '../../core/plugins/plugin.interface';
import { ACCOUNT_JSON_SCHEMA, ACCOUNT_NAMESPACE } from './schema';
import {
  LIST_ACCOUNTS_OUTPUT_SCHEMA,
  LIST_ACCOUNTS_TEMPLATE,
} from './commands/list';
import {
  CREATE_ACCOUNT_OUTPUT_SCHEMA,
  CREATE_ACCOUNT_TEMPLATE,
} from './commands/create';
import {
  ACCOUNT_BALANCE_OUTPUT_SCHEMA,
  ACCOUNT_BALANCE_TEMPLATE,
} from './commands/balance';
import {
  CLEAR_ACCOUNTS_OUTPUT_SCHEMA,
  CLEAR_ACCOUNTS_TEMPLATE,
} from './commands/clear';
import {
  DELETE_ACCOUNT_OUTPUT_SCHEMA,
  DELETE_ACCOUNT_TEMPLATE,
} from './commands/delete';
import {
  VIEW_ACCOUNT_OUTPUT_SCHEMA,
  VIEW_ACCOUNT_TEMPLATE,
} from './commands/view';
import {
  IMPORT_ACCOUNT_OUTPUT_SCHEMA,
  IMPORT_ACCOUNT_TEMPLATE,
} from './commands/import';

export const accountPluginManifest: PluginManifest = {
  name: 'account',
  version: '1.0.0',
  displayName: 'Account Plugin',
  description: 'Plugin for managing Hedera accounts',
  compatibility: {
    cli: '^1.0.0',
    core: '^1.0.0',
    api: '^1.0.0',
  },
  capabilities: [
    `state:namespace:${ACCOUNT_NAMESPACE}`,
    'network:read',
    'network:write',
    'signing:use',
  ],
  commands: [
    {
      name: 'create',
      summary: 'Create a new Hedera account',
      description:
        'Create a new Hedera account with specified balance and settings',
      options: [
        { name: 'balance', type: 'number', required: false, default: 10000 },
        {
          name: 'auto-associations',
          type: 'number',
          required: false,
          default: 0,
        },
        { name: 'alias', type: 'string', required: false },
        { name: 'payer', type: 'string', required: false },
      ],
      handler: './commands/create/handler',
      output: {
        schema: CREATE_ACCOUNT_OUTPUT_SCHEMA,
        humanTemplate: CREATE_ACCOUNT_TEMPLATE,
      },
    },
    {
      name: 'balance',
      summary: 'Get account balance',
      description: 'Retrieve the balance for an account ID, name, or alias',
      options: [
        { name: 'account-id-or-name-or-alias', type: 'string', required: true },
        { name: 'only-hbar', type: 'boolean', required: false, default: false },
        { name: 'token-id', type: 'string', required: false },
      ],
      handler: './commands/balance/handler',
      output: {
        schema: ACCOUNT_BALANCE_OUTPUT_SCHEMA,
        humanTemplate: ACCOUNT_BALANCE_TEMPLATE,
      },
    },
    {
      name: 'list',
      summary: 'List all accounts',
      description: 'List all accounts stored in the address book',
      options: [
        { name: 'private', type: 'boolean', required: false, default: false },
      ],
      handler: './commands/list/handler',
      output: {
        schema: LIST_ACCOUNTS_OUTPUT_SCHEMA,
        humanTemplate: LIST_ACCOUNTS_TEMPLATE,
      },
    },
    {
      name: 'import',
      summary: 'Import an existing account',
      description: 'Import an existing account into the CLI tool',
      options: [
        { name: 'id', type: 'string', required: true },
        { name: 'key', type: 'string', required: false },
        { name: 'alias', type: 'string', required: false },
      ],
      handler: './commands/import/handler',
      output: {
        schema: IMPORT_ACCOUNT_OUTPUT_SCHEMA,
        humanTemplate: IMPORT_ACCOUNT_TEMPLATE,
      },
    },
    {
      name: 'clear',
      summary: 'Clear all accounts',
      description: 'Remove all account information from the address book',
      options: [],
      handler: './commands/clear/handler',
      output: {
        schema: CLEAR_ACCOUNTS_OUTPUT_SCHEMA,
        humanTemplate: CLEAR_ACCOUNTS_TEMPLATE,
      },
    },
    {
      name: 'delete',
      summary: 'Delete an account',
      description: 'Delete an account from the address book',
      options: [
        { name: 'name', type: 'string', required: false },
        { name: 'id', type: 'string', required: false },
      ],
      handler: './commands/delete/handler',
      output: {
        schema: DELETE_ACCOUNT_OUTPUT_SCHEMA,
        humanTemplate: DELETE_ACCOUNT_TEMPLATE,
      },
    },
    {
      name: 'view',
      summary: 'View account details',
      description: 'View detailed information about an account',
      options: [
        { name: 'account-id-or-name-or-alias', type: 'string', required: true },
      ],
      handler: './commands/view/handler',
      output: {
        schema: VIEW_ACCOUNT_OUTPUT_SCHEMA,
        humanTemplate: VIEW_ACCOUNT_TEMPLATE,
      },
    },
  ],
  stateSchemas: [
    {
      namespace: ACCOUNT_NAMESPACE,
      version: 1,
      jsonSchema: ACCOUNT_JSON_SCHEMA,
      scope: 'profile',
    },
  ],
  init: () => {
    console.log('[ACCOUNT PLUGIN] Initializing account plugin...');
  },
  teardown: () => {
    console.log('[ACCOUNT PLUGIN] Tearing down account plugin...');
  },
};

export default accountPluginManifest;
