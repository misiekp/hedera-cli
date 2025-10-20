/**
 * Core API Implementation
 * Combines all services into a single Core API instance
 */
import { CoreApi } from './core-api.interface';
import { AccountService } from '../services/account/account-transaction-service.interface';
import { TransactionService } from '../services/tx-execution/tx-execution-service.interface';
import { TopicService } from '../services/topic/topic-transaction-service.interface';
import { StateService } from '../services/state/state-service.interface';
import { HederaMirrornodeService } from '../services/mirrornode/hedera-mirrornode-service.interface';
import { NetworkService } from '../services/network/network-service.interface';
import { ConfigService } from '../services/config/config-service.interface';
import { Logger } from '../services/logger/logger-service.interface';
import { AccountServiceImpl } from '../services/account/account-transaction-service';
import { TxExecutionServiceImpl } from '../services/tx-execution/tx-execution-service';
import { TopicServiceImpl } from '../services/topic/topic-transaction-service';
import { ZustandGenericStateServiceImpl } from '../services/state/state-service';
import { HederaMirrornodeServiceDefaultImpl } from '../services/mirrornode/hedera-mirrornode-service';
import { LedgerId } from '@hashgraph/sdk';
import { NetworkServiceImpl } from '../services/network/network-service';
import { MockConfigService } from '../services/config/config-service';
import { MockLoggerService } from '../services/logger/logger-service';
import { HbarService } from '../services/hbar/hbar-service.interface';
import { HbarServiceImpl } from '../services/hbar/hbar-service';
import { AliasService } from '../services/alias/alias-service.interface';
import { AliasServiceImpl } from '../services/alias/alias-service';
import { KmsService } from '../services/kms/kms-service.interface';
import { KmsServiceImpl } from '../services/kms/kms-service';
import { TokenService } from '../services/token/token-service.interface';
import { TokenServiceImpl } from '../services/token/token-service';

export class CoreApiImplementation implements CoreApi {
  public account: AccountService;
  public token: TokenService;
  public txExecution: TransactionService;
  public topic: TopicService;
  public state: StateService;
  public mirror: HederaMirrornodeService;
  public network: NetworkService;
  public config: ConfigService;
  public logger: Logger;
  public alias: AliasService;
  public kms: KmsService;
  public hbar?: HbarService;

  constructor() {
    this.logger = new MockLoggerService();
    this.state = new ZustandGenericStateServiceImpl(this.logger);

    this.network = new NetworkServiceImpl(this.state, this.logger);

    // Initialize new services
    this.alias = new AliasServiceImpl(this.state, this.logger);
    this.kms = new KmsServiceImpl(this.logger, this.state, this.network);
    this.txExecution = new TxExecutionServiceImpl(
      this.logger,
      this.kms,
      this.network,
    );

    // Initialize all services with dependencies
    this.account = new AccountServiceImpl(this.logger);
    this.token = new TokenServiceImpl(this.logger, this.txExecution);
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
export function createCoreApi(): CoreApi {
  return new CoreApiImplementation();
}
