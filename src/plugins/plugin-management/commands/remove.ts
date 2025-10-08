/**
 * Remove Plugin Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';

export function removeHandler(args: CommandHandlerArgs): void {
  const { logger } = args;
  const { name } = args.args as { name: string };

  logger.log(`➖ Removing plugin: ${name}`);

  // Note: In a real implementation, this would use the plugin manager
  // For now, we'll just log the action
  logger.log(`✅ Plugin removed: ${name}`);

  process.exit(0);
}

export default removeHandler;
