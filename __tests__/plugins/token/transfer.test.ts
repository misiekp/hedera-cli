/**
 * Token Transfer Handler Unit Tests
 * Tests the token transfer functionality of the token plugin
 */
import type { CommandHandlerArgs } from '../../../src/core/plugins/plugin.interface';
import { transferTokenHandler } from '../../../src/plugins/token/commands/transfer';
import { Logger } from '../../../src/core/services/logger/logger-service.interface';
import type { CoreAPI } from '../../../src/core/core-api/core-api.interface';
import type {
  SigningService,
  TransactionResult,
} from '../../../src/core/services/signing/signing-service.interface';
import type { TokenTransactionService } from '../../../src/core/services/tokens/token-transaction-service.interface';
import type { StateService } from '../../../src/core/services/state/state-service.interface';

const makeLogger = (): jest.Mocked<Logger> => ({
  log: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  warn: jest.fn(),
});

const makeApiMocks = ({
  createTransferImpl,
  signAndExecuteImpl,
}: {
  createTransferImpl?: jest.Mock;
  signAndExecuteImpl?: jest.Mock;
}) => {
  const tokenTransactions: jest.Mocked<TokenTransactionService> = {
    createTokenTransaction: jest.fn(),
    createTokenAssociationTransaction: jest.fn(),
    createTransferTransaction: createTransferImpl || jest.fn(),
  };

  const signing: jest.Mocked<SigningService> = {
    signAndExecute: jest.fn(),
    signAndExecuteWithKey: signAndExecuteImpl || jest.fn(),
    signWithKey: jest.fn(),
    sign: jest.fn(),
    execute: jest.fn(),
    getStatus: jest.fn(),
  };

  const state: jest.Mocked<StateService> = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    list: jest.fn(),
    clear: jest.fn(),
    has: jest.fn(),
    getNamespaces: jest.fn(),
    getKeys: jest.fn(),
    subscribe: jest.fn(),
    getActions: jest.fn(),
    getState: jest.fn(),
  };

  const api: jest.Mocked<CoreAPI> = {
    accountTransactions: {} as any,
    tokenTransactions,
    signing,
    credentials: {} as any,
    state,
    mirror: {} as any,
    network: {} as any,
    config: {} as any,
    logger: {} as any,
  };

  return { api, tokenTransactions, signing, state };
};

let exitSpy: jest.SpyInstance;

describe('transferTokenHandler', () => {
  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process.exit(${code})`);
    });
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  describe('success scenarios', () => {
    test('should transfer tokens between accounts using provided key', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer-transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      const { api, tokenTransactions, signing } = makeApiMocks({
        createTransferImpl: jest
          .fn()
          .mockResolvedValue(mockTransferTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678',
          balance: 100,
          fromKey: 'test-from-key',
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

      expect(tokenTransactions.createTransferTransaction).toHaveBeenCalledWith({
        tokenId: '0.0.123456',
        fromAccountId: '0.0.345678',
        toAccountId: '0.0.789012',
        amount: 100,
      });
      expect(signing.signAndExecuteWithKey).toHaveBeenCalledWith(
        mockTransferTransaction,
        'test-from-key',
      );
    });

    test('should handle zero amount transfer', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer-transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      const { api, tokenTransactions, signing } = makeApiMocks({
        createTransferImpl: jest
          .fn()
          .mockResolvedValue(mockTransferTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678',
          balance: 0,
          fromKey: 'test-from-key',
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

      expect(tokenTransactions.createTransferTransaction).toHaveBeenCalledWith({
        tokenId: '0.0.123456',
        fromAccountId: '0.0.345678',
        toAccountId: '0.0.789012',
        amount: 0,
      });
    });
  });

  describe('validation scenarios', () => {
    test('should throw error when fromKey is missing', async () => {
      // Arrange
      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678',
          balance: 100,
          // fromKey missing
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(transferTokenHandler(args)).rejects.toThrow(
        'From account key is required for token transfer',
      );
    });

    test('should throw error when required parameters are missing', async () => {
      // Arrange
      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          // tokenId missing
          to: '0.0.789012',
          from: '0.0.345678',
          balance: 100,
          fromKey: 'test-from-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(transferTokenHandler(args)).rejects.toThrow();
    });

    test('should handle negative amount gracefully', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer-transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      const { api, tokenTransactions, signing } = makeApiMocks({
        createTransferImpl: jest
          .fn()
          .mockResolvedValue(mockTransferTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678',
          balance: -50, // Negative amount
          fromKey: 'test-from-key',
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

      expect(tokenTransactions.createTransferTransaction).toHaveBeenCalledWith({
        tokenId: '0.0.123456',
        fromAccountId: '0.0.345678',
        toAccountId: '0.0.789012',
        amount: -50,
      });
    });
  });

  describe('error scenarios', () => {
    test('should handle transaction failure', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer-transaction' };
      const mockSignResult: TransactionResult = {
        success: false,
        transactionId: '',
        receipt: { status: { status: 'failed', transactionId: '' } },
      };

      const { api, tokenTransactions, signing } = makeApiMocks({
        createTransferImpl: jest
          .fn()
          .mockResolvedValue(mockTransferTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678',
          balance: 100,
          fromKey: 'test-from-key',
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

    test('should handle token transaction service error', async () => {
      // Arrange
      const { api, tokenTransactions } = makeApiMocks({
        createTransferImpl: jest
          .fn()
          .mockRejectedValue(new Error('Network error')),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678',
          balance: 100,
          fromKey: 'test-from-key',
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

    test('should handle signing service error', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer-transaction' };

      const { api, tokenTransactions, signing } = makeApiMocks({
        createTransferImpl: jest
          .fn()
          .mockResolvedValue(mockTransferTransaction),
        signAndExecuteImpl: jest
          .fn()
          .mockRejectedValue(new Error('Invalid key')),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678',
          balance: 100,
          fromKey: 'test-from-key',
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

    test('should handle large amount transfers', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer-transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      const { api, tokenTransactions, signing } = makeApiMocks({
        createTransferImpl: jest
          .fn()
          .mockResolvedValue(mockTransferTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678',
          balance: 999999999, // Large amount
          fromKey: 'test-from-key',
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

      expect(tokenTransactions.createTransferTransaction).toHaveBeenCalledWith({
        tokenId: '0.0.123456',
        fromAccountId: '0.0.345678',
        toAccountId: '0.0.789012',
        amount: 999999999,
      });
    });
  });

  describe('logging and debugging', () => {
    test('should log transfer details', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer-transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      const { api, tokenTransactions, signing } = makeApiMocks({
        createTransferImpl: jest
          .fn()
          .mockResolvedValue(mockTransferTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678',
          balance: 100,
          fromKey: 'test-from-key',
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

  describe('edge cases', () => {
    test('should handle same from and to account', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer-transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      const { api, tokenTransactions, signing } = makeApiMocks({
        createTransferImpl: jest
          .fn()
          .mockResolvedValue(mockTransferTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          to: '0.0.345678', // Same as from
          from: '0.0.345678',
          balance: 100,
          fromKey: 'test-from-key',
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

      expect(tokenTransactions.createTransferTransaction).toHaveBeenCalledWith({
        tokenId: '0.0.123456',
        fromAccountId: '0.0.345678',
        toAccountId: '0.0.345678',
        amount: 100,
      });
    });

    test('should handle decimal amounts', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer-transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      const { api, tokenTransactions, signing } = makeApiMocks({
        createTransferImpl: jest
          .fn()
          .mockResolvedValue(mockTransferTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678',
          balance: 100.5, // Decimal amount
          fromKey: 'test-from-key',
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

      expect(tokenTransactions.createTransferTransaction).toHaveBeenCalledWith({
        tokenId: '0.0.123456',
        fromAccountId: '0.0.345678',
        toAccountId: '0.0.789012',
        amount: 100.5,
      });
    });
  });
});
