/**
 * Remove Credentials Command Handler
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { formatError } from '../../../../utils/errors';
import { RemoveCredentialsOutput } from './output';

export default function removeCredentials(
  args: CommandHandlerArgs,
): CommandExecutionResult {
  const { logger, api } = args;
  const { keyRefId } = args.args as { keyRefId: string };

  logger.log(`🗑️  Removing credentials for keyRefId: ${keyRefId}`);

  try {
    // Remove the credentials
    api.kms.remove(keyRefId);

    // Prepare output data
    const outputData: RemoveCredentialsOutput = {
      keyRefId,
      removed: true,
    };

    return {
      status: 'success',
      outputJson: JSON.stringify(outputData),
    };
  } catch (error: unknown) {
    // Even if removal fails, we still want to return a structured response
    const outputData: RemoveCredentialsOutput = {
      keyRefId,
      removed: false,
    };

    return {
      status: 'failure',
      errorMessage: formatError('Failed to remove credentials', error),
      outputJson: JSON.stringify(outputData),
    };
  }
}
