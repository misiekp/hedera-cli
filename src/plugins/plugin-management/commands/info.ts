/**
 * Plugin Info Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';

export function infoHandler(args: CommandHandlerArgs): void {
  const { logger } = args;
  const { name } = args.args as { name: string };

  logger.log(`ℹ️  Plugin Information: ${name}`);

  if (name === 'account') {
    logger.log('   Name: account');
    logger.log('   Version: 1.0.0');
    logger.log('   Description: Hedera Account Management');
    logger.log(
      '   Commands: create, list, balance, import, clear, delete, view',
    );
    logger.log(
      '   Capabilities: network:read, network:write, state:namespace:accounts, signing:use',
    );
  } else if (name === 'plugin-management') {
    logger.log('   Name: plugin-management');
    logger.log('   Version: 1.0.0');
    logger.log('   Description: Plugin Management');
    logger.log('   Commands: add, remove, list, info');
    logger.log('   Capabilities: plugin:manage, plugin:list, plugin:info');
  } else {
    logger.log(`❌ Plugin '${name}' not found`);
  }

  process.exit(0);
}

export default infoHandler;
