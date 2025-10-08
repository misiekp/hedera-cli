/**
 * Token Create Handler Unit Tests
 * Tests the token creation functionality of the token plugin
 */
import type { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { createTokenHandler } from '../../commands/create';
import { ZustandTokenStateHelper } from '../../zustand-state-helper';
import type { TransactionResult } from '../../../../core/services/signing/signing-service.interface';
import {
  makeLogger,
  makeApiMocks,
  mockProcessExit,
  makeTransactionResult,
} from './helpers/mocks';
import {
  mockCredentials,
  mockAccountIds,
  mockKeys,
  mockTransactions,
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

      const { api, tokenTransactions, signing, credentials } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockResolvedValue(mockTransactions.token),
        },
        signing: {
          signAndExecuteWithKey: jest.fn().mockResolvedValue(mockSignResult),
        },
        credentials: {
          getDefaultCredentials: jest.fn().mockResolvedValue({
            accountId: mockAccountIds.treasury,
            privateKey: 'different-private-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          decimals: 2,
          initialSupply: 1000,
          supplyType: 'INFINITE',
          treasuryId: '0.0.123456',
          treasuryKey: 'test-private-key',
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
      expect(tokenTransactions.createTokenTransaction).toHaveBeenCalledWith({
        name: 'TestToken',
        symbol: 'TEST',
        decimals: 2,
        initialSupply: 1000,
        supplyType: 'INFINITE',
        maxSupply: undefined,
        treasuryId: mockAccountIds.treasury,
        treasuryKey: 'test-private-key',
        adminKey: 'test-admin-key',
      });
      expect(signing.signAndExecuteWithKey).toHaveBeenCalledWith(
        mockTransactions.token,
        'test-private-key',
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

      const { api, tokenTransactions, signing, credentials } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockResolvedValue(mockTransactions.token),
        },
        signing: {
          signAndExecute: jest.fn().mockResolvedValue(mockSignResult),
        },
        credentials: {
          getDefaultCredentials: jest.fn().mockResolvedValue({
            accountId: '0.0.789012',
            privateKey: mockKeys.operator,
          }),
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
      expect(credentials.getDefaultCredentials).toHaveBeenCalled();
      expect(tokenTransactions.createTokenTransaction).toHaveBeenCalledWith({
        name: 'TestToken',
        symbol: 'TEST',
        decimals: 0,
        initialSupply: 1000000,
        supplyType: 'INFINITE',
        maxSupply: undefined,
        treasuryId: '0.0.789012',
        treasuryKey: mockKeys.operator,
        adminKey: mockKeys.operator,
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

    test('should throw error when no credentials found', async () => {
      // Arrange
      const { api, credentials } = makeApiMocks({
        credentials: {
          getDefaultCredentials: jest.fn().mockResolvedValue(null),
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

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow(
        'No credentials found. Please set up your Hedera account credentials.',
      );
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

      const { api, tokenTransactions, signing, credentials } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockResolvedValue(mockTokenTransaction),
        },
        signing: {
          signAndExecute: jest
            .fn()
            .mockResolvedValue(mockSignResult as TransactionResult),
        },
        credentials: {
          getDefaultCredentials: jest.fn().mockResolvedValue({
            accountId: '0.0.123456',
            privateKey: 'test-private-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-private-key',
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
      const { api, tokenTransactions, credentials } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockRejectedValue(new Error('Service error')),
        },
        credentials: {
          getDefaultCredentials: jest.fn().mockResolvedValue({
            accountId: '0.0.123456',
            privateKey: 'test-private-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-private-key',
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

      const { api, credentials } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockResolvedValue(mockTokenTransaction),
        },
        signing: {
          signAndExecuteWithKey: jest.fn().mockResolvedValue(mockSignResult),
        },
        credentials: {
          getDefaultCredentials: jest.fn().mockResolvedValue({
            accountId: '0.0.123456',
            privateKey: 'test-private-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-private-key',
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
