/**
 * List Credentials Command Handler
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { Status } from '../../../../core/shared/constants';
import { formatError } from '../../../../utils/errors';
import { ListCredentialsOutput } from './output';

export default function listCredentials(
  args: CommandHandlerArgs,
): CommandExecutionResult {
  const { logger, api } = args;

  logger.log('🔐 Retrieving stored credentials...');

  try {
    const credentials = api.kms.list();

    // Map the credentials to match our output schema
    const mappedCredentials = credentials.map((cred) => ({
      keyRefId: cred.keyRefId,
      type: cred.type as 'ECDSA' | 'ED25519',
      publicKey: cred.publicKey,
      labels: cred.labels || [],
    }));

    // Prepare output data
    const outputData: ListCredentialsOutput = {
      credentials: mappedCredentials,
      totalCount: credentials.length,
    };

    return {
      status: Status.Success,
      outputJson: JSON.stringify(outputData),
    };
  } catch (error: unknown) {
    return {
      status: Status.Failure,
      errorMessage: formatError('Failed to list credentials', error),
    };
  }
}
