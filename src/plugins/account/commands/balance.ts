/**
 * Account Balance Command Handler
 * Handles account balance retrieval using the Core API
 */
import { TokenBalance } from '../../../../types';
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { ZustandAccountStateHelper } from '../zustand-state-helper';

export async function getAccountBalanceHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const accountState = new ZustandAccountStateHelper(api.state, logger);

  // Extract command arguments
  const accountIdOrNameOrAlias = args.args['account'] as string;
  const onlyHbar = (args.args['only-hbar'] as boolean) || false;
  const tokenId = args.args['token-id'] as string;

  logger.log(`Getting balance for account: ${accountIdOrNameOrAlias}`);

  try {
    // Resolve account identifier (could be name or account ID)
    let accountId = accountIdOrNameOrAlias;

    // First check if it's a stored account name
    const account = accountState.loadAccount(accountIdOrNameOrAlias);
    if (account) {
      accountId = account.accountId;
      logger.log(`Found account in state: ${account.name} -> ${accountId}`);
    } else {
      // For now, assume it's an account ID
      // TODO: Add proper name resolution here
      logger.log(`Using as account ID: ${accountIdOrNameOrAlias}`);
    }

    // Get HBAR balance from mirror node
    const hbarBalance = await api.mirror.getAccountHBarBalance(accountId);

    if (onlyHbar) {
      logger.log(`💰 Hbar Balance: ${hbarBalance.toString()} tinybars`);
    } else {
      logger.log(`💰 Account Balance: ${hbarBalance.toString()} tinybars`);

      // Get token balances if not only HBAR
      if (!tokenId) {
        try {
          const tokenBalances =
            await api.mirror.getAccountTokenBalances(accountId);
          if (tokenBalances.tokens && tokenBalances.tokens.length > 0) {
            logger.log(`🪙 Token Balances:`);
            tokenBalances.tokens.forEach((token: TokenBalance) => {
              logger.log(`   ${token.token_id}: ${token.balance}`);
            });
          } else {
            logger.log(`   No token balances found`);
          }
        } catch (error: unknown) {
          logger.log(formatError('   Could not fetch token balances', error));
          process.exit(1);
        }
      }
    }

    process.exit(0);
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to get account balance', error));
    process.exit(1);
  }
}
