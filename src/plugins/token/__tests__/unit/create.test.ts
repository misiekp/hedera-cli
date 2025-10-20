/**
 * Token Create Handler Unit Tests
 * Tests the token creation functionality of the token plugin
 */
import type { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { createTokenHandler } from '../../commands/create';
import { ZustandTokenStateHelper } from '../../zustand-state-helper';
import type { TransactionResult } from '../../../../core/services/tx-execution/tx-execution-service.interface';
import {
  makeLogger,
  makeApiMocks,
  mockProcessExit,
  makeTransactionResult,
} from './helpers/mocks';
import {
  mockAccountIds,
  mockTransactions,
  makeTokenCreateCommandArgs,
  expectedTokenTransactionParams,
} from './helpers/fixtures';

jest.mock('../../zustand-state-helper', () => ({
  ZustandTokenStateHelper: jest.fn(),
}));

const MockedHelper = ZustandTokenStateHelper as jest.Mock;
const { setupExit, cleanupExit, getExitSpy } = mockProcessExit();

describe('createTokenHandler', () => {
  beforeEach(() => {
    setupExit();
    MockedHelper.mockClear();
    MockedHelper.mockImplementation(() => ({
      saveToken: jest.fn().mockResolvedValue(undefined),
    }));
  });

  afterEach(() => {
    cleanupExit();
  });

  describe('success scenarios', () => {
    test('should create token with valid parameters', async () => {
      // Arrange
      const mockSaveToken = jest.fn();
      const mockSignResult = makeTransactionResult({
        tokenId: mockAccountIds.treasury,
      });

      MockedHelper.mockImplementation(() => ({
        saveToken: mockSaveToken,
      }));

      const { api, tokenTransactions, signing, kms } =
        makeApiMocks({
          tokenTransactions: {
            createTokenTransaction: jest
              .fn()
              .mockReturnValue(mockTransactions.token),
          },
          signing: {
            signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
          },
          kms: {
            getDefaultOperator: jest.fn().mockReturnValue({
              accountId: mockAccountIds.operator,
              keyRefId: 'operator-key-ref-id',
            }),
            getPublicKey: jest.fn().mockReturnValue('operator-public-key'),
            importPrivateKey: jest.fn().mockReturnValue({
              keyRefId: 'treasury-key-ref-id',
              publicKey: 'treasury-public-key',
            }),
          },
          alias: {
            resolve: jest.fn().mockImplementation((alias, type) => {
              // Mock key alias resolution for test keys
              if (type === 'key' && alias === 'test-admin-key') {
                return {
                  keyRefId: 'admin-key-ref-id',
                  publicKey: 'test-admin-key',
                };
              }
              return null;
            }),
          },
        });

      const logger = makeLogger();
      const args = makeTokenCreateCommandArgs({ api, logger });

      // Act
      await createTokenHandler(args);

      // Assert
      expect(kms.importPrivateKey).toHaveBeenCalledWith('test-private-key');
      expect(tokenTransactions.createTokenTransaction).toHaveBeenCalledWith(
        expectedTokenTransactionParams,
      );
      expect(signing.signAndExecuteWith).toHaveBeenCalledWith(
        mockTransactions.token,
        { keyRefId: 'treasury-key-ref-id' },
      );
      expect(mockSaveToken).toHaveBeenCalled();
      expect(getExitSpy()).toHaveBeenCalledWith(0);
    });

    test('should use default credentials when treasury not provided', async () => {
      // Arrange
      const mockSaveToken = jest.fn();
      const mockSignResult = makeTransactionResult({
        tokenId: mockAccountIds.treasury,
      });

      MockedHelper.mockImplementation(() => ({
        saveToken: mockSaveToken,
      }));

      const { api, tokenTransactions, signing, kms } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockReturnValue(mockTransactions.token),
        },
        signing: {
          signAndExecute: jest.fn().mockResolvedValue(mockSignResult),
        },
        kms: {
          getDefaultOperator: jest.fn().mockReturnValue({
            accountId: '0.0.100000',
            keyRefId: 'operator-key-ref-id',
          }),
          getPublicKey: jest.fn().mockReturnValue('operator-public-key'),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenHandler(args);

      // Assert
      expect(kms.getDefaultOperator).toHaveBeenCalled();
      expect(tokenTransactions.createTokenTransaction).toHaveBeenCalledWith({
        name: 'TestToken',
        symbol: 'TEST',
        decimals: 0,
        initialSupply: 1000000,
        supplyType: 'INFINITE',
        maxSupply: undefined,
        treasuryId: '0.0.100000',
        adminKey: 'operator-public-key',
      });
      expect(signing.signAndExecute).toHaveBeenCalledWith(
        mockTransactions.token,
      );
      expect(mockSaveToken).toHaveBeenCalled();
      expect(getExitSpy()).toHaveBeenCalledWith(0);
    });
  });

  describe('validation scenarios', () => {
    test('should exit with error for invalid parameters', async () => {
      // Arrange
      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: '', // Invalid: empty name
          symbol: 'TEST',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenHandler(args);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Invalid command parameters:',
      );
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });

    test('should exit with error when no credentials found', async () => {
      // Arrange
      const { api } = makeApiMocks({
        kms: {
          getDefaultOperator: jest.fn().mockReturnValue(null),
          ensureDefaultFromEnv: jest.fn().mockReturnValue(null),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenHandler(args);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to create token:'),
      );
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });
  });

  describe('error scenarios', () => {
    test('should handle transaction failure', async () => {
      // Arrange
      const mockSaveToken = jest.fn();
      const mockTokenTransaction = { test: 'transaction' };
      const mockSignResult = {
        success: true, // Success but no tokenId - this triggers the error
        transactionId: '0.0.123@1234567890.123456789',
        // tokenId is missing - this should trigger the error path
        receipt: {
          status: {
            status: 'success',
            transactionId: '0.0.123@1234567890.123456789',
          },
        },
      };

      MockedHelper.mockImplementation(() => ({
        saveToken: mockSaveToken,
      }));

      const { api } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockReturnValue(mockTokenTransaction),
        },
        signing: {
          signAndExecute: jest
            .fn()
            .mockResolvedValue(mockSignResult as TransactionResult),
        },
        kms: {
          getDefaultOperator: jest.fn().mockReturnValue({
            accountId: '0.0.100000',
            keyRefId: 'operator-key-ref-id',
          }),
          getPublicKey: jest.fn().mockReturnValue('operator-public-key'),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          adminKey: 'test-admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenHandler(args);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to create token:'),
      );
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });

    test('should handle token transaction service error', async () => {
      // Arrange
      const { api } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest.fn().mockImplementation(() => {
            throw new Error('Service error');
          }),
        },
        kms: {
          getDefaultOperator: jest.fn().mockReturnValue({
            accountId: '0.0.100000',
            keyRefId: 'operator-key-ref-id',
          }),
          getPublicKey: jest.fn().mockReturnValue('operator-public-key'),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          adminKey: 'test-admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenHandler(args);

      // Assert
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });
  });

  describe('state management', () => {
    test('should initialize token state helper', async () => {
      // Arrange
      const mockSaveToken = jest.fn();
      const mockTokenTransaction = { test: 'transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        tokenId: '0.0.123456',
        receipt: {
          status: {
            status: 'success',
            transactionId: '0.0.123@1234567890.123456789',
          },
        },
      };

      MockedHelper.mockImplementation(() => ({
        saveToken: mockSaveToken,
      }));

      const { api } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockReturnValue(mockTokenTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        kms: {
          getDefaultOperator: jest.fn().mockReturnValue({
            accountId: '0.0.100000',
            keyRefId: 'operator-key-ref-id',
          }),
          getPublicKey: jest.fn().mockReturnValue('operator-public-key'),
        },
        alias: {
          resolve: jest.fn().mockImplementation((alias, type) => {
            // Mock key alias resolution for test keys
            if (type === 'key' && alias === 'test-admin-key') {
              return {
                keyRefId: 'admin-key-ref-id',
                publicKey: 'test-admin-key',
              };
            }
            return null;
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          adminKey: 'test-admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenHandler(args);

      // Assert
      expect(MockedHelper).toHaveBeenCalledWith(api.state, logger);
      expect(mockSaveToken).toHaveBeenCalled();
      expect(getExitSpy()).toHaveBeenCalledWith(0);
    });
  });
});
