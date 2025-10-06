/**
 * List Credentials Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';

export async function listHandler(args: CommandHandlerArgs): Promise<void> {
  const { logger, api } = args;

  logger.log('🔐 Stored Credentials:');

  try {
    const credentials = api.credentials.listCredentials();

    if (credentials.length === 0) {
      logger.log('   No credentials stored');
      logger.log('   Use "credentials set" to add credentials');
      logger.log(
        '   Or set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY environment variables',
      );
    } else {
      credentials.forEach((cred, index) => {
        logger.log(`   ${index + 1}. Account: ${cred.accountId}`);
        logger.log(`      Network: ${cred.network}`);
        logger.log(`      Default: ${cred.isDefault ? 'Yes' : 'No'}`);
        logger.log(`      Created: ${cred.createdAt}`);
        logger.log('');
      });
    }
  } catch (error) {
    logger.error(`❌ Failed to list credentials: ${error}`);
    throw error;
  }

  process.exit(0);
}

export default listHandler;
