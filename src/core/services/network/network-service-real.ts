/**
 * Real implementation of Network Service
 * Reads network configuration from hedera-cli.config.json
 */
import {
  NetworkService,
  NetworkConfig,
} from './network-service.interface';
import { loadUserConfig } from '../../../config/loader';
import { mergeUserConfig } from '../../../config/schema';
import baseConfig from '../../../state/config';

export class RealNetworkService implements NetworkService {
  private currentNetwork: string;
  private config: any;

  constructor() {
    // Load configuration from file
    const loadedConfig = loadUserConfig();
    this.config = mergeUserConfig(baseConfig, loadedConfig.user as any);

    // Get current network from config
    this.currentNetwork = this.config.network || 'testnet';

    console.log(
      `[REAL NETWORK] Loaded config from: ${loadedConfig.source || 'default'}`,
    );
    console.log(`[REAL NETWORK] Current network: ${this.currentNetwork}`);
  }

  /**
   * Get the current active network
   */
  getCurrentNetwork(): string {
    console.log(
      `[REAL NETWORK] Getting current network: ${this.currentNetwork}`,
    );
    return this.currentNetwork;
  }

  /**
   * Get list of available networks
   */
  getAvailableNetworks(): string[] {
    const networks = Object.keys(this.config.networks || {});
    console.log(`[REAL NETWORK] Available networks: ${networks.join(', ')}`);
    return networks;
  }

  /**
   * Switch to a different network
   */
  switchNetwork(network: string): void {
    if (!this.config.networks || !this.config.networks[network]) {
      throw new Error(`Network '${network}' not found in configuration`);
    }

    console.log(
      `[REAL NETWORK] Switching network from ${this.currentNetwork} to ${network}`,
    );
    this.currentNetwork = network;

    // Update the stored state
    // Note: In a real implementation, this would persist to the state file
  }

  /**
   * Get configuration for a specific network
   */
  getNetworkConfig(network: string): NetworkConfig {
    console.log(`[REAL NETWORK] Getting network config for: ${network}`);

    const networkConfig = this.config.networks?.[network];
    if (!networkConfig) {
      throw new Error(`Network '${network}' not found in configuration`);
    }

    return {
      name: network,
      rpcUrl: networkConfig.rpcUrl || '',
      mirrorNodeUrl: networkConfig.mirrorNodeUrl || '',
      chainId: network === 'mainnet' ? '0x127' : '0x128',
      explorerUrl: `https://hashscan.io/${network}`,
      isTestnet: network !== 'mainnet',
    };
  }

  /**
   * Check if a network is available
   */
  isNetworkAvailable(network: string): boolean {
    const available = !!(this.config.networks && this.config.networks[network]);
    console.log(`[REAL NETWORK] Network '${network}' available: ${available}`);
    return available;
  }

  /**
   * Get operator credentials for the current network
   */
  getOperatorCredentials(): { operatorId: string; operatorKey: string } | null {
    const networkConfig = this.config.networks?.[this.currentNetwork];
    if (!networkConfig) {
      return null;
    }

    return {
      operatorId: networkConfig.operatorId || '',
      operatorKey: networkConfig.operatorKey || '',
    };
  }
}
