/**
 * Account Plugin Index
 * Exports the account plugin manifest and command handlers
 */
export { accountPluginManifest } from './manifest';

// Export command handlers
export { getAccountBalanceHandler as balanceHandler } from './commands/balance';
export { clearAccountsHandler as clearHandler } from './commands/clear';
export { createAccountHandler as createHandler } from './commands/create';
export { deleteAccountHandler as deleteHandler } from './commands/delete';
export { importAccountHandler as importHandler } from './commands/import';
export { listAccountsHandler as listHandler } from './commands/list';
export { viewAccountHandler as viewHandler } from './commands/view';
