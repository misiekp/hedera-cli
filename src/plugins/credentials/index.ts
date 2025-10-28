/**
 * Credentials Plugin Index
 * Exports the credentials plugin manifest and command handlers
 */
import listHandler from './commands/list/handler';
import removeHandler from './commands/remove/handler';
import setHandler from './commands/set/handler';

export { default as credentialsManifest } from './manifest';

// Export command handlers
export { listHandler, removeHandler, setHandler };
