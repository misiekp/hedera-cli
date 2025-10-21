/**
 * Set Credentials Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { SupportedNetwork } from '../../../core/types/shared.types';
import { formatError } from '../../../utils/errors';

export function setHandler(args: CommandHandlerArgs): void {
  const { logger, api } = args;
  const { accountId, privateKey, network } = args.args as {
    accountId: string;
    privateKey: string;
    network?: SupportedNetwork;
  };

  // Determine target network
  const targetNetwork = network || api.network.getCurrentNetwork();

  logger.log(`🔐 Setting credentials for account: ${accountId}`);
  logger.log(`   Network: ${targetNetwork}`);

  try {
    // Import the private key and get the keyRefId
    const { keyRefId, publicKey } = api.kms.importPrivateKey(privateKey, [
      'default-operator',
    ]);

    // Set operator for the specified network
    api.kms.setOperator(accountId, keyRefId, targetNetwork);

    logger.log(`✅ Credentials set successfully for account: ${accountId}`);
    logger.log(`   Network: ${targetNetwork}`);
    logger.log(`   Key Reference ID: ${keyRefId}`);
    logger.log(`   Public Key: ${publicKey}`);
  } catch (error) {
    logger.error(formatError('❌ Failed to set credentials: ', error));
    throw error;
  }

  process.exit(0);
}

export default setHandler;
