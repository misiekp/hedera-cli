# Core API Reference

Complete reference documentation for the Hedera CLI Core API, including all services, interfaces, and types.

## 📋 Overview

The Core API provides a stable, typed interface for plugins to interact with Hedera networks and CLI functionality. All services are injected into command handlers via dependency injection.

## 🏗️ Core API Structure

```typescript
interface CoreAPI {
  accountTransactions: AccountTransactionService;
  signing: SigningService;
  state: StateService;
  mirror: HederaMirrornodeService;
  network: NetworkService;
  config: ConfigService;
  logger: Logger;
  credentials: CredentialsService;
}
```

## 🛠️ Service Interfaces

### Account Transaction Service

Handles Hedera account creation and management operations.

```typescript
interface AccountTransactionService {
  createAccount(params: CreateAccountParams): Promise<AccountCreationResult>;
}

interface CreateAccountParams {
  name: string;
  balance?: number;
  maxAutoAssociations?: number;
  memo?: string;
}

interface AccountCreationResult {
  accountId: string;
  transactionId: string;
  receipt: TransactionReceipt;
}
```

**Usage Example:**

```typescript
const result = await api.accountTransactions.createAccount({
  name: 'my-account',
  balance: 1000,
  maxAutoAssociations: 10,
});
```

### Signing Service

Manages transaction signing and execution.

```typescript
interface SigningService {
  signAndExecute(transaction: Transaction): Promise<TransactionReceipt>;
  getTransactionStatus(transactionId: string): Promise<TransactionStatus>;
}
```

**Usage Example:**

```typescript
const receipt = await api.signing.signAndExecute(transaction);
const status = await api.signing.getTransactionStatus(transactionId);
```

### State Service

Provides namespaced, versioned state management with Zustand.

```typescript
interface StateService {
  set<T>(namespace: string, key: string, value: T): void;
  get<T>(namespace: string, key: string): T | undefined;
  has(namespace: string, key: string): boolean;
  delete(namespace: string, key: string): void;
  clear(namespace: string): void;
  list(namespace: string): Array<{ key: string; value: unknown }>;
  getNamespaces(): string[];
  getKeys(namespace: string): string[];
}
```

**Usage Example:**

```typescript
// Store data
api.state.set('my-plugin-data', 'user-123', {
  name: 'John Doe',
  accountId: '0.0.123456',
});

// Retrieve data
const user = api.state.get('my-plugin-data', 'user-123');

// Check if data exists
const hasUser = api.state.has('my-plugin-data', 'user-123');

// List all data in namespace
const allUsers = api.state.list('my-plugin-data');
```

### Mirror Node Service

Provides comprehensive access to Hedera Mirror Node API.

```typescript
interface HederaMirrornodeService {
  // Account operations
  getAccount(accountId: string): Promise<AccountResponse>;
  getAccountHBarBalance(accountId: string): Promise<BigNumber>;
  getAccountTokenBalances(
    accountId: string,
    tokenId?: string,
  ): Promise<TokenBalancesResponse>;

  // Token operations
  getTokenInfo(tokenId: string): Promise<TokenInfo>;

  // Topic operations
  getTopicInfo(topicId: string): Promise<TopicInfo>;
  getTopicMessages(
    queryParams: TopicMessagesQueryParams,
  ): Promise<TopicMessagesResponse>;

  // Transaction operations
  getTransactionRecord(
    transactionId: string,
    nonce?: number,
  ): Promise<TransactionDetailsResponse>;

  // Contract operations
  getContractInfo(contractId: string): Promise<ContractInfo>;

  // Network operations
  getExchangeRate(timestamp?: string): Promise<ExchangeRateResponse>;
}
```

**Usage Examples:**

```typescript
// Get account information
const account = await api.mirror.getAccount('0.0.123456');
console.log(
  `Account: ${account.accountId}, Balance: ${account.balance.balance}`,
);

// Get HBAR balance
const balance = await api.mirror.getAccountHBarBalance('0.0.123456');
console.log(`Balance: ${balance.toString()} tinybars`);

// Get token balances
const tokenBalances = await api.mirror.getAccountTokenBalances('0.0.123456');
console.log(`Tokens: ${tokenBalances.tokens.length}`);

// Get topic messages
const messages = await api.mirror.getTopicMessages({
  topicId: '0.0.123456',
  limit: 10,
});
console.log(`Messages: ${messages.messages.length}`);
```

### Network Service

Manages network configuration and selection.

```typescript
interface NetworkService {
  getCurrentNetwork(): string;
  getAvailableNetworks(): string[];
  getNetworkConfig(network: string): NetworkConfig;
  setCurrentNetwork(network: string): void;
}

interface NetworkConfig {
  name: string;
  mirrorNodeUrl: string;
  consensusNodes: string[];
  networkId: string;
}
```

**Usage Example:**

```typescript
const currentNetwork = api.network.getCurrentNetwork();
const config = api.network.getNetworkConfig(currentNetwork);
const availableNetworks = api.network.getAvailableNetworks();
```

### Config Service

Provides read-only access to CLI configuration.

```typescript
interface ConfigService {
  getConfig(): Config;
  getValue(key: string): unknown;
  hasValue(key: string): boolean;
}

interface Config {
  network: string;
  profile: string;
  plugins: {
    enabled: string[];
  };
  [key: string]: unknown;
}
```

**Usage Example:**

```typescript
const config = api.config.getConfig();
const network = api.config.getValue('network');
const hasCustomSetting = api.config.hasValue('custom.setting');
```

### Logger Service

Provides structured logging capabilities.

```typescript
interface Logger {
  log(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}
```

**Usage Example:**

```typescript
api.logger.log('Processing request...');
api.logger.error('Failed to process:', error);
api.logger.warn('Deprecated feature used');
api.logger.info('Operation completed');
api.logger.debug('Debug information:', data);
```

### Credentials Service

Manages operator credentials securely.

```typescript
interface CredentialsService {
  getDefaultCredentials(): Promise<Credentials>;
  getCredentials(accountId: string): Promise<Credentials | null>;
  setCredentials(credentials: Credentials): Promise<void>;
  removeCredentials(accountId: string): Promise<void>;
  listCredentials(): Promise<Credentials[]>;
}

interface Credentials {
  accountId: string;
  privateKey: string;
  network: string;
  isDefault: boolean;
  createdAt: string;
}
```

**Usage Example:**

```typescript
const credentials = await api.credentials.getDefaultCredentials();
const allCredentials = await api.credentials.listCredentials();
```

## 📊 Type Definitions

### Core Types

```typescript
// Account types
interface Account {
  name: string;
  accountId: string;
  type: 'ECDSA' | 'ED25519';
  publicKey: string;
  evmAddress: string;
  solidityAddress: string;
  solidityAddressFull: string;
  privateKey: string;
  network: string;
}

// Token types
interface Token {
  tokenId: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: string;
  treasury: string;
}

// Topic types
interface Topic {
  topicId: string;
  adminKey?: string;
  submitKey?: string;
  memo: string;
  runningHash: string;
  sequenceNumber: number;
}

// Network types
interface NetworkConfig {
  name: string;
  mirrorNodeUrl: string;
  consensusNodes: string[];
  networkId: string;
}
```

### Mirror Node Response Types

```typescript
// Account response
interface AccountResponse {
  accountId: string;
  accountPublicKey?: string;
  balance: {
    balance: number;
    timestamp: string;
  };
  evmAddress?: string;
}

// Token balance response
interface TokenBalancesResponse {
  account: string;
  balance: number;
  tokens: TokenBalanceInfo[];
  timestamp: string;
}

interface TokenBalanceInfo {
  token_id: string;
  balance: number;
  decimals: number;
}

// Topic messages response
interface TopicMessagesResponse {
  topicId: string;
  messages: TopicMessage[];
}

interface TopicMessage {
  consensus_timestamp: string;
  topic_id: string;
  message: string;
  running_hash: string;
  sequence_number: number;
}
```

## 🔧 Command Handler Interface

### CommandHandlerArgs

All command handlers receive this interface:

```typescript
interface CommandHandlerArgs {
  args: Record<string, unknown>;
  api: CoreAPI;
  state: StateService;
  config: ConfigService;
  logger: Logger;
}
```

**Usage in Command Handler:**

```typescript
export async function myCommandHandler(
  args: CommandHandlerArgs,
): Promise<void> {
  const { api, logger, state } = args;

  // Extract arguments
  const name = args.args['name'] as string;
  const value = args.args['value'] as string;

  // Use services
  logger.log(`Processing: ${name}`);

  // Store in state
  state.set('my-namespace', name, { name, value });

  // Use Core API
  const account = await api.mirror.getAccount('0.0.123456');

  logger.log(`✅ Completed: ${account.accountId}`);
  process.exit(0);
}
```

## 🧪 Testing with Core API

### Mocking Services

```typescript
import { CoreAPI } from '../core/core-api/core-api.interface';

const mockCoreAPI: Partial<CoreAPI> = {
  accountTransactions: {
    createAccount: jest.fn().mockResolvedValue({
      accountId: '0.0.123456',
      transactionId: '0.0.123456@1234567890.123456789',
      receipt: {} as TransactionReceipt,
    }),
  },
  mirror: {
    getAccount: jest.fn().mockResolvedValue({
      accountId: '0.0.123456',
      balance: { balance: 1000000, timestamp: '2023-01-01T00:00:00Z' },
    }),
  },
  state: {
    set: jest.fn(),
    get: jest.fn(),
    has: jest.fn(),
  },
  logger: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
};
```

### Testing Command Handlers

```typescript
import { myCommandHandler } from '../commands/my-command';

describe('My Command Handler', () => {
  it('should process command successfully', async () => {
    const mockArgs = {
      args: { name: 'test', value: 'value' },
      api: mockCoreAPI,
      state: mockState,
      config: mockConfig,
      logger: mockLogger,
    };

    await myCommandHandler(mockArgs);

    expect(mockState.set).toHaveBeenCalledWith('my-namespace', 'test', {
      name: 'test',
      value: 'value',
    });
    expect(mockLogger.log).toHaveBeenCalledWith('Processing: test');
  });
});
```

## 🚀 Advanced Usage

### Error Handling

```typescript
export async function robustHandler(args: CommandHandlerArgs): Promise<void> {
  const { api, logger } = args;

  try {
    // Primary operation
    const result = await api.mirror.getAccount('0.0.123456');
    logger.log(`Account found: ${result.accountId}`);
  } catch (error) {
    if (error.message.includes('not found')) {
      logger.error('Account not found');
    } else if (error.message.includes('network')) {
      logger.error('Network error:', error.message);
    } else {
      logger.error('Unexpected error:', error);
    }
    process.exit(1);
  }
}
```

### State Management Patterns

```typescript
// Namespace isolation
const PLUGIN_NAMESPACE = 'my-plugin-data';

// Store with validation
function storeUser(user: User): void {
  if (!user.id || !user.name) {
    throw new Error('Invalid user data');
  }
  api.state.set(PLUGIN_NAMESPACE, user.id, user);
}

// Retrieve with fallback
function getUser(id: string): User | null {
  return api.state.get(PLUGIN_NAMESPACE, id) || null;
}

// Batch operations
function getAllUsers(): User[] {
  return api.state.list(PLUGIN_NAMESPACE).map((item) => item.value as User);
}
```

### Service Composition

```typescript
export async function complexOperation(
  args: CommandHandlerArgs,
): Promise<void> {
  const { api, logger } = args;

  // Get current network
  const network = api.network.getCurrentNetwork();
  logger.log(`Operating on network: ${network}`);

  // Get credentials
  const credentials = await api.credentials.getDefaultCredentials();

  // Create account
  const account = await api.accountTransactions.createAccount({
    name: 'complex-account',
    balance: 1000,
  });

  // Get account info from mirror node
  const accountInfo = await api.mirror.getAccount(account.accountId);

  // Store in state
  api.state.set('complex-plugin', account.accountId, {
    accountId: account.accountId,
    network,
    createdAt: new Date().toISOString(),
  });

  logger.log(`✅ Complex operation completed: ${account.accountId}`);
}
```

## 📚 Related Documentation

- [Plugin Development Guide](./plugin-development.md)
- [Architecture Overview](./architecture.md)
- [Contributing Guide](./contributing.md)
- [ADR-001 Plugin Architecture](./adr/ADR-001-plugin-architecture.md)
