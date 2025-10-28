/**
 * Topic Plugin Manifest
 */
import { PluginManifest } from '../../core';
import { TOPIC_JSON_SCHEMA, TOPIC_NAMESPACE } from './schema';
import { createTopicHandler } from './commands/create';
import { listTopicsHandler } from './commands/list';
import { submitMessageHandler } from './commands/message-submit';
import { findMessageHandler } from './commands/message-find';

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
    'tx-execution:use',
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
          short: 'm',
        },
        {
          name: 'admin-key',
          type: 'string',
          required: false,
          default: false,
          description:
            'Pass an admin key as alias or private key (ECDSA) for the topic',
          short: 'a',
        },
        {
          name: 'submit-key',
          type: 'string',
          required: false,
          default: false,
          description:
            'Pass a submit key as alias or private key (ECDSA) for the topic',
          short: 's',
        },
        {
          name: 'alias',
          short: 'n',
          type: 'string',
          required: false,
          description: 'Define the alias (name) for this topic',
        },
      ],
      handler: createTopicHandler,
    },
    {
      name: 'list',
      summary: 'List all topics',
      description: 'List all topics stored in the state',
      options: [],
      handler: listTopicsHandler,
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
          short: 't',
        },
        {
          name: 'message',
          type: 'string',
          required: true,
          description: 'Submit a message to the topic',
          short: 'm',
        },
      ],
      handler: submitMessageHandler,
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
          short: 't',
        },
        {
          name: 'sequence-number',
          type: 'number',
          required: false,
          description: 'The sequence number',
          short: 's',
        },
        {
          name: 'sequence-number-gt',
          type: 'number',
          required: false,
          description: 'The sequence number greater than',
          short: 'g',
        },
        {
          name: 'sequence-number-gte',
          short: 'G',
          type: 'number',
          required: false,
          description: 'The sequence number greater than or equal to',
        },
        {
          name: 'sequence-number-lt',
          short: 'l',
          type: 'number',
          required: false,
          description: 'The sequence number less than',
        },
        {
          name: 'sequence-number-lte',
          short: 'L',
          type: 'number',
          required: false,
          description: 'The sequence number less than or equal to',
        },
        {
          name: 'sequence-number-eq',
          short: 'e',
          type: 'number',
          required: false,
          description: 'The sequence number equal to',
        },
        {
          name: 'sequence-number-ne',
          short: 'E',
          type: 'number',
          required: false,
          description: 'The sequence number not equal to',
        },
      ],
      handler: findMessageHandler,
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
