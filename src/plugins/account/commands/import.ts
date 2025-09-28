/**
 * Account Import Command Handler
 * Handles importing existing accounts using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { ZustandAccountStateHelper } from '../zustand-state-helper';

export async function importAccountHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const accountState = new ZustandAccountStateHelper(api.state, logger);

  // Extract command arguments
  const name = args.args.name as string;
  const accountId = args.args.id as string;
  const privateKey = args.args.key as string;

  logger.log(`Importing account: ${name} (${accountId})`);

  try {
    // Check if account name already exists
    if (await accountState.hasAccount(name)) {
      throw new Error(`Account with name '${name}' already exists`);
    }

    // Get account info from mirror node
    const accountInfo = await api.mirror.getAccount(accountId);

    // Create account object
    const account = {
      name,
      accountId,
      type: 'ECDSA' as 'ECDSA' | 'ED25519', // Default type since key info not available in new API
      publicKey: accountInfo.accountPublicKey || 'unknown',
      evmAddress:
        accountInfo.evmAddress || '0x0000000000000000000000000000000000000000',
      solidityAddress: accountId, // Simplified for mock
      solidityAddressFull: `0x${accountId}`,
      privateKey: privateKey || 'imported-without-key',
      network: api.network.getCurrentNetwork() as
        | 'mainnet'
        | 'testnet'
        | 'previewnet',
    };

    // Store account in state using the helper
    await accountState.saveAccount(name, account);

    logger.log(`✅ Account imported successfully: ${accountId}`);
    logger.log(`   Name: ${account.name}`);
    logger.log(`   Type: ${account.type}`);
    logger.log(`   Network: ${account.network}`);
    logger.log(`   Balance: ${accountInfo.balance.balance} tinybars`);

    process.exit(0);
  } catch (error) {
    logger.error(`❌ Failed to import account: ${error}`);
    process.exit(1);
  }
}
