import { getAccountBalance } from '../../utils/account';

export class AccountApi {
  constructor() {}

  async getAccountBalance(
    accountIdOrName: string,
    onlyHbar: boolean = false,
    tokenId?: string,
  ): Promise<void> {
    return getAccountBalance(accountIdOrName, onlyHbar, tokenId);
  }
}
