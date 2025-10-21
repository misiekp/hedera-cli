/**
 * Remove Credentials Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { SupportedNetwork } from '../../../core/types/shared.types';
import { formatError } from '../../../utils/errors';

export function removeHandler(args: CommandHandlerArgs): Promise<void> {
  const { logger, api } = args;
  const { keyRefId, network } = args.args as {
    keyRefId: string;
    network?: SupportedNetwork;
  };

  // Determine target network
  const targetNetwork = network || api.network.getCurrentNetwork();

  logger.log(`🗑️  Removing credentials for keyRefId: ${keyRefId}`);
  logger.log(`   Network: ${targetNetwork}`);

  try {
    // Check if the key exists
    const credentials = api.kms.list();
    const keyExists = credentials.some((cred) => cred.keyRefId === keyRefId);

    if (!keyExists) {
      logger.log(`⚠️  Key not found: ${keyRefId}`);
      logger.log(`   Nothing to remove.`);
      process.exit(0);
    }

    // Remove the key from the system
    api.kms.remove(keyRefId);
    logger.log(`✅ Credentials removed for keyRefId: ${keyRefId}`);
    logger.log(`   Network: ${targetNetwork}`);
  } catch (error) {
    logger.error(formatError('❌ Failed to remove credentials: ', error));
    throw error;
  }

  process.exit(0);
}

export default removeHandler;
