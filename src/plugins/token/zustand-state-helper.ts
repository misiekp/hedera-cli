/**
 * Token State Helper for Zustand State Management
 * Provides convenient methods for token state operations
 */
import { StateService } from '../../core/services/state/state-service.interface';
import { Logger } from '../../core/services/logger/logger-service.interface';
import { TokenData, TOKEN_NAMESPACE } from './schema';

export class ZustandTokenStateHelper {
  private state: StateService;
  private logger: Logger;

  constructor(state: StateService, logger: Logger) {
    this.state = state;
    this.logger = logger;
  }

  /**
   * Save a token to the state
   */
  async saveToken(tokenId: string, tokenData: TokenData): Promise<void> {
    try {
      this.logger.debug(`[TOKEN STATE] Saving token ${tokenId} to state`);

      // Use the state service to save data in the token namespace
      this.state.set(TOKEN_NAMESPACE, tokenId, tokenData);

      this.logger.debug(`[TOKEN STATE] Successfully saved token ${tokenId}`);
    } catch (error) {
      this.logger.error(
        `[TOKEN STATE] Failed to save token ${tokenId}: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Get a token from the state
   */
  async getToken(tokenId: string): Promise<TokenData | null> {
    try {
      this.logger.debug(`[TOKEN STATE] Getting token ${tokenId} from state`);

      const tokenData = this.state.get<TokenData>(TOKEN_NAMESPACE, tokenId);

      if (tokenData) {
        this.logger.debug(`[TOKEN STATE] Found token ${tokenId} in state`);
        return tokenData;
      } else {
        this.logger.debug(`[TOKEN STATE] Token ${tokenId} not found in state`);
        return null;
      }
    } catch (error) {
      this.logger.error(
        `[TOKEN STATE] Failed to get token ${tokenId}: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Get all tokens from the state
   */
  async getAllTokens(): Promise<Record<string, TokenData>> {
    try {
      this.logger.debug(`[TOKEN STATE] Getting all tokens from state`);

      const allTokens = this.state.list<TokenData>(TOKEN_NAMESPACE);
      const tokensMap: Record<string, TokenData> = {};

      // Convert array to record using token IDs as keys
      allTokens.forEach((token, index) => {
        if (token && token.tokenId) {
          tokensMap[token.tokenId] = token;
        }
      });

      this.logger.debug(
        `[TOKEN STATE] Found ${Object.keys(tokensMap).length} tokens in state`,
      );
      return tokensMap;
    } catch (error) {
      this.logger.error(`[TOKEN STATE] Failed to get all tokens: ${error}`);
      throw error;
    }
  }

  /**
   * Remove a token from the state
   */
  async removeToken(tokenId: string): Promise<void> {
    try {
      this.logger.debug(`[TOKEN STATE] Removing token ${tokenId} from state`);

      this.state.delete(TOKEN_NAMESPACE, tokenId);

      this.logger.debug(`[TOKEN STATE] Successfully removed token ${tokenId}`);
    } catch (error) {
      this.logger.error(
        `[TOKEN STATE] Failed to remove token ${tokenId}: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Add an association to a token
   */
  async addTokenAssociation(
    tokenId: string,
    accountId: string,
    accountName: string,
  ): Promise<void> {
    try {
      const tokenData = await this.getToken(tokenId);
      if (!tokenData) {
        throw new Error(`Token ${tokenId} not found`);
      }

      // Check if association already exists
      const existingAssociation = tokenData.associations.find(
        (assoc) => assoc.accountId === accountId,
      );

      if (!existingAssociation) {
        tokenData.associations.push({
          name: accountName,
          accountId: accountId,
        });

        await this.saveToken(tokenId, tokenData);
        this.logger.debug(
          `[TOKEN STATE] Added association ${accountId} to token ${tokenId}`,
        );
      } else {
        this.logger.debug(
          `[TOKEN STATE] Association ${accountId} already exists for token ${tokenId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[TOKEN STATE] Failed to add association to token ${tokenId}: ${error}`,
      );
      throw error;
    }
  }
}
