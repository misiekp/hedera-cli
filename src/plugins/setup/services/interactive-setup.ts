/**
 * Interactive Setup Service
 *
 * Handles interactive CLI setup when credentials are missing.
 */
import { prompt } from 'enquirer';
import * as dotenv from 'dotenv';
import { CoreAPI } from '../../../core/core-api/core-api.interface';
import { Logger } from '../../../core/services/logger/logger-service.interface';
import accountUtils from '../../../utils/account';

interface NetworkChoice {
  network: string;
}

interface CredentialAnswers {
  operatorId: string;
  operatorKey: string;
}

interface EnvCredentials {
  id: string;
  key: string;
}

/**
 * Try to load credentials from .env file
 */
export function tryLoadFromEnv(
  network: string,
  envPath?: string,
): EnvCredentials | null {
  // Load .env file
  dotenv.config(envPath ? { path: envPath } : undefined);

  const upper = network.toUpperCase();
  const envId = (process.env[`${upper}_OPERATOR_ID`] || '').trim();
  const envKey = (process.env[`${upper}_OPERATOR_KEY`] || '').trim();

  if (envId && envKey) {
    return { id: envId, key: envKey };
  }

  return null;
}

/**
 * Prompt user for operator credentials
 */
async function promptForCredentials(
  network: string,
): Promise<CredentialAnswers> {
  const answers = await prompt<CredentialAnswers>([
    {
      type: 'input',
      name: 'operatorId',
      message: `Operator Account ID for ${network} (e.g., 0.0.123456):`,
      validate: (v: string) => {
        if (!v || v.trim().length === 0) {
          return 'Account ID is required';
        }
        if (!/^0\.0\.\d+$/.test(v.trim())) {
          return 'Invalid account ID format (expected: 0.0.xxxxx)';
        }
        return true;
      },
    },
    {
      type: 'password',
      name: 'operatorKey',
      message: `Operator Private Key for ${network}:`,
      validate: (v: string) => {
        if (!v || v.trim().length === 0) {
          return 'Private key is required';
        }
        return true;
      },
    },
  ]);

  return {
    operatorId: answers.operatorId.trim(),
    operatorKey: answers.operatorKey.trim(),
  };
}

/**
 * Verify operator account balance
 */
async function verifyOperatorBalance(
  operatorId: string,
  network: string,
  logger: Logger,
): Promise<void> {
  try {
    logger.log(`\n🔍 Verifying operator balance for ${operatorId}...`);

    const balance = await accountUtils.getAccountHbarBalanceByNetwork(
      operatorId,
      network,
    );

    if (balance < 100000000) {
      logger.warn(
        `⚠️  Warning: Operator account ${operatorId} has less than 1 HBAR.`,
      );
      logger.warn('   Some operations may fail due to insufficient balance.');
    } else {
      logger.log(`✅ Operator balance verified (${balance / 100000000} HBAR)`);
    }
  } catch (error) {
    logger.debug(
      `Skipping balance verification for ${operatorId} on ${network}: ${(error as Error).message}`,
    );
    // Continue anyway - in test/e2e environments mirror data may not be available
  }
}

/**
 * Setup operator account using credentials service
 */
function setupOperatorAccount(
  api: CoreAPI,
  operatorId: string,
  operatorKey: string,
  network: string,
  logger: Logger,
): void {
  try {
    // Store credentials using the credentials service
    api.credentials.setDefaultCredentials(operatorId, operatorKey, network);

    logger.log(`✅ Credentials configured for ${network}`);
    logger.debug(`   Account ID: ${operatorId}`);
  } catch (error) {
    logger.error(`Failed to set credentials: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Run interactive setup flow
 */
export async function runInteractiveSetup(
  api: CoreAPI,
  logger: Logger,
  envPath?: string,
): Promise<void> {
  // Get available networks from config
  const networkNames = api.config.getAvailableNetworks();

  if (networkNames.length === 0) {
    throw new Error(
      'No networks found in configuration. Please check your config file.',
    );
  }

  logger.log('📋 Available networks: ' + networkNames.join(', '));
  logger.log('');

  // Ask which network to configure
  const primaryNetwork = await prompt<NetworkChoice>({
    type: 'select',
    name: 'network',
    message: 'Which network would you like to use?',
    choices: networkNames,
  });

  const selectedNetwork = primaryNetwork.network;

  // Try loading from .env first
  logger.log(`\n🔍 Checking for credentials in .env file...`);
  const envCredentials = tryLoadFromEnv(selectedNetwork, envPath);

  if (envCredentials) {
    logger.log(`✅ Found credentials in .env for ${selectedNetwork}`);

    setupOperatorAccount(
      api,
      envCredentials.id,
      envCredentials.key,
      selectedNetwork,
      logger,
    );

    await verifyOperatorBalance(envCredentials.id, selectedNetwork, logger);
  } else {
    // No .env credentials found, prompt user
    logger.log(
      `\nNo .env file found or missing credentials for ${selectedNetwork}.`,
    );
    logger.log(`Let's configure ${selectedNetwork} manually.\n`);

    const credentials = await promptForCredentials(selectedNetwork);

    setupOperatorAccount(
      api,
      credentials.operatorId,
      credentials.operatorKey,
      selectedNetwork,
      logger,
    );

    await verifyOperatorBalance(
      credentials.operatorId,
      selectedNetwork,
      logger,
    );
  }

  logger.log(
    '\n💡 Tip: You can add more networks anytime with "hcli setup configure"',
  );
  logger.log('💡 Tip: To reload from .env, run "hcli setup reload"');
}
