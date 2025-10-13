/**
 * Topic Message Find Command Handler
 * Handles finding messages in topics using mirror node
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { Filter } from '../../../../types';

function buildSequenceNumberFilter(
  args: CommandHandlerArgs['args'],
): Filter | undefined {
  const sequenceFilters = [
    {
      operation: 'gt',
      value: args.sequenceNumberGt,
    },
    {
      operation: 'gte',
      value: args.sequenceNumberGte,
    },
    {
      operation: 'lt',
      value: args.sequenceNumberLt,
    },
    {
      operation: 'lte',
      value: args.sequenceNumberLte,
    },
    {
      operation: 'eq',
      value: args.sequenceNumberEq,
    },
    {
      operation: 'ne',
      value: args.sequenceNumberNe,
    },
  ];

  const nonEmptyFilters = sequenceFilters.filter(
    (f) => f.value !== undefined,
  ) as Filter[];

  return nonEmptyFilters.length > 0 ? nonEmptyFilters[0] : undefined;
}

export async function findMessageHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  const topicIdOrAlias = args.args.topicId as string;
  const sequenceNumber = args.args.sequenceNumber as number | undefined;

  const currentNetwork = api.network.getCurrentNetwork();

  // Resolve topic ID from alias if exist
  let topicId = topicIdOrAlias;
  const topicAliasResult = api.alias.resolve(
    topicIdOrAlias,
    'topic',
    currentNetwork,
  );

  if (topicAliasResult?.entityId) {
    topicId = topicAliasResult.entityId;
  }

  logger.log(`   Finding messages in topic: ${topicId}`);

  try {
    if (sequenceNumber) {
      const response = await api.mirror.getTopicMessage({
        topicId,
        sequenceNumber,
      });

      const timestampAsSeconds = response.consensus_timestamp.split('.')[0];
      const formatedTimestamp = Number(timestampAsSeconds) * 1000;

      const timestamp = new Date(formatedTimestamp).toLocaleString();

      const decodedMessage = Buffer.from(response.message, 'base64').toString(
        'ascii',
      );

      logger.log(`   Message: "${decodedMessage}"`);
      logger.log(`   Timestamp: ${timestamp}`);
      return process.exit(0);
    }

    const activeFilter = buildSequenceNumberFilter(args.args);

    if (activeFilter) {
      const response = await api.mirror.getTopicMessages({
        topicId,
        filter: {
          field: 'sequenceNumber',
          operation: activeFilter.operation,
          value: activeFilter.value,
        },
      });

      response.messages.forEach((msg, index: number) => {
        const decodedMessage = Buffer.from(msg.message, 'base64').toString(
          'ascii',
        );

        const timestampAsSeconds = msg.consensus_timestamp.split('.')[0];
        const formatedTimestamp = Number(timestampAsSeconds) * 1000;

        const timestamp = new Date(formatedTimestamp).toLocaleString();

        logger.log(`${index + 1}. Sequence #${msg.sequence_number}`);
        logger.log(`   Message: "${decodedMessage}"`);
        logger.log(`   Timestamp: ${timestamp}`);

        if (index < response.messages.length - 1) {
          logger.log(''); // Empty line between messages
        }
      });

      return process.exit(0);
    }

    logger.error('No sequence number or filter provided.');

    return process.exit(0);
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to find messages', error));
    process.exit(1);
  }
}
