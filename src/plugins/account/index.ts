/**
 * Account Plugin Index
 * Exports the account plugin manifest and command handlers
 */
export { accountPluginManifest } from './manifest';

// Export command handlers
export { default as createAccountHandler } from './commands/create';
export { default as getAccountBalanceHandler } from './commands/balance';
export { default as listAccountsHandler } from './commands/list';
export { default as importAccountHandler } from './commands/import';
export { default as clearAccountsHandler } from './commands/clear';
export { default as deleteAccountHandler } from './commands/delete';
export { default as viewAccountHandler } from './commands/view';
