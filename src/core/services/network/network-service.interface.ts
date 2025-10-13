/**
 * Interface for network management operations
 * All network services must implement this interface
 */
export interface NetworkService {
  /**
   * Get the current active network
   */
  getCurrentNetwork(): string;

  /**
   * Get list of available networks
   */
  getAvailableNetworks(): string[];

  /**
   * Switch to a different network
   */
  switchNetwork(network: string): void;

  /**
   * Get configuration for a specific network
   */
  getNetworkConfig(network: string): NetworkConfig;

  /**
   * Check if a network is available
   */
  isNetworkAvailable(network: string): boolean;

  /**
   * Get localnet-specific configuration
   */
  getLocalnetConfig(): LocalnetConfig;
}

// Network configuration types
export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  mirrorNodeUrl: string;
  chainId: string;
  explorerUrl?: string;
  isTestnet: boolean;
}

export interface LocalnetConfig {
  localNodeAddress: string;
  localNodeAccountId: string;
  localNodeMirrorAddressGRPC: string;
}

export interface NetworkInfo {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  rpcUrl: string;
  mirrorNodeUrl: string;
  lastChecked: string;
}
