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
    logger.error(
      '❌ Must specify --operator (alias or account-id:private-key format)',
    );
    process.exit(1);
  }

  try {
    // Set as operator for specified network or current network
    const targetNetwork =
      (network as SupportedNetwork) || api.network.getCurrentNetwork();

    const {
      accountId: resolvedAccountId,
      keyRefId: resolvedKeyRefId,
      publicKey: resolvedPublicKey,
    } = operator.includes(':')
      ? api.kms.parseAccountIdKeyPair(operator, 'account')
      : (() => {
          const aliasRecord = api.alias.resolve(
            operator,
            'account',
            targetNetwork,
          );
          if (!aliasRecord) {
            logger.error(
              `❌ Alias '${operator}' not found for network ${targetNetwork}`,
            );
            process.exit(1);
          }
          if (!aliasRecord.keyRefId) {
            logger.error(`❌ No key found for account ${aliasRecord.entityId}`);
            process.exit(1);
          }
          return {
            accountId: aliasRecord.entityId!,
            keyRefId: aliasRecord.keyRefId,
            publicKey: aliasRecord.publicKey || '',
          };
        })();

    if (operator.includes(':')) {
      logger.log(
        `🔐 Setting operator credentials using account-id:private-key format: ${resolvedAccountId}`,
      );
    } else {
      logger.log(
        `🔐 Setting operator credentials using alias: ${operator} → ${resolvedAccountId}`,
      );
    }

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
    logger.error(formatError('❌ Failed to set operator: ', error));
    throw error;
  }

  process.exit(0);
}

export default setHandler;
