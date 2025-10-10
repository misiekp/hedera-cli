/**
 * Topic Plugin Manifest
 */
import { PluginManifest } from '../../core';
import { TOPIC_JSON_SCHEMA, TOPIC_NAMESPACE } from './schema';

export const topicPluginManifest: PluginManifest = {
  name: 'topic',
  version: '1.0.0',
  displayName: 'Topic Plugin',
  description:
    'Plugin for managing Hedera Consensus Service topics and messages',
  compatibility: {
    cli: '^1.0.0',
    core: '^1.0.0',
    api: '^1.0.0',
  },
  capabilities: [
    `state:namespace:${TOPIC_NAMESPACE}`,
    'network:read',
    'network:write',
    'signing:use',
  ],
  commands: [
    {
      name: 'create',
      summary: 'Create a new Hedera topic',
      description:
        'Create a new Hedera Consensus Service topic with optional memo and keys',
      options: [
        {
          name: 'memo',
          type: 'string',
          required: false,
          description: 'The memo',
        },
        {
          name: 'admin-key',
          type: 'string',
          required: false,
          default: false,
          description: 'Pass an admin key (ECDSA) for the topic',
        },
        {
          name: 'submit-key',
          type: 'string',
          required: false,
          default: false,
          description: 'Pass a submit key (ECDSA) for the topic',
        },
      ],
      handler: './commands/create',
    },
    {
      name: 'list',
      summary: 'List all topics',
      description: 'List all topics stored in the state',
      options: [],
      handler: './commands/list',
    },
    {
      name: 'submit-message',
      summary: 'Submit a message to a topic',
      description: 'Submit a message to a Hedera Consensus Service topic',
      options: [
        {
          name: 'topic-id',
          type: 'string',
          required: true,
          description: 'The topic ID',
        },
        {
          name: 'message',
          type: 'string',
          required: true,
          description: 'Submit a message to the topic',
        },
      ],
      handler: './commands/message-submit',
    },
    {
      name: 'find-message',
      summary: 'Find messages in a topic',
      description: 'Find messages in a topic by sequence number or filters',
      options: [
        {
          name: 'topic-id',
          type: 'string',
          required: true,
          description: 'The topic ID',
        },
        {
          name: 'sequence-number',
          type: 'number',
          required: false,
          description: 'The sequence number',
        },
        {
          name: 'sequence-number-gt',
          type: 'number',
          required: false,
          description: 'The sequence number greater than',
        },
        {
          name: 'sequence-number-gte',
          type: 'number',
          required: false,
          description: 'The sequence number greater than or equal to',
        },
        {
          name: 'sequence-number-lt',
          type: 'number',
          required: false,
          description: 'The sequence number less than',
        },
        {
          name: 'sequence-number-lte',
          type: 'number',
          required: false,
          description: 'The sequence number less than or equal to',
        },
        {
          name: 'sequence-number-eq',
          type: 'number',
          required: false,
          description: 'The sequence number equal to',
        },
        {
          name: 'sequence-number-ne',
          type: 'number',
          required: false,
          description: 'The sequence number not equal to',
        },
      ],
      handler: './commands/message-find',
    },
  ],
  stateSchemas: [
    {
      namespace: TOPIC_NAMESPACE,
      version: 1,
      jsonSchema: TOPIC_JSON_SCHEMA,
      scope: 'profile',
    },
  ],
};

export default topicPluginManifest;
