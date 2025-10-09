/**
 * Network List Command Handler
 * Handles listing all available networks using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { color, heading } from '../../../utils/color';
import { isJsonOutput, printOutput } from '../../../utils/output';
import { checkMirrorNodeHealth, checkRpcHealth } from '../utils/networkHealth';
import stateUtils from '../../../utils/state';
import { selectNetworks } from '../../../state/selectors';

export async function listHandler(args: CommandHandlerArgs) {
  const { logger } = args;

  try {
    const networkNames = stateUtils.getAvailableNetworks();
    const currentNetwork = stateUtils.getNetwork();
    const networks = selectNetworks();

    if (isJsonOutput()) {
      const networksWithConfig = networkNames.map((name) => {
        const config = networks[name];
        return {
          name,
          isActive: name === currentNetwork,
          mirrorNodeUrl: config.mirrorNodeUrl,
          rpcUrl: config.rpcUrl,
          operatorId: config.operatorId,
        };
      });
      printOutput('networks', {
        networks: networksWithConfig,
        activeNetwork: currentNetwork,
      });
      return;
    }

    logger.log(heading('Available networks:'));
    for (const name of networkNames) {
      const isActive = name === currentNetwork;
      const config = networks[name];
      const networkLine = `${color.green('-')} ${color.magenta(name)}`;
      const activeIndicator = isActive ? ` ${color.yellow('(active)')}` : '';
      logger.log(`${networkLine}${activeIndicator}`);

      if (isActive) {
        const mirrorStatus = await checkMirrorNodeHealth(config.mirrorNodeUrl);
        logger.log(
          `  Mirror Node: ${color.cyan(config.mirrorNodeUrl)} ${mirrorStatus.status} ${
            mirrorStatus.code ? `(${mirrorStatus.code})` : ''
          }`,
        );

        const rpcStatus = await checkRpcHealth(config.rpcUrl);
        logger.log(
          `  RPC URL: ${color.cyan(config.rpcUrl)} ${rpcStatus.status} ${
            rpcStatus.code ? `(${rpcStatus.code})` : ''
          }`,
        );

        if (config.operatorId) {
          logger.log(`  Operator ID: ${color.cyan(config.operatorId)}`);
        }
      }
    }

    process.exit(0);
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to list networks', error));
    process.exit(1);
  }
}
