/**
 * State Stats Command Handler
 * Handles displaying state statistics using the Core API
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { formatError } from '../../../../utils/errors';
import { StateStatsOutput } from './output';
import { NamespaceInfo } from '../../schema';

export default function stateStats(
  args: CommandHandlerArgs,
): CommandExecutionResult {
  const { api, logger } = args;

  logger.log('📊 Getting state statistics...');

  try {
    // Get statistics from all namespaces
    const namespaces = api.state.getNamespaces();
    let totalEntries = 0;
    let totalSize = 0;
    const namespaceInfoList: NamespaceInfo[] = [];

    for (const namespace of namespaces) {
      const data = api.state.list<unknown>(namespace);
      const size = JSON.stringify(data).length;

      totalEntries += data.length;
      totalSize += size;

      namespaceInfoList.push({
        name: namespace,
        entryCount: data.length,
        size,
        lastModified: new Date().toISOString(), // TODO: Get actual last modified time
      });
    }

    // Prepare output data
    const outputData: StateStatsOutput = {
      totalNamespaces: namespaces.length,
      totalEntries,
      totalSize,
      namespaces: namespaceInfoList,
    };

    return {
      status: 'success',
      outputJson: JSON.stringify(outputData),
    };
  } catch (error: unknown) {
    return {
      status: 'failure',
      errorMessage: formatError('Failed to get statistics', error),
    };
  }
}
