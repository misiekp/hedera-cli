/**
 * Token List Command Handler
 * Handles listing tokens from state for the current network
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { ZustandTokenStateHelper } from '../zustand-state-helper';
import { TokenData } from '../schema';
import { formatError } from '../../../utils/errors';
import { SupportedNetwork } from '../../../core/types/shared.types';
import { CoreAPI } from '../../../core';

/**
 * Resolves the token alias from the alias service
 * @param api - Core API instance
 * @param tokenId - Token ID to resolve
 * @param network - Network the token is on
 * @returns The alias if found, null otherwise
 */
function resolveTokenAlias(
  api: CoreAPI,
  tokenId: string,
  network: SupportedNetwork,
): string | null {
  try {
    const aliases = api.alias.list({ network: network, type: 'token' });
    const aliasRecord = aliases.find((alias) => alias.entityId === tokenId);
    return aliasRecord ? aliasRecord.alias : null;
  } catch (error) {
    // If alias resolution fails, just return null
    return null;
  }
}

/**
 * Displays a single token with comprehensive information
 * @param token - Token data to display
 * @param index - Token index in the list
 * @param showKeys - Whether to show key information
 * @param alias - Token alias (if available)
 * @param logger - Logger instance
 */
function displayToken(
  token: TokenData,
  index: number,
  showKeys: boolean,
  alias: string | null,
  logger: CommandHandlerArgs['logger'],
): void {
  // Display token name and symbol with alias
  let header = `${index + 1}. ${token.name} (${token.symbol})`;
  if (alias) {
    header += ` - alias: ${alias}`;
  }
  logger.log(header);

  // Display core information
  logger.log(`   Token ID: ${token.tokenId}`);
  logger.log(`   Network: ${token.network}`);
  logger.log(`   Treasury: ${token.treasuryId}`);
  logger.log(`   Decimals: ${token.decimals}`);
  logger.log(`   Initial Supply: ${token.initialSupply}`);
  logger.log(`   Supply Type: ${token.supplyType}`);

  // Show max supply for FINITE tokens
  if (token.supplyType === 'FINITE' && token.maxSupply > 0) {
    logger.log(`   Max Supply: ${token.maxSupply}`);
  }

  // Show associations count if present
  const associationCount = token.associations?.length || 0;
  if (associationCount > 0) {
    logger.log(`   Associations: ${associationCount}`);
  }

  // Optionally show key information
  if (showKeys && token.keys) {
    const keyMapping = [
      { key: 'adminKey', label: 'Admin Key' },
      { key: 'supplyKey', label: 'Supply Key' },
      { key: 'wipeKey', label: 'Wipe Key' },
      { key: 'kycKey', label: 'KYC Key' },
      { key: 'freezeKey', label: 'Freeze Key' },
      { key: 'pauseKey', label: 'Pause Key' },
      { key: 'feeScheduleKey', label: 'Fee Schedule Key' },
      { key: 'treasuryKey', label: 'Treasury Key' },
    ] as const;

    keyMapping.forEach(({ key, label }) => {
      if (token.keys[key]) {
        logger.log(`   ${label}: ✅ Present`);
      }
    });
  }
}

/**
 * Displays token statistics
 * @param stats - Token statistics
 * @param logger - Logger instance
 */
function displayStatistics(
  stats: {
    total: number;
    byNetwork: Record<string, number>;
    bySupplyType: Record<string, number>;
    withAssociations: number;
    totalAssociations: number;
  },
  logger: CommandHandlerArgs['logger'],
): void {
  logger.log('\n──────────────────────────────────────');
  logger.log(`Total Tokens: ${stats.total}`);

  // Show supply type breakdown
  if (Object.keys(stats.bySupplyType).length > 0) {
    logger.log('\nSupply Types:');
    Object.entries(stats.bySupplyType).forEach(([supplyType, count]) => {
      logger.log(`  ${supplyType}: ${count}`);
    });
  }

  // Show associations statistics
  if (stats.withAssociations > 0) {
    logger.log(
      `\nWith Associations: ${stats.withAssociations} (${stats.totalAssociations} total associations)`,
    );
  }

  // Show network breakdown if multiple networks
  if (Object.keys(stats.byNetwork).length > 1) {
    logger.log('\nBy Network:');
    Object.entries(stats.byNetwork).forEach(([network, count]) => {
      logger.log(`  ${network}: ${count}`);
    });
  }
}

export function listTokensHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize token state helper
  const tokenState = new ZustandTokenStateHelper(api.state, logger);

  // Extract command arguments
  const showKeys = (args.args.keys as boolean) || false;
  const networkFilter = args.args.network as string | undefined;

  // Determine which network to show
  const currentNetwork = api.network.getCurrentNetwork();
  const targetNetwork = networkFilter || currentNetwork;

  logger.log('Listing tokens...');
  logger.debug(`[TOKEN LIST] Current network: ${currentNetwork}`);
  logger.debug(`[TOKEN LIST] Target network: ${targetNetwork}`);
  logger.debug(
    `[TOKEN LIST] Network filter override: ${networkFilter || 'none'}`,
  );

  try {
    // Get all tokens
    let tokens = tokenState.listTokens();
    logger.debug(
      `[TOKEN LIST] Retrieved ${tokens.length} tokens from state before filtering`,
    );

    // Log all tokens before filtering
    tokens.forEach((token, index) => {
      logger.debug(
        `[TOKEN LIST]   ${index + 1}. ${token.name} (${token.symbol}) - ${token.tokenId} on ${token.network}`,
      );
    });

    // Filter by target network
    const tokensBeforeFilter = tokens.length;
    tokens = tokens.filter((token) => token.network === targetNetwork);
    logger.debug(
      `[TOKEN LIST] After network filtering: ${tokens.length} tokens (filtered out ${tokensBeforeFilter - tokens.length})`,
    );

    // Handle empty state
    if (tokens.length === 0) {
      if (tokensBeforeFilter > 0) {
        // Tokens exist but none match the current network
        logger.log(`\n⚠️  No tokens found for network: ${targetNetwork}`);
        logger.log(
          `\n💡 You have ${tokensBeforeFilter} token(s) on other networks.`,
        );
        logger.log(
          `   Use --network <network-name> to view tokens on a specific network.`,
        );
      } else if (networkFilter) {
        logger.log(`\nNo tokens found for network: ${networkFilter}`);
      } else {
        logger.log(`\nNo tokens found for current network: ${currentNetwork}`);
      }
      process.exit(0);
      return;
    }

    // Display header
    logger.log(
      `\nFound ${tokens.length} token(s) for network ${targetNetwork}:`,
    );
    if (tokensBeforeFilter > tokens.length) {
      logger.log(
        `(${tokensBeforeFilter - tokens.length} token(s) filtered out from other networks)`,
      );
    }
    logger.log('──────────────────────────────────────');

    // Display each token
    tokens.forEach((token, index) => {
      // Resolve alias for this token
      const alias = resolveTokenAlias(api, token.tokenId, token.network);

      // Display token information
      displayToken(token, index, showKeys, alias, logger);

      // Add separator between tokens (except for the last one)
      if (index < tokens.length - 1) {
        logger.log('');
      }
    });

    // Display statistics
    const stats = tokenState.getTokensWithStats();
    displayStatistics(stats, logger);

    process.exit(0);
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to list tokens', error));
    process.exit(1);
  }
}

export default listTokensHandler;
