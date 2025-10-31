/**
 * Account View Command Handler
 * Handles viewing account details using the Core API
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { formatError } from '../../../../utils/errors';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import { ViewAccountOutput } from './output';

export async function viewAccount(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const accountState = new ZustandAccountStateHelper(api.state, logger);

  // Extract command arguments
  const accountIdOrNameOrAlias = args.args['accountIdOrNameOrAlias'] as string;

  logger.log(`Viewing account details: ${accountIdOrNameOrAlias}`);

  try {
    // Resolve account identifier (could be name, account ID, or alias)
    let accountId = accountIdOrNameOrAlias;

    // First check if it's a stored account name
    const account = accountState.loadAccount(accountIdOrNameOrAlias);
    if (account) {
      accountId = account.accountId;
      logger.log(`Found account in state: ${account.name}`);
    } else {
      // For now, assume it's an account ID
      // TODO: Add proper alias resolution here
      logger.log(`Using as account ID: ${accountIdOrNameOrAlias}`);
    }

    // Get account info from mirror node
    const accountInfo = await api.mirror.getAccount(accountId);

    // Prepare output data
    const outputData: ViewAccountOutput = {
      accountId: accountInfo.accountId,
      balance: BigInt(accountInfo.balance.balance.toString()),
      ...(accountInfo.evmAddress && { evmAddress: accountInfo.evmAddress }),
      ...(accountInfo.accountPublicKey && {
        publicKey: accountInfo.accountPublicKey,
      }),
      balanceTimestamp: accountInfo.balance.timestamp,
    };

    return {
      status: 'success',
      outputJson: JSON.stringify(outputData, (key, value): unknown =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    };
  } catch (error: unknown) {
    return {
      status: 'failure',
      errorMessage: formatError('Failed to view account', error),
    };
  }
}
