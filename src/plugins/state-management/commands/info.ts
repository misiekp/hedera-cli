/**
 * State Info Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import * as fs from 'fs';
import * as path from 'path';

export async function infoHandler(args: CommandHandlerArgs): Promise<void> {
  const { logger, api } = args;

  logger.log('ℹ️  State Information:');

  try {
    const namespaces = [
      'accounts',
      'tokens',
      'topics',
      'scripts',
      'credentials',
    ];
    let totalEntries = 0;
    let totalSize = 0;

    logger.log(`   Storage Directory: ${process.cwd()}/.hedera-cli/state`);
    logger.log('');

    for (const ns of namespaces) {
      const data = (api.state as any)[ns]?.list() || [];
      const entryCount = data.length;
      totalEntries += entryCount;

      if (entryCount > 0) {
        logger.log(`   ${ns}: ${entryCount} entries`);

        // Calculate approximate size
        const size = JSON.stringify(data).length;
        totalSize += size;
        logger.log(`     Size: ~${size} bytes`);

        // Show sample entries
        if (data.length <= 3) {
          data.forEach((item: any, index: number) => {
            if (typeof item === 'object' && item.name) {
              logger.log(`     ${index + 1}. ${item.name}`);
            }
          });
        } else {
          logger.log(
            `     Sample: ${data[0]?.name || 'entry 1'}, ${data[1]?.name || 'entry 2'}, ...`,
          );
        }
        logger.log('');
      }
    }

    logger.log(`   Total: ${totalEntries} entries, ~${totalSize} bytes`);

    // Check if storage directory exists
    const storageDir = path.join(process.cwd(), '.hedera-cli', 'state');
    if (fs.existsSync(storageDir)) {
      logger.log(`   Storage: Active (${storageDir})`);
    } else {
      logger.log(`   Storage: Not initialized`);
    }

    process.exit(0);
  } catch (error) {
    logger.error(`❌ Failed to get state info: ${error}`);
    process.exit(1);
  }
}

export default infoHandler;
