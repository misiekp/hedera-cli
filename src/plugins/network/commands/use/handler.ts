import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { formatError } from '../../../../utils/errors';
import { UseNetworkOutput } from './output';
import { SupportedNetwork } from '../../../../core/types/shared.types';

export function useHandler(args: CommandHandlerArgs): CommandExecutionResult {
  const { logger, api } = args;

  const network = args.args.network as SupportedNetwork | undefined;
  if (!network) {
    return {
      status: 'failure',
      errorMessage: 'Network name is required. Use --network <name>',
    };
  }

  logger.verbose(`Switching to network: ${network}`);

  try {
    api.network.switchNetwork(network);

    const output: UseNetworkOutput = {
      activeNetwork: network,
    };
    return { status: 'success', outputJson: JSON.stringify(output) };
  } catch (error) {
    return {
      status: 'failure',
      errorMessage: formatError('Failed to switch network', error),
    };
  }
}
