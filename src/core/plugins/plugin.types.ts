/**
 * Plugin System Type Definitions
 * Types specific to the plugin architecture
 */
import { CoreApi } from '../core-api/core-api.interface';
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
 * Command output specification
 * Defines the schema and optional human-readable template for command output
 */
import { z } from 'zod';

export interface CommandOutputSpec {
  /** Zod schema for the command's output */
  schema: z.ZodTypeAny;
  /** Optional human-readable Handlebars template string */
  humanTemplate?: string;
}

/**
 * Command specification
 */
export interface CommandSpec {
  name: string;
  summary: string;
  description: string;
  options?: CommandOption[];
  handler: string;
  /** Describes the handler's output (schema and optional template)
   * TODO: Make this field mandatory once all commands have been migrated to ADR-003 contract
   */
  output?: CommandOutputSpec;
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
  api: CoreApi;
  state: StateService;
  config: ConfigService;
  logger: Logger;
}

/**
 * Command execution status
 */
export type CommandStatus = 'success' | 'failure' | 'partial';

/**
 * Command execution result
 * Returned by handlers that follow ADR-003 contract
 */
export interface CommandExecutionResult {
  status: CommandStatus;
  /** Optional, present when status !== 'success'; intended for humans */
  errorMessage?: string;
  /** JSON string conforming to the manifest-declared output schema */
  outputJson?: string;
}

/**
 * Command handler function type
 * - Handlers without output spec can return void (legacy behavior)
 * - Handlers with output spec must return CommandExecutionResult (ADR-003)
 */
export type CommandHandler = (
  args: CommandHandlerArgs,
) =>
  | void
  | Promise<void>
  | CommandExecutionResult
  | Promise<CommandExecutionResult>;

/**
 * Plugin state schema
 */
export interface PluginStateSchema {
  namespace: string;
  version: number;
  jsonSchema: object;
  scope: 'global' | 'profile' | 'plugin';
}
