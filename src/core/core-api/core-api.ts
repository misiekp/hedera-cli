/**
 * Core API Implementation
 * Combines all services into a single Core API instance
 */
import { CoreAPI } from './core-api.interface';
import { AccountService } from '../services/account/account-transaction-service.interface';
import { TransactionService } from '../services/signing/signing-service.interface';
import { TopicService } from '../services/topics/topic-transaction-service.interface';
import { StateService } from '../services/state/state-service.interface';
import { HederaMirrornodeService } from '../services/mirrornode/hedera-mirrornode-service.interface';
import { NetworkService } from '../services/network/network-service.interface';
import { ConfigService } from '../services/config/config-service.interface';
import { Logger } from '../services/logger/logger-service.interface';
import { AccountServiceImpl } from '../services/account/account-transaction-service';
import { TransactionServiceImpl } from '../services/signing/signing-service';
import { TopicServiceImpl } from '../services/topics/topic-transaction-service';
import { ZustandGenericStateServiceImpl } from '../services/state/state-service';
import { HederaMirrornodeServiceDefaultImpl } from '../services/mirrornode/hedera-mirrornode-service';
import { LedgerId } from '@hashgraph/sdk';
import { NetworkServiceImpl } from '../services/network/network-service';
import { MockConfigService } from '../services/config/config-service';
import { MockLoggerService } from '../services/logger/logger-service';
import { HbarService } from '../services/hbar/hbar-service.interface';
import { HbarServiceImpl } from '../services/hbar/hbar-service';
import { AliasManagementService } from '../services/alias/alias-service.interface';
import { AliasManagementServiceImpl } from '../services/alias/alias-service';
import { KeyManagementService } from '../services/kms/credentials-state-service.interface';
import { KeyManagementServiceImpl } from '../services/kms/credentials-state-service';

export class CoreAPIImplementation implements CoreAPI {
  public accountTransactions: AccountService;
  public signing: TransactionService;
  public topic: TopicService;
  public state: StateService;
  public mirror: HederaMirrornodeService;
  public network: NetworkService;
  public config: ConfigService;
  public logger: Logger;
  public alias: AliasManagementService;
  public credentialsState: KeyManagementService;
  public hbar?: HbarService;

  constructor() {
    this.logger = new MockLoggerService();
    this.state = new ZustandGenericStateServiceImpl(this.logger);

    this.network = new NetworkServiceImpl(this.state, this.logger);

    // Initialize all services with dependencies
    this.accountTransactions = new AccountServiceImpl(this.logger);
    // Initialize new services
    this.alias = new AliasManagementServiceImpl(this.state, this.logger);
    this.credentialsState = new KeyManagementServiceImpl(
      this.logger,
      this.state,
      this.network,
    );
    this.signing = new TransactionServiceImpl(
      this.logger,
      this.credentialsState,
      this.network,
    );
    this.topic = new TopicServiceImpl();
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
        ledgerId = LedgerId.TESTNET;
    }

    this.mirror = new HederaMirrornodeServiceDefaultImpl(ledgerId);
    this.config = new MockConfigService();

    this.hbar = new HbarServiceImpl(this.logger);
  }
}

/**
 * Factory function to create a Core API instance
 */
export function createCoreAPI(): CoreAPI {
  return new CoreAPIImplementation();
}
