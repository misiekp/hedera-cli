/**
 * Network Service Implementation
 * Manages network configuration using StateService with namespace
 */
import {
  NetworkService,
  NetworkConfig,
  LocalnetConfig,
} from './network-service.interface';
import { StateService } from '../state/state-service.interface';
import { Logger } from '../logger/logger-service.interface';
import {
  DEFAULT_NETWORK,
  DEFAULT_NETWORKS,
  DEFAULT_LOCALNET_NODE,
} from './network.config';

const NAMESPACE = 'network-config';
const CURRENT_NETWORK_KEY = 'current';

export class NetworkServiceImpl implements NetworkService {
  private readonly state: StateService;
  private readonly logger: Logger;

  constructor(state: StateService, logger: Logger) {
    this.state = state;
    this.logger = logger;
  }

  getCurrentNetwork(): string {
    const network = this.state.get<string>(NAMESPACE, CURRENT_NETWORK_KEY);
    this.logger.debug(`[NETWORK] Getting current network: ${network}`);
    return network || DEFAULT_NETWORK;
  }

  getAvailableNetworks(): string[] {
    const networks = Object.keys(DEFAULT_NETWORKS);
    this.logger.debug(
      `[NETWORK] Getting available networks: ${networks.join(', ')}`,
    );
    return networks;
  }

  switchNetwork(network: string): void {
    if (!this.isNetworkAvailable(network)) {
      throw new Error(`Network not available: ${network}`);
    }
    const currentNetwork = this.getCurrentNetwork();
    this.logger.debug(
      `[NETWORK] Switching network from ${currentNetwork} to ${network}`,
    );
    this.state.set<string>(NAMESPACE, CURRENT_NETWORK_KEY, network);
  }

  getNetworkConfig(network: string): NetworkConfig {
    const config = DEFAULT_NETWORKS[network];

    if (!config) {
      throw new Error(`Network configuration not found: ${network}`);
    }

    return {
      name: network,
      rpcUrl: config.rpcUrl,
      mirrorNodeUrl: config.mirrorNodeUrl,
      chainId: network === 'mainnet' ? '0x127' : '0x128',
      explorerUrl: `https://hashscan.io/${network}`,
      isTestnet: network !== 'mainnet',
    };
  }

  isNetworkAvailable(network: string): boolean {
    const available = network in DEFAULT_NETWORKS;
    this.logger.debug(
      `[NETWORK] Checking if network is available: ${network} -> ${available}`,
    );
    return available;
  }

  getLocalnetConfig(): LocalnetConfig {
    this.logger.debug(`[NETWORK] Getting localnet configuration`);
    return DEFAULT_LOCALNET_NODE;
  }
}
