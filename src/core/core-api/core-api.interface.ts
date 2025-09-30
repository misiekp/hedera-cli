/**
 * Main Core API interface that combines all services
 * This is the primary interface that plugins will use
 */
import { AccountTransactionService } from '../services/accounts/account-transaction-service.interface';
import { TokenTransactionService } from '../services/tokens/token-transaction-service.interface';
import { SigningService } from '../services/signing/signing-service.interface';
import { StateService } from '../services/state/state-service.interface';
import { HederaMirrornodeService } from '../services/mirrornode/hedera-mirrornode-service.interface';
import { NetworkService } from '../services/network/network-service.interface';
import { ConfigService } from '../services/config/config-service.interface';
import { Logger } from '../services/logger/logger-service.interface';
import { CredentialsService } from '../services/credentials/credentials-service.interface';

export interface CoreAPI {
  /**
   * Account transaction operations
   */
  accountTransactions: AccountTransactionService;

  /**
   * Token transaction operations
   */
  tokenTransactions: TokenTransactionService;

  /**
   * Transaction signing and execution
   */
  signing: SigningService;

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
   * Credentials management
   */
  credentials: CredentialsService;
}
