/**
 * Credentials Management Plugin Manifest
 * A plugin for managing operator credentials
 * Updated for ADR-003 compliance
 */
import { PluginManifest } from '../../core/plugins/plugin.interface';
import {
  SetCredentialsOutputSchema,
  SET_CREDENTIALS_TEMPLATE,
} from './commands/set/output';
import {
  ListCredentialsOutputSchema,
  LIST_CREDENTIALS_TEMPLATE,
} from './commands/list/output';
import {
  RemoveCredentialsOutputSchema,
  REMOVE_CREDENTIALS_TEMPLATE,
} from './commands/remove/output';
import { CREDENTIALS_JSON_SCHEMA, CREDENTIALS_NAMESPACE } from './schema';
import { setCredentials } from './commands/set/handler';
import { listCredentials } from './commands/list/handler';
import { removeCredentials } from './commands/remove/handler';

export const credentialsManifest: PluginManifest = {
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
      namespace: CREDENTIALS_NAMESPACE,
      version: 1,
      jsonSchema: CREDENTIALS_JSON_SCHEMA,
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
      handler: setCredentials,
      output: {
        schema: SetCredentialsOutputSchema,
        humanTemplate: SET_CREDENTIALS_TEMPLATE,
      },
    },
    {
      name: 'list',
      summary: 'List all credentials',
      description: 'Show all stored credentials',
      handler: listCredentials,
      output: {
        schema: ListCredentialsOutputSchema,
        humanTemplate: LIST_CREDENTIALS_TEMPLATE,
      },
    },
    {
      name: 'remove',
      summary: 'Remove credentials',
      description: 'Remove credentials for a specific keyRefId',
      options: [
        { name: 'key-ref-id', short: 'k', type: 'string', required: true },
      ],
      handler: removeCredentials,
      output: {
        schema: RemoveCredentialsOutputSchema,
        humanTemplate: REMOVE_CREDENTIALS_TEMPLATE,
      },
    },
  ],
};

export default credentialsManifest;
