/**
 * State Clear Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';

export async function clearHandler(args: CommandHandlerArgs): Promise<void> {
  const { logger, api } = args;
  const { namespace, confirm } = args.args as {
    namespace?: string;
    confirm?: boolean;
  };

  logger.log('🗑️ Clearing state data...');

  try {
    if (namespace) {
      // Clear specific namespace
      if (!confirm) {
        logger.log(`⚠️  This will clear all data in namespace: ${namespace}`);
        logger.log('   Add --confirm flag to proceed');
        process.exit(1);
      }

      const data = api.state.list(namespace);
      const count = data.length;

      api.state.clear(namespace);

      logger.log(`✅ Cleared ${count} entries from namespace: ${namespace}`);
    } else {
      // Clear all namespaces
      if (!confirm) {
        logger.log('⚠️  This will clear ALL state data across all plugins');
        logger.log('   Add --confirm flag to proceed');
        process.exit(1);
      }

      const namespaces = api.state.getNamespaces();
      let totalCleared = 0;

      for (const ns of namespaces) {
        const data = api.state.list(ns);
        if (data.length > 0) {
          api.state.clear(ns);
          totalCleared += data.length;
          logger.log(`   Cleared ${data.length} entries from ${ns}`);
        }
      }

      logger.log(
        `✅ Cleared ${totalCleared} total entries across ${namespaces.length} namespaces`,
      );
    }

    process.exit(0);
  } catch (error) {
    logger.error(`❌ Failed to clear state data: ${error}`);
    process.exit(1);
  }
}

export default clearHandler;
