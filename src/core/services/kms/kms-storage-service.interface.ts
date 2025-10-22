import type {
  KmsCredentialRecord,
  KmsCredentialSecret,
} from './kms-types.interface';
import { SupportedNetwork } from '../../types/shared.types';

export interface KmsStorageServiceInterface {
  get(key: string): KmsCredentialRecord | undefined;
  set(key: string, value: KmsCredentialRecord): void;
  remove(key: string): void;
  list(): KmsCredentialRecord[];

  // Secret APIs (internal use by provider implementations only)
  writeSecret(keyRefId: string, secret: KmsCredentialSecret): void;
  readSecret(keyRefId: string): KmsCredentialSecret | null;
  removeSecret(keyRefId: string): void;

  // Operator mapping (metadata)
  setOperator(
    network: SupportedNetwork,
    mapping: { accountId: string; keyRefId: string },
  ): void;
  getOperator(
    network: SupportedNetwork,
  ): { accountId: string; keyRefId: string } | null;
}
