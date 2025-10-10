import { SupportedNetwork } from '../../types/shared.types';

export type AliasType = 'account' | 'token' | 'key' | 'topic' | 'contract';

export interface AliasRecord {
  alias: string;
  type: AliasType;
  network: SupportedNetwork;
  entityId?: string;
  publicKey?: string;
  keyRefId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface AliasManagementService {
  register(record: AliasRecord): void;
  resolve(
    ref: string,
    expectation: AliasType | undefined,
    network: SupportedNetwork,
  ): AliasRecord | null;
  list(filter?: {
    network?: SupportedNetwork;
    type?: AliasType;
  }): AliasRecord[];
  remove(alias: string, network: SupportedNetwork): void;
}
