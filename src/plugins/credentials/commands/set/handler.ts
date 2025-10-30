/**
 * Set Credentials Command Handler
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { SupportedNetwork } from '../../../../core/types/shared.types';
import { formatError } from '../../../../utils/errors';
import { SetCredentialsOutput } from './output';

export function setCredentials(
  args: CommandHandlerArgs,
): CommandExecutionResult {
  const { logger, api } = args;
  const { accountId, privateKey, network } = args.args as {
    accountId: string;
    privateKey: string;
    network?: string;
  };

  logger.log(`🔐 Setting operator for account: ${accountId}`);

  try {
    // Import the private key and get the keyRefId
    const { keyRefId, publicKey } = api.kms.importPrivateKey(privateKey, [
      'default-operator',
    ]);

    // Set as operator for specified network or current network
    const targetNetwork =
      (network as SupportedNetwork) || api.network.getCurrentNetwork();
    api.network.setOperator(targetNetwork, { accountId, keyRefId });

    // Prepare output data
    const outputData: SetCredentialsOutput = {
      accountId,
      network: targetNetwork,
      keyRefId,
      publicKey,
      success: true,
    };

    return {
      status: 'success',
      outputJson: JSON.stringify(outputData),
    };
  } catch (error: unknown) {
    return {
      status: 'failure',
      errorMessage: formatError('Failed to set operator credentials', error),
    };
  }
}
