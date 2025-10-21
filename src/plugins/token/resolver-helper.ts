/**
 * Token Plugin Parameter Resolvers
 * Helper functions to resolve command parameters (aliases, account IDs, keys)
 * using CoreApi services
 */
import { CoreApi } from '../../core';
import { SupportedNetwork } from '../../core/types/shared.types';

/**
 * Resolved treasury information
 */
export interface ResolvedTreasury {
  treasuryId: string;
  treasuryKeyRefId: string;
  treasuryPublicKey: string;
}

/**
 * Parse and validate an account-id:private-key pair
 *
 * @param idKeyPair - The colon-separated account-id:private-key string
 * @param api - Core API instance for importing the key
 * @param entityType - The type of entity (for error messages)
 * @returns Object with accountId, keyRefId, and publicKey
 * @throws Error if the format is invalid or account ID doesn't match expected pattern
 */
function parseAccountIdKeyPair(
  idKeyPair: string,
  api: CoreApi,
  entityType: 'treasury' | 'account',
): { accountId: string; keyRefId: string; publicKey: string } {
  const parts = idKeyPair.split(':');
  if (parts.length !== 2) {
    throw new Error(
      `Invalid ${entityType} format. Expected either an alias or ${entityType}-id:${entityType}-key`,
    );
  }

  const [accountId, privateKey] = parts;

  // Validate account ID format
  const accountIdPattern = /^0\.0\.\d+$/;
  if (!accountIdPattern.test(accountId)) {
    throw new Error(
      `Invalid ${entityType} ID format: ${accountId}. Expected format: 0.0.123456`,
    );
  }

  // Import the private key
  const imported = api.credentialsState.importPrivateKey(privateKey);

  return {
    accountId,
    keyRefId: imported.keyRefId,
    publicKey: imported.publicKey,
  };
}

/**
 * Parse and resolve treasury parameter
 * Can be:
 * - An alias (resolved via alias service)
 * - A treasury-id:treasury-key pair
 *
 * @param treasury - Treasury parameter from command
 * @param api - Core API instance
 * @param network - Current network
 * @returns Resolved treasury information
 */
export function resolveTreasuryParameter(
  treasury: string | undefined,
  api: CoreApi,
  network: SupportedNetwork,
): ResolvedTreasury | null {
  if (!treasury) {
    return null;
  }

  // Check if it's a treasury-id:treasury-key pair
  if (treasury.includes(':')) {
    const parsed = parseAccountIdKeyPair(treasury, api, 'treasury');
    return {
      treasuryId: parsed.accountId,
      treasuryKeyRefId: parsed.keyRefId,
      treasuryPublicKey: parsed.publicKey,
    };
  }

  // Try to resolve as an alias
  const aliasRecord = api.alias.resolve(treasury, 'account', network);
  if (!aliasRecord) {
    throw new Error(
      `Treasury alias "${treasury}" not found for network ${network}. ` +
        'Please provide either a valid alias or treasury-id:treasury-key pair.',
    );
  }

  // Get the account ID and key from the alias
  if (!aliasRecord.entityId) {
    throw new Error(
      `Treasury alias "${treasury}" does not have an associated account ID`,
    );
  }

  if (!aliasRecord.keyRefId) {
    throw new Error(
      `Treasury alias "${treasury}" does not have an associated key`,
    );
  }

  // Get the public key
  const publicKey = api.credentialsState.getPublicKey(aliasRecord.keyRefId);
  if (!publicKey) {
    throw new Error(
      `Treasury alias "${treasury}" key not found in credentials state`,
    );
  }

  return {
    treasuryId: aliasRecord.entityId,
    treasuryKeyRefId: aliasRecord.keyRefId,
    treasuryPublicKey: publicKey,
  };
}

/**
 * Resolved account information
 */
export interface ResolvedAccount {
  accountId: string;
  accountKeyRefId: string;
  accountPublicKey: string;
}

/**
 * Parse and resolve account parameter
 * Can be:
 * - An alias (resolved via alias service)
 * - An account-id:account-key pair
 *
 * @param account - Account parameter from command
 * @param api - Core API instance
 * @param network - Current network
 * @returns Resolved account information
 */
export function resolveAccountParameter(
  account: string | undefined,
  api: CoreApi,
  network: SupportedNetwork,
): ResolvedAccount | null {
  if (!account) {
    return null;
  }

  // Check if it's an account-id:account-key pair
  if (account.includes(':')) {
    const parsed = parseAccountIdKeyPair(account, api, 'account');
    return {
      accountId: parsed.accountId,
      accountKeyRefId: parsed.keyRefId,
      accountPublicKey: parsed.publicKey,
    };
  }

  // Try to resolve as an alias
  const aliasRecord = api.alias.resolve(account, 'account', network);
  if (!aliasRecord) {
    throw new Error(
      `Account alias "${account}" not found for network ${network}. ` +
        'Please provide either a valid alias or account-id:account-key pair.',
    );
  }

  // Get the account ID and key from the alias
  if (!aliasRecord.entityId) {
    throw new Error(
      `Account alias "${account}" does not have an associated account ID`,
    );
  }

  if (!aliasRecord.keyRefId) {
    throw new Error(
      `Account alias "${account}" does not have an associated key`,
    );
  }

  // Get the public key
  const publicKey = api.credentialsState.getPublicKey(aliasRecord.keyRefId);
  if (!publicKey) {
    throw new Error(
      `Account alias "${account}" key not found in credentials state`,
    );
  }

  return {
    accountId: aliasRecord.entityId,
    accountKeyRefId: aliasRecord.keyRefId,
    accountPublicKey: publicKey,
  };
}

/**
 * Resolved destination account information (no private key needed)
 */
export interface ResolvedDestinationAccount {
  accountId: string;
}

/**
 * Parse and resolve destination account parameter
 * Can be:
 * - An alias (resolved via alias service)
 * - An account-id (used directly)
 *
 * @param account - Account parameter from command
 * @param api - Core API instance
 * @param network - Current network
 * @returns Resolved destination account information
 */
export function resolveDestinationAccountParameter(
  account: string | undefined,
  api: CoreApi,
  network: SupportedNetwork,
): ResolvedDestinationAccount | null {
  if (!account) {
    return null;
  }

  // Check if it's already an account-id (format: 0.0.123456)
  const accountIdPattern = /^0\.0\.\d+$/;
  if (accountIdPattern.test(account)) {
    return {
      accountId: account,
    };
  }

  // Try to resolve as an alias
  const aliasRecord = api.alias.resolve(account, 'account', network);
  if (!aliasRecord) {
    throw new Error(
      `Account alias "${account}" not found for network ${network}. ` +
        'Please provide either a valid alias or account-id.',
    );
  }

  // Get the account ID from the alias
  if (!aliasRecord.entityId) {
    throw new Error(
      `Account alias "${account}" does not have an associated account ID`,
    );
  }

  return {
    accountId: aliasRecord.entityId,
  };
}

/**
 * Resolved token information
 */
export interface ResolvedToken {
  tokenId: string;
}

/**
 * Parse and resolve token parameter
 * Can be:
 * - An alias (resolved via alias service)
 * - A token-id (used directly)
 *
 * @param tokenIdOrAlias - Token ID or alias from command
 * @param api - Core API instance
 * @param network - Current network
 * @returns Resolved token information
 */
export function resolveTokenParameter(
  tokenIdOrAlias: string | undefined,
  api: CoreAPI,
  network: SupportedNetwork,
): ResolvedToken | null {
  if (!tokenIdOrAlias) {
    return null;
  }

  // Check if it's already a token-id (format: 0.0.123456)
  const tokenIdPattern = /^0\.0\.\d+$/;
  if (tokenIdPattern.test(tokenIdOrAlias)) {
    return {
      tokenId: tokenIdOrAlias,
    };
  }

  // Try to resolve as an alias
  const aliasRecord = api.alias.resolve(tokenIdOrAlias, 'token', network);
  if (!aliasRecord) {
    throw new Error(
      `Token alias "${tokenIdOrAlias}" not found for network ${network}. ` +
        'Please provide either a valid token alias or token-id.',
    );
  }

  // Get the token ID from the alias
  if (!aliasRecord.entityId) {
    throw new Error(
      `Token alias "${tokenIdOrAlias}" does not have an associated token ID`,
    );
  }

  return {
    tokenId: aliasRecord.entityId,
  };
}
