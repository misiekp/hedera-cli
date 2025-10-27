/**
 * Account Import Command Handler
 * Handles importing existing accounts using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { ZustandAccountStateHelper } from '../zustand-state-helper';

export async function importAccountHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const accountState = new ZustandAccountStateHelper(api.state, logger);

  // Extract command arguments
  const accountId = args.args.id as string;
  const privateKey = args.args.key as string;
  const alias = (args.args.name as string) || '';

  // Check if alias already exists on the current network
  const network = api.network.getCurrentNetwork();
  api.alias.availableOrThrow(alias, network);

  // Generate a unique name for the account
  const name = alias || `imported-${accountId.replace(/\./g, '-')}`;
  logger.log(`Importing account: ${name} (${accountId})`);

  try {
    // Check if account name already exists
    if (accountState.hasAccount(name)) {
      throw new Error(`Account with name '${name}' already exists`);
    }

    // No alias resolution needed for import

    // Get account info from mirror node
    const accountInfo = await api.mirror.getAccount(accountId);

    // Securely store the private key in credentials storage
    const { keyRefId, publicKey } = api.kms.importPrivateKey(privateKey, [
      `account:${name}`,
    ]);

    // Register alias if provided
    if (alias) {
      api.alias.register({
        alias,
        type: 'account',
        network: api.network.getCurrentNetwork() as
          | 'mainnet'
          | 'testnet'
          | 'previewnet',
        entityId: accountId,
        publicKey,
        keyRefId,
        createdAt: new Date().toISOString(),
      });
    }

    // Create account object (no private key in plugin state)
    const account = {
      name,
      accountId,
      type: 'ECDSA' as 'ECDSA' | 'ED25519', // Default type since key info not available in new API
      publicKey: publicKey,
      evmAddress:
        accountInfo.evmAddress || '0x0000000000000000000000000000000000000000',
      solidityAddress: accountId, // Simplified for mock
      solidityAddressFull: `0x${accountId}`,
      keyRefId,
      network: api.network.getCurrentNetwork() as
        | 'mainnet'
        | 'testnet'
        | 'previewnet',
    };

    // Store account in state using the helper
    accountState.saveAccount(name, account);

    logger.log(`✅ Account imported successfully: ${accountId}`);
    logger.log(`   Name: ${account.name}`);
    logger.log(`   Type: ${account.type}`);
    logger.log(`   Network: ${account.network}`);
    if (alias) {
      logger.log(`   Alias: ${alias}`);
    }
    logger.log(`   Balance: ${accountInfo.balance.balance} tinybars`);

    process.exit(0);
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to import account', error));
    process.exit(1);
  }
}

export default importAccountHandler;
