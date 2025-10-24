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
}
