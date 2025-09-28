/**
 * Comprehensive Hedera Mirror Node Service Interface
 * Provides access to all Hedera Mirror Node API endpoints
 */
import { LedgerId } from '@hashgraph/sdk';
import BigNumber from 'bignumber.js';
import {
  AccountResponse,
  TokenBalancesResponse,
  TopicMessagesQueryParams,
  TopicMessagesResponse,
  TokenInfo,
  TopicInfo,
  TransactionDetailsResponse,
  ContractInfo,
  TokenAirdropsResponse,
  ExchangeRateResponse,
} from './types';

export interface HederaMirrornodeService {
  /**
   * Get account information
   */
  getAccount(accountId: string): Promise<AccountResponse>;

  /**
   * Get account HBAR balance
   */
  getAccountHBarBalance(accountId: string): Promise<BigNumber>;

  /**
   * Get account token balances
   */
  getAccountTokenBalances(
    accountId: string,
    tokenId?: string,
  ): Promise<TokenBalancesResponse>;

  /**
   * Get topic messages with pagination support
   */
  getTopicMessages(
    queryParams: TopicMessagesQueryParams,
  ): Promise<TopicMessagesResponse>;

  /**
   * Get token information
   */
  getTokenInfo(tokenId: string): Promise<TokenInfo>;

  /**
   * Get topic information
   */
  getTopicInfo(topicId: string): Promise<TopicInfo>;

  /**
   * Get transaction record
   */
  getTransactionRecord(
    transactionId: string,
    nonce?: number,
  ): Promise<TransactionDetailsResponse>;

  /**
   * Get contract information
   */
  getContractInfo(contractId: string): Promise<ContractInfo>;

  /**
   * Get pending airdrops for an account
   */
  getPendingAirdrops(accountId: string): Promise<TokenAirdropsResponse>;

  /**
   * Get outstanding airdrops for an account
   */
  getOutstandingAirdrops(accountId: string): Promise<TokenAirdropsResponse>;

  /**
   * Get exchange rate
   */
  getExchangeRate(timestamp?: string): Promise<ExchangeRateResponse>;
}
