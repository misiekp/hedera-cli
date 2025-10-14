import type {
  CredentialsRecord,
  CredentialSecret,
} from './credentials-types.interface';

export interface CredentialsStorageService {
  get(key: string): CredentialsRecord | undefined;
  set(key: string, value: CredentialsRecord): void;
  remove(key: string): void;
  list(): CredentialsRecord[];

  // Secret APIs (internal use by provider implementations only)
  writeSecret(keyRefId: string, secret: CredentialSecret): void;
  readSecret(keyRefId: string): CredentialSecret | null;
  removeSecret(keyRefId: string): void;

  // Default operator mapping (metadata) per network
  setOperator(
    network: string,
    mapping: { accountId: string; keyRefId: string },
  ): void;
  getOperator(network: string): { accountId: string; keyRefId: string } | null;
}
