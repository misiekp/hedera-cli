/**
 * Network Use Command Handler
 * Handles switching to a specific network using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { heading, success } from '../../../utils/color';
import { isJsonOutput, printOutput } from '../../../utils/output';
import stateUtils from '../../../utils/state';
import { saveState } from '../../../state/store';

export function useHandler(args: CommandHandlerArgs) {
  const { logger } = args;

  // Extract command arguments
  const positionalArgs = args.args._ as string[];
  const name = positionalArgs[0];

  logger.verbose(`Switching to network: ${name}`);

  try {
    const networks = stateUtils.getAvailableNetworks();
    if (!networks.includes(name)) {
      throw new Error(
        `Invalid network name. Available networks: ${networks.join(', ')}`,
      );
    }

    saveState({ network: name });

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
