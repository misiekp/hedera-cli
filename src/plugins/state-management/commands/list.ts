/**
 * State List Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';

export function listHandler(args: CommandHandlerArgs): Promise<void> {
  const { logger, api } = args;
  const { namespace } = args.args as { namespace?: string };

  logger.log('📋 State Data:');

  try {
    if (namespace) {
      // List specific namespace
      const data = api.state.list(namespace);
      logger.log(`   ${namespace}: ${data.length} entries`);
      data.forEach((item: any, index: number) => {
        if (typeof item === 'object' && item.name) {
          logger.log(
            `     ${index + 1}. ${item.name} (${item.accountId || item.tokenId || item.topicId || 'unknown'})`,
          );
        } else {
          logger.log(`     ${index + 1}. ${JSON.stringify(item)}`);
        }
      });
    } else {
      // List all namespaces
      const namespaces = api.state.getNamespaces();
      let totalEntries = 0;

      if (namespaces.length === 0) {
        logger.log('   No state data found');
      } else {
        for (const ns of namespaces) {
          const data = api.state.list(ns);
          if (data.length > 0) {
            logger.log(`   ${ns}: ${data.length} entries`);
            totalEntries += data.length;
          }
        }

        if (totalEntries > 0) {
          logger.log(`   Total: ${totalEntries} entries across all namespaces`);
        } else {
          logger.log('   No state data found');
        }
      }
    }

    process.exit(0);
  } catch (error) {
    logger.error(formatError('❌ Failed to list state data: ', error));
    process.exit(1);
  }
}

export default listHandler;
