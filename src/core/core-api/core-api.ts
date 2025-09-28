/**
 * Core API Implementation
 * Combines all services into a single Core API instance
 */
import { CoreAPI } from './core-api.interface';
import { AccountTransactionServiceImpl } from '../services/accounts/account-transaction-service';
import { SigningServiceImpl } from '../services/signing/signing-service';
import { ZustandGenericStateServiceImpl } from '../services/state/state-service';
import { HederaMirrornodeServiceDefaultImpl } from '../services/mirrornode/hedera-mirrornode-service';
import { LedgerId } from '@hashgraph/sdk';
import { MockNetworkService } from '../services/network/network-service';
import { MockConfigService } from '../services/config/config-service';
import { MockLoggerService } from '../services/logger/logger-service';
import { CredentialsServiceImpl } from '../services/credentials/credentials-service';

export class CoreAPIImplementation implements CoreAPI {
  public accountTransactions: AccountTransactionServiceImpl;
  public signing: SigningServiceImpl;
  public state: ZustandGenericStateServiceImpl;
  public mirror: HederaMirrornodeServiceDefaultImpl;
  public network: MockNetworkService;
  public config: MockConfigService;
  public logger: MockLoggerService;
  public credentials: CredentialsServiceImpl;

  constructor() {
    // Initialize logger first
    this.logger = new MockLoggerService();

    // Initialize Zustand state service
    this.state = new ZustandGenericStateServiceImpl(this.logger);

    // Initialize credentials service
    this.credentials = new CredentialsServiceImpl(this.state, this.logger);

    // Initialize all services with dependencies
    this.network = new MockNetworkService();
    this.accountTransactions = new AccountTransactionServiceImpl(this.logger);
    this.signing = new SigningServiceImpl(this.logger, this.credentials);
    // Convert network string to LedgerId
    const networkString = this.network.getCurrentNetwork();
    let ledgerId: LedgerId;
    switch (networkString) {
      case 'mainnet':
        ledgerId = LedgerId.MAINNET;
        break;
      case 'testnet':
        ledgerId = LedgerId.TESTNET;
        break;
      case 'previewnet':
        ledgerId = LedgerId.PREVIEWNET;
        break;
      default:
        ledgerId = LedgerId.TESTNET; // Default to testnet
    }

    this.mirror = new HederaMirrornodeServiceDefaultImpl(ledgerId);
    this.config = new MockConfigService();
  }
}

/**
 * Factory function to create a Core API instance
 */
export function createCoreAPI(): CoreAPI {
  return new CoreAPIImplementation();
}
