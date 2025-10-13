/**
 * Topic Create Command Handler
 * Handles topic creation using the Core API
 */
import { CommandHandlerArgs } from '../../../core';
import { formatError } from '../../../utils/errors';
import { ZustandTopicStateHelper } from '../zustand-state-helper';

export async function createTopicHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const topicState = new ZustandTopicStateHelper(api.state, logger);

  // Extract command arguments
  const memo = args.args.memo as string | undefined;

  const adminKey = args.args.adminKey as string | undefined;
  const submitKey = args.args.submitKey as string | undefined;

  const alias = args.args.alias as string | undefined;
  const name = alias || `topic-${Date.now()}`;

  if (memo) {
    logger.log(`Creating topic with memo: ${memo}`);
  }

  try {
    // 1. Create transaction using Core API
    const topicCreateResult = api.topicTransactions.createTopic({
      memo,
      adminKey,
      submitKey,
    });

    // 2. Sign and execute transaction
    const result = await api.signing.signAndExecute(
      topicCreateResult.transaction,
    );

    let adminKeyRefId: string | undefined = undefined;
    let submitKeyRefId: string | undefined = undefined;

    // 3. Save submit, admin private key to credentials if exists
    if (adminKey) {
      const { keyRefId } = api.credentialsState.importPrivateKey(adminKey);
      adminKeyRefId = keyRefId;
    }

    if (submitKey) {
      const { keyRefId } = api.credentialsState.importPrivateKey(submitKey);
      submitKeyRefId = keyRefId;
    }

    if (result.success) {
      // 3. Store topic in state with real data using state helper
      const topicData = {
        name,
        topicId: result.topicId || '(unknown)',
        memo: memo || '(No memo)',
        adminKeyRefId,
        submitKeyRefId,
        network: api.network.getCurrentNetwork(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (alias) {
        api.alias.register({
          alias,
          type: 'topic',
          network: api.network.getCurrentNetwork(),
          entityId: result.topicId,
          createdAt: new Date().toISOString(),
        });
      }

      topicState.saveTopic(String(result.topicId), topicData);

      logger.log(`✅ Topic created successfully: ${topicData.topicId}`);
      logger.log(`   Network: ${topicData.network}`);
      if (topicData.memo) {
        logger.log(`   Memo: ${topicData.memo}`);
      }
      logger.log(`   Admin key: ${Boolean(topicData.adminKeyRefId)}`);
      logger.log(`   Submit key: ${Boolean(topicData.submitKeyRefId)}`);
      logger.log(`   Transaction ID: ${result.transactionId}`);

      process.exit(0);
    } else {
      throw new Error('Failed to create topic');
    }
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to create topic', error));
    process.exit(1);
  }
}
