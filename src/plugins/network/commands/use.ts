/**
 * Network Use Command Handler
 * Handles switching to a specific network using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { heading, success } from '../../../utils/color';
import { isJsonOutput, printOutput } from '../../../utils/output';

export function useHandler(args: CommandHandlerArgs) {
  const { logger, api } = args;

  // Extract network from options
  const network = args.args.network as string | undefined;

  if (!network) {
    logger.error('❌ Network name is required. Use --network <name>');
    process.exit(1);
    return;
  }

  logger.verbose(`Switching to network: ${network}`);

  try {
    api.network.switchNetwork(network);

    if (isJsonOutput()) {
      printOutput('network', { activeNetwork: network });
      return;
    }

    logger.log(heading('Active network: ') + success(network));
    process.exit(0);
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to switch network', error));
    process.exit(1);
  }
}
