/**
 * Topic Plugin Index
 * Exports the topic plugin manifest and command handlers
 */
export { topicPluginManifest } from './manifest';

// Export command handlers
export { createTopicHandler } from './commands/create';
export { listTopicsHandler } from './commands/list';
export { submitMessageHandler } from './commands/message-submit';
export { findMessageHandler } from './commands/message-find';
