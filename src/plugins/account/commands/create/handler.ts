/**
 * Account Create Command Handler
 * Handles account creation using the Core API
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import type { AccountData } from '../../schema';
import { AliasType } from '../../../../core/services/alias/alias-service.interface';
import { formatError } from '../../../../utils/errors';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import { CreateAccountOutput } from './output';

export async function createAccount(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api, logger } = args;

  // Initialize Zustand state helper
  const accountState = new ZustandAccountStateHelper(api.state, logger);

  // Extract command arguments
  const balance =
    args.args.balance !== undefined ? (args.args.balance as number) : 1;
  const autoAssociations = (args.args['auto-associations'] as number) || 0;
  const alias = (args.args.alias as string) || '';

  const name = alias || `account-${Date.now()}`;

  // Generate a unique name for the account
  logger.log(`Creating account with alias: ${alias}`);

  try {
    // 1. Generate a new key pair for the account
    const { keyRefId, publicKey } = api.kms.createLocalPrivateKey();

    // 2. Create transaction using Core API
    const accountCreateResult = await api.account.createAccount({
      balance,
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
          network: api.network.getCurrentNetwork(),
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

      // Prepare output data
      const outputData: CreateAccountOutput = {
        accountId: accountData.accountId,
        name: accountData.name,
        type: accountData.type,
        ...(alias && { alias }),
        network: accountData.network,
        transactionId: result.transactionId || '',
        evmAddress: accountData.evmAddress,
        publicKey: accountData.publicKey,
      };

      return {
        status: 'success',
        outputJson: JSON.stringify(outputData),
      };
    } else {
      return {
        status: 'failure',
        errorMessage: 'Failed to create account',
      };
    }
  } catch (error: unknown) {
    return {
      status: 'failure',
      errorMessage: formatError('Failed to create account', error),
    };
  }
}
