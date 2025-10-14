/**
 * Core API exports
 * Main entry point for the Core API interfaces
 */

// Main Core API interface
export { CoreAPI } from './core-api.interface';

// Core API implementation
export { CoreAPIImplementation, createCoreAPI } from './core-api';

// Service interfaces
export { AccountService } from '../services/account/account-transaction-service.interface';
export { TransactionService } from '../services/signing/signing-service.interface';
export { StateService as GenericStateService } from '../services/state/state-service.interface';
export { NetworkService } from '../services/network/network-service.interface';
export { ConfigService } from '../services/config/config-service.interface';
export { Logger } from '../services/logger/logger-service.interface';
export { HbarService } from '../services/hbar/hbar-service.interface';
export { AliasManagementService } from '../services/alias/alias-service.interface';
export { KeyManagementService } from '../services/kms/credentials-state-service.interface';

// Plugin interfaces (ADR-001 compliant)
export { CommandHandlerArgs } from '../plugins/plugin.interface';

// Re-export types for convenience
export type {
  Account,
  Token,
  Topic,
  Script,
  Credentials,
  NetworkConfig,
} from '../types/shared.types';

export type {
  PluginManifest,
  CommandSpec,
  CommandOption,
  PluginContext,
  PluginStateSchema,
} from '../plugins/plugin.types';

export type { CreateAccountParams } from '../services/account/account-transaction-service.interface';
