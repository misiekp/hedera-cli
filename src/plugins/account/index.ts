/**
 * Account Plugin Index
 * Exports the account plugin manifest and command handlers
 */
export { accountPluginManifest } from './manifest';

// Export command handlers
export { getAccountBalanceHandler } from './commands/balance';
export { clearAccountsHandler } from './commands/clear';
export { createAccountHandler } from './commands/create';
export { deleteAccountHandler } from './commands/delete';
export { importAccountHandler } from './commands/import';
export { listAccountsHandler } from './commands/list';
export { viewAccountHandler } from './commands/view';
