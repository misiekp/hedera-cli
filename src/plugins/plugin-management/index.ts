/**
 * Plugin Management Plugin Index
 * Exports the plugin manifest and command handlers
 */
import pluginManagementManifest from './manifest';

// Export command handlers
export { default as addPlugin } from './commands/add/handler';
export { default as removePlugin } from './commands/remove/handler';
export { default as getPluginList } from './commands/list/handler';
export { default as getPluginInfo } from './commands/info/handler';

// Export the manifest
export default pluginManagementManifest;
