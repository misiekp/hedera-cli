/**
 * Implementation of Token Service
 * Handles token-related transaction creation and execution
 */
import {
  TransferTransaction,
  TokenCreateTransaction,
  TokenAssociateTransaction,
  AccountId,
  TokenId,
  PrivateKey,
  PublicKey,
  TokenSupplyType,
  CustomFee,
  CustomFixedFee,
  CustomFractionalFee,
  Hbar,
  TokenId as HederaTokenId,
} from '@hashgraph/sdk';
import { Logger } from '../logger/logger-service.interface';
import { TransactionService } from '../signing/signing-service.interface';
import {
  TokenService,
  TokenOperationResult,
  SignerRef,
} from './token-service.interface';
import type {
  TokenTransferParams,
  TokenCreateParams,
  TokenAssociationParams,
  CustomFee as CustomFeeParams,
} from '../../types/token.types';
import { parsePrivateKey } from '../../../utils/keys';

export class TokenServiceImpl implements TokenService {
  private logger: Logger;
  private transactionService?: TransactionService;

  constructor(logger: Logger, transactionService?: TransactionService) {
    this.logger = logger;
    this.transactionService = transactionService;
  }

  /**
   * Create a token transfer transaction (without execution)
   */
  async createTransferTransaction(
    params: TokenTransferParams,
  ): Promise<TransferTransaction> {
    this.logger.debug(
      `[TOKEN SERVICE] Creating transfer transaction: ${params.amount} tokens from ${params.fromAccountId} to ${params.toAccountId}`,
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
      `[TOKEN SERVICE] Created transfer transaction for token ${tokenId}`,
    );

    return transferTx;
  }

  /**
   * Create and execute a token transfer transaction
   */
  async transfer(
    params: TokenTransferParams,
    signer?: SignerRef,
  ): Promise<TokenOperationResult> {
    this.logger.debug(
      `[TOKEN SERVICE] Executing transfer: ${params.amount} tokens from ${params.fromAccountId} to ${params.toAccountId}`,
    );

    if (!this.transactionService) {
      throw new Error(
        '[TOKEN SERVICE] Transaction service not available for execution',
      );
    }

    // Create the transfer transaction
    const transferTx = await this.createTransferTransaction(params);

    // Execute the transaction
    const result = signer
      ? await this.transactionService.signAndExecuteWith(transferTx, signer)
      : await this.transactionService.signAndExecute(transferTx);

    this.logger.debug(
      `[TOKEN SERVICE] Transfer executed successfully: ${result.transactionId}`,
    );

    return {
      transactionId: result.transactionId,
      success: result.success,
      receipt: result.receipt,
    };
  }

  /**
   * Create a token creation transaction (without execution)
   */
  async createTokenTransaction(
    params: TokenCreateParams,
  ): Promise<TokenCreateTransaction> {
    this.logger.debug(
      `[TOKEN SERVICE] Creating token: ${params.name} (${params.symbol})`,
    );

    const {
      name,
      symbol,
      treasuryId,
      decimals,
      initialSupply,
      supplyType,
      maxSupply,
      adminKey,
      customFees,
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
      .setAdminKey(this.parseKeyToPublic(adminKey));

    // Set max supply for finite supply tokens
    if (supplyType === 'FINITE' && maxSupply !== undefined) {
      tokenCreateTx.setMaxSupply(maxSupply);
      this.logger.debug(
        `[TOKEN SERVICE] Set max supply to ${maxSupply} for finite supply token`,
      );
    }

    // Set custom fees if provided
    const hederaCustomFees = this.processCustomFees(customFees);
    if (hederaCustomFees.length > 0) {
      tokenCreateTx.setCustomFees(hederaCustomFees);
      this.logger.debug(
        `[TOKEN SERVICE] Set ${hederaCustomFees.length} custom fees`,
      );
    }

    this.logger.debug(
      `[TOKEN SERVICE] Created token creation transaction for ${name}`,
    );

    return tokenCreateTx;
  }

  /**
   * Create and execute a token creation transaction
   */
  async createToken(
    params: TokenCreateParams,
    signer?: SignerRef,
  ): Promise<TokenOperationResult> {
    this.logger.debug(
      `[TOKEN SERVICE] Executing token creation: ${params.name} (${params.symbol})`,
    );

    if (!this.transactionService) {
      throw new Error(
        '[TOKEN SERVICE] Transaction service not available for execution',
      );
    }

    // Create the token transaction
    const tokenCreateTx = await this.createTokenTransaction(params);

    // Execute the transaction
    const result = signer
      ? await this.transactionService.signAndExecuteWith(tokenCreateTx, signer)
      : await this.transactionService.signAndExecute(tokenCreateTx);

    this.logger.debug(
      `[TOKEN SERVICE] Token creation executed successfully: ${result.transactionId}`,
    );

    return {
      transactionId: result.transactionId,
      success: result.success,
      tokenId: result.tokenId,
      receipt: result.receipt,
    };
  }

  /**
   * Create a token association transaction (without execution)
   */
  async createTokenAssociationTransaction(
    params: TokenAssociationParams,
  ): Promise<TokenAssociateTransaction> {
    this.logger.debug(
      `[TOKEN SERVICE] Creating association transaction: token ${params.tokenId} with account ${params.accountId}`,
    );

    const { tokenId, accountId } = params;

    // Create token association transaction
    const associateTx = new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(accountId))
      .setTokenIds([TokenId.fromString(tokenId)]);

    this.logger.debug(
      `[TOKEN SERVICE] Created association transaction for token ${tokenId}`,
    );

    return associateTx;
  }

  /**
   * Create and execute a token association transaction
   */
  async associateToken(
    params: TokenAssociationParams,
    signer?: SignerRef,
  ): Promise<TokenOperationResult> {
    this.logger.debug(
      `[TOKEN SERVICE] Executing token association: token ${params.tokenId} with account ${params.accountId}`,
    );

    if (!this.transactionService) {
      throw new Error(
        '[TOKEN SERVICE] Transaction service not available for execution',
      );
    }

    // Create the association transaction
    const associateTx = await this.createTokenAssociationTransaction(params);

    // Execute the transaction
    const result = signer
      ? await this.transactionService.signAndExecuteWith(associateTx, signer)
      : await this.transactionService.signAndExecute(associateTx);

    this.logger.debug(
      `[TOKEN SERVICE] Token association executed successfully: ${result.transactionId}`,
    );

    return {
      transactionId: result.transactionId,
      success: result.success,
      receipt: result.receipt,
    };
  }

  /**
   * Parse a key string to PublicKey
   * Handles both public keys and private keys (extracts public key from private)
   */
  private parseKeyToPublic(key: string) {
    try {
      // Try to parse as private key first (for backwards compatibility)
      return parsePrivateKey(key).publicKey;
    } catch {
      // If that fails, try to parse as public key directly
      try {
        return PublicKey.fromString(key);
      } catch {
        throw new Error(`Invalid key format: ${key}`);
      }
    }
  }

  /**
   * Process custom fees and convert them to Hedera CustomFee objects
   */
  private processCustomFees(customFees?: CustomFeeParams[]): CustomFee[] {
    if (!customFees || customFees.length === 0) {
      return [];
    }

    const hederaCustomFees: CustomFee[] = [];

    for (const fee of customFees) {
      if (fee.type === 'fixed') {
        // Only support HBAR fixed fees
        const fixedFee = new CustomFixedFee();

        // Set HBAR amount (default unitType is HBAR)
        fixedFee.setHbarAmount(Hbar.fromTinybars(fee.amount || 0));
        this.logger.debug(
          `[TOKEN SERVICE] Added fixed HBAR fee: ${fee.amount} tinybars`,
        );

        if (fee.collectorId) {
          fixedFee.setFeeCollectorAccountId(
            AccountId.fromString(fee.collectorId),
          );
        }

        if (fee.exempt !== undefined) {
          fixedFee.setAllCollectorsAreExempt(fee.exempt);
        }

        hederaCustomFees.push(fixedFee);
      }
    }

    return hederaCustomFees;
  }
}
