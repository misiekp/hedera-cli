/**
 * Set Credentials Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';

export function setHandler(args: CommandHandlerArgs): void {
  const { logger, api } = args;
  const { accountId, privateKey, network } = args.args as {
    accountId: string;
    privateKey: string;
    network?: string;
  };

  logger.log(`🔐 Setting credentials for account: ${accountId}`);

  try {
    api.credentials.setDefaultCredentials(
      accountId,
      privateKey,
      network || 'testnet',
    );

    logger.log(`✅ Credentials set successfully for account: ${accountId}`);
    logger.log(`   Network: ${network || 'testnet'}`);
    logger.log(`   Account ID: ${accountId}`);
  } catch (error) {
    logger.error(formatError('❌ Failed to set credentials: ', error));
    throw error;
  }

  process.exit(0);
}

export default setHandler;
