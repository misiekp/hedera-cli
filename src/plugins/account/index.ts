/**
 * Account Plugin Index
 * Exports the account plugin manifest and command handlers
 */
export { accountPluginManifest } from './manifest';

// Export command handlers
export { createAccountHandler } from './commands/create';
export { getAccountBalanceHandler } from './commands/balance';
export { listAccountsHandler } from './commands/list';
export { importAccountHandler } from './commands/import';
export { clearAccountsHandler } from './commands/clear';
export { deleteAccountHandler } from './commands/delete';
export { viewAccountHandler } from './commands/view';
