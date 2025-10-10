import {
  AliasManagementService,
  AliasRecord,
  AliasType,
  RefKind,
} from './alias-service.interface';
import { SupportedNetwork } from '../../types/shared.types';
import { StateService } from '../state/state-service.interface';
import { Logger } from '../logger/logger-service.interface';
import { NetworkService } from '../network/network-service.interface';

const NAMESPACE = 'aliases';

export class AliasManagementServiceImpl implements AliasManagementService {
  private readonly state: StateService;
  private readonly logger: Logger;
  private readonly network: NetworkService;

  constructor(state: StateService, logger: Logger, network: NetworkService) {
    this.state = state;
    this.logger = logger;
    this.network = network;
  }

  register(record: AliasRecord): void {
    if (this.exists(record.alias, record.network)) {
      throw new Error(
        `Alias already exists for network=${record.network}: ${record.alias}`,
      );
    }
    const key = this.composeKey(record.network, record.alias);
    const value: AliasRecord = {
      ...record,
      updatedAt: new Date().toISOString(),
    };
    this.state.set<AliasRecord>(NAMESPACE, key, value);
    this.logger.debug(
      `[ALIAS] Registered ${record.alias} (${record.type}) on ${record.network}`,
    );
  }

  resolve(
    ref: string,
    expectation: AliasType | undefined,
    network: SupportedNetwork,
  ): AliasRecord | null {
    const { kind, value } = this.parseRef(ref);
    if (kind !== 'alias') return null;
    const key = this.composeKey(network, value);
    const rec = this.state.get<AliasRecord>(NAMESPACE, key);
    if (!rec) return null;
    if (expectation && rec.type !== expectation) return null;
    return rec;
  }

  list(filter?: {
    network?: SupportedNetwork;
    type?: AliasType;
  }): AliasRecord[] {
    const all = this.state.list<AliasRecord>(NAMESPACE) || [];
    return all.filter((r) => {
      if (!r) return false;
      if (filter?.network && r.network !== filter.network) return false;
      if (filter?.type && r.type !== filter.type) return false;
      return true;
    });
  }

  remove(alias: string, network: SupportedNetwork): void {
    const key = this.composeKey(network, alias);
    this.state.delete(NAMESPACE, key);
    this.logger.debug(`[ALIAS] Removed ${alias} on ${network}`);
  }

  private exists(alias: string, network: SupportedNetwork): boolean {
    const key = this.composeKey(network, alias);
    return this.state.has(NAMESPACE, key);
  }

  parseRef(ref: string): { kind: RefKind; value: string } {
    if (ref.startsWith('keyRef:'))
      return { kind: 'keyRef', value: ref.substring(7) };
    if (ref.startsWith('pub:')) return { kind: 'pub', value: ref.substring(4) };
    if (ref.startsWith('acc:')) return { kind: 'acc', value: ref.substring(4) };
    if (ref.startsWith('token:'))
      return { kind: 'token', value: ref.substring(6) };
    if (ref.startsWith('alias:'))
      return { kind: 'alias', value: ref.substring(6) };
    return { kind: 'alias', value: ref };
  }

  private composeKey(network: SupportedNetwork, alias: string): string {
    return `${network}:${alias}`;
  }

  private currentNetwork(): SupportedNetwork {
    const n = this.network.getCurrentNetwork();
    if (
      n === 'mainnet' ||
      n === 'testnet' ||
      n === 'previewnet' ||
      n === 'localnet'
    ) {
      return n as SupportedNetwork;
    }
    return 'testnet';
  }
}
