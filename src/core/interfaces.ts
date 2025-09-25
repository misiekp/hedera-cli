import { WrapConfig } from '../commands/shared/wrapAction';
import { CoreApi } from './core-api';
import { Errors } from './errors';

export interface PluginManifest {
  name: string;
  version: string;
  cliName: string;
  description?: string;
  compatibility: { cli: string; core: string; api?: string };
  capabilities: string[];
  commands: CommandSpec<any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  stateSchemas?: Array<{
    namespace: string;
    version: number;
    jsonSchema: unknown;
    scope?: 'profile' | 'global';
  }>;
}

export interface CommandOption {
  flags: string;
  description: string;
  required?: boolean;
}

export type AnyOptions = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface CommandSpec<Options extends AnyOptions = AnyOptions> {
  name: string;
  cliName: string;
  summary?: string;
  description?: string;
  options: Array<CommandOption>;
  handler: (options: Options, api: CommandHandlerArgs) => void | Promise<void>; // path within plugin package
  config?: WrapConfig<Options>;
}

export interface CommandHandlerArgs {
  api: CoreApi;
  errors: Errors;
  // args: Record<string, unknown>;
  // state: StateManager; // namespaced access provided by Core
  // config: ConfigView;
  // telemetry: Telemetry;
  // logger: Logger;
}
