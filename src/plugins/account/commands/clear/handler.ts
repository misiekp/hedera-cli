/**
 * Account Clear Command Handler
 * Handles clearing all accounts using the Core API
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { formatError } from '../../../../utils/errors';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import { ClearAccountsOutput } from './output';

export function clearAccounts(
  args: CommandHandlerArgs,
): CommandExecutionResult {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const accountState = new ZustandAccountStateHelper(api.state, logger);

  logger.log('Clearing all accounts...');

  try {
    const accounts = accountState.listAccounts();
    const count = accounts.length;

    // Clear all accounts
    accountState.clearAccounts();

    // Prepare output data
    const outputData: ClearAccountsOutput = {
      clearedCount: count,
    };

    return {
      status: 'success',
      outputJson: JSON.stringify(outputData),
    };
  } catch (error: unknown) {
    return {
      status: 'failure',
      errorMessage: formatError('Failed to clear accounts', error),
    };
  }
}
