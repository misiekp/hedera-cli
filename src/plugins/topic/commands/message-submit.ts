/**
 * Topic Message Submit Command Handler
 * Handles submitting messages to topics
 */
import { CommandHandlerArgs, TransactionResult } from '../../../core';
import { formatError } from '../../../utils/errors';
import { ZustandTopicStateHelper } from '../zustand-state-helper';

export async function submitMessageHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const topicState = new ZustandTopicStateHelper(api.state, logger);

  // Extract command arguments
  const topicIdOrAlias = args.args.topicId as string;
  const message = args.args.message as string;

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

  logger.log(`Submitting message to topic: ${topicId}`);

  try {
    const topicData = topicState.loadTopic(topicId);

    if (!topicData) {
      throw new Error(`Topic not found with name: ${topicId}`);
    }

    // 1. Create message submit transaction using Core API
    const messageSubmitTx = api.topic.submitMessage({
      topicId,
      message,
    });

    let txResult: TransactionResult;

    // 2. If we have a submit key, sign the transaction with it and execute else execute
    if (topicData.submitKeyRefId) {
      txResult = await api.signing.signAndExecuteWith(
        messageSubmitTx.transaction,
        {
          keyRefId: topicData.submitKeyRefId,
        },
      );
    } else {
      txResult = await api.signing.signAndExecute(messageSubmitTx.transaction);
    }

    if (txResult.success) {
      logger.log(`✅ Message submitted successfully`);
      logger.log(`   Topic ID: ${topicId}`);
      logger.log(`   Message: "${message}"`);
      if (txResult.topicSequenceNumber) {
        logger.log(`   Sequence Number: ${txResult.topicSequenceNumber}`);
      }
      logger.log(`   Transaction ID: ${txResult.transactionId}`);

      process.exit(0);
    } else {
      throw new Error('Failed to submit message');
    }
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to submit message', error));
    process.exit(1);
  }
}
