/**
 * State Statistics Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';

export async function statsHandler(args: CommandHandlerArgs): Promise<void> {
  const { logger, api } = args;

  logger.log('📊 State Statistics:');

  try {
    // Get statistics from all namespaces
    const namespaces = api.state.getNamespaces();
    let totalKeys = 0;
    let totalSize = 0;

    logger.log(`   Total Namespaces: ${namespaces.length}`);
    logger.log('');

    if (namespaces.length > 0) {
      logger.log('   Namespace Details:');
      for (const namespace of namespaces) {
        const data = api.state.list(namespace);
        const keys = api.state.getKeys(namespace);
        const size = JSON.stringify(data).length;

        totalKeys += keys.length;
        totalSize += size;

        logger.log(`     ${namespace}:`);
        logger.log(`       Keys: ${keys.length}`);
        logger.log(`       Size: ${size} bytes`);
        logger.log('');
      }
    }

    logger.log(`   Total Keys: ${totalKeys}`);
    logger.log(`   Total Size: ${totalSize} bytes`);

    process.exit(0);
  } catch (error) {
    logger.error(`❌ Failed to get statistics: ${error}`);
    process.exit(1);
  }
}

export default statsHandler;
