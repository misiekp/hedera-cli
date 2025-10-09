/**
 * Reload Command Handler
 *
 * Reloads operator credentials from .env file for all configured networks
 */
import * as dotenv from 'dotenv';
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { Logger } from '../../../core/services/logger/logger-service.interface';
import { formatError } from '../../../utils/errors';
import accountUtils from '../../../utils/account';

/**
 * Verify operator account balance
 */
async function verifyOperatorBalance(
  operatorId: string,
  network: string,
  logger: Logger,
): Promise<void> {
  if (!operatorId) return;

  try {
    const balance = await accountUtils.getAccountHbarBalanceByNetwork(
      operatorId,
      network,
    );

    if (balance < 100000000) {
      logger.warn(
        `⚠️  Warning: Operator account ${operatorId} has less than 1 HBAR on ${network}.`,
      );
    } else {
      logger.log(`   ✅ Balance verified: ${balance / 100000000} HBAR`);
    }
  } catch (error) {
    logger.debug(
      `Skipping balance verification for ${operatorId} on ${network}: ${(error as Error).message}`,
    );
  }
}

/**
 * Reload command handler
 */
export async function reloadHandler(args: CommandHandlerArgs): Promise<void> {
  const { logger, api } = args;
  const { path: envPath } = args.args as { path?: string };

  logger.log('🔄 Reloading operator credentials from .env file...\n');

  try {
    // Load environment variables from .env file
    const envConfig = dotenv.config(envPath ? { path: envPath } : undefined);

    if (envConfig.error) {
      throw new Error(`Failed to load .env file: ${envConfig.error.message}`);
    }

    if (envPath) {
      logger.log(`📄 Loaded .env from: ${envPath}`);
    } else {
      logger.log(`📄 Loaded .env from: ./.env`);
    }

    // Get configured networks
    const networkNames = api.config.getAvailableNetworks();

    if (networkNames.length === 0) {
      throw new Error('No networks found in configuration.');
    }

    logger.log(`📋 Checking networks: ${networkNames.join(', ')}\n`);

    let foundCount = 0;

    // For each network, try to load credentials from env
    for (const networkName of networkNames) {
      const upper = networkName.toUpperCase();
      const envId = (process.env[`${upper}_OPERATOR_ID`] || '').trim();
      const envKey = (process.env[`${upper}_OPERATOR_KEY`] || '').trim();

      if (envId && envKey) {
        logger.log(`🔑 Found credentials for ${networkName}:`);
        logger.log(`   Account ID: ${envId}`);

        // Store credentials using the credentials service
        api.credentials.setDefaultCredentials(envId, envKey, networkName);

        // Verify balance
        await verifyOperatorBalance(envId, networkName, logger);

        foundCount++;
        logger.log('');
      } else {
        logger.log(`⚠️  No credentials found for ${networkName}`);
        logger.log(
          `   Expected: ${upper}_OPERATOR_ID and ${upper}_OPERATOR_KEY\n`,
        );
      }
    }

    if (foundCount === 0) {
      logger.warn('❌ No credentials found in .env file for any network.');
      logger.log('\n💡 Tip: Add credentials to your .env file:');
      logger.log('   TESTNET_OPERATOR_ID=0.0.xxxxx');
      logger.log('   TESTNET_OPERATOR_KEY=302e...');
      logger.log('\n💡 Or run: hcli setup configure');
      process.exit(1);
    } else {
      logger.log(
        `✅ Successfully reloaded credentials for ${foundCount} network(s)`,
      );
    }

    process.exit(0);
  } catch (error) {
    logger.error(formatError('❌ Failed to reload credentials: ', error));
    process.exit(1);
  }
}

export default reloadHandler;
