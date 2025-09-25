import {
  CommandHandlerArgs,
  CommandOption,
  CommandSpec,
  PluginManifest,
} from './interfaces';
import { Command } from 'commander';
import { wrapAction } from '../commands/shared/wrapAction';
import { CoreApi } from './core-api';
import { errors } from './errors';

function registerOption(cmd: Command, option: CommandOption) {
  if (option.required) {
    return cmd.requiredOption(option.flags, option.description);
  }

  return cmd.option(option.flags, option.description);
}

function registerCommand(
  root: Command,
  command: CommandSpec,
  coreApi: CoreApi,
) {
  let cmd = root.command(command.cliName);

  if (command.description) {
    cmd = cmd.description(command.description);
  }

  for (const option of command.options) {
    cmd = registerOption(cmd, option);
  }

  const handlerArgs: CommandHandlerArgs = {
    api: coreApi,
    errors: errors,
  };

  cmd.action(
    wrapAction((opts) => {
      // @TODO Type safety for register command handler
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      command.handler(opts, handlerArgs);
    }),
  );

  return cmd;
}

export function registerPlugin(
  program: Command,
  plugin: PluginManifest,
  core: CoreApi,
) {
  let root = program.command(plugin.cliName);

  if (plugin.description) {
    root = root.description(plugin.description);
  }

  for (const command of plugin.commands) {
    // @TODO Type safety for register commands
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    registerCommand(root, command, core);
  }
}
