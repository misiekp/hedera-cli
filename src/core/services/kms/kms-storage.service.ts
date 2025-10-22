import { KmsStorageServiceInterface } from './kms-storage-service.interface';
import { StateService } from '../state/state-service.interface';
import type {
  KmsCredentialRecord,
  KmsCredentialSecret,
} from './kms-types.interface';
import { SupportedNetwork } from '../../types/shared.types';

export class KmsStorageService implements KmsStorageServiceInterface {
  private readonly state: StateService;
  private readonly namespace: string = 'kms-credentials';

  constructor(state: StateService) {
    this.state = state;
  }

  get(key: string): KmsCredentialRecord | undefined {
    return this.state.get<KmsCredentialRecord>(this.namespace, key);
  }

  set(key: string, value: KmsCredentialRecord): void {
    this.state.set<KmsCredentialRecord>(this.namespace, key, value);
  }

  remove(key: string): void {
    this.state.delete(this.namespace, key);
  }

  list(): KmsCredentialRecord[] {
    return this.state.list<KmsCredentialRecord>(this.namespace) || [];
  }

  writeSecret(keyRefId: string, secret: KmsCredentialSecret): void {
    this.state.set<KmsCredentialSecret>('kms-secrets', keyRefId, secret);
  }

  readSecret(keyRefId: string): KmsCredentialSecret | null {
    return this.state.get<KmsCredentialSecret>('kms-secrets', keyRefId) || null;
  }

  removeSecret(keyRefId: string): void {
    this.state.delete('kms-secrets', keyRefId);
  }

  setOperator(
    network: SupportedNetwork,
    mapping: { accountId: string; keyRefId: string },
  ): void {
    this.state.set('network-config', `${network}Operator`, mapping);
  }

  getOperator(
    network: SupportedNetwork,
  ): { accountId: string; keyRefId: string } | null {
    return (
      this.state.get<{ accountId: string; keyRefId: string }>(
        'network-config',
        `${network}Operator`,
      ) || null
    );
  }
}
