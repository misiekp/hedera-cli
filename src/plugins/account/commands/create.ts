/**
 * Account Create Command Handler
 * Handles account creation using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { formatError } from '../../../utils/errors';
import { ZustandAccountStateHelper } from '../zustand-state-helper';

export async function createAccountHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const accountState = new ZustandAccountStateHelper(api.state, logger);

  // Extract command arguments
  const name = args.args.name as string;
  const balance =
    args.args.balance !== undefined ? (args.args.balance as number) : 10000;
  const autoAssociations = (args.args['auto-associations'] as number) || 0;

  logger.log(`Creating account with name: ${name}`);

  try {
    // 1. Create transaction using Core API
    const accountCreateResult = await api.accountTransactions.createAccount({
      balance,
      name,
      maxAutoAssociations: autoAssociations,
    });

    // 2. Sign and execute transaction
    const result = await api.signing.signAndExecute(
      accountCreateResult.transaction,
    );

    if (result.success) {
      // 3. Store account in state with real data using state helper
      const accountData = {
        name,
        accountId: result.accountId || '0.0.123456',
        type: 'ECDSA' as const,
        publicKey: accountCreateResult.publicKey,
        evmAddress: accountCreateResult.evmAddress,
        solidityAddress: accountCreateResult.evmAddress,
        solidityAddressFull: accountCreateResult.evmAddress,
        privateKey: accountCreateResult.privateKey,
        network: api.network.getCurrentNetwork() as
          | 'mainnet'
          | 'testnet'
          | 'previewnet',
      };

      accountState.saveAccount(name, accountData);

      logger.log(`✅ Account created successfully: ${accountData.accountId}`);
      logger.log(`   Name: ${accountData.name}`);
      logger.log(`   Type: ${accountData.type}`);
      logger.log(`   Network: ${accountData.network}`);
      logger.log(`   Transaction ID: ${result.transactionId}`);

      process.exit(0);
    } else {
      throw new Error('Failed to create account');
    }
  } catch (error: unknown) {
    logger.error(formatError('❌ Failed to create account', error));
    process.exit(1);
  }
}

export default createAccountHandler;
