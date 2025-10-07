/**
 * Real implementation of HBAR Service
 */
import { HbarService } from './hbar-service.interface';
import { Logger } from '../logger/logger-service.interface';
import { SigningService } from '../signing/signing-service.interface';
import { TransferTransaction, Hbar, HbarUnit, AccountId } from '@hashgraph/sdk';

export class HbarServiceImpl implements HbarService {
  private logger: Logger;
  private signing: SigningService;

  constructor(logger: Logger, signing: SigningService) {
    this.logger = logger;
    this.signing = signing;
  }

  async transferTinybar(params: {
    amount: number;
    from: string;
    to: string;
    memo?: string;
  }): Promise<{ transactionId: string }> {
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

    const result = await this.signing.signAndExecute(tx);

    if (!result.success) {
      throw new Error(`HBAR transfer failed: ${result.receipt?.status.status}`);
    }

    this.logger.log(
      `[HBAR SERVICE] Transfer submitted. txId=${result.transactionId}`,
    );
    return { transactionId: result.transactionId };
  }
}
