/**
 * Token Create Command Handler
 * Handles token creation operations using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { CoreApi } from '../../../core/core-api/core-api.interface';
import { Logger } from '../../../core/services/logger/logger-service.interface';
import { TransactionResult } from '../../../core/services/tx-execution/tx-execution-service.interface';
import { SupportedNetwork } from '../../../core/types/shared.types';
import { Transaction as HederaTransaction } from '@hashgraph/sdk';
import { ZustandTokenStateHelper } from '../zustand-state-helper';
import { TokenData, safeValidateTokenCreateParams } from '../schema';
import { resolveTreasuryParameter } from '../resolver-helper';
import { formatError } from '../../../utils/errors';

/**
 * Determines the final max supply value for FINITE supply tokens
 * @param maxSupply - The max supply value (if provided)
 * @param initialSupply - The initial supply value
 * @returns The calculated final max supply (defaults to initialSupply if not provided)
 */
function determineFiniteMaxSupply(
  maxSupply: number | undefined,
  initialSupply: number,
): number {
  if (maxSupply !== undefined) {
    if (maxSupply < initialSupply) {
      throw new Error(
        `Max supply (${maxSupply}) cannot be less than initial supply (${initialSupply})`,
      );
    }
    return maxSupply;
  }
  // Default to initial supply if no max supply specified for finite tokens
  return initialSupply;
}

/**
 * Treasury resolution result
 */
interface TreasuryResolution {
  treasuryId: string;
  keyRefId?: string;
  useCustom: boolean;
}

/**
 * Resolves the treasury account to use for token creation
 * @param api - Core API instance
 * @param treasuryId - Optional custom treasury ID
 * @param treasuryKeyRefId - Optional custom treasury key reference
 * @param treasuryPublicKey - Optional custom treasury public key
 * @returns Treasury resolution result
 */
function resolveTreasuryAccount(
  api: CoreApi,
  treasuryId?: string,
  treasuryKeyRefId?: string,
  treasuryPublicKey?: string,
): TreasuryResolution {
  if (treasuryId && treasuryKeyRefId && treasuryPublicKey) {
    return {
      treasuryId,
      keyRefId: treasuryKeyRefId,
      useCustom: true,
    };
  }

  // No treasury provided - get operator info (required for token creation)
  const operator = api.kms.getDefaultOperator();
  if (!operator) {
    throw new Error(
      'No operator credentials found. Please set up your Hedera account credentials or provide a treasury account.',
    );
  }

  return {
    treasuryId: operator.accountId,
    useCustom: false,
  };
}

/**
 * Resolves the admin public key for token creation
 * @param api - Core API instance
 * @param adminKey - Optional explicit admin key
 * @param treasuryPublicKey - Optional treasury public key
 * @param logger - Logger instance
 * @returns The resolved admin public key
 */
function resolveAdminKey(
  api: CoreApi,
  adminKey?: string,
  treasuryPublicKey?: string,
  logger?: Logger,
): string {
  // 1. Use explicit admin key if provided
  if (adminKey) {
    return adminKey;
  }

  // 2. Use treasury public key if available
  if (treasuryPublicKey) {
    return treasuryPublicKey;
  }

  // 3. Fall back to operator's public key
  const operator = api.kms.getDefaultOperator();
  if (!operator) {
    throw new Error('No operator credentials found');
  }

  const pubKey = api.kms.getPublicKey(operator.keyRefId);
  if (logger) {
    logger.debug(`operator.keyRefId: ${operator.keyRefId}`);
    logger.debug(`pubKey: ${pubKey}`);
  }

  if (!pubKey) {
    throw new Error(`Operator key not found: ${operator.keyRefId}`);
  }

  return pubKey;
}

/**
 * Executes the token creation transaction
 * @param api - Core API instance
 * @param transaction - Token creation transaction
 * @param treasury - Treasury resolution result
 * @param logger - Logger instance
 * @returns Transaction result
 */
async function executeTokenCreation(
  api: CoreApi,
  transaction: HederaTransaction,
  treasury: TreasuryResolution,
  logger: Logger,
): Promise<TransactionResult> {
  if (treasury.useCustom && treasury.keyRefId) {
    logger.debug(`Signing with custom treasury key`);
    return await api.txExecution.signAndExecuteWith(transaction, {
      keyRefId: treasury.keyRefId,
    });
  }

  logger.debug(`Signing with operator key`);
  return await api.txExecution.signAndExecute(transaction);
}

/**
 * Builds the token data object for state storage
 * @param result - Transaction result
 * @param params - Token creation parameters
 * @returns Token data object
 */
function buildTokenData(
  result: TransactionResult,
  params: {
    name: string;
    symbol: string;
    treasuryId: string;
    decimals: number;
    initialSupply: number;
    supplyType: string;
    adminPublicKey: string;
    treasuryPublicKey?: string;
    network: SupportedNetwork;
  },
): TokenData {
  return {
    tokenId: result.tokenId!,
    name: params.name,
    symbol: params.symbol,
    treasuryId: params.treasuryId,
    decimals: params.decimals,
    initialSupply: params.initialSupply,
    supplyType: params.supplyType.toUpperCase() as 'FINITE' | 'INFINITE',
    maxSupply:
      params.supplyType.toUpperCase() === 'FINITE' ? params.initialSupply : 0,
    keys: {
      adminKey: params.adminPublicKey,
      supplyKey: '',
      wipeKey: '',
      kycKey: '',
      freezeKey: '',
      pauseKey: '',
      feeScheduleKey: '',
      treasuryKey: params.treasuryPublicKey || '',
    },
    network: params.network,
    associations: [],
    customFees: [],
  };
}

/**
 * Logs token creation success details
 * @param result - Transaction result
 * @param params - Token creation parameters
 * @param logger - Logger instance
 */
function logTokenCreationSuccess(
  result: TransactionResult,
  params: {
    name: string;
    symbol: string;
    treasuryId: string;
    decimals: number;
    initialSupply: number;
    supplyType: string;
  },
  logger: Logger,
): void {
  logger.log(`✅ Token created successfully!`);
  logger.log(`   Token ID: ${result.tokenId!}`);
  logger.log(`   Name: ${params.name}`);
  logger.log(`   Symbol: ${params.symbol}`);
  logger.log(`   Treasury: ${params.treasuryId}`);
  logger.log(`   Decimals: ${params.decimals}`);
  logger.log(`   Initial Supply: ${params.initialSupply}`);
  logger.log(`   Supply Type: ${params.supplyType}`);
  logger.log(`   Transaction ID: ${result.transactionId}`);
}

export async function createTokenHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Validate command parameters
  const validationResult = safeValidateTokenCreateParams(args.args);
  if (!validationResult.success) {
    logger.error('❌ Invalid command parameters:');
    validationResult.error.errors.forEach((error) => {
      logger.error(`   - ${error.path.join('.')}: ${error.message}`);
    });
    process.exit(1);
    return; // Ensure execution stops (for testing with mocked process.exit)
  }

  // Initialize token state helper
  const tokenState = new ZustandTokenStateHelper(api.state, logger);

  // Use validated parameters with defaults
  const validatedParams = validationResult.data;
  const name = validatedParams.name;
  const symbol = validatedParams.symbol;
  const decimals = validatedParams.decimals || 0;
  const initialSupply = validatedParams.initialSupply || 1000000;
  const supplyType = validatedParams.supplyType || 'INFINITE';
  const maxSupply = validatedParams.maxSupply;
  const alias = validatedParams.alias;

  // Resolve treasury parameter (alias or treasury-id:treasury-key) if provided
  let treasuryId: string | undefined;
  let treasuryKeyRefId: string | undefined;
  let treasuryPublicKey: string | undefined;

  if (validatedParams.treasury) {
    const network = api.network.getCurrentNetwork();
    const resolvedTreasury = resolveTreasuryParameter(
      validatedParams.treasury,
      api,
      network,
    );

    // Treasury was explicitly provided - it MUST resolve or fail
    if (!resolvedTreasury) {
      throw new Error(
        `Failed to resolve treasury parameter: ${validatedParams.treasury}. ` +
          `Expected format: account-alias OR treasury-id:treasury-key`,
      );
    }

    // Use resolved treasury from alias or treasury-id:treasury-key
    treasuryId = resolvedTreasury.treasuryId;
    treasuryKeyRefId = resolvedTreasury.treasuryKeyRefId;
    treasuryPublicKey = resolvedTreasury.treasuryPublicKey;

    logger.log(`🏦 Using custom treasury account: ${treasuryId}`);
    logger.log(`🔑 Will sign with treasury key`);
  }

  // Validate and determine maxSupply
  let finalMaxSupply: number | undefined = undefined;
  if (supplyType.toUpperCase() === 'FINITE') {
    finalMaxSupply = determineFiniteMaxSupply(maxSupply, initialSupply);
  } else if (maxSupply !== undefined) {
    logger.warn(
      `Max supply specified for INFINITE supply type - ignoring max supply parameter`,
    );
  }

  logger.log(`Creating token: ${name} (${symbol})`);
  if (finalMaxSupply !== undefined) {
    logger.log(`Max supply: ${finalMaxSupply}`);
  }

  try {
    // 1. Resolve treasury and admin key
    const treasury = resolveTreasuryAccount(
      api,
      treasuryId,
      treasuryKeyRefId,
      treasuryPublicKey,
    );

    const adminPublicKey = resolveAdminKey(
      api,
      validatedParams.adminKey,
      treasuryPublicKey,
      logger,
    );

    logger.debug('=== TOKEN PARAMS DEBUG ===');
    logger.debug(`Treasury ID: ${treasury.treasuryId}`);
    logger.debug(`Admin Key (public): ${adminPublicKey}`);
    logger.debug(`Use Custom Treasury: ${treasury.useCustom}`);
    logger.debug('=========================');

    // 2. Create and execute token transaction
    const tokenCreateParams = {
      name,
      symbol,
      treasuryId: treasury.treasuryId,
      decimals,
      initialSupply,
      supplyType: supplyType.toUpperCase() as 'FINITE' | 'INFINITE',
      maxSupply: finalMaxSupply,
      adminKey: adminPublicKey,
    };

    const tokenCreateTransaction =
      api.token.createTokenTransaction(tokenCreateParams);

    const result = await executeTokenCreation(
      api,
      tokenCreateTransaction,
      treasury,
      logger,
    );

    // 3. Verify success and store token data
    if (!result.success || !result.tokenId) {
      throw new Error('Token creation failed - no token ID returned');
    }

    logTokenCreationSuccess(
      result,
      {
        name,
        symbol,
        treasuryId: treasury.treasuryId,
        decimals,
        initialSupply,
        supplyType,
      },
      logger,
    );

    const tokenData = buildTokenData(result, {
      name,
      symbol,
      treasuryId: treasury.treasuryId,
      decimals,
      initialSupply,
      supplyType,
      adminPublicKey,
      treasuryPublicKey,
      network: api.network.getCurrentNetwork(),
    });

    tokenState.saveToken(result.tokenId, tokenData);
    logger.log(`   Token data saved to state`);

    // Register alias if provided
    if (alias) {
      api.alias.register({
        alias,
        type: 'token',
        network: api.network.getCurrentNetwork(),
        entityId: result.tokenId,
        // @TODO take createdAt from transaction timestamp
        createdAt: new Date().toISOString(),
      });
      logger.log(`   Alias registered: ${alias}`);
    }

    process.exit(0);
    return; // Ensure execution stops (for testing with mocked process.exit)
  } catch (error) {
    logger.error(formatError('❌ Failed to create token', error));
    process.exit(1);
    return; // Ensure execution stops (for testing with mocked process.exit)
  }
}

export default createTokenHandler;
