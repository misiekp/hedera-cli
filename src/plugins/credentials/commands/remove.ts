/**
 * Remove Credentials Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';

export function removeHandler(args: CommandHandlerArgs): void {
  const { logger, api } = args;
  const { keyRefId } = args.args as {
    keyRefId?: string;
  };

  if (!keyRefId) {
    logger.error('❌ Must specify --key-ref-id');
    process.exit(1);
  }

  try {
    logger.log(`🗑️  Removing credentials for keyRefId: ${keyRefId}`);

    // Remove from KMS only
    api.kms.remove(keyRefId);
    logger.log(`✅ Credentials removed for keyRefId: ${keyRefId}`);
  } catch (error) {
    logger.error(formatError('❌ Failed to remove credentials: ', error));
    throw error;
  }

  process.exit(0);
}

export default removeHandler;
