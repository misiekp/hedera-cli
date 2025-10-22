/**
 * Remove Credentials Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';

export function removeHandler(args: CommandHandlerArgs): Promise<void> {
  const { logger, api } = args;
  const { keyRefId } = args.args as { keyRefId: string };

  logger.log(`🗑️  Removing credentials for keyRefId: ${keyRefId}`);

  try {
    api.kms.remove(keyRefId);
    logger.log(`✅ Credentials removed for keyRefId: ${keyRefId}`);
  } catch (error) {
    logger.error(formatError('❌ Failed to remove credentials: ', error));
    throw error;
  }

  process.exit(0);
}

export default removeHandler;
