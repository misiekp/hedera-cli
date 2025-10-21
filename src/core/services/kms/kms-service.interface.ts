import type { CredentialType } from './kms-types.interface';
import { KmsSignerService } from './kms-signer-service.interface';
import { Client, Transaction as HederaTransaction } from '@hashgraph/sdk';
import { SupportedNetwork } from '../../types/shared.types';

export interface KmsService {
  createLocalPrivateKey(labels?: string[]): {
    keyRefId: string;
    publicKey: string;
  };
  importPrivateKey(
    privateKey: string,
    labels?: string[],
  ): { keyRefId: string; publicKey: string };
  getPublicKey(keyRefId: string): string | null;
  getSignerHandle(keyRefId: string): KmsSignerService;

  // Find key by publicKey (for commands that resolve aliases to publicKeys)
  findByPublicKey(publicKey: string): string | null; // Returns keyRefId or null

  // Plugin compatibility methods
  list(): Array<{
    keyRefId: string;
    type: CredentialType;
    publicKey: string;
    labels?: string[];
  }>;
  remove(keyRefId: string): void;

  // Removed registerProvider - no longer needed

  // Default operator management
  setDefaultOperator(accountId: string, keyRefId: string): void;
  getDefaultOperator(): { accountId: string; keyRefId: string } | null;
  ensureDefaultFromEnv(): { accountId: string; keyRefId: string } | null;

  // Network-aware operator management
  setOperator(
    accountId: string,
    keyRefId: string,
    network: SupportedNetwork,
  ): void;
  getOperator(
    network: SupportedNetwork,
  ): { accountId: string; keyRefId: string } | null;
  removeOperator(network: SupportedNetwork): void;
  listOperators(): Array<{
    network: SupportedNetwork;
    accountId: string;
    keyRefId: string;
  }>;

  // Client operations that don't expose private keys
  createClient(network: SupportedNetwork): Client;
  signTransaction(
    transaction: HederaTransaction,
    keyRefId: string,
  ): Promise<void>;
}
