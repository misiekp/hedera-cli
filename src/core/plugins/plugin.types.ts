/**
 * Plugin System Type Definitions
 * Types specific to the plugin architecture
 */
import { CoreAPI } from '../core-api/core-api.interface';
import { StateService } from '../services/state/state-service.interface';
import { ConfigService } from '../services/config/config-service.interface';
import { Logger } from '../services/logger/logger-service.interface';
import { CommandHandlerArgs } from './plugin.interface';

/**
 * Plugin manifest structure
 */
export interface PluginManifest {
  name: string;
  version: string;
  displayName: string;
  description: string;
  compatibility: {
    cli: string;
    core: string;
    api: string;
  };
  capabilities: string[];
  commands: CommandSpec[];
  stateSchemas?: PluginStateSchema[];
  init?: (context?: PluginContext) => void | Promise<void>;
  teardown?: (context?: PluginContext) => void | Promise<void>;
}

/**
 * Command specification
 */
export interface CommandSpec {
  name: string;
  summary: string;
  description: string;
  arguments?: string;
  options?: CommandOption[];
  handler: string;
}

/**
 * Command option
 */
export interface CommandOption {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  default?: unknown;
  description?: string;
  short?: string; // optional short flag alias like 'b' for -b
}

/**
 * Plugin context
 */
export interface PluginContext {
  api: CoreAPI;
  state: StateService;
  config: ConfigService;
  logger: Logger;
}

/**
 * Command handler function type
 */
export type CommandHandler = (args: CommandHandlerArgs) => void | Promise<void>;

/**
 * Plugin state schema
 */
export interface PluginStateSchema {
  namespace: string;
  version: number;
  jsonSchema: object;
  scope: 'global' | 'profile' | 'plugin';
}
