/**
 * Topic Message Submit Command Handler
 * Handles submitting messages to topics
 */
import { CommandHandlerArgs } from '../../../core';
import { formatError } from '../../../utils/errors';
import { ZustandTopicStateHelper } from '../zustand-state-helper';
import { PrivateKey } from '@hashgraph/sdk';

export async function submitMessageHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const topicState = new ZustandTopicStateHelper(api.state, logger);

  // Extract command arguments
  const topicId = args.args.topicId as string;
  const message = args.args.message as string;

  logger.log(`Submitting message to topic: ${topicId}`);

  try {
    const topicData = topicState.loadTopic(topicId);

    if (!topicData) {
      throw new Error(`Topic not found with name: ${topicId}`);
    }
    const submitKey = topicData.submitKey;
    // 1. Create message submit transaction using Core API
    const messageSubmitResult = api.topicTransactions.submitMessage({
      topicId,
      message,
      submitKey,
    });

    let transaction = api.signing.freezeTransaction(
      messageSubmitResult.transaction,
    );

    // 2. If we have a submit key, sign the transaction with it
    if (submitKey) {
      const privateKey = PrivateKey.fromStringDer(submitKey);
      transaction = await transaction.sign(privateKey);
    }

    // 3. Sign and execute transaction
    const result = await api.signing.signAndExecute(transaction);

    if (result.success) {
      logger.log(`✅ Message submitted successfully`);
      logger.log(`   Topic ID: ${topicId}`);
      logger.log(`   Message: "${message}"`);
      if (result.topicSequenceNumber) {
        logger.log(`   Sequence Number: ${result.topicSequenceNumber}`);
      }
      logger.log(`   Transaction ID: ${result.transactionId}`);

      process.exit(0);
    } else {
      throw new Error('Failed to submit message');
    }
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to submit message', error));
    process.exit(1);
  }
}
