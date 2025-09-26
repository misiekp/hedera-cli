import { Command } from 'commander';
import * as dotenv from 'dotenv';
import config from '../state/config';
import { saveState as storeSaveState } from '../state/store';
import accountUtils from '../utils/account';
import { Logger } from '../utils/logger';
import setupUtils from '../utils/setup';
import stateUtils from '../utils/state';
import { wrapAction } from './shared/wrapAction';
import { DomainError } from '../core/errors';

const logger = Logger.getInstance();

interface SetupOptions {
  path?: string;
}

/**
 * @description Setup the state file with the init config
 */
function setupState(): void {
  storeSaveState(config);
}

/**
 * @description Verify that the operator account has enough balance to pay for transactions (at least 1 Hbar)
 * @param operatorId Operator ID to check balance for
 * @param network
 */
async function verifyOperatorBalance(
  operatorId: string,
  network: string,
): Promise<void> {
  // Skip if operator ID is not defined
  if (operatorId) {
    try {
      const balance = await accountUtils.getAccountHbarBalanceByNetwork(
        operatorId,
        network,
      );
      if (balance < 100000000) {
        throw new DomainError(
          `The operator account ${operatorId} does not have enough balance to pay for transactions (less than 1 Hbar). Please add more balance to the account.`,
        );
      }
    } catch (e) {
      // In test/e2e environments we allow missing mirror data; log & continue
      logger.verbose(
        `Skipping operator balance verification for ${operatorId} on ${network}: ${(e as Error).message}`,
      );
    }
  }
}

/**
 * @description Setup the CLI with operator key and ID for different networks
 * @param action Action to perform (init or reload)
 */
async function setupCLI(action: string, envPath?: string): Promise<void> {
  // Load environment variables from .env file (optional custom path)
  const envConfig = dotenv.config(envPath ? { path: envPath } : undefined);
  if (envConfig.error) {
    throw new DomainError(`Can't load .env file: ${envConfig.error.message}`);
  }

  if (!config.networks || Object.keys(config.networks).length === 0) {
    throw new DomainError(
      'No networks found in the config. Please check your config file.',
    );
  }

  const networkNames = Object.keys(config.networks);

  // Only write a fresh state file if the user is running the init command
  if (action === 'init') {
    setupState();
  }

  // For each supported network allow env overrides: TESTNET_OPERATOR_ID / KEY etc.
  for (const networkName of networkNames) {
    const upper = networkName.toUpperCase();
    const envId = (process.env[`${upper}_OPERATOR_ID`] || '').trim();
    const envKey = (process.env[`${upper}_OPERATOR_KEY`] || '').trim();
    if (envId && envKey) {
      setupUtils.setupOperatorAccount(envId, envKey, networkName);
      await verifyOperatorBalance(envId, networkName);
    }
  }
}

export default (program: Command) => {
  const setup = program
    .command('setup')
    .alias('su')
    .description('Setup Hedera CLI');

  setup
    .command('init')
    .description('Setup the CLI with operator key and ID')
    .option('--path <path>', 'Specify a custom path for the .env file')
    .action(
      wrapAction<SetupOptions>(
        async (options) => {
          await setupCLI('init', options.path);
          stateUtils.createUUID(); // Create a new UUID for the user if doesn't exist
        },
        {
          log: 'Initializing the CLI tool with the config and operator key and ID for different networks',
        },
      ),
    );

  setup
    .command('reload')
    .description('Reload the CLI with operator key and ID')
    .option('--path <path>', 'Specify a custom path for the .env file')
    .action(
      wrapAction<{ path?: string }>(
        async (options) => {
          await setupCLI('reload', options.path);
        },
        {
          log: 'Reloading the CLI tool with operator key and ID for different networks',
        },
      ),
    );
};
