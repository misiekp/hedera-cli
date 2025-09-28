/**
 * Mock implementation of Network Service
 * This is a placeholder implementation for testing the architecture
 */
import {
  NetworkService,
  NetworkConfig,
  NetworkInfo,
} from './network-service.interface';

export class MockNetworkService implements NetworkService {
  private currentNetwork: string = 'testnet';
  private availableNetworks: string[] = ['mainnet', 'testnet', 'previewnet'];

  /**
   * Get the current active network (mock implementation)
   */
  getCurrentNetwork(): string {
    console.log(`[MOCK] Getting current network: ${this.currentNetwork}`);
    return this.currentNetwork;
  }

  /**
   * Get list of available networks (mock implementation)
   */
  getAvailableNetworks(): string[] {
    console.log(
      `[MOCK] Getting available networks: ${this.availableNetworks.join(', ')}`,
    );
    return [...this.availableNetworks];
  }

  /**
   * Switch to a different network (mock implementation)
   */
  switchNetwork(network: string): void {
    console.log(
      `[MOCK] Switching network from ${this.currentNetwork} to ${network}`,
    );
    this.currentNetwork = network;
  }

  /**
   * Get configuration for a specific network (mock implementation)
   */
  getNetworkConfig(network: string): NetworkConfig {
    console.log(`[MOCK] Getting network config for: ${network}`);

    // Mock implementation - return mock network config
    return {
      name: network,
      rpcUrl: `https://${network}.hedera.com:50211`,
      mirrorNodeUrl: `https://${network}.mirrornode.hedera.com`,
      chainId: network === 'mainnet' ? '0x127' : '0x128',
      explorerUrl: `https://hashscan.io/${network}`,
      isTestnet: network !== 'mainnet',
    };
  }

  /**
   * Check if a network is available (mock implementation)
   */
  isNetworkAvailable(network: string): boolean {
    console.log(`[MOCK] Checking if network is available: ${network}`);
    return this.availableNetworks.includes(network);
  }
}
