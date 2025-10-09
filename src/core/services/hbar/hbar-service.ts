/**
 * Real implementation of HBAR Service
 */
import {
  HbarService,
  TransferTinybarParams,
  TransferTinybarResult,
} from './hbar-service.interface';
import { Logger } from '../logger/logger-service.interface';
import { TransferTransaction, Hbar, HbarUnit, AccountId } from '@hashgraph/sdk';

export class HbarServiceImpl implements HbarService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  transferTinybar(
    params: TransferTinybarParams,
  ): Promise<TransferTinybarResult> {
    const { amount, from, to, memo } = params;

    this.logger.debug(
      `[HBAR SERVICE] Building transfer: amount=${amount} from=${from} to=${to} memo=${memo || ''}`,
    );

    const fromId = AccountId.fromString(from);
    const toId = AccountId.fromString(to);

    const tx = new TransferTransaction()
      .addHbarTransfer(fromId, new Hbar(-amount, HbarUnit.Tinybar))
      .addHbarTransfer(toId, new Hbar(amount, HbarUnit.Tinybar));

    if (memo) {
      tx.setTransactionMemo(memo);
    }

    this.logger.debug(
      `[HBAR SERVICE] Created transfer transaction: from=${from} to=${to} amount=${amount}`,
    );

    return Promise.resolve({
      transaction: tx,
    });
  }
}
