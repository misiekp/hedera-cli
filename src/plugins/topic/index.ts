/**
 * Topic Plugin Index
 * Exports the topic plugin manifest and command handlers
 */
export { topicPluginManifest } from './manifest';

// Export command handlers (now using default exports from new structure)
export { default as createHandler } from './commands/create/handler';
export { default as listHandler } from './commands/list/handler';
export { default as submitMessageHandler } from './commands/submit-message/handler';
export { default as findMessageHandler } from './commands/find-message/handler';
