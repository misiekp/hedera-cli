/**
 * Remove Credentials Command Handler
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';

export function removeHandler(args: CommandHandlerArgs): Promise<void> {
  const { logger, api } = args;
  const { accountId } = args.args as { accountId: string };

  logger.log(`🗑️  Removing credentials for account: ${accountId}`);

  try {
    api.credentials.removeCredentials(accountId);
    logger.log(`✅ Credentials removed for account: ${accountId}`);
  } catch (error) {
    logger.error(formatError('❌ Failed to remove credentials: ', error));
    throw error;
  }

  process.exit(0);
}

export default removeHandler;
