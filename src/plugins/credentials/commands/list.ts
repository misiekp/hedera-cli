/**
 * List Credentials Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';

export function listHandler(args: CommandHandlerArgs): Promise<void> {
  const { logger, api } = args;

  logger.log('🔐 Stored Credentials:');

  try {
    const credentials = api.kms.list();

    if (credentials.length === 0) {
      logger.log('   No credentials stored');
      logger.log('   Use "credentials set" to add credentials');
      logger.log(
        '   Or set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY environment variables',
      );
    } else {
      credentials.forEach((cred, index) => {
        logger.log(`   ${index + 1}. Key Reference ID: ${cred.keyRefId}`);
        logger.log(`      Type: ${cred.type}`);
        logger.log(`      Public Key: ${cred.publicKey}`);
        if (cred.labels && cred.labels.length > 0) {
          logger.log(`      Labels: ${cred.labels.join(', ')}`);
        }
        logger.log('');
      });
    }
  } catch (error) {
    logger.error(formatError('❌ Failed to list credentials: ${error}', error));
    throw error;
  }

  process.exit(0);
}

export default listHandler;
