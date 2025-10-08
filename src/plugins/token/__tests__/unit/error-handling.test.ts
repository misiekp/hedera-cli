/**
 * Token Plugin Error Handling Tests
 * Tests error scenarios and edge cases across the token plugin
 */
import type { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { createTokenHandler } from '../../commands/create';
import { associateTokenHandler } from '../../commands/associate';
import { transferTokenHandler } from '../../commands/transfer';
import { createTokenFromFileHandler } from '../../commands/createFromFile';
import { ZustandTokenStateHelper } from '../../zustand-state-helper';
import type { TransactionResult } from '../../../../core/services/signing/signing-service.interface';
import {
  makeLogger,
  makeApiMocks,
  mockProcessExitThrows,
  mockZustandTokenStateHelper,
} from './helpers/mocks';

jest.mock('../../zustand-state-helper', () => ({
  ZustandTokenStateHelper: jest.fn(),
}));

const MockedHelper = ZustandTokenStateHelper as jest.Mock;
const { setupExit, cleanupExit, getExitSpy } = mockProcessExitThrows();

describe('Token Plugin Error Handling', () => {
  beforeEach(() => {
    setupExit();
    mockZustandTokenStateHelper(MockedHelper);
  });

  afterEach(() => {
    cleanupExit();
  });

  describe('network and connectivity errors', () => {
    test('should handle network timeout during token creation', async () => {
      // Arrange
      const { api, tokenTransactions, credentials } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockRejectedValue(new Error('Network timeout')),
        },
        credentials: {
          getDefaultCredentials: jest.fn().mockResolvedValue({
            accountId: '0.0.123456',
            privateKey: 'test-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-key',
          adminKey: 'admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to create token: Error: Network timeout',
      );
    });

    test('should handle network connectivity issues during association', async () => {
      // Arrange
      const { api, tokenTransactions } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockRejectedValue(new Error('Connection refused')),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          accountId: '0.0.789012',
          accountKey: 'test-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(associateTokenHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
    });

    test('should handle network errors during transfer', async () => {
      // Arrange
      const { api, tokenTransactions } = makeApiMocks({
        tokenTransactions: {
          createTransferTransaction: jest
            .fn()
            .mockRejectedValue(new Error('Network unreachable')),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          from: '0.0.345678',
          to: '0.0.789012',
          balance: 100,
          fromKey: 'test-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(transferTokenHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
    });
  });

  describe('authentication and authorization errors', () => {
    test('should handle invalid credentials', async () => {
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

    test('should handle invalid private key', async () => {
      // Arrange
      const mockTokenTransaction = { test: 'transaction' };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        credentials,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockResolvedValue(mockTokenTransaction),
        },
        signing: {
          signAndExecute: jest.fn().mockResolvedValue({
            success: false,
            transactionId: '',
            receipt: {
              status: {
                status: 'failed',
                transactionId: '',
                error: 'Invalid private key',
              },
            },
          }),
          signAndExecuteWithKey: jest.fn().mockResolvedValue({
            success: false,
            transactionId: '',
            receipt: {
              status: {
                status: 'failed',
                transactionId: '',
                error: 'Invalid private key',
              },
            },
          }),
        },
        credentials: {
          getDefaultCredentials: jest.fn().mockResolvedValue({
            accountId: '0.0.123456',
            privateKey: 'invalid-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          adminKey: 'admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to create token: Error: Token creation failed - no token ID returned',
      );
    });

    test('should handle insufficient permissions', async () => {
      // Arrange
      const mockAssociationTransaction = { test: 'association' };
      const _mockSignResult: TransactionResult = {
        success: false,
        transactionId: '',
        receipt: { status: { status: 'failed', transactionId: '' } },
      };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockResolvedValue(mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWithKey: jest.fn().mockResolvedValue(_mockSignResult),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          accountId: '0.0.789012',
          accountKey: 'insufficient-permissions-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(associateTokenHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to associate token: Error: Token association failed',
      );
    });
  });

  describe('business logic errors', () => {
    test('should handle insufficient token balance', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer' };
      const _mockSignResult: TransactionResult = {
        success: false,
        transactionId: '',
        receipt: { status: { status: 'failed', transactionId: '' } },
      };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTransferTransaction: jest
            .fn()
            .mockResolvedValue(mockTransferTransaction),
        },
        signing: {
          signAndExecuteWithKey: jest.fn().mockResolvedValue(_mockSignResult),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          from: '0.0.345678',
          to: '0.0.789012',
          balance: 1000000, // Large amount
          fromKey: 'test-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(transferTokenHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to transfer token: Error: Token transfer failed',
      );
    });

    test('should handle token not found', async () => {
      // Arrange
      const { api, tokenTransactions } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockRejectedValue(new Error('Token not found')),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.999999', // Non-existent token
          accountId: '0.0.789012',
          accountKey: 'test-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(associateTokenHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
    });

    test('should handle account not found', async () => {
      // Arrange
      const mockAssociationTransaction = { test: 'association' };
      const _mockSignResult: TransactionResult = {
        success: false,
        transactionId: '',
        receipt: { status: { status: 'failed', transactionId: '' } },
      };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockResolvedValue(mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWithKey: jest.fn().mockResolvedValue(_mockSignResult),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          accountId: '0.0.999999', // Non-existent account
          accountKey: 'test-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(associateTokenHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
    });

    test('should handle duplicate token name', async () => {
      // Arrange
      const mockTokenTransaction = { test: 'transaction' };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        credentials,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockResolvedValue(mockTokenTransaction),
        },
        signing: {
          signAndExecute: jest.fn().mockResolvedValue({
            success: false,
            transactionId: '',
            receipt: { status: { status: 'failed', transactionId: '' } },
          }),
          signAndExecuteWithKey: jest.fn().mockResolvedValue({
            success: false,
            transactionId: '',
            receipt: { status: { status: 'failed', transactionId: '' } },
          }),
        },
        credentials: {
          getDefaultCredentials: jest.fn().mockResolvedValue({
            accountId: '0.0.123456',
            privateKey: 'test-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'ExistingToken', // Duplicate name
          symbol: 'TEST',
          adminKey: 'admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to create token: Error: Token creation failed - no token ID returned',
      );
    });
  });

  describe('file system errors', () => {
    test('should handle file not found error', async () => {
      // Arrange
      const { api } = makeApiMocks();
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'nonexistent-file',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenFromFileHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to create token from file:'),
      );
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });

    test('should handle file permission error', async () => {
      // Arrange
      const { api } = makeApiMocks();
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'restricted-file',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenFromFileHandler(args)).rejects.toThrow();
    });

    test('should handle corrupted JSON file', async () => {
      // Arrange
      const { api } = makeApiMocks();
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'corrupted-file',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenFromFileHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to create token from file:'),
      );
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });
  });

  describe('state management errors', () => {
    test('should handle state service failures', async () => {
      // Arrange
      const mockSaveToken = jest.fn().mockImplementation(() => {
        throw new Error('State service unavailable');
      });

      mockZustandTokenStateHelper(MockedHelper, {
        saveToken: mockSaveToken,
      });

      const mockTokenTransaction = { test: 'transaction' };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        credentials,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockResolvedValue(mockTokenTransaction),
        },
        signing: {
          signAndExecute: jest.fn().mockResolvedValue({
            success: true,
            transactionId: '0.0.123@1234567890.123456789',
            tokenId: '0.0.123456',
            receipt: {
              status: {
                status: 'success',
                transactionId: '0.0.123@1234567890.123456789',
              },
            },
          }),
          signAndExecuteWithKey: jest.fn().mockResolvedValue({
            success: true,
            transactionId: '0.0.123@1234567890.123456789',
            tokenId: '0.0.123456',
            receipt: {
              status: {
                status: 'success',
                transactionId: '0.0.123@1234567890.123456789',
              },
            },
          }),
        },
        credentials: {
          getDefaultCredentials: jest.fn().mockResolvedValue({
            accountId: '0.0.123456',
            privateKey: 'test-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-key',
          adminKey: 'admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to create token: Error: State service unavailable',
      );
    });
  });

  describe('rate limiting and throttling', () => {
    test('should handle rate limiting errors', async () => {
      // Arrange
      const { api, tokenTransactions } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockRejectedValue(new Error('Rate limit exceeded')),
        },
        credentials: {
          getDefaultCredentials: jest.fn().mockResolvedValue({
            accountId: '0.0.123456',
            privateKey: 'test-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-key',
          adminKey: 'admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to create token: Error: Rate limit exceeded',
      );
    });

    test('should handle service throttling', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer' };
      const _mockSignResult: TransactionResult = {
        success: false,
        transactionId: '',
        receipt: { status: { status: 'failed', transactionId: '' } },
      };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTransferTransaction: jest
            .fn()
            .mockResolvedValue(mockTransferTransaction),
        },
        signing: {
          signAndExecuteWithKey: jest.fn().mockResolvedValue(_mockSignResult),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          from: '0.0.345678',
          to: '0.0.789012',
          balance: 100,
          fromKey: 'test-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(transferTokenHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to transfer token: Error: Token transfer failed',
      );
    });
  });

  describe('malformed data errors', () => {
    test('should handle malformed transaction responses', async () => {
      // Arrange
      const mockTokenTransaction = { test: 'transaction' };
      const _mockSignResult: TransactionResult = {
        success: true,
        transactionId: 'malformed-transaction-id',
        // tokenId is missing - this is the malformed response
        receipt: {
          status: {
            status: 'success',
            transactionId: 'malformed-transaction-id',
          },
        },
      } as any;

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        credentials,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockResolvedValue(mockTokenTransaction),
        },
        signing: {
          signAndExecute: jest.fn().mockResolvedValue(_mockSignResult),
          signAndExecuteWithKey: jest.fn().mockResolvedValue(_mockSignResult),
        },
        credentials: {
          getDefaultCredentials: jest.fn().mockResolvedValue({
            accountId: '0.0.123456',
            privateKey: 'test-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-key',
          adminKey: 'admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to create token: Error: Token creation failed - no token ID returned',
      );
    });

    test('should handle unexpected API responses', async () => {
      // Arrange
      const { api, tokenTransactions } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockResolvedValue('unexpected-response-type'),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-key',
          adminKey: 'admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow();
    });
  });

  describe('error recovery and resilience', () => {
    test('should handle failures and log appropriate errors', async () => {
      // Arrange
      const mockAssociationTransaction = { test: 'association-transaction' };
      const mockFailureResult: TransactionResult = {
        success: false,
        transactionId: '',
        receipt: { status: { status: 'failed', transactionId: '' } },
      };

      const { api, tokenTransactions, signing } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockResolvedValue(mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWithKey: jest.fn().mockResolvedValue(mockFailureResult),
        },
      });

      const logger = makeLogger();

      // Act - Associate token (should fail)
      const associateArgs: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          accountId: '0.0.345678',
          accountKey: 'user-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(associateTokenHandler(associateArgs)).rejects.toThrow(
        'Process.exit(1)',
      );

      // Assert - Should log appropriate error
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to associate token: Error: Token association failed',
      );
    });
  });
});
