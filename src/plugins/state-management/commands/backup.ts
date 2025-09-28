/**
 * State Backup Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import * as fs from 'fs';
import * as path from 'path';

export async function backupHandler(args: CommandHandlerArgs): Promise<void> {
  const { logger, api } = args;
  const { output } = args.args as { output?: string };

  logger.log('💾 Creating state backup...');

  try {
    // Create backup data from all namespaces
    const namespaces = api.state.getNamespaces();
    const backup: any = {
      timestamp: new Date().toISOString(),
      namespaces: {},
      metadata: {
        totalNamespaces: namespaces.length,
        totalSize: 0,
      },
    };

    for (const namespace of namespaces) {
      const data = api.state.list(namespace);
      backup.namespaces[namespace] = data;
      backup.metadata.totalSize += JSON.stringify(data).length;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = output || `hedera-cli-backup-${timestamp}.json`;
    const filepath = path.resolve(filename);

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

    logger.log(`✅ Backup created successfully: ${filepath}`);
    logger.log(`   Namespaces: ${namespaces.length}`);
    logger.log(`   Total size: ${backup.metadata.totalSize} bytes`);
    logger.log(`   Timestamp: ${backup.timestamp}`);

    process.exit(0);
  } catch (error) {
    logger.error(`❌ Failed to create backup: ${error}`);
    process.exit(1);
  }
}

export default backupHandler;
