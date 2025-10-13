/**
 * Network Service Implementation
 * Manages network state through Zustand store
 */
import {
  NetworkService,
  NetworkConfig,
  LocalnetConfig,
} from './network-service.interface';
import { getState, saveState } from '../../../state/store';

export class NetworkServiceImpl implements NetworkService {
  /**
   * Get the current active network from state
   */
  getCurrentNetwork(): string {
    const network = getState().network;
    console.log(`[MOCK] Getting current network: ${network}`);
    return network;
  }

  /**
   * Get list of available networks from state
   */
  getAvailableNetworks(): string[] {
    const networks = Object.keys(getState().networks);
    console.log(`[MOCK] Getting available networks: ${networks.join(', ')}`);
    return networks;
  }

  /**
   * Switch to a different network and persist to state
   */
  switchNetwork(network: string): void {
    const currentNetwork = this.getCurrentNetwork();
    console.log(
      `[MOCK] Switching network from ${currentNetwork} to ${network}`,
    );
    saveState({ network });
  }

  /**
   * Get configuration for a specific network from state
   */
  getNetworkConfig(network: string): NetworkConfig {
    console.log(`[MOCK] Getting network config for: ${network}`);
    const networkConfig = getState().networks[network];

    if (!networkConfig) {
      throw new Error(`Network configuration not found: ${network}`);
    }

    return {
      name: network,
      rpcUrl: networkConfig.rpcUrl,
      mirrorNodeUrl: networkConfig.mirrorNodeUrl,
      chainId: network === 'mainnet' ? '0x127' : '0x128',
      explorerUrl: `https://hashscan.io/${network}`,
      isTestnet: network !== 'mainnet',
    };
  }

  /**
   * Check if a network is available in state
   */
  isNetworkAvailable(network: string): boolean {
    console.log(`[MOCK] Checking if network is available: ${network}`);
    return network in getState().networks;
  }

  /**
   * Get localnet-specific configuration from state
   */
  getLocalnetConfig(): LocalnetConfig {
    const state = getState();
    console.log(`[MOCK] Getting localnet configuration`);
    return {
      localNodeAddress: state.localNodeAddress,
      localNodeAccountId: state.localNodeAccountId,
      localNodeMirrorAddressGRPC: state.localNodeMirrorAddressGRPC,
    };
  }
}
