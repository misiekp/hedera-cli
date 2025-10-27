/**
 * Get Operator Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { SupportedNetwork } from '../../../core/types/shared.types';

export function getOperatorHandler(args: CommandHandlerArgs): void {
  const { logger, api } = args;
  const { network } = args.args as {
    network?: string;
  };

  try {
    const targetNetwork =
      (network as SupportedNetwork) || api.network.getCurrentNetwork();

    if (network && !api.network.isNetworkAvailable(network)) {
      logger.error(`❌ Network '${network}' is not available`);
      logger.log(
        `   Available networks: ${api.network.getAvailableNetworks().join(', ')}`,
      );
      process.exit(1);
    }

    logger.log(`🔍 Getting operator for network: ${targetNetwork}`);

    const operator = api.network.getOperator(targetNetwork);

    if (!operator) {
      logger.log(`⚠️  No operator configured for network: ${targetNetwork}`);
      process.exit(0);
    }

    const publicKey = api.kms.getPublicKey(operator.keyRefId);

    if (!publicKey) {
      logger.log(`❌ Public key not found for keyRefId: ${operator.keyRefId}`);
      process.exit(0);
    }

    logger.log(`✅ Operator found for network: ${targetNetwork}`);
    logger.log(`   Account ID: ${operator.accountId}`);
    logger.log(`   Key Reference ID: ${operator.keyRefId}`);
    logger.log(`   Public Key: ${publicKey}`);
  } catch (error) {
    logger.error(formatError('❌ Failed to get operator: ', error));
    process.exit(1);
  }

  process.exit(0);
}

export default getOperatorHandler;
