/**
 * Main Core exports
 * Entry point for the entire Core API
 */

// Core API
export * from './core-api';

// Services
export * from './services/accounts/account-transaction-service.interface';
export * from './services/signing/signing-service.interface';
export * from './services/state/state-service.interface';
export * from './services/mirrornode/hedera-mirrornode-service.interface';
export { NetworkService } from './services/network/network-service.interface';
export { ConfigService } from './services/config/config-service.interface';
export * from './services/logger/logger-service.interface';

// Shared Types
export type {
  Account,
  Token,
  Topic,
  Script,
  Credentials,
  NetworkConfig,
} from './types/shared.types';

// Plugin Types
export type {
  PluginManifest,
  CommandSpec,
  CommandOption,
  PluginContext,
  PluginStateSchema,
} from './plugins/plugin.types';

// Plugins
export * from './plugins/plugin.interface';
