/**
 * List Plugins Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';

export function listHandler(args: CommandHandlerArgs): void {
  const { logger } = args;

  logger.log('📋 Available Plugins:');
  logger.log('  1. account - Hedera Account Management');
  logger.log('  2. plugin-management - Plugin Management');
  logger.log('');
  logger.log('Use "plugin-management info <name>" for detailed information');

  process.exit(0);
}

export default listHandler;
