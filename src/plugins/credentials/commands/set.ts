/**
 * Set Credentials Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { SupportedNetwork } from '../../../core/types/shared.types';

export function setHandler(args: CommandHandlerArgs): void {
  const { logger, api } = args;
  const { accountId, privateKey, network } = args.args as {
    accountId: string;
    privateKey: string;
    network?: SupportedNetwork;
  };

  const targetNetwork = network || api.network.getCurrentNetwork();

  logger.log(`🔐 Setting credentials for account: ${accountId}`);

  try {
    // Import the private key and get the keyRefId
    const { keyRefId, publicKey } = api.credentialsState.importPrivateKey(
      privateKey,
      ['default-operator'],
    );

    // Set as default operator for the specified network
    api.credentialsState.setOperator(targetNetwork, accountId, keyRefId);

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
