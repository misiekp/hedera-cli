/**
 * Account Balance Command Handler
 * Handles account balance retrieval using the Core API
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import { TokenBalance } from '../../../../../types';
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { Status } from '../../../../core/shared/constants';
import { formatError } from '../../../../utils/errors';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import { AccountBalanceOutput } from './output';

export default async function getAccountBalance(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const accountState = new ZustandAccountStateHelper(api.state, logger);

  // Extract command arguments
  const accountIdOrNameOrAlias = args.args['accountIdOrNameOrAlias'] as string;
  const onlyHbar = (args.args['only-hbar'] as boolean) || false;
  const tokenId = args.args['token-id'] as string;

  logger.log(`Getting balance for account: ${accountIdOrNameOrAlias}`);

  try {
    // Resolve account identifier (could be name, account ID, or alias)
    let accountId = accountIdOrNameOrAlias;

    // First check if it's a stored account name
    const account = accountState.loadAccount(accountIdOrNameOrAlias);
    if (account) {
      accountId = account.accountId;
      logger.log(`Found account in state: ${account.name} -> ${accountId}`);
    } else {
      // For now, assume it's an account ID
      // TODO: Add proper alias resolution here
      logger.log(`Using as account ID: ${accountIdOrNameOrAlias}`);
    }

    // Get HBAR balance from mirror node
    const hbarBalance = await api.mirror.getAccountHBarBalance(accountId);

    // Prepare output data
    const outputData: AccountBalanceOutput = {
      accountId,
      hbarBalance: hbarBalance,
    };

    // Get token balances if not only HBAR
    if (!onlyHbar && !tokenId) {
      try {
        const tokenBalances =
          await api.mirror.getAccountTokenBalances(accountId);
        if (tokenBalances.tokens && tokenBalances.tokens.length > 0) {
          outputData.tokenBalances = tokenBalances.tokens.map(
            (token: TokenBalance) => ({
              tokenId: token.token_id,
              balance: BigInt(token.balance.toString()),
            }),
          );
        }
      } catch (error: unknown) {
        return {
          status: Status.Failure,
          errorMessage: formatError('Could not fetch token balances', error),
        };
      }
    }

    return {
      status: Status.Success,
      outputJson: JSON.stringify(outputData, (key, value): unknown =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    };
  } catch (error: unknown) {
    return {
      status: Status.Failure,
      errorMessage: formatError('Failed to get account balance', error),
    };
  }
}
