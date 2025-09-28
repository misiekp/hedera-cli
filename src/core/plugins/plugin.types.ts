/**
 * Plugin System Type Definitions
 * Types specific to the plugin architecture
 */

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
  init?: (context: PluginContext) => Promise<void>;
  teardown?: (context: PluginContext) => Promise<void>;
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
}

/**
 * Command option
 */
export interface CommandOption {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  default?: any;
  description?: string;
}

/**
 * Plugin context
 */
export interface PluginContext {
  api: any; // CoreAPI
  state: any; // StateManager
  config: any; // ConfigView
  logger: any; // Logger
}

/**
 * Plugin state schema
 */
export interface PluginStateSchema {
  namespace: string;
  version: number;
  jsonSchema: object;
  scope: 'global' | 'profile' | 'plugin';
}
