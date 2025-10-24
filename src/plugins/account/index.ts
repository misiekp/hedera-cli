/**
 * Account Plugin Index
 * Exports the account plugin manifest and command handlers
 */
import balanceHandler from './commands/balance/handler';
import clearHandler from './commands/clear/handler';
import createHandler from './commands/create/handler';
import deleteHandler from './commands/delete/handler';
import importHandler from './commands/import/handler';
import listHandler from './commands/list/handler';
import viewHandler from './commands/view/handler';

export { accountPluginManifest } from './manifest';

// Export command handlers
export {
  balanceHandler,
  clearHandler,
  createHandler,
  deleteHandler,
  importHandler,
  listHandler,
  viewHandler,
};
