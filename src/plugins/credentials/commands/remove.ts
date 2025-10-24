/**
 * Remove Credentials Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { SupportedNetwork } from '../../../core/types/shared.types';

export function removeHandler(args: CommandHandlerArgs): void {
  const { logger, api } = args;
  const { keyRefId, network } = args.args as {
    keyRefId?: string;
    network?: string;
  };

  if (keyRefId && network) {
    logger.error(
      '❌ Cannot specify both keyRefId and network. Use either --key-ref-id or --network',
    );
    process.exit(1);
  }

  if (!keyRefId && !network) {
    logger.error('❌ Must specify either --key-ref-id or --network');
    process.exit(1);
  }

  try {
    if (keyRefId) {
      logger.log(`🗑️  Removing credentials for keyRefId: ${keyRefId}`);

      const networksUsingThisKey = api.network.findNetworksUsingKey(keyRefId);

      // Remove from KMS
      api.kms.remove(keyRefId);
      logger.log(`✅ Credentials removed for keyRefId: ${keyRefId}`);

      // Remove from networks that were using this key
      if (networksUsingThisKey.length > 0) {
        logger.log(
          `🔗 Also removing operator from networks: ${networksUsingThisKey.join(', ')}`,
        );
        for (const net of networksUsingThisKey) {
          api.network.removeOperator(net);
        }
        logger.log(
          `✅ Operator removed from ${networksUsingThisKey.length} network(s)`,
        );
      }
    } else if (network) {
      const targetNetwork = network as SupportedNetwork;
      logger.log(
        `🗑️  Removing operator credentials for network: ${targetNetwork}`,
      );

      const currentOperator = api.network.getOperator(targetNetwork);
      if (!currentOperator) {
        logger.log(`⚠️  No operator configured for network: ${targetNetwork}`);
        return;
      }

      api.network.removeOperator(targetNetwork);
      logger.log(`✅ Operator removed for network: ${targetNetwork}`);
      logger.log(`   Account ID: ${currentOperator.accountId}`);
      logger.log(`   Key Reference ID: ${currentOperator.keyRefId}`);
    }
  } catch (error) {
    logger.error(formatError('❌ Failed to remove credentials: ', error));
    throw error;
  }

  process.exit(0);
}

export default removeHandler;
