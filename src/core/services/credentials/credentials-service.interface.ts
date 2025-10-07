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
  ): void;

  /**
   * Get credentials by account ID
   */
  getCredentials(accountId: string): Credentials | null;

  /**
   * Add new credentials
   */
  addCredentials(
    accountId: string,
    privateKey: string,
    network: string,
    isDefault?: boolean,
  ): void;

  /**
   * Remove credentials
   */
  removeCredentials(accountId: string): void;

  /**
   * List all credentials
   */
  listCredentials(): Credentials[];

  /**
   * Load credentials from environment variables
   */
  loadFromEnvironment(): Credentials | null;
}
