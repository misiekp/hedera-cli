/**
 * Mock implementation of Config Service
 * This is a placeholder implementation for testing the architecture
 */
import { ConfigService } from './config-service.interface';
import { NetworkConfig } from '../network/network-service.interface';

export class MockConfigService implements ConfigService {
  private currentNetwork: string = 'testnet';
  private operatorId: string = '0.0.123456';
  private operatorKey: string = 'mock-operator-key';

  /**
   * Get the current active network (mock implementation)
   */
  getCurrentNetwork(): string {
    console.log(`[MOCK] Getting current network: ${this.currentNetwork}`);
    return this.currentNetwork;
  }

  /**
   * Get network configuration (mock implementation)
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
      operator: {
        accountId: this.operatorId,
        keyRefId: 'mock-key-ref',
      },
    };
  }

  /**
   * Get all available networks (mock implementation)
   */
  getAvailableNetworks(): string[] {
    console.log(`[MOCK] Getting available networks`);
    return ['mainnet', 'testnet', 'previewnet'];
  }

  /**
   * Get operator account ID for current network (mock implementation)
   */
  getOperatorId(): string {
    console.log(`[MOCK] Getting operator ID: ${this.operatorId}`);
    return this.operatorId;
  }

  /**
   * Get operator private key for current network (mock implementation)
   */
  getOperatorKey(): string {
    console.log(`[MOCK] Getting operator key`);
    return this.operatorKey;
  }
}
