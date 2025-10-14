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

  // Extract command arguments
  const positionalArgs = args.args._ as string[];
  const name = positionalArgs[0];

  if (!name) {
    logger.error('❌ Network name is required');
    process.exit(1);
    return;
  }

  logger.verbose(`Switching to network: ${name}`);

  try {
    api.network.switchNetwork(name);

    if (isJsonOutput()) {
      printOutput('network', { activeNetwork: name });
      return;
    }

    logger.log(heading('Active network: ') + success(name));
    process.exit(0);
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to switch network', error));
    process.exit(1);
  }
}
