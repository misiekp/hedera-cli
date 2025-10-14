/**
 * Main Core API interface that combines all services
 * This is the primary interface that plugins will use
 */
import { AccountService } from '../services/account/account-transaction-service.interface';
import { TransactionService } from '../services/signing/signing-service.interface';
import { TopicService } from '../services/topics/topic-transaction-service.interface';
import { StateService } from '../services/state/state-service.interface';
import { HederaMirrornodeService } from '../services/mirrornode/hedera-mirrornode-service.interface';
import { NetworkService } from '../services/network/network-service.interface';
import { ConfigService } from '../services/config/config-service.interface';
import { Logger } from '../services/logger/logger-service.interface';
import { HbarService } from '../services/hbar/hbar-service.interface';
import { AliasManagementService } from '../services/alias/alias-service.interface';
import { KeyManagementService } from '../services/kms/credentials-state-service.interface';

export interface CoreAPI {
  /**
   * Account operations
   */
  accountTransactions: AccountService;

  /**
   * Topic transaction operations
   */
  topic: TopicService;

  /**
   * Transaction signing and execution
   */
  signing: TransactionService;

  /**
   * State management with namespaced access
   */
  state: StateService;

  /**
   * Mirror node data queries
   */
  mirror: HederaMirrornodeService;

  /**
   * Network management
   */
  network: NetworkService;

  /**
   * Configuration access
   */
  config: ConfigService;

  /**
   * Logging operations
   */
  logger: Logger;

  /**
   * Alias management (non-sensitive)
   */
  alias: AliasManagementService;

  /**
   * Key Management Service (KMS)
   */
  credentialsState: KeyManagementService;

  /**
   * HBAR operations
   */
  hbar?: HbarService;
}
