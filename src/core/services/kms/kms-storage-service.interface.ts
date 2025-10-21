import type {
  KmsCredentialRecord,
  KmsCredentialSecret,
} from './kms-types.interface';

export interface KmsStorageServiceInterface {
  get(key: string): KmsCredentialRecord | undefined;
  set(key: string, value: KmsCredentialRecord): void;
  remove(key: string): void;
  list(): KmsCredentialRecord[];

  // Secret APIs (internal use by provider implementations only)
  writeSecret(keyRefId: string, secret: KmsCredentialSecret): void;
  readSecret(keyRefId: string): KmsCredentialSecret | null;
  removeSecret(keyRefId: string): void;

  // Default operator mapping (metadata)
  setDefaultOperator(mapping: { accountId: string; keyRefId: string }): void;
  getDefaultOperator(): { accountId: string; keyRefId: string } | null;

  // Network-aware operator management
  setOperator(accountId: string, keyRefId: string, network: string): void;
  getOperator(network: string): { accountId: string; keyRefId: string } | null;
  removeOperator(network: string): void;
  listOperators(): Array<{
    network: string;
    accountId: string;
    keyRefId: string;
  }>;
}
