/**
 * Setup Plugin Manifest
 * Manages operator credentials and CLI initialization
 *
 * This plugin:
 * - Automatically initializes CLI when no credentials exist
 * - Loads credentials from .env files
 * - Provides interactive setup prompts
 * - Manages operator credentials for all networks
 */
import { PluginManifest } from '../../core/plugins/plugin.interface';
import {
  PluginContext,
  GlobalPreActionHook,
} from '../../core/plugins/plugin.types';

export const setupPluginManifest: PluginManifest = {
  name: 'setup',
  version: '1.0.0',
  displayName: 'CLI Setup & Initialization',
  description: 'Manages operator credentials and CLI initialization',
  compatibility: {
    cli: '>=1.0.0',
    core: '>=1.0.0',
    api: '>=1.0.0',
  },
  capabilities: ['credentials:manage', 'state:write', 'network:read'],

  commands: [
    {
      name: 'reload',
      summary: 'Reload operator credentials from .env file',
      description:
        'Reload credentials from environment variables or custom .env file',
      options: [
        {
          name: 'path',
          type: 'string',
          required: false,
          default: '.env',
        },
      ],
      handler: './commands/reload',
    },
    {
      name: 'configure',
      summary: 'Configure operator credentials interactively',
      description:
        'Interactively configure operator credentials for one or all networks',
      options: [
        {
          name: 'network',
          type: 'string',
          required: false,
        },
      ],
      handler: './commands/configure',
    },
  ],

  // Initialize the auto-setup hook when plugin loads
  init: async (
    context?: PluginContext,
  ): Promise<GlobalPreActionHook | void> => {
    if (!context) {
      console.error('[SETUP PLUGIN] No context provided');
      return;
    }

    const { logger } = context;
    logger.debug('[SETUP PLUGIN] Initializing auto-setup hooks...');

    // Import and return the auto-setup hook
    const { createAutoSetupHook } = await import('./services/auto-setup-hook');
    const hookFn = createAutoSetupHook(context);
    return hookFn;
  },

  teardown: () => {
    console.log('[SETUP PLUGIN] Tearing down setup plugin...');
  },
};

export default setupPluginManifest;
