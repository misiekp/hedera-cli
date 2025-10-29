/**
 * Token Create Command Handler
 * Handles token creation operations using the Core API
 */
import { CommandHandlerArgs } from '../../../core';
import { CoreApi } from '../../../core';
import { Logger } from '../../../core';
import { TransactionResult } from '../../../core';
import { SupportedNetwork } from '../../../core/types/shared.types';
import { Transaction as HederaTransaction } from '@hashgraph/sdk';
import { ZustandTokenStateHelper } from '../zustand-state-helper';
import { TokenData, safeValidateTokenCreateParams } from '../schema';
import {
  resolveTreasuryParameter,
  resolveKeyParameter,
} from '../resolver-helper';
import { formatError } from '../../../utils/errors';
import { processBalanceInput } from '../../../core/utils/process-balance-input';
import { TokenCreateParams } from '../../../core/types/token.types';

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
  const currentNetwork = api.network.getCurrentNetwork();
  const operator = api.network.getOperator(currentNetwork);
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
 * Executes the token creation transaction
 * @param api - Core API instance
 * @param transaction - Token creation transaction
 * @param treasury - Treasury resolution result
 * @param logger - Logger instance
 * @param adminKeyRefId - Optional admin key reference Id
 * @returns Transaction result
 */
async function executeTokenCreation(
  api: CoreApi,
  transaction: HederaTransaction,
  treasury: TreasuryResolution,
  logger: Logger,
  adminKeyRefId?: string,
): Promise<TransactionResult> {
  if (adminKeyRefId) {
    const tx = api.txExecution.freezeTx(transaction);
    // @TODO - Migrate from signTransaction to keep consistent with other usages
    await api.kms.signTransaction(tx, adminKeyRefId);
  }

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
  const name = validatedParams.tokenName;
  const symbol = validatedParams.symbol;
  const decimals = validatedParams.decimals || 0;
  const rawInitialSupply = validatedParams.initialSupply || 1000000;
  // Convert display units to raw token units
  const initialSupply = processBalanceInput(
    rawInitialSupply,
    decimals,
  ).toNumber();
  const supplyType = validatedParams.supplyType || 'INFINITE';
  const maxSupply = validatedParams.maxSupply
    ? processBalanceInput(validatedParams.maxSupply, decimals).toNumber()
    : undefined;
  const alias = validatedParams.name;

  // Check if alias already exists on the current network
  const network = api.network.getCurrentNetwork();
  api.alias.availableOrThrow(alias, network);

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

    // Resolve admin key - will use provided key or fall back to operator key
    const adminKey = resolveKeyParameter(validatedParams.adminKey, api);

    if (!adminKey) {
      throw new Error('Unable to resolve any adminKey for the token');
    }

    logger.debug('=== TOKEN PARAMS DEBUG ===');
    logger.debug(`Treasury ID: ${treasury.treasuryId}`);
    logger.debug(`Admin Key (keyRefId): ${adminKey?.keyRefId}`);
    logger.debug(`Use Custom Treasury: ${treasury.useCustom}`);
    logger.debug('=========================');

    // 2. Create and execute token transaction
    const tokenCreateParams: TokenCreateParams = {
      name,
      symbol,
      treasuryId: treasury.treasuryId,
      decimals,
      initialSupplyRaw: initialSupply,
      supplyType: supplyType.toUpperCase() as 'FINITE' | 'INFINITE',
      maxSupplyRaw: finalMaxSupply,
      adminKey: adminKey.publicKey,
    };

    const tokenCreateTransaction =
      api.token.createTokenTransaction(tokenCreateParams);

    const result = await executeTokenCreation(
      api,
      tokenCreateTransaction,
      treasury,
      logger,
      adminKey.keyRefId,
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
      adminPublicKey: adminKey.publicKey,
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
      logger.log(`   Name registered: ${alias}`);
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
