/**
 * HBAR Service Interface
 * Encapsulates HBAR-related operations
 */
export interface HbarService {
  transferTinybar(params: {
    amount: number;
    from: string;
    to: string;
    memo?: string;
  }): Promise<{ transactionId: string }>;
}
