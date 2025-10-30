/**
 * State Management Plugin Index
 * Exports the state management plugin manifest and command handlers
 */
import listHandler from './commands/list/handler';
import clearHandler from './commands/clear/handler';
import infoHandler from './commands/info/handler';
import backupHandler from './commands/backup/handler';
import statsHandler from './commands/stats/handler';

export { default as stateManagementManifest } from './manifest';

// Export command handlers
export { listHandler, clearHandler, infoHandler, backupHandler, statsHandler };
