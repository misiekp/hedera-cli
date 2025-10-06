/**
 * Plugin Manager
 *
 * Direct plugin management without unnecessary layers
 */
import { Command } from 'commander';
import { CoreAPI } from '../core-api/core-api.interface';
import { CommandHandlerArgs, PluginManifest } from './plugin.interface';
import * as path from 'path';

interface LoadedPlugin {
  manifest: PluginManifest;
  path: string;
  status: 'loaded' | 'error';
}

export class PluginManager {
  private coreAPI: CoreAPI;
  private loadedPlugins: Map<string, LoadedPlugin> = new Map();
  private defaultPlugins: string[] = [];

  constructor(coreAPI: CoreAPI) {
    this.coreAPI = coreAPI;
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
    console.log('🔌 Loading plugins...');

    for (const pluginPath of this.defaultPlugins) {
      try {
        await this.loadPluginFromPath(pluginPath);
        console.log(`✅ Loaded: ${pluginPath}`);
      } catch (error) {
        console.log(`ℹ️  Plugin not available: ${pluginPath}`);
      }
    }

    console.log(`✅ Plugin system ready`);
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
    console.log(`➕ Adding plugin: ${pluginPath}`);
    await this.loadPluginFromPath(pluginPath);
    console.log(`✅ Plugin added: ${pluginPath}`);
  }

  /**
   * Remove a plugin
   */
  async removePlugin(pluginName: string): Promise<void> {
    console.log(`➖ Removing plugin: ${pluginName}`);
    this.loadedPlugins.delete(pluginName);
    console.log(`✅ Plugin removed: ${pluginName}`);
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
      const manifestModule = await import(manifestPath);
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
      throw new Error(`Failed to load plugin from ${pluginPath}: ${error}`);
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

    console.log(`✅ Registered commands for: ${pluginName}`);
  }

  /**
   * Register a single command
   */
  private registerSingleCommand(
    pluginCommand: Command,
    plugin: LoadedPlugin,
    commandSpec: any,
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
        const optionFlag = `--${optionName}`;

        if (option.type === 'boolean') {
          command.option(
            optionFlag,
            String(option.description || `Set ${optionName}`),
          );
        } else if (option.type === 'number') {
          command.option(
            `${optionFlag} <value>`,
            String(option.description || `Set ${optionName}`),
            parseFloat,
          );
        } else if (option.type === 'array') {
          command.option(
            `${optionFlag} <values>`,
            String(option.description || `Set ${optionName}`),
            (value: unknown) => String(value).split(','),
          );
        } else {
          command.option(
            `${optionFlag} <value>`,
            String(option.description || `Set ${optionName}`),
          );
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
    commandSpec: any,
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
      api: this.coreAPI,
      state: this.coreAPI.state,
      config: this.coreAPI.config,
      logger: this.coreAPI.logger,
    };

    const handlerPath = commandSpec.handler;
    if (!handlerPath) {
      throw new Error(`No handler specified for command ${commandSpec.name}`);
    }

    const fullHandlerPath = path.resolve(plugin.path, handlerPath + '.js');
    const handlerModule = await import(fullHandlerPath);
    const handler =
      handlerModule.default || handlerModule[commandSpec.name + 'Handler'];

    if (typeof handler !== 'function') {
      throw new Error(`Handler for ${commandSpec.name} is not a function`);
    }

    await handler(handlerArgs);
  }
}
