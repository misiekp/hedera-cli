/**
 * Topic Plugin Index
 * Exports the topic plugin manifest and command handlers
 */
export { topicPluginManifest } from './manifest';

// Export command handlers
export { createTopicHandler as createHandler } from './commands/create';
export { listTopicsHandler as listHandler } from './commands/list';
export { submitMessageHandler } from './commands/message-submit';
export { findMessageHandler } from './commands/message-find';
