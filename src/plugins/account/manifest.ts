/**
 * Account Plugin Manifest
 * Defines the account plugin according to ADR-001
 */
import { PluginManifest } from '../../core/plugins/plugin.interface';
import { ACCOUNT_JSON_SCHEMA, ACCOUNT_NAMESPACE } from './schema';
import {
  ListAccountsOutputSchema,
  LIST_ACCOUNTS_TEMPLATE,
} from './commands/list';
import {
  CreateAccountOutputSchema,
  CREATE_ACCOUNT_TEMPLATE,
} from './commands/create';
import {
  AccountBalanceOutputSchema,
  ACCOUNT_BALANCE_TEMPLATE,
} from './commands/balance';
import {
  ClearAccountsOutputSchema,
  CLEAR_ACCOUNTS_TEMPLATE,
} from './commands/clear';
import {
  DeleteAccountOutputSchema,
  DELETE_ACCOUNT_TEMPLATE,
} from './commands/delete';
import {
  ViewAccountOutputSchema,
  VIEW_ACCOUNT_TEMPLATE,
} from './commands/view';
import {
  ImportAccountOutputSchema,
  IMPORT_ACCOUNT_TEMPLATE,
} from './commands/import';
import { createAccount } from './commands/create/handler';
import { getAccountBalance } from './commands/balance/handler';
import { listAccounts } from './commands/list/handler';
import { importAccount } from './commands/import/handler';
import { clearAccounts } from './commands/clear/handler';
import { deleteAccount } from './commands/delete/handler';
import { viewAccount } from './commands/view/handler';

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
    'tx-execution:use',
  ],
  commands: [
    {
      name: 'create',
      summary: 'Create a new Hedera account',
      description:
        'Create a new Hedera account with specified balance and settings',
      options: [
        {
          name: 'balance',
          short: 'b',
          type: 'number',
          required: false,
          default: 10000,
        },
        {
          name: 'auto-associations',
          short: 'a',
          type: 'number',
          required: false,
          default: 0,
        },
        { name: 'alias', short: 'n', type: 'string', required: false },
        { name: 'payer', short: 'p', type: 'string', required: false },
      ],
      handler: createAccount,
      output: {
        schema: CreateAccountOutputSchema,
        humanTemplate: CREATE_ACCOUNT_TEMPLATE,
      },
    },
    {
      name: 'balance',
      summary: 'Get account balance',
      description: 'Retrieve the balance for an account ID, name, or alias',
      options: [
        {
          // @TODO Find all long option names and rename
          name: 'account-id-or-name-or-alias',
          short: 'a',
          type: 'string',
          required: true,
        },
        {
          name: 'only-hbar',
          short: 'H',
          type: 'boolean',
          required: false,
          default: false,
        },
        { name: 'token-id', short: 't', type: 'string', required: false },
      ],
      handler: getAccountBalance,
      output: {
        schema: AccountBalanceOutputSchema,
        humanTemplate: ACCOUNT_BALANCE_TEMPLATE,
      },
    },
    {
      name: 'list',
      summary: 'List all accounts',
      description: 'List all accounts stored in the address book',
      options: [
        {
          name: 'private',
          short: 'p',
          type: 'boolean',
          required: false,
          default: false,
        },
      ],
      handler: listAccounts,
      output: {
        schema: ListAccountsOutputSchema,
        humanTemplate: LIST_ACCOUNTS_TEMPLATE,
      },
    },
    {
      name: 'import',
      summary: 'Import an existing account',
      description: 'Import an existing account into the CLI tool',
      options: [
        { name: 'id', short: 'i', type: 'string', required: true },
        { name: 'key', short: 'k', type: 'string', required: false },
        { name: 'alias', short: 'n', type: 'string', required: false },
      ],
      handler: importAccount,
      output: {
        schema: ImportAccountOutputSchema,
        humanTemplate: IMPORT_ACCOUNT_TEMPLATE,
      },
    },
    {
      name: 'clear',
      summary: 'Clear all accounts',
      description: 'Remove all account information from the address book',
      options: [],
      handler: clearAccounts,
      output: {
        schema: ClearAccountsOutputSchema,
        humanTemplate: CLEAR_ACCOUNTS_TEMPLATE,
      },
    },
    {
      name: 'delete',
      summary: 'Delete an account',
      description: 'Delete an account from the address book',
      options: [
        { name: 'name', short: 'N', type: 'string', required: false },
        { name: 'id', short: 'i', type: 'string', required: false },
      ],
      handler: deleteAccount,
      output: {
        schema: DeleteAccountOutputSchema,
        humanTemplate: DELETE_ACCOUNT_TEMPLATE,
      },
    },
    {
      name: 'view',
      summary: 'View account details',
      description: 'View detailed information about an account',
      options: [
        {
          name: 'account-id-or-name-or-alias',
          short: 'a',
          type: 'string',
          required: true,
        },
      ],
      handler: viewAccount,
      output: {
        schema: ViewAccountOutputSchema,
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
