/**
 * Configure Command Handler
 *
 * Interactively configure operator credentials for networks
 */
import { prompt } from 'enquirer';
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { CoreAPI } from '../../../core/core-api/core-api.interface';
import { Logger } from '../../../core/services/logger/logger-service.interface';
import { formatError } from '../../../utils/errors';
import accountUtils from '../../../utils/account';

interface CredentialAnswers {
  operatorId: string;
  operatorKey: string;
}

interface NetworkChoice {
  network: string;
}

interface ConfigureMoreChoice {
  configureMore: boolean;
}

/**
 * Prompt for operator credentials
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
 * Verify operator balance
 */
async function verifyOperatorBalance(
  operatorId: string,
  network: string,
  logger: Logger,
): Promise<void> {
  try {
    logger.log(`🔍 Verifying operator balance...`);

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
  }
}

/**
 * Configure a single network
 */
async function configureNetwork(
  network: string,
  api: CoreAPI,
  logger: Logger,
): Promise<void> {
  logger.log(`\n⚙️  Configuring ${network}...\n`);

  const credentials = await promptForCredentials(network);

  // Store credentials
  api.credentials.setDefaultCredentials(
    credentials.operatorId,
    credentials.operatorKey,
    network,
  );

  logger.log(`\n✅ Credentials saved for ${network}`);
  logger.log(`   Account ID: ${credentials.operatorId}`);

  // Verify balance
  await verifyOperatorBalance(credentials.operatorId, network, logger);
}

/**
 * Configure command handler
 */
export async function configureHandler(
  args: CommandHandlerArgs,
): Promise<void> {
  const { logger, api } = args;
  const { network: specificNetwork } = args.args as { network?: string };

  logger.log('⚙️  Configure Operator Credentials\n');

  try {
    // Get available networks
    const networkNames = api.config.getAvailableNetworks();

    if (networkNames.length === 0) {
      throw new Error('No networks found in configuration.');
    }

    if (specificNetwork) {
      // Configure specific network
      if (!networkNames.includes(specificNetwork)) {
        throw new Error(
          `Network '${specificNetwork}' not found. Available: ${networkNames.join(', ')}`,
        );
      }

      await configureNetwork(specificNetwork, api, logger);
    } else {
      // Interactive: configure one or more networks
      logger.log('📋 Available networks: ' + networkNames.join(', '));
      logger.log('');

      let continueConfiguring = true;
      const configuredNetworks: string[] = [];

      while (continueConfiguring) {
        // Get remaining networks
        const remainingNetworks = networkNames.filter(
          (n) => !configuredNetworks.includes(n),
        );

        if (remainingNetworks.length === 0) {
          logger.log('\n✅ All networks have been configured!');
          break;
        }

        // Ask which network to configure
        const networkChoice = await prompt<NetworkChoice>({
          type: 'select',
          name: 'network',
          message: 'Which network would you like to configure?',
          choices: remainingNetworks,
        });

        await configureNetwork(networkChoice.network, api, logger);
        configuredNetworks.push(networkChoice.network);

        // Ask if they want to configure more networks
        if (remainingNetworks.length > 1) {
          const continueChoice = await prompt<ConfigureMoreChoice>({
            type: 'confirm',
            name: 'configureMore',
            message: 'Would you like to configure another network?',
            initial: false,
          });

          continueConfiguring = continueChoice.configureMore;
        } else {
          continueConfiguring = false;
        }
      }
    }

    logger.log('\n✅ Configuration complete!');
    logger.log(
      '💡 Tip: You can reload from .env anytime with "hcli setup reload"',
    );

    process.exit(0);
  } catch (error) {
    logger.error(formatError('❌ Configuration failed: ', error));
    process.exit(1);
  }
}

export default configureHandler;
