/**
 * Implementation of Token Transaction Service
 * Handles token-related transaction creation
 */
import {
  TransferTransaction,
  TokenCreateTransaction,
  TokenAssociateTransaction,
  AccountId,
  TokenId,
  PrivateKey,
  TokenSupplyType,
} from '@hashgraph/sdk';
import { Logger } from '../logger/logger-service.interface';
import {
  TokenTransactionService,
  TokenTransferParams,
  TokenCreateParams,
  TokenAssociationParams,
} from './token-transaction-service.interface';

export class TokenTransactionServiceImpl implements TokenTransactionService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Create a token transfer transaction
   */
  async createTransferTransaction(
    params: TokenTransferParams,
  ): Promise<TransferTransaction> {
    this.logger.debug(
      `[TOKEN TX] Creating transfer transaction: ${params.amount} tokens from ${params.fromAccountId} to ${params.toAccountId}`,
    );

    const { tokenId, fromAccountId, toAccountId, amount } = params;

    // Create transfer transaction
    const transferTx = new TransferTransaction()
      .addTokenTransfer(
        TokenId.fromString(tokenId),
        AccountId.fromString(fromAccountId),
        -amount, // Negative for sender
      )
      .addTokenTransfer(
        TokenId.fromString(tokenId),
        AccountId.fromString(toAccountId),
        amount, // Positive for receiver
      );

    this.logger.debug(
      `[TOKEN TX] Created transfer transaction for token ${tokenId}`,
    );

    return transferTx;
  }

  /**
   * Create a token creation transaction
   */
  async createTokenTransaction(
    params: TokenCreateParams,
  ): Promise<TokenCreateTransaction> {
    this.logger.debug(
      `[TOKEN TX] Creating token: ${params.name} (${params.symbol})`,
    );

    const {
      name,
      symbol,
      treasuryId,
      decimals,
      initialSupply,
      supplyType,
      adminKey,
      treasuryKey,
    } = params;

    // Convert supply type string to enum
    const tokenSupplyType =
      supplyType === 'FINITE'
        ? TokenSupplyType.Finite
        : TokenSupplyType.Infinite;

    // Create token creation transaction
    const tokenCreateTx = new TokenCreateTransaction()
      .setTokenName(name)
      .setTokenSymbol(symbol)
      .setDecimals(decimals)
      .setInitialSupply(initialSupply)
      .setSupplyType(tokenSupplyType)
      .setTreasuryAccountId(AccountId.fromString(treasuryId))
      .setAdminKey(PrivateKey.fromStringDer(adminKey).publicKey);

    this.logger.debug(
      `[TOKEN TX] Created token creation transaction for ${name}`,
    );

    return tokenCreateTx;
  }

  /**
   * Create a token association transaction
   */
  async createTokenAssociationTransaction(
    params: TokenAssociationParams,
  ): Promise<TokenAssociateTransaction> {
    this.logger.debug(
      `[TOKEN TX] Creating association transaction: token ${params.tokenId} with account ${params.accountId}`,
    );

    const { tokenId, accountId } = params;

    // Create token association transaction
    const associateTx = new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(accountId))
      .setTokenIds([TokenId.fromString(tokenId)]);

    this.logger.debug(
      `[TOKEN TX] Created association transaction for token ${tokenId}`,
    );

    return associateTx;
  }
}
