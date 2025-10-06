/**
 * Account Delete Command Handler
 * Handles deleting accounts using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { ZustandAccountStateHelper } from '../zustand-state-helper';

async function deleteAccountHandler(args: CommandHandlerArgs) {
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
      accountToDelete = await accountState.loadAccount(name);
      if (!accountToDelete) {
        throw new Error(`Account with name '${name}' not found`);
      }
    } else if (accountId) {
      const accounts = await accountState.listAccounts();
      accountToDelete = accounts.find((acc) => acc.accountId === accountId);
      if (!accountToDelete) {
        throw new Error(`Account with ID '${accountId}' not found`);
      }
    } else {
      throw new Error('Either name or id must be provided');
    }

    // Delete account from state
    await accountState.deleteAccount(accountToDelete.name);

    logger.log(
      `✅ Account deleted successfully: ${accountToDelete.name} (${accountToDelete.accountId})`,
    );

    process.exit(0);
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to delete account', error));
    process.exit(1);
  }
}

export default deleteAccountHandler;
