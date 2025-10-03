/**
 * Token Create Command Handler
 * Handles token creation operations using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { ZustandTokenStateHelper } from '../zustand-state-helper';
import { TokenData, safeValidateTokenCreateParams } from '../schema';

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

  // Get current account credentials for treasury
  const credentials = await api.credentials.getDefaultCredentials();
  if (!credentials) {
    throw new Error(
      'No credentials found. Please set up your Hedera account credentials.',
    );
  }

  // Use provided treasury ID and key or default to operator credentials
  const treasuryId = validatedParams.treasuryId || credentials.accountId;
  const treasuryKey = validatedParams.treasuryKey || credentials.privateKey;

  // Log treasury information
  logger.debug(`Using treasury account: ${treasuryId}`);
  if (treasuryId !== credentials.accountId) {
    logger.log(`🏦 Using custom treasury account: ${treasuryId}`);
    logger.log(`🔑 Will sign with treasury key (not operator key)`);
  } else {
    logger.log(`🏦 Using operator account as treasury: ${treasuryId}`);
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
    // 1. Create token transaction using Core API
    const adminKey = validatedParams.adminKey || treasuryKey;

    const tokenCreateParams = {
      name,
      symbol,
      treasuryId,
      decimals,
      initialSupply,
      supplyType: supplyType.toUpperCase() as 'FINITE' | 'INFINITE',
      maxSupply: finalMaxSupply,
      adminKey,
      treasuryKey,
    };

    const tokenCreateTransaction =
      await api.tokenTransactions.createTokenTransaction(tokenCreateParams);

    // 2. Sign and execute transaction
    // Use treasury key for signing if provided, otherwise use operator key
    let result;
    if (treasuryKey !== credentials.privateKey) {
      logger.debug(`Using treasury key for signing transaction`);
      result = await api.signing.signAndExecuteWithKey(
        tokenCreateTransaction,
        treasuryKey,
      );
    } else {
      logger.debug(`Using operator key for signing transaction`);
      result = await api.signing.signAndExecute(tokenCreateTransaction);
    }

    if (result.success && result.tokenId) {
      logger.log(`✅ Token created successfully!`);
      logger.log(`   Token ID: ${result.tokenId}`);
      logger.log(`   Name: ${name}`);
      logger.log(`   Symbol: ${symbol}`);
      logger.log(`   Treasury: ${treasuryId}`);
      logger.log(`   Decimals: ${decimals}`);
      logger.log(`   Initial Supply: ${initialSupply}`);
      logger.log(`   Supply Type: ${supplyType}`);
      logger.log(`   Transaction ID: ${result.transactionId}`);

      // 3. Store token in state
      const tokenData: TokenData = {
        tokenId: result.tokenId,
        name,
        symbol,
        treasuryId,
        decimals,
        initialSupply,
        supplyType: supplyType.toUpperCase() as 'FINITE' | 'INFINITE',
        maxSupply: supplyType.toUpperCase() === 'FINITE' ? initialSupply : 0,
        keys: {
          adminKey: treasuryKey,
          supplyKey: '',
          wipeKey: '',
          kycKey: '',
          freezeKey: '',
          pauseKey: '',
          feeScheduleKey: '',
          treasuryKey,
        },
        network: api.network.getCurrentNetwork() as
          | 'mainnet'
          | 'testnet'
          | 'previewnet',
        associations: [],
        customFees: [],
      };

      await tokenState.saveToken(result.tokenId, tokenData);
      logger.log(`   Token data saved to state`);

      process.exit(0);
    } else {
      throw new Error('Token creation failed - no token ID returned');
    }
  } catch (error) {
    logger.error(`❌ Failed to create token: ${error}`);
    process.exit(1);
  }
}

export default createTokenHandler;
