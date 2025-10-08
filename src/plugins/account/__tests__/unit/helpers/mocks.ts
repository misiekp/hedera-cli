/**
 * Shared Mock Factory Functions for Account Plugin Tests
 * Provides reusable mocks for services, APIs, and common test utilities
 */
import type { CommandHandlerArgs } from '../../../../../core/plugins/plugin.interface';
import type { Logger } from '../../../../../core/services/logger/logger-service.interface';
import type { HederaMirrornodeService } from '../../../../../core/services/mirrornode/hedera-mirrornode-service.interface';
import type { CoreAPI } from '../../../../../core/core-api/core-api.interface';
import type { AccountData } from '../../../schema';
import type { AccountTransactionService } from '../../../../../core/services/accounts/account-transaction-service.interface';
import type { SigningService } from '../../../../../core/services/signing/signing-service.interface';
import type { NetworkService } from '../../../../../core/services/network/network-service.interface';
import {
  mockAccountData,
  mockTransactionResults,
  mockMirrorAccountData,
} from './fixtures';

/**
 * Create a mocked Logger
 */
export const makeLogger = (): jest.Mocked<Logger> => ({
  log: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  warn: jest.fn(),
});

/**
 * Creates an AccountData object with default values and optional overrides
 */
export const makeAccountData = (
  overrides: Partial<AccountData> = {},
): AccountData => ({
  ...mockAccountData.default,
  ...overrides,
});

/**
 * Creates mock HederaMirrornodeService methods for testing account balances
 */
export const makeMirrorMocks = ({
  hbarBalance = 0n,
  tokenBalances,
  tokenError,
}: {
  hbarBalance?: bigint;
  tokenBalances?: { token_id: string; balance: number }[];
  tokenError?: Error;
}): Partial<HederaMirrornodeService> => {
  return {
    getAccountHBarBalance: jest.fn().mockResolvedValue(hbarBalance),
    getAccountTokenBalances: tokenError
      ? jest.fn().mockRejectedValue(tokenError)
      : jest.fn().mockResolvedValue({ tokens: tokenBalances ?? [] }),
  };
};

/**
 * Creates mock AccountTransactionService
 */
export const makeAccountTransactionServiceMock = (
  overrides?: Partial<jest.Mocked<AccountTransactionService>>,
): jest.Mocked<AccountTransactionService> => ({
  createAccount: jest.fn(),
  getAccountInfo: jest.fn(),
  getAccountBalance: jest.fn(),
  ...overrides,
});

/**
 * Creates mock SigningService
 */
export const makeSigningServiceMock = (
  overrides?: Partial<jest.Mocked<SigningService>>,
): jest.Mocked<SigningService> => ({
  signAndExecute: jest.fn().mockResolvedValue(mockTransactionResults.success),
  signAndExecuteWithKey: jest
    .fn()
    .mockResolvedValue(mockTransactionResults.success),
  sign: jest.fn(),
  signWithKey: jest.fn(),
  execute: jest.fn(),
  getStatus: jest.fn(),
  ...overrides,
});

/**
 * Creates mock NetworkService
 */
export const makeNetworkServiceMock = (
  network: 'testnet' | 'mainnet' | 'previewnet' = 'testnet',
): jest.Mocked<NetworkService> => ({
  getCurrentNetwork: jest.fn().mockReturnValue(network),
  getAvailableNetworks: jest.fn(),
  switchNetwork: jest.fn(),
  getNetworkConfig: jest.fn(),
  isNetworkAvailable: jest.fn(),
});

/**
 * Creates mock HederaMirrornodeService with getAccount method
 */
export const makeMirrorNodeMock = (
  overrides?: Partial<jest.Mocked<HederaMirrornodeService>>,
): Partial<HederaMirrornodeService> => ({
  getAccount: jest.fn().mockResolvedValue(mockMirrorAccountData.default),
  ...overrides,
});

/**
 * Creates mock ZustandAccountStateHelper methods
 */
export const makeAccountStateHelperMock = (overrides?: {
  loadAccount?: jest.Mock;
  saveAccount?: jest.Mock;
  deleteAccount?: jest.Mock;
  listAccounts?: jest.Mock;
  clearAccounts?: jest.Mock;
  hasAccount?: jest.Mock;
}) => ({
  loadAccount: jest.fn(),
  saveAccount: jest.fn(),
  deleteAccount: jest.fn(),
  listAccounts: jest.fn().mockReturnValue([]),
  clearAccounts: jest.fn(),
  hasAccount: jest.fn().mockReturnValue(false),
  ...overrides,
});

/**
 * Creates CommandHandlerArgs for testing command handlers
 */
export const makeArgs = (
  api: Partial<CoreAPI>,
  logger: jest.Mocked<Logger>,
  args: Record<string, unknown>,
): CommandHandlerArgs => ({
  api: api as CoreAPI,
  logger,
  state: {} as any,
  config: {} as any,
  args,
});
