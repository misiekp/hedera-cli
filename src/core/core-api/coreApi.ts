import { AccountApi } from './account';
import { OutputApi } from './output';

export class CoreApi {
  public account: AccountApi;
  public output: OutputApi;

  constructor() {
    this.account = new AccountApi();
    this.output = new OutputApi();
  }
}
