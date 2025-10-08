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
  CustomFee,
  CustomFixedFee,
  CustomFractionalFee,
  Hbar,
  TokenId as HederaTokenId,
} from '@hashgraph/sdk';
import { Logger } from '../logger/logger-service.interface';
import { TokenTransactionService } from './token-transaction-service.interface';
import type {
  TokenTransferParams,
  TokenCreateParams,
  TokenAssociationParams,
  CustomFee as CustomFeeParams,
} from '../../types/token.types';
import { parsePrivateKey } from '../../../utils/keys';

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
      maxSupply,
      adminKey,
      treasuryKey,
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
      .setAdminKey(parsePrivateKey(adminKey).publicKey);

    // Set max supply for finite supply tokens
    if (supplyType === 'FINITE' && maxSupply !== undefined) {
      tokenCreateTx.setMaxSupply(maxSupply);
      this.logger.debug(
        `[TOKEN TX] Set max supply to ${maxSupply} for finite supply token`,
      );
    }

    // Set custom fees if provided
    const hederaCustomFees = this.processCustomFees(customFees);
    if (hederaCustomFees.length > 0) {
      tokenCreateTx.setCustomFees(hederaCustomFees);
      this.logger.debug(
        `[TOKEN TX] Set ${hederaCustomFees.length} custom fees`,
      );
    }

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
        if (fee.unitType && fee.unitType !== 'HBAR') {
          throw new Error(
            `Only HBAR fixed fees are supported. Got unitType: ${fee.unitType}`,
          );
        }

        const fixedFee = new CustomFixedFee();

        // Set HBAR amount (default unitType is HBAR)
        fixedFee.setHbarAmount(Hbar.fromTinybars(fee.amount || 0));
        this.logger.debug(
          `[TOKEN TX] Added fixed HBAR fee: ${fee.amount} tinybars`,
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
      } else {
        throw new Error(
          `Only fixed fees are supported. Got fee type: ${fee.type}`,
        );
      }
    }

    return hederaCustomFees;
  }
}
