#!/usr/bin/env node

import { program } from 'commander';
import { installGlobalErrorHandlers } from './utils/errors';
import { PluginManifest } from './core/interfaces';
import { accountPlugin } from './core/plugins/account';
import { setupCmd } from './core/setup-cmd';
import { registerPlugin } from './core/register-plugins';
import { CoreApi } from './core/core-api';

setupCmd();
installGlobalErrorHandlers();

const core = new CoreApi();

const plugins: PluginManifest[] = [accountPlugin];

for (const plugin of plugins) {
  registerPlugin(program, plugin, core);
}

void program.parseAsync(process.argv);
