/**
 * Token Create Command Handler
 * Handles token creation operations using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { ZustandTokenStateHelper } from '../zustand-state-helper';
import { TokenData, safeValidateTokenCreateParams } from '../schema';
import { resolveTreasuryParameter } from '../resolver-helper';
import { formatError } from '../../../utils/errors';

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
    if (maxSupply !== undefined) {
      finalMaxSupply = maxSupply;
      if (finalMaxSupply < initialSupply) {
        throw new Error(
          `Max supply (${finalMaxSupply}) cannot be less than initial supply (${initialSupply})`,
        );
      }
    } else {
      // Default to initial supply if no max supply specified for finite tokens
      finalMaxSupply = initialSupply;
    }
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
    // 1. Determine treasury - use provided or fall back to operator
    let finalTreasuryId: string;
    let useCustomTreasury = false;

    if (treasuryId && treasuryKeyRefId && treasuryPublicKey) {
      // Custom treasury provided
      finalTreasuryId = treasuryId;
      useCustomTreasury = true;
    } else {
      // No treasury provided - get operator info (required for token creation)
      const operator = api.credentialsState.getDefaultOperator();
      if (!operator) {
        throw new Error(
          'No operator credentials found. Please set up your Hedera account credentials or provide a treasury account.',
        );
      }
      finalTreasuryId = operator.accountId;
    }

    // 2. Create token transaction using Core API
    // Admin key is a public key parameter (not used for signing)
    // If no admin key provided, use treasury public key (or operator's key if no custom treasury)
    let adminPublicKey: string;
    if (validatedParams.adminKey) {
      adminPublicKey = validatedParams.adminKey;
    } else if (treasuryPublicKey) {
      adminPublicKey = treasuryPublicKey;
    } else {
      // Get operator's public key
      const operator = api.credentialsState.getDefaultOperator();
      if (!operator) {
        throw new Error('No operator credentials found');
      }
      const pubKey = api.credentialsState.getPublicKey(operator.keyRefId);
      logger.debug(`operator.keyRefId: ${operator.keyRefId}`);
      logger.debug(`pubKey: ${pubKey}`);
      if (!pubKey) {
        throw new Error(`Operator key not found: ${operator.keyRefId}`);
      }
      adminPublicKey = pubKey;
    }

    logger.debug('=== TOKEN PARAMS DEBUG ===');
    logger.debug(`Treasury ID: ${finalTreasuryId}`);
    logger.debug(`Admin Key (public): ${adminPublicKey}`);
    logger.debug(`Use Custom Treasury: ${useCustomTreasury}`);
    logger.debug('=========================');

    const tokenCreateParams = {
      name,
      symbol,
      treasuryId: finalTreasuryId,
      decimals,
      initialSupply,
      supplyType: supplyType.toUpperCase() as 'FINITE' | 'INFINITE',
      maxSupply: finalMaxSupply,
      adminKey: adminPublicKey,
    };

    const tokenCreateTransaction =
      api.token.createTokenTransaction(tokenCreateParams);

    // 3. Sign and execute transaction
    // If custom treasury provided, sign with treasury key
    // Otherwise sign with operator key (signAndExecute handles this internally)
    let result;
    if (useCustomTreasury && treasuryKeyRefId) {
      logger.debug(`Signing with custom treasury key`);
      result = await api.signing.signAndExecuteWith(tokenCreateTransaction, {
        keyRefId: treasuryKeyRefId,
      });
    } else {
      logger.debug(`Signing with operator key`);
      result = await api.signing.signAndExecute(tokenCreateTransaction);
    }

    if (result.success && result.tokenId) {
      logger.log(`✅ Token created successfully!`);
      logger.log(`   Token ID: ${result.tokenId}`);
      logger.log(`   Name: ${name}`);
      logger.log(`   Symbol: ${symbol}`);
      logger.log(`   Treasury: ${finalTreasuryId}`);
      logger.log(`   Decimals: ${decimals}`);
      logger.log(`   Initial Supply: ${initialSupply}`);
      logger.log(`   Supply Type: ${supplyType}`);
      logger.log(`   Transaction ID: ${result.transactionId}`);

      // 3. Store token in state
      const tokenData: TokenData = {
        tokenId: result.tokenId,
        name,
        symbol,
        treasuryId: finalTreasuryId,
        decimals,
        initialSupply,
        supplyType: supplyType.toUpperCase() as 'FINITE' | 'INFINITE',
        maxSupply: supplyType.toUpperCase() === 'FINITE' ? initialSupply : 0,
        keys: {
          adminKey: adminPublicKey,
          supplyKey: '',
          wipeKey: '',
          kycKey: '',
          freezeKey: '',
          pauseKey: '',
          feeScheduleKey: '',
          treasuryKey: treasuryPublicKey || '',
        },
        network: api.network.getCurrentNetwork(),
        associations: [],
        customFees: [],
      };

      tokenState.saveToken(result.tokenId, tokenData);
      logger.log(`   Token data saved to state`);

      process.exit(0);
      return; // Ensure execution stops (for testing with mocked process.exit)
    } else {
      throw new Error('Token creation failed - no token ID returned');
    }
  } catch (error) {
    logger.error(formatError('❌ Failed to create token', error));
    process.exit(1);
    return; // Ensure execution stops (for testing with mocked process.exit)
  }
}

export default createTokenHandler;
