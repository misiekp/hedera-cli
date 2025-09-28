/**
 * Interface for configuration access
 * Provides read-only access to CLI configuration
 */
export interface ConfigService {
  /**
   * Get the current active network
   */
  getCurrentNetwork(): string;

  /**
   * Get network configuration
   */
  getNetworkConfig(network: string): NetworkConfig;

  /**
   * Get all available networks
   */
  getAvailableNetworks(): string[];

  /**
   * Get operator account ID for current network
   */
  getOperatorId(): string;

  /**
   * Get operator private key for current network
   */
  getOperatorKey(): string;
}

export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  mirrorNodeUrl: string;
  chainId: string;
  explorerUrl?: string;
  isTestnet: boolean;
}
