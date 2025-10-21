/**
 * Account List Command Handler
 * Handles listing all accounts using the Core API
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { formatError } from '../../../../utils/errors';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import { ListAccountsOutput } from './output';

export default function listAccountsHandler(
  args: CommandHandlerArgs,
): CommandExecutionResult {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const accountState = new ZustandAccountStateHelper(api.state, logger);

  // Extract command arguments
  const showPrivateKeys = (args.args.private as boolean) || false;

  logger.log('Listing all accounts...');

  try {
    const accounts = accountState.listAccounts();

    // Prepare output data
    const outputData: ListAccountsOutput = {
      accounts: accounts.map((account) => ({
        name: account.name,
        accountId: account.accountId,
        type: account.type,
        network: account.network,
        evmAddress: account.evmAddress,
        // Only include keyRefId when --private flag is used
        ...(showPrivateKeys && { keyRefId: account.keyRefId }),
      })),
      totalCount: accounts.length,
    };

    return {
      status: 'success',
      outputJson: JSON.stringify(outputData),
    };
  } catch (error: unknown) {
    return {
      status: 'failure',
      errorMessage: formatError('Failed to list accounts', error),
    };
  }
}
