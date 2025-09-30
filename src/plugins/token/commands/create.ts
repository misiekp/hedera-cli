/**
 * Token Create Command Handler
 * Handles token creation operations using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { ZustandTokenStateHelper } from '../zustand-state-helper';
import { TokenData } from '../schema';

export async function createTokenHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize token state helper
  const tokenState = new ZustandTokenStateHelper(api.state, logger);

  // Extract command arguments with defaults
  const name = args.args['name'] as string;
  const symbol = args.args['symbol'] as string;
  const decimals = (args.args['decimals'] as number) || 0;
  const initialSupply = (args.args['initial-supply'] as number) || 1000000;
  const supplyType =
    (args.args['supply-type'] as string | undefined) || 'INFINITE';

  // Get current account credentials for treasury
  const credentials = await api.credentials.getDefaultCredentials();
  if (!credentials) {
    throw new Error(
      'No credentials found. Please set up your Hedera account credentials.',
    );
  }

  const treasuryId =
    (args.args['treasury-id'] as string) || credentials.accountId;
  const treasuryKey =
    (args.args['treasury-key'] as string) || credentials.privateKey;

  logger.log(`Creating token: ${name} (${symbol})`);

  try {
    // 1. Create token transaction using Core API
    const tokenCreateTransaction =
      await api.tokenTransactions.createTokenTransaction({
        name,
        symbol,
        treasuryId,
        decimals,
        initialSupply,
        supplyType: supplyType.toUpperCase() as 'FINITE' | 'INFINITE',
        adminKey: treasuryKey, // Using treasury key as admin key for simplicity
        treasuryKey,
      });

    // 2. Sign and execute transaction
    // Note: In a real implementation, you'd need proper key management
    // For now, we'll use a placeholder signing process
    const result = await api.signing.signAndExecute(tokenCreateTransaction);

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
