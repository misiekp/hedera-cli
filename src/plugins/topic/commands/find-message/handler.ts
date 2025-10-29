/**
 * Topic Message Find Command Handler
 * Handles finding messages in topics using mirror node
 */
import { CommandHandlerArgs } from '../../../../core';
import { CommandExecutionResult } from '../../../../core';
import { formatError } from '../../../../utils/errors';
import { Filter } from '../../../../../types';
import { FindMessagesOutput } from './output';

/**
 * Helper function to build sequence number filter from command arguments
 * @param args - Command arguments containing filter parameters
 * @returns Filter object or undefined if no filter parameters provided
 */
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

  // Find first non-empty filter
  const nonEmptyFilters = sequenceFilters.filter(
    (f) => f.value !== undefined,
  ) as Filter[];

  return nonEmptyFilters.length > 0 ? nonEmptyFilters[0] : undefined;
}

/**
 * Helper function to decode message and format timestamp
 * @param message - Base64 encoded message
 * @param consensusTimestamp - Hedera consensus timestamp
 * @returns Object with decoded message and formatted timestamp
 */
function decodeMessageData(message: string, consensusTimestamp: string) {
  const decodedMessage = Buffer.from(message, 'base64').toString('ascii');

  // Extract seconds from consensus timestamp and convert to milliseconds
  const timestampAsSeconds = consensusTimestamp.split('.')[0];
  const formattedTimestamp = Number(timestampAsSeconds) * 1000;
  const timestamp = new Date(formattedTimestamp).toLocaleString();

  return { decodedMessage, timestamp };
}

/**
 * Default export handler function for finding messages
 * @param args - Command handler arguments from CLI core
 * @returns Promise resolving to CommandExecutionResult with structured output
 */
export default async function findMessageHandler(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api, logger } = args;

  // Extract command arguments
  const topicIdOrAlias = args.args.topicId as string;
  const sequenceNumber = args.args.sequenceNumber as number | undefined;

  const currentNetwork = api.network.getCurrentNetwork();

  // Step 1: Resolve topic ID from alias if it exists
  let topicId = topicIdOrAlias;
  const topicAliasResult = api.alias.resolve(
    topicIdOrAlias,
    'topic',
    currentNetwork,
  );

  if (topicAliasResult?.entityId) {
    topicId = topicAliasResult.entityId;
  }

  // Log progress indicator (not final output)
  logger.log(`Finding messages in topic: ${topicId}`);

  try {
    let messages: FindMessagesOutput['messages'] = [];

    // Step 2: Query messages based on provided parameters
    if (sequenceNumber) {
      // Fetch single message by sequence number
      const response = await api.mirror.getTopicMessage({
        topicId,
        sequenceNumber,
      });

      const { decodedMessage, timestamp } = decodeMessageData(
        response.message,
        response.consensus_timestamp,
      );

      // Wrap single message in array for unified schema
      messages = [
        {
          sequenceNumber: response.sequence_number,
          message: decodedMessage,
          timestamp,
          consensusTimestamp: response.consensus_timestamp,
        },
      ];
    } else {
      // Try to build filter from other sequence number parameters
      const activeFilter = buildSequenceNumberFilter(args.args);

      if (activeFilter) {
        // Fetch multiple messages with filter
        const response = await api.mirror.getTopicMessages({
          topicId,
          filter: {
            field: 'sequenceNumber',
            operation: activeFilter.operation,
            value: activeFilter.value,
          },
        });

        // Transform messages to output format
        messages = response.messages
          .map((msg) => {
            const { decodedMessage, timestamp } = decodeMessageData(
              msg.message,
              msg.consensus_timestamp,
            );

            return {
              sequenceNumber: msg.sequence_number,
              message: decodedMessage,
              timestamp,
              consensusTimestamp: msg.consensus_timestamp,
            };
          })
          .reverse();
      } else {
        // No sequence number or filter provided
        return {
          status: 'failure',
          errorMessage:
            'No sequence number or filter provided. Use --sequence-number or filter options (--sequence-number-gt, --sequence-number-gte, etc.)',
        };
      }
    }

    // Step 3: Prepare structured output data
    const outputData: FindMessagesOutput = {
      topicId,
      messages,
      totalCount: messages.length,
    };

    // Return success result with JSON output
    return {
      status: 'success',
      outputJson: JSON.stringify(outputData),
    };
  } catch (error: unknown) {
    // Catch and format any errors
    return {
      status: 'failure',
      errorMessage: formatError('Failed to find messages', error),
    };
  }
}
