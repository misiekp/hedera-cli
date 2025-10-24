/**
 * Set Credentials Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { SupportedNetwork } from '../../../core/types/shared.types';

export function setHandler(args: CommandHandlerArgs): void {
  const { logger, api } = args;
  const { operator, network } = args.args as {
    operator: string;
    network?: string;
  };

  if (!operator) {
    logger.error('❌ Must specify --operator in account-id:private-key format');
    process.exit(1);
  }

  try {
    // Parse account-id:private-key format
    const resolved = api.kms.parseAccountIdKeyPair(operator, 'account');
    const resolvedAccountId = resolved.accountId;
    const resolvedKeyRefId = resolved.keyRefId;
    const resolvedPublicKey = resolved.publicKey;

    logger.log(
      `🔐 Setting operator credentials using account-id:private-key format: ${resolvedAccountId}`,
    );

    // Set as operator for specified network or current network
    const targetNetwork =
      (network as SupportedNetwork) || api.network.getCurrentNetwork();

    // Check if operator already exists for this network
    const existingOperator = api.network.getOperator(targetNetwork);
    if (existingOperator) {
      logger.log(`⚠️  Operator already exists for network ${targetNetwork}`);
      logger.log(
        `   Previous: ${existingOperator.accountId} (${existingOperator.keyRefId})`,
      );
      logger.log(`   New: ${resolvedAccountId} (${resolvedKeyRefId})`);
      logger.log(`🔄 Overwriting operator for network ${targetNetwork}`);
    } else {
      logger.log(`✅ Setting new operator for network ${targetNetwork}`);
    }

    api.network.setOperator(targetNetwork, {
      accountId: resolvedAccountId,
      keyRefId: resolvedKeyRefId,
    });

    logger.log(
      `✅ Credentials set successfully for account: ${resolvedAccountId}`,
    );
    logger.log(`   Network: ${targetNetwork}`);
    logger.log(`   Key Reference ID: ${resolvedKeyRefId}`);
    logger.log(`   Public Key: ${resolvedPublicKey}`);
  } catch (error) {
    logger.error(formatError('❌ Failed to set credentials: ', error));
    throw error;
  }

  process.exit(0);
}

export default setHandler;
