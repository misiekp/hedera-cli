/**
 * Set Operator Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { SupportedNetwork } from '../../../core/types/shared.types';
import { validateAccountId } from '../../../core/utils/account-id-validator';
import { Logger } from '../../../core/services/logger/logger-service.interface';
import { AliasService } from '../../../core/services/alias/alias-service.interface';
import { KmsService } from '../../../core/services/kms/kms-service.interface';

/**
 * Resolve operator credentials from alias
 */
function resolveOperatorFromAlias(
  alias: string,
  targetNetwork: SupportedNetwork,
  aliasService: AliasService,
  logger: Logger,
): { accountId: string; keyRefId: string; publicKey: string } {
  const aliasRecord = aliasService.resolve(alias, 'account', targetNetwork);

  if (!aliasRecord) {
    logger.error(`❌ Alias '${alias}' not found for network ${targetNetwork}`);
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
}

function resolveOperatorFromIdKey(
  idKeyPair: string,
  kmsService: KmsService,
): { accountId: string; keyRefId: string; publicKey: string } {
  const parts = idKeyPair.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid format. Expected account-id:private-key');
  }
  const [accountId, privateKey] = parts;
  validateAccountId(accountId);
  const imported = kmsService.importPrivateKey(privateKey);
  return {
    accountId,
    keyRefId: imported.keyRefId,
    publicKey: imported.publicKey,
  };
}

export function setOperatorHandler(args: CommandHandlerArgs): void {
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
      ? resolveOperatorFromIdKey(operator, api.kms)
      : resolveOperatorFromAlias(operator, targetNetwork, api.alias, logger);

    if (operator.includes(':')) {
      logger.log(
        `🔐 Setting operator using account-id:private-key format: ${resolvedAccountId}`,
      );
    } else {
      logger.log(
        `🔐 Setting operator using alias: ${operator} → ${resolvedAccountId}`,
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
      `✅ Operator set successfully for account: ${resolvedAccountId}`,
    );
    logger.log(`   Network: ${targetNetwork}`);
    logger.log(`   Key Reference ID: ${resolvedKeyRefId}`);
    logger.log(`   Public Key: ${resolvedPublicKey}`);
  } catch (error) {
    logger.error(formatError('❌ Failed to set operator: ', error));
    process.exit(1);
  }

  process.exit(0);
}

export default setOperatorHandler;
