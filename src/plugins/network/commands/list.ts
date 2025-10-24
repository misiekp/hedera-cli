/**
 * Network List Command Handler
 * Handles listing all available networks using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { SupportedNetwork } from '../../../core/types/shared.types';
import { formatError } from '../../../utils/errors';
import { color, heading } from '../../../utils/color';
import { isJsonOutput, printOutput } from '../../../utils/output';
import { checkMirrorNodeHealth, checkRpcHealth } from '../utils/networkHealth';

export async function listHandler(args: CommandHandlerArgs) {
  const { logger, api } = args;

  try {
    const networkNames = api.network.getAvailableNetworks();
    const currentNetwork = api.network.getCurrentNetwork();

    if (isJsonOutput()) {
      const networksWithConfig = networkNames.map((name) => {
        const config = api.network.getNetworkConfig(name);
        const operator = api.network.getOperator(name as SupportedNetwork);
        return {
          name,
          isActive: name === currentNetwork,
          mirrorNodeUrl: config.mirrorNodeUrl,
          rpcUrl: config.rpcUrl,
          operatorId: operator?.accountId || '',
        };
      });
      printOutput('networks', {
        networks: networksWithConfig,
        activeNetwork: currentNetwork,
      });
      return;
    }

    logger.log(heading('Available networks:'));
    logger.log(''); // Empty line for better spacing

    for (let i = 0; i < networkNames.length; i++) {
      const name = networkNames[i];
      const isActive = name === currentNetwork;
      const config = api.network.getNetworkConfig(name);
      const operator = api.network.getOperator(name as SupportedNetwork);

      const networkLine = `${color.green('●')} ${color.magenta(name.toUpperCase())}`;
      const activeIndicator = isActive ? ` ${color.yellow('(ACTIVE)')}` : '';
      logger.log(`${networkLine}${activeIndicator}`);

      if (operator) {
        logger.log(
          `   ${color.dim('└─')} Operator: ${color.cyan(operator.accountId)} (${color.dim(operator.keyRefId)})`,
        );
      } else {
        logger.log(
          `   ${color.dim('└─')} Operator: ${color.dim('Not configured')}`,
        );
      }

      if (isActive) {
        const mirrorStatus = await checkMirrorNodeHealth(config.mirrorNodeUrl);
        logger.log(
          `   ${color.dim('└─')} Mirror Node: ${color.cyan(config.mirrorNodeUrl)} ${mirrorStatus.status} ${
            mirrorStatus.code ? `(${mirrorStatus.code})` : ''
          }`,
        );

        const rpcStatus = await checkRpcHealth(config.rpcUrl);
        logger.log(
          `   ${color.dim('└─')} RPC URL: ${color.cyan(config.rpcUrl)} ${rpcStatus.status} ${
            rpcStatus.code ? `(${rpcStatus.code})` : ''
          }`,
        );
      }

      if (i < networkNames.length - 1) {
        logger.log('');
      }
    }

    process.exit(0);
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to list networks', error));
    process.exit(1);
  }
}
