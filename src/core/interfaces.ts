export interface PluginManifest {
  name: string;
  version: string;
  cliName: string;
  description?: string;
  compatibility: { cli: string; core: string; api?: string };
  capabilities: string[];
  commands: CommandSpec[];
  stateSchemas?: Array<{
    namespace: string;
    version: number;
    jsonSchema: unknown;
    scope?: 'profile' | 'global';
  }>;
}

export interface CommandSpec {
  name: string; // e.g., 'token create',
  cliName: string;
  summary?: string;
  description?: string;
  options?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    required?: boolean;
    default?: unknown;
  }>;
  handler: () => void; // path within plugin package
}

export interface CommandHandlerArgs {
  // args: Record<string, unknown>;
  // api: CoreAPI; // injected instance per execution
  // state: StateManager; // namespaced access provided by Core
  // config: ConfigView;
  // telemetry: Telemetry;
  // logger: Logger;
}
