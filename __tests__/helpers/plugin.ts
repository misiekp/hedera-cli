/**
 * Shared test helpers and fixtures for plugin unit tests
 */
import type { CommandHandlerArgs } from '../../src/core/plugins/plugin.interface';
import type { CoreAPI } from '../../src/core/core-api/core-api.interface';
import type { Logger } from '../../src/core/services/logger/logger-service.interface';
import type { StateService } from '../../src/core/services/state/state-service.interface';
import type { ConfigService } from '../../src/core/services/config/config-service.interface';
import type { NetworkService } from '../../src/core/services/network/network-service.interface';
import type { CredentialsStateService } from '../../src/core/services/credentials-state/credentials-state-service.interface';
import type { AliasManagementService } from '../../src/core/services/alias/alias-service.interface';
import type { SigningService } from '../../src/core/services/signing/signing-service.interface';
import type { HederaMirrornodeService } from '../../src/core/services/mirrornode/hedera-mirrornode-service.interface';
import type { AccountData } from '../../src/plugins/account/schema';

/**
 * Create a mocked Logger instance
 */
export const makeLogger = (): jest.Mocked<Logger> => ({
  log: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  warn: jest.fn(),
});

/**
 * Create a test AccountData object with defaults
 */
export const makeAccountData = (
  overrides: Partial<AccountData> = {},
): AccountData => ({
  keyRefId: 'kr_test123',
  name: 'default',
  accountId: '0.0.1234',
  type: 'ECDSA',
  publicKey: 'pk',
  evmAddress: '0x0000000000000000000000000000000000000000',
  solidityAddress: 'sa',
  solidityAddressFull: 'safull',
  network: 'testnet',
  ...overrides,
});

/**
 * Create CommandHandlerArgs for testing
 */
export const makeArgs = (
  api: Partial<CoreAPI>,
  logger: jest.Mocked<Logger>,
  args: Record<string, unknown>,
): CommandHandlerArgs => ({
  api: api as CoreAPI,
  logger,
  state: {} as StateService,
  config: {} as ConfigService,
  args,
});

/**
 * Create a mocked NetworkService
 */
export const makeNetworkMock = (
  network: 'testnet' | 'mainnet' | 'previewnet' = 'testnet',
): jest.Mocked<NetworkService> => ({
  getCurrentNetwork: jest.fn().mockReturnValue(network),
  getAvailableNetworks: jest.fn(),
  switchNetwork: jest.fn(),
  getNetworkConfig: jest.fn(),
  isNetworkAvailable: jest.fn(),
});

/**
 * Create a mocked CredentialsStateService
 */
export const makeCredentialsStateMock = (
  options: {
    defaultOperator?: { accountId: string; keyRefId: string } | null;
  } = {},
): jest.Mocked<CredentialsStateService> => ({
  createLocalPrivateKey: jest.fn(),
  importPrivateKey: jest.fn().mockReturnValue({
    keyRefId: 'kr_test123',
    publicKey: 'pub-key-test',
  }),
  getPublicKey: jest.fn(),
  getPrivateKeyString: jest.fn(),
  getSignerHandle: jest.fn(),
  findByPublicKey: jest.fn(),
  list: jest.fn(),
  remove: jest.fn(),
  setDefaultOperator: jest.fn(),
  getDefaultOperator: jest
    .fn()
    .mockReturnValue(options.defaultOperator ?? null),
  ensureDefaultFromEnv: jest.fn(),
  createClient: jest.fn(),
  signTransaction: jest.fn(),
});

/**
 * Create a mocked AliasManagementService
 */
export const makeAliasMock = (): jest.Mocked<AliasManagementService> => ({
  register: jest.fn(),
  resolve: jest.fn().mockReturnValue(null), // No alias resolution by default
  list: jest.fn(),
  remove: jest.fn(),
  parseRef: jest.fn(),
});

/**
 * Create a mocked SigningService
 */
export const makeSigningMock = (
  options: {
    signAndExecuteImpl?: jest.Mock;
  } = {},
): jest.Mocked<SigningService> => ({
  signAndExecute:
    options.signAndExecuteImpl ||
    jest.fn().mockResolvedValue({
      success: true,
      transactionId: 'mock-tx-id',
      receipt: { status: { status: 'success' } },
    }),
  signAndExecuteWith:
    options.signAndExecuteImpl ||
    jest.fn().mockResolvedValue({
      success: true,
      transactionId: 'mock-tx-id',
      receipt: { status: { status: 'success' } },
    }),
  sign: jest.fn(),
  signWith: jest.fn(),
  execute: jest.fn(),
  getStatus: jest.fn(),
  setDefaultSigner: jest.fn(),
});

/**
 * Create a mocked StateService
 */
export const makeStateMock = (
  options: {
    listData?: unknown[];
  } = {},
): Partial<StateService> => ({
  list: jest.fn().mockReturnValue(options.listData || []),
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  has: jest.fn(),
  getNamespaces: jest.fn(),
  getKeys: jest.fn(),
  subscribe: jest.fn(),
  getActions: jest.fn(),
  getState: jest.fn(),
});

/**
 * Create a mocked HederaMirrornodeService
 */
export const makeMirrorMock = (
  options: {
    hbarBalance?: bigint;
    tokenBalances?: { token_id: string; balance: number }[];
    tokenError?: Error;
    accountInfo?: any;
    getAccountImpl?: jest.Mock;
  } = {},
): Partial<HederaMirrornodeService> => ({
  getAccountHBarBalance: jest.fn().mockResolvedValue(options.hbarBalance ?? 0n),
  getAccountTokenBalances: options.tokenError
    ? jest.fn().mockRejectedValue(options.tokenError)
    : jest.fn().mockResolvedValue({ tokens: options.tokenBalances ?? [] }),
  getAccount:
    options.getAccountImpl ||
    jest.fn().mockResolvedValue(
      options.accountInfo ?? {
        accountId: '0.0.1234',
        balance: { balance: 1000n, timestamp: '1234567890' },
        evmAddress: '0xabc',
        accountPublicKey: 'pubKey',
      },
    ),
});

/**
 * Setup and teardown for process.exit spy
 */
export const setupExitSpy = (): jest.SpyInstance => {
  return jest.spyOn(process, 'exit').mockImplementation(() => {
    return undefined as never;
  });
};
