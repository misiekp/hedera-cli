import { CredentialsStorageService } from './credentials-storage-service.interface';
import { StateService } from '../state/state-service.interface';
import type {
  CredentialsRecord,
  CredentialSecret,
} from './credentials-types.interface';

export class KmsStorageService implements CredentialsStorageService {
  private readonly state: StateService;
  private readonly namespace: string = 'credentials-state';

  constructor(state: StateService) {
    this.state = state;
  }

  get(key: string): CredentialsRecord | undefined {
    return this.state.get<CredentialsRecord>(this.namespace, key);
  }

  set(key: string, value: CredentialsRecord): void {
    this.state.set<CredentialsRecord>(this.namespace, key, value);
  }

  remove(key: string): void {
    this.state.delete(this.namespace, key);
  }

  list(): CredentialsRecord[] {
    return this.state.list<CredentialsRecord>(this.namespace) || [];
  }

  writeSecret(keyRefId: string, secret: CredentialSecret): void {
    this.state.set<CredentialSecret>(
      this.namespace + '-secrets',
      keyRefId,
      secret,
    );
  }

  readSecret(keyRefId: string): CredentialSecret | null {
    return (
      this.state.get<CredentialSecret>(this.namespace + '-secrets', keyRefId) ||
      null
    );
  }

  removeSecret(keyRefId: string): void {
    this.state.delete(this.namespace + '-secrets', keyRefId);
  }

  setOperator(mapping: { accountId: string; keyRefId: string }): void {
    this.state.set(this.namespace + '-default', 'operator', mapping);
  }

  getOperator(): { accountId: string; keyRefId: string } | null {
    return (
      this.state.get<{ accountId: string; keyRefId: string }>(
        this.namespace + '-default',
        'operator',
      ) || null
    );
  }
}
