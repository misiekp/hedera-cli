/**
 * Topic List Command Handler
 * Handles listing topics from state
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { ZustandTopicStateHelper } from '../zustand-state-helper';

export function listTopicsHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const topicState = new ZustandTopicStateHelper(api.state, logger);

  // Extract command arguments
  const showKeys = args.args.keys as boolean;
  const networkFilter = args.args.network as string | undefined;

  logger.log('Listing topics...');

  try {
    // Get all topics
    let topics = topicState.listTopics();

    // Filter by network if specified
    if (networkFilter) {
      topics = topics.filter((topic) => topic.network === networkFilter);
    }

    if (topics.length === 0) {
      if (networkFilter) {
        logger.log(`No topics found for network: ${networkFilter}`);
      } else {
        logger.log('No topics found');
      }
      process.exit(0);
    }

    logger.log(`\nFound ${topics.length} topic(s):`);
    logger.log('──────────────────────────────────────');

    topics.forEach((topic, index) => {
      logger.log(`${index + 1}. ${topic.memo ?? '(No memo)'}`);
      logger.log(`   Topic ID: ${topic.topicId}`);
      logger.log(`   Network: ${topic.network}`);

      if (topic.memo) {
        logger.log(`   Memo: ${topic.memo}`);
      }

      if (showKeys) {
        if (topic.adminKey) {
          logger.log(`   Admin Key: ✅ Present`);
        }
        if (topic.submitKey) {
          logger.log(`   Submit Key: ✅ Present`);
        }
        if (!topic.adminKey && !topic.submitKey) {
          logger.log(`   Keys: None`);
        }
      }

      logger.log(`   Created: ${new Date(topic.createdAt).toLocaleString()}`);

      if (index < topics.length - 1) {
        logger.log(''); // Empty line between topics
      }
    });

    // Show summary statistics
    const stats = topicState.getTopicStats();
    logger.log('\n──────────────────────────────────────');
    logger.log(`Total Topics: ${stats.total}`);
    logger.log(`With Admin Key: ${stats.withAdminKey}`);
    logger.log(`With Submit Key: ${stats.withSubmitKey}`);
    logger.log(`With Memo: ${stats.withMemo}`);

    if (Object.keys(stats.byNetwork).length > 1) {
      logger.log('\nBy Network:');
      Object.entries(stats.byNetwork).forEach(([network, count]) => {
        logger.log(`  ${network}: ${count}`);
      });
    }

    process.exit(0);
  } catch (error: unknown) {
    logger.error(
      `❌ Failed to list topics: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    process.exit(1);
  }
}
