/**
 * Account Create Command Handler
 * Handles account creation using the Core API
 */
import { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import type { AccountData } from '../schema';
import { AliasType } from '../../../core/services/alias/alias-service.interface';
import { formatError } from '../../../utils/errors';
import { ZustandAccountStateHelper } from '../zustand-state-helper';
import { processBalanceInput } from '../../../core/utils/process-balance-input';

export async function createAccountHandler(args: CommandHandlerArgs) {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const accountState = new ZustandAccountStateHelper(api.state, logger);

  // Extract command arguments
  const rawBalance =
    args.args.balance !== undefined
      ? (args.args.balance as string | number)
      : 10000;
  let balance: number;

  try {
    // Convert balance input: display units (default) or base units (with 't' suffix)
    // HBAR uses 8 decimals
    balance = processBalanceInput(rawBalance, 8).toNumber();
  } catch (error) {
    logger.error(
      `Invalid balance parameter: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
    return;
  }

  const autoAssociations = (args.args['auto-associations'] as number) || 0;
  const alias = (args.args.name as string) || '';

  // Check if alias already exists on the current network
  const network = api.network.getCurrentNetwork();
  api.alias.availableOrThrow(alias, network);

  const name = alias || `account-${Date.now()}`;

  // Generate a unique name for the account
  logger.log(`Creating account with name: ${alias}`);

  try {
    // 1. Generate a new key pair for the account
    const { keyRefId, publicKey } = api.kms.createLocalPrivateKey();

    // 2. Create transaction using Core API
    // Convert HBAR to tinybar (8 decimals: multiply by 10^8)
    const accountCreateResult = await api.account.createAccount({
      balanceRaw: balance,
      maxAutoAssociations: autoAssociations,
      publicKey,
      keyType: 'ECDSA',
    });

    // 2. Sign and execute transaction with default operator
    const result = await api.txExecution.signAndExecute(
      accountCreateResult.transaction,
    );

    if (result.success) {
      // 4. Optionally register alias for the new account (per-network)
      if (alias) {
        api.alias.register({
          alias,
          type: AliasType.Account,
          network,
          entityId: result.accountId,
          publicKey,
          keyRefId,
          createdAt: new Date().toISOString(),
        });
      }

      // 5. Store account metadata in plugin state (no private key)
      const accountData = {
        name,
        accountId: result.accountId || '0.0.123456',
        type: 'ECDSA' as const,
        publicKey: accountCreateResult.publicKey,
        evmAddress: accountCreateResult.evmAddress,
        solidityAddress: accountCreateResult.evmAddress,
        solidityAddressFull: accountCreateResult.evmAddress,
        keyRefId,
        network: api.network.getCurrentNetwork() as AccountData['network'],
      };

      accountState.saveAccount(name, accountData);

      logger.log(`✅ Account created successfully: ${accountData.accountId}`);
      logger.log(`   Name: ${accountData.name}`);
      logger.log(`   Type: ${accountData.type}`);
      if (alias) {
        logger.log(`   Name: ${alias}`);
      }
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

// Default export for plugin manager
export default createAccountHandler;
