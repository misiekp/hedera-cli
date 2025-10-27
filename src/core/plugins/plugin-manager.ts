/**
 * Plugin Manager
 *
 * Direct plugin management without unnecessary layers
 */
import * as path from 'path';
import { Command } from 'commander';
import { CoreApi } from '../core-api/core-api.interface';
import { CommandHandlerArgs, PluginManifest } from './plugin.interface';
import { CommandSpec, CommandHandler } from './plugin.types';
import { formatError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { kebabToCamel } from '../utils/kebab-to-camel';

interface LoadedPlugin {
  manifest: PluginManifest;
  path: string;
  status: 'loaded' | 'error';
}

export class PluginManager {
  private coreApi: CoreApi;
  private loadedPlugins: Map<string, LoadedPlugin> = new Map();
  private defaultPlugins: string[] = [];

  constructor(coreApi: CoreApi) {
    this.coreApi = coreApi;
  }

  /**
   * Set default plugins
   */
  setDefaultPlugins(pluginPaths: string[]): void {
    this.defaultPlugins = pluginPaths;
  }

  /**
   * Initialize and load default plugins
   */
  async initialize(): Promise<void> {
    logger.log('🔌 Loading plugins...');

    for (const pluginPath of this.defaultPlugins) {
      try {
        await this.loadPluginFromPath(pluginPath);
        logger.log(`✅ Loaded: ${pluginPath}`);
      } catch {
        logger.log(`ℹ️  Plugin not available: ${pluginPath}`);
      }
    }

    logger.log(`✅ Plugin system ready`);
  }

  /**
   * Register all plugin commands with Commander.js
   */
  registerCommands(program: Command): void {
    for (const plugin of this.loadedPlugins.values()) {
      this.registerPluginCommands(program, plugin);
    }
  }

  /**
   * Add a plugin dynamically
   */
  async addPlugin(pluginPath: string): Promise<void> {
    logger.log(`➕ Adding plugin: ${pluginPath}`);
    await this.loadPluginFromPath(pluginPath);
    logger.log(`✅ Plugin added: ${pluginPath}`);
  }

  /**
   * Remove a plugin
   */
  removePlugin(pluginName: string): void {
    logger.log(`➖ Removing plugin: ${pluginName}`);
    this.loadedPlugins.delete(pluginName);
    logger.log(`✅ Plugin removed: ${pluginName}`);
  }

  /**
   * List all plugins
   */
  listPlugins(): Array<{ name: string; path: string; status: string }> {
    return Array.from(this.loadedPlugins.values()).map((plugin) => ({
      name: plugin.manifest.name,
      path: plugin.path,
      status: plugin.status,
    }));
  }

  /**
   * Load a plugin from path
   */
  private async loadPluginFromPath(pluginPath: string): Promise<LoadedPlugin> {
    try {
      // Load manifest
      const manifestPath = path.resolve(pluginPath, 'manifest.js');
      const manifestModule = (await import(manifestPath)) as {
        default: PluginManifest;
      };
      const manifest = manifestModule.default;

      if (!manifest) {
        throw new Error(`No manifest found in ${pluginPath}`);
      }

      const loadedPlugin: LoadedPlugin = {
        manifest,
        path: pluginPath,
        status: 'loaded',
      };

      this.loadedPlugins.set(String(manifest.name), loadedPlugin);
      return loadedPlugin;
    } catch (error) {
      throw new Error(
        formatError(`Failed to load plugin from ${pluginPath}: `, error),
      );
    }
  }

  /**
   * Register commands for a specific plugin
   */
  private registerPluginCommands(program: Command, plugin: LoadedPlugin): void {
    const pluginName = plugin.manifest.name;
    const commands = plugin.manifest.commands || [];

    // Create plugin command group
    const pluginCommand = program
      .command(pluginName)
      .description(
        plugin.manifest.description || `Commands for ${pluginName} plugin`,
      );

    // Register each command
    for (const commandSpec of commands) {
      this.registerSingleCommand(pluginCommand, plugin, commandSpec);
    }

    logger.log(`✅ Registered commands for: ${pluginName}`);
  }

  /**
   * Register a single command
   */
  private registerSingleCommand(
    pluginCommand: Command,
    plugin: LoadedPlugin,
    commandSpec: CommandSpec,
  ): void {
    const commandName = String(commandSpec.name);

    const command = pluginCommand
      .command(commandName)
      .description(
        String(
          commandSpec.description ||
            commandSpec.summary ||
            `Execute ${commandName}`,
        ),
      );

    // Add options
    if (commandSpec.options) {
      for (const option of commandSpec.options) {
        const optionName = String(option.name);
        const short = option.short ? `-${String(option.short)}` : '';
        const long = `--${optionName}`;
        const combined = short ? `${short}, ${long}` : long;

        if (option.type === 'boolean') {
          command.option(
            combined,
            String(option.description || `Set ${optionName}`),
          );
        } else if (option.type === 'number') {
          const flags = `${combined} <value>`;
          if (option.required) {
            command.requiredOption(
              flags,
              String(option.description || `Set ${optionName}`),
              parseFloat,
            );
          } else {
            command.option(
              flags,
              String(option.description || `Set ${optionName}`),
              parseFloat,
            );
          }
        } else if (option.type === 'array') {
          const flags = `${combined} <values>`;
          if (option.required) {
            command.requiredOption(
              flags,
              String(option.description || `Set ${optionName}`),
              (value: unknown) => String(value).split(','),
            );
          } else {
            command.option(
              flags,
              String(option.description || `Set ${optionName}`),
              (value: unknown) => String(value).split(','),
            );
          }
        } else {
          const flags = `${combined} <value>`;
          if (option.required) {
            command.requiredOption(
              flags,
              String(option.description || `Set ${optionName}`),
            );
          } else {
            command.option(
              flags,
              String(option.description || `Set ${optionName}`),
            );
          }
        }
      }
    }

    // Set up action handler
    command.action(async (...args: unknown[]) => {
      try {
        await this.executePluginCommand(plugin, commandSpec, args);
      } catch (error) {
        console.error(
          `Error executing ${plugin.manifest.name} ${commandName}:`,
          error,
        );
        process.exit(1);
      }
    });
  }

  /**
   * Execute a plugin command
   */
  private async executePluginCommand(
    plugin: LoadedPlugin,
    commandSpec: CommandSpec,
    args: unknown[],
  ): Promise<void> {
    const command = args[args.length - 1] as Command;
    const options = command.opts();
    const commandArgs = command.args;

    const handlerArgs: CommandHandlerArgs = {
      args: {
        ...options,
        _: commandArgs,
      },
      api: this.coreApi,
      state: this.coreApi.state,
      config: this.coreApi.config,
      logger: this.coreApi.logger,
    };

    const handlerPath = commandSpec.handler;
    if (!handlerPath) {
      throw new Error(`No handler specified for command ${commandSpec.name}`);
    }

    const fullHandlerPath = path.resolve(plugin.path, handlerPath + '.js');
    const handlerModule = (await import(fullHandlerPath)) as Record<
      string,
      unknown
    >;

    // handle for dash commands handlers like `submit-message` -> `submitMessage`
    const fixedName = kebabToCamel(commandSpec.name);

    const handler =
      (handlerModule.default as CommandHandler) ||
      (handlerModule[fixedName + 'Handler'] as CommandHandler);

    if (typeof handler !== 'function') {
      throw new Error(`Handler for ${commandSpec.name} is not a function`);
    }

    // Execute handler
    const result = await handler(handlerArgs);

    // ADR-003: If command has output spec, expect handler to return result
    if (commandSpec.output) {
      if (!result) {
        logger.error(
          `Handler for ${commandSpec.name} must return CommandExecutionResult when output spec is defined`,
        );
        process.exit(1);
      }

      const executionResult = result;

      // Handle failure or partial success
      if (executionResult.status !== 'success') {
        if (executionResult.errorMessage) {
          logger.error(executionResult.errorMessage);
        }
        // Exit with code 1 for both 'failure' and 'partial' status
        process.exit(1);
      }

      // Handle successful execution with output
      if (executionResult.outputJson) {
        try {
          // Use OutputHandlerService to format and display output
          this.coreApi.output.handleCommandOutput({
            outputJson: executionResult.outputJson,
            schema: commandSpec.output.schema,
            template: commandSpec.output.humanTemplate,
            format: this.coreApi.output.getFormat(),
          });
        } catch (error) {
          logger.error(
            `Failed to handle output from ${commandSpec.name}: ${formatError('', error)}`,
          );
          process.exit(1);
        }
      }

      // Success - exit with code 0
      process.exit(0);
    }

    // Legacy behavior: handler returns void, no output processing
    // Handler is responsible for its own output and error handling
  }
}
