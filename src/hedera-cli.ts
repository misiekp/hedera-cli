#!/usr/bin/env node

import { program } from 'commander';
import { installGlobalErrorHandlers } from './utils/errors';
import { PluginManifest } from './core/interfaces';
import { accountPlugin } from './core/plugins/account';
import { setupCmd } from './core/setup-cmd';
import { registerPlugin } from './core/register-plugins';

setupCmd();
installGlobalErrorHandlers();

const plugins: PluginManifest[] = [accountPlugin];

for (const plugin of plugins) {
  registerPlugin(program, plugin);
}

void program.parseAsync(process.argv);
