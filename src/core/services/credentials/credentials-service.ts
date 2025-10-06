/**
 * Implementation of Credentials Service
 * Manages operator keys with state persistence and .env fallback
 */
import { CredentialsService } from './credentials-service.interface';
import { StateService } from '../state/state-service.interface';
import { Logger } from '../logger/logger-service.interface';
import { NetworkService } from '../network/network-service.interface';
import { Credentials } from '../../types/shared.types';

export class CredentialsServiceImpl implements CredentialsService {
  private state: StateService;
  private logger: Logger;
  private network: NetworkService;

  constructor(state: StateService, logger: Logger, network: NetworkService) {
    this.state = state;
    this.logger = logger;
    this.network = network;
  }

  /**
   * Get the default operator credentials
   */
  async getDefaultCredentials(): Promise<Credentials | null> {
    this.logger.debug('[CREDENTIALS] Getting default credentials');

    // First try to get from state
    const credentials = this.state
      .list<Credentials>('credentials')
      .find((cred) => cred.isDefault);
    if (credentials) {
      this.logger.debug(
        `[CREDENTIALS] Found default credentials in state: ${credentials.accountId}`,
      );
      return credentials;
    }

    // Fallback to environment variables
    this.logger.debug(
      '[CREDENTIALS] No default credentials in state, trying environment',
    );
    return await this.loadFromEnvironment();
  }

  /**
   * Set default operator credentials
   */
  async setDefaultCredentials(
    accountId: string,
    privateKey: string,
    network: string,
  ): Promise<void> {
    this.logger.debug(
      `[CREDENTIALS] Setting default credentials for account: ${accountId}`,
    );

    // Remove default flag from existing credentials
    const existingCredentials = this.state.list<Credentials>('credentials');
    for (const cred of existingCredentials) {
      if (cred.isDefault) {
        cred.isDefault = false;
        this.state.set('credentials', cred.accountId, cred);
      }
    }

    // Add new default credentials
    const credentials: Credentials = {
      accountId,
      privateKey,
      network,
      isDefault: true,
      createdAt: new Date().toISOString(),
    };

    this.state.set('credentials', accountId, credentials);
    this.logger.debug(
      `[CREDENTIALS] Default credentials set for account: ${accountId}`,
    );
  }

  /**
   * Get credentials by account ID
   */
  async getCredentials(accountId: string): Promise<Credentials | null> {
    this.logger.debug(
      `[CREDENTIALS] Getting credentials for account: ${accountId}`,
    );
    return this.state.get<Credentials>('credentials', accountId) || null;
  }

  /**
   * Add new credentials
   */
  async addCredentials(
    accountId: string,
    privateKey: string,
    network: string,
    isDefault: boolean = false,
  ): Promise<void> {
    this.logger.debug(
      `[CREDENTIALS] Adding credentials for account: ${accountId}`,
    );

    const credentials: Credentials = {
      accountId,
      privateKey,
      network,
      isDefault,
      createdAt: new Date().toISOString(),
    };

    this.state.set('credentials', accountId, credentials);
    this.logger.debug(
      `[CREDENTIALS] Credentials added for account: ${accountId}`,
    );
  }

  /**
   * Remove credentials
   */
  async removeCredentials(accountId: string): Promise<void> {
    this.logger.debug(
      `[CREDENTIALS] Removing credentials for account: ${accountId}`,
    );
    this.state.delete('credentials', accountId);
    this.logger.debug(
      `[CREDENTIALS] Credentials removed for account: ${accountId}`,
    );
  }

  /**
   * List all credentials
   */
  async listCredentials(): Promise<Credentials[]> {
    this.logger.debug('[CREDENTIALS] Listing all credentials');
    return this.state.list<Credentials>('credentials');
  }

  /**
   * Load credentials from environment variables and network config
   */
  async loadFromEnvironment(): Promise<Credentials | null> {
    this.logger.debug(
      '[CREDENTIALS] Loading credentials from environment variables',
    );

    const accountId = process.env.TESTNET_OPERATOR_ID;
    const privateKey = process.env.TESTNET_OPERATOR_KEY;
    const network = this.network.getCurrentNetwork();

    if (accountId && privateKey) {
      this.logger.debug(
        `[CREDENTIALS] Found credentials in environment for account: ${accountId}`,
      );
      return {
        accountId,
        privateKey,
        network,
        isDefault: true,
        createdAt: new Date().toISOString(),
      };
    }

    // Fallback to network config
    const currentNetwork = this.network.getCurrentNetwork();

    // Check if the network service has a method to get operator credentials
    if ('getOperatorCredentials' in this.network) {
      const operatorCreds = (
        this.network as {
          getOperatorCredentials(): {
            operatorId?: string;
            operatorKey?: string;
          };
        }
      ).getOperatorCredentials();
      if (
        operatorCreds &&
        operatorCreds.operatorId &&
        operatorCreds.operatorKey
      ) {
        this.logger.debug(
          `[CREDENTIALS] Found credentials in network config for account: ${operatorCreds.operatorId}`,
        );
        return {
          accountId: operatorCreds.operatorId,
          privateKey: operatorCreds.operatorKey,
          network: currentNetwork,
          isDefault: true,
          createdAt: new Date().toISOString(),
        };
      }
    }

    this.logger.debug(
      '[CREDENTIALS] No credentials found in environment variables or network config',
    );
    return null;
  }
}
