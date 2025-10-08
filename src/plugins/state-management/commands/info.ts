/**
 * State Info Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import * as fs from 'fs';
import * as path from 'path';
import { formatError } from '../../../utils/errors';

export function infoHandler(args: CommandHandlerArgs): void {
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
      const data = api.state.list<unknown>(ns) || [];
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
          data.forEach((item: unknown, index: number) => {
            if (typeof item === 'object' && item !== null && 'name' in item) {
              logger.log(
                `     ${index + 1}. ${(item as { name?: string }).name}`,
              );
            }
          });
        } else {
          const first = data[0];
          const second = data[1];
          logger.log(
            `     Sample: ${
              typeof first === 'object' && first !== null && 'name' in first
                ? (first as { name?: string }).name
                : 'entry 1'
            }, ${
              typeof second === 'object' && second !== null && 'name' in second
                ? (second as { name?: string }).name
                : 'entry 2'
            }, ...`,
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
    logger.error(formatError('❌ Failed to get state info: ', error));
    process.exit(1);
  }
}

export default infoHandler;
