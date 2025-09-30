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
  private network?: NetworkService;

  constructor(state: StateService, logger: Logger, network?: NetworkService) {
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
    return this.loadFromEnvironment();
  }

  /**
   * Set default operator credentials
   */
  setDefaultCredentials(
    accountId: string,
    privateKey: string,
    network: string,
  ): void {
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
  getCredentials(accountId: string): Credentials | null {
    this.logger.debug(
      `[CREDENTIALS] Getting credentials for account: ${accountId}`,
    );
    return this.state.get<Credentials>('credentials', accountId) || null;
  }

  /**
   * Add new credentials
   */
  addCredentials(
    accountId: string,
    privateKey: string,
    network: string,
    isDefault: boolean = false,
  ): void {
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
  removeCredentials(accountId: string): void {
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
  listCredentials(): Credentials[] {
    this.logger.debug('[CREDENTIALS] Listing all credentials');
    return this.state.list<Credentials>('credentials');
  }

  /**
   * Load credentials from environment variables and network config
   */
  loadFromEnvironment(): Credentials | null {
    this.logger.debug(
      '[CREDENTIALS] Loading credentials from environment variables',
    );

    // First try environment variables
    const envAccountId = process.env.HEDERA_ACCOUNT_ID;
    const envPrivateKey = process.env.HEDERA_PRIVATE_KEY;
    const envNetwork = process.env.HEDERA_NETWORK || 'testnet';

    if (envAccountId && envPrivateKey) {
      this.logger.debug(
        `[CREDENTIALS] Found credentials in environment for account: ${envAccountId}`,
      );
      return {
        accountId: envAccountId,
        privateKey: envPrivateKey,
        network: envNetwork,
        isDefault: true,
        createdAt: new Date().toISOString(),
      };
    }

    // Fallback to network config
    if (this.network) {
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
    }

    this.logger.debug(
      '[CREDENTIALS] No credentials found in environment variables or network config',
    );
    return null;
  }
}
