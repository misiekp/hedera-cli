/**
 * Set Credentials Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';

export function setHandler(args: CommandHandlerArgs): void {
  const { logger, api } = args;
  const { accountId, privateKey, network } = args.args as {
    accountId: string;
    privateKey: string;
    network?: string;
  };

  logger.log(`🔐 Setting credentials for account: ${accountId}`);

  try {
    // Import the private key and get the keyRefId
    const { keyRefId, publicKey } = api.kms.importPrivateKey(privateKey, [
      'default-operator',
    ]);

    // Set as operator for current network
    const currentNetwork = api.network.getCurrentNetwork();
    api.network.setOperator(currentNetwork, { accountId, keyRefId });

    logger.log(`✅ Credentials set successfully for account: ${accountId}`);
    logger.log(`   Network: ${network || 'testnet'}`);
    logger.log(`   Key Reference ID: ${keyRefId}`);
    logger.log(`   Public Key: ${publicKey}`);
  } catch (error) {
    logger.error(formatError('❌ Failed to set credentials: ', error));
    throw error;
  }

  process.exit(0);
}

export default setHandler;
