/**
 * Account Delete Command Handler
 * Handles deleting accounts using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { ZustandAccountStateHelper } from '../zustand-state-helper';
import { AliasType } from '../../../core/services/alias/alias-service.interface';

export function deleteAccountHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const accountState = new ZustandAccountStateHelper(api.state, logger);

  // Extract command arguments
  const name = args.args.name as string;
  const accountId = args.args.id as string;

  logger.log(`Deleting account...`);

  try {
    let accountToDelete;

    // Find account by name or ID
    if (name) {
      accountToDelete = accountState.loadAccount(name);
      if (!accountToDelete) {
        throw new Error(`Account with name '${name}' not found`);
      }
    } else if (accountId) {
      const accounts = accountState.listAccounts();
      accountToDelete = accounts.find((acc) => acc.accountId === accountId);
      if (!accountToDelete) {
        throw new Error(`Account with ID '${accountId}' not found`);
      }
    } else {
      throw new Error('Either name or id must be provided');
    }

    // Remove any aliases associated with this account on the current network
    const currentNetwork = api.network.getCurrentNetwork();
    const aliasesForAccount = api.alias
      .list({ network: currentNetwork, type: AliasType.Account })
      .filter((rec) => rec.entityId === accountToDelete.accountId);

    for (const rec of aliasesForAccount) {
      api.alias.remove(rec.alias, currentNetwork);
      logger.log(`🧹 Removed alias '${rec.alias}' on ${currentNetwork}`);
    }

    // Delete account from state
    accountState.deleteAccount(accountToDelete.name);

    logger.log(
      `✅ Account deleted successfully: ${accountToDelete.name} (${accountToDelete.accountId})`,
    );

    process.exit(0);
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to delete account', error));
    process.exit(1);
  }
}
