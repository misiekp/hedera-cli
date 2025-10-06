/**
 * Comprehensive Hedera Mirror Node Service Implementation
 * Makes actual HTTP calls to Hedera Mirror Node API
 */
import { LedgerId } from '@hashgraph/sdk';
import { HederaMirrornodeService } from './hedera-mirrornode-service.interface';
import {
  AccountAPIResponse,
  AccountResponse,
  LedgerIdToBaseUrl,
  TokenBalancesResponse,
  TokenInfo,
  TopicInfo,
  TopicMessage,
  TopicMessagesAPIResponse,
  TopicMessagesQueryParams,
  TopicMessagesResponse,
  TransactionDetailsResponse,
  ContractInfo,
  TokenAirdropsResponse,
  ExchangeRateResponse,
} from './types';
import BigNumber from 'bignumber.js';

export class HederaMirrornodeServiceDefaultImpl
  implements HederaMirrornodeService
{
  private readonly baseUrl: string;

  constructor(private readonly ledgerId: LedgerId) {
    if (!LedgerIdToBaseUrl.has(ledgerId.toString())) {
      throw new Error(`Network type ${ledgerId} not supported`);
    }
    this.baseUrl = LedgerIdToBaseUrl.get(ledgerId.toString())!;
  }

  async getAccount(accountId: string): Promise<AccountResponse> {
    const url = `${this.baseUrl}/accounts/${accountId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch account ${accountId}: ${response.status} ${response.statusText}`,
      );
    }

    const data: AccountAPIResponse = await response.json();

    // Check if the response is empty (no account found)
    if (!data.account) {
      throw new Error(`Account ${accountId} not found`);
    }

    return {
      accountId: data.account,
      accountPublicKey: data?.key?.key,
      balance: data.balance,
      evmAddress: data.evm_address,
    };
  }

  async getAccountHBarBalance(accountId: string): Promise<BigNumber> {
    let account;
    try {
      account = await this.getAccount(accountId);
    } catch (error) {
      throw Error(`Failed to fetch hbar balance for ${accountId}: ${error}`);
    }
    return new BigNumber(account.balance.balance);
  }

  async getAccountTokenBalances(
    accountId: string,
    tokenId?: string,
  ): Promise<TokenBalancesResponse> {
    const tokenIdParam = tokenId ? `&token.id=${tokenId}` : '';
    const url = `${this.baseUrl}/accounts/${accountId}/tokens?${tokenIdParam}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch balance for an account ${accountId}: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as TokenBalancesResponse;
    return data;
  }

  async getTopicMessages(
    queryParams: TopicMessagesQueryParams,
  ): Promise<TopicMessagesResponse> {
    const lowerThreshold = queryParams.lowerTimestamp
      ? `&timestamp=gte:${queryParams.lowerTimestamp}`
      : '';
    const upperThreshold = queryParams.upperTimestamp
      ? `&timestamp=lte:${queryParams.upperTimestamp}`
      : '';
    const baseParams = `&order=desc&limit=100`;
    let url: string | null =
      `${this.baseUrl}/topics/${queryParams.topicId}/messages?${lowerThreshold}${upperThreshold}${baseParams}`;
    const arrayOfMessages: TopicMessage[] = [];
    let fetchedMessages = 0;
    try {
      while (url) {
        // Results are paginated

        fetchedMessages += 1;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Failed to get topic messages for ${queryParams.topicId}: ${response.status} ${response.statusText}`,
          );
        }

        const data: TopicMessagesAPIResponse = await response.json();

        arrayOfMessages.push(...data.messages);
        if (fetchedMessages >= 100) {
          break;
        }

        // Update URL for pagination.
        // This endpoint does not return a full path to the next page, it has to be built first
        url = data.links?.next ? this.baseUrl + data.links.next : null;
      }
    } catch (error) {
      console.error(
        `Failed to fetch topic messages for ${queryParams.topicId}. Error:`,
        error,
      );
      throw error;
    }
    return {
      topicId: queryParams.topicId,
      messages: arrayOfMessages.slice(0, queryParams.limit),
    };
  }

  async getTokenInfo(tokenId: string): Promise<TokenInfo> {
    const url = `${this.baseUrl}/tokens/${tokenId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to get token info for a token ${tokenId}: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as TokenInfo;
    return data;
  }

  async getTopicInfo(topicId: string): Promise<TopicInfo> {
    const url = `${this.baseUrl}/topics/${topicId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to get topic info for ${topicId}: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as TopicInfo;
    return data;
  }

  async getTransactionRecord(
    transactionId: string,
    nonce?: number,
  ): Promise<TransactionDetailsResponse> {
    let url = `${this.baseUrl}/transactions/${transactionId}`;
    if (nonce !== undefined) {
      url += `?nonce=${nonce}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to get transaction record for ${transactionId}: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as TransactionDetailsResponse;
    return data;
  }

  async getContractInfo(contractId: string): Promise<ContractInfo> {
    const url = `${this.baseUrl}/contracts/${contractId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to get contract info for ${contractId}: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as ContractInfo;
    return data;
  }

  async getPendingAirdrops(accountId: string): Promise<TokenAirdropsResponse> {
    const url = `${this.baseUrl}/accounts/${accountId}/airdrops/pending`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch pending airdrops for an account ${accountId}: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as TokenAirdropsResponse;
    return data;
  }

  async getOutstandingAirdrops(
    accountId: string,
  ): Promise<TokenAirdropsResponse> {
    const url = `${this.baseUrl}/accounts/${accountId}/airdrops/outstanding`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch outstanding airdrops for an account ${accountId}: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as TokenAirdropsResponse;
    return data;
  }

  async getExchangeRate(timestamp?: string): Promise<ExchangeRateResponse> {
    const timestampParam = timestamp
      ? `?timestamp=${encodeURIComponent(timestamp)}`
      : '';
    const url = `${this.baseUrl}/network/exchangerate${timestampParam}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status}. Message: ${response.statusText}`,
      );
    }
    const data = (await response.json()) as ExchangeRateResponse;
    return data;
  }
}
