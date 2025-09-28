/**
 * Interface for credential management
 * Handles operator keys and account credentials
 */
import { Credentials } from '../../types/shared.types';

export interface CredentialsService {
  /**
   * Get the default operator credentials
   */
  getDefaultCredentials(): Promise<Credentials | null>;

  /**
   * Set default operator credentials
   */
  setDefaultCredentials(
    accountId: string,
    privateKey: string,
    network: string,
  ): Promise<void>;

  /**
   * Get credentials by account ID
   */
  getCredentials(accountId: string): Promise<Credentials | null>;

  /**
   * Add new credentials
   */
  addCredentials(
    accountId: string,
    privateKey: string,
    network: string,
    isDefault?: boolean,
  ): Promise<void>;

  /**
   * Remove credentials
   */
  removeCredentials(accountId: string): Promise<void>;

  /**
   * List all credentials
   */
  listCredentials(): Promise<Credentials[]>;

  /**
   * Load credentials from environment variables
   */
  loadFromEnvironment(): Promise<Credentials | null>;
}
