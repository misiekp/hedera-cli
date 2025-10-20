/**
 * Get Credentials Command Handler
 * Shows the default operator for a specific network
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { SupportedNetwork } from '../../../core/types/shared.types';
import { color } from '../../../utils/color';

export function getHandler(args: CommandHandlerArgs): void {
  const { logger, api } = args;
  const { network } = args.args as {
    network?: SupportedNetwork;
  };

  const targetNetwork = network || api.network.getCurrentNetwork();

  logger.log(`🔐 Default operator for ${targetNetwork}:`);

  try {
    const operator = api.credentialsState.getOperator(targetNetwork);

    if (!operator) {
      logger.log(
        `   ${color.yellow('No default operator set for this network')}`,
      );
      logger.log(`   Use "credentials set" to add credentials`);
      process.exit(0);
      return;
    }

    // Get additional details from the credential record
    const publicKey = api.credentialsState.getPublicKey(operator.keyRefId);
    const allCredentials = api.credentialsState.list();
    const credentialRecord = allCredentials.find(
      (cred) => cred.keyRefId === operator.keyRefId,
    );

    logger.log(`   Account ID: ${color.cyan(operator.accountId)}`);
    logger.log(`   Key Reference ID: ${color.cyan(operator.keyRefId)}`);
    if (publicKey) {
      logger.log(`   Public Key: ${color.cyan(publicKey)}`);
    }
    if (credentialRecord?.labels && credentialRecord.labels.length > 0) {
      logger.log(
        `   Labels: ${color.cyan(credentialRecord.labels.join(', '))}`,
      );
    }

    process.exit(0);
  } catch (error) {
    logger.error(formatError('❌ Failed to get credentials', error));
    process.exit(1);
  }
}

export default getHandler;
