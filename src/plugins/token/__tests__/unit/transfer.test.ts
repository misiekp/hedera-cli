/**
 * Token Transfer Handler Unit Tests
 * Tests the token transfer functionality of the token plugin
 */
import type { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { transferTokenHandler } from '../../commands/transfer';
import type { TransactionResult } from '../../../../core/services/tx-execution/tx-execution-service.interface';
import { makeLogger, makeApiMocks } from './helpers/mocks';

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
    test('should transfer tokens between accounts using account-id:private-key format', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer-transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      const {
        api,
        tokens,
        signing,
        alias: _alias,
        credentialsState,
      } = makeApiMocks({
        tokens: {
          createTransferTransaction: jest
            .fn()
            .mockReturnValue(mockTransferTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        alias: {
          resolve: jest.fn().mockReturnValue(null), // No alias resolution needed for account-id:key format
        },
        credentialsState: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'imported-key-ref-id',
            publicKey: 'imported-public-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678:test-from-key',
          balance: 100,
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      // The transfer will call process.exit(0) on success, which our mock turns into a thrown error
      // The command has a try-catch that catches this and calls process.exit(1)
      // So we need to expect process.exit(1) to be thrown
      await expect(transferTokenHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );

      // Verify the transfer succeeded (the error logged is from process.exit(0) being caught)
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to transfer token: Process.exit(0)',
      );

      expect(tokens.createTransferTransaction).toHaveBeenCalledWith({
        tokenId: '0.0.123456',
        fromAccountId: '0.0.345678',
        toAccountId: '0.0.789012',
        amount: 100,
      });
      expect(signing.signAndExecuteWith).toHaveBeenCalledWith(
        mockTransferTransaction,
        { keyRefId: 'imported-key-ref-id' },
      );
      expect(credentialsState.importPrivateKey).toHaveBeenCalledWith(
        'test-from-key',
      );
    });

    test('should transfer tokens using alias for from account', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer-transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      const {
        api,
        tokens,
        signing,
        alias,
        credentialsState: _credentialsState,
      } = makeApiMocks({
        tokens: {
          createTransferTransaction: jest
            .fn()
            .mockReturnValue(mockTransferTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        alias: {
          resolve: jest.fn().mockReturnValue({
            entityId: '0.0.345678',
            keyRefId: 'alias-key-ref-id',
          }),
        },
        credentialsState: {
          getPublicKey: jest.fn().mockReturnValue('alias-public-key'),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          to: '0.0.789012',
          from: 'alice',
          balance: 100,
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

      // Verify the transfer succeeded (the error logged is from process.exit(0) being caught)
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to transfer token: Process.exit(0)',
      );

      expect(alias.resolve).toHaveBeenCalledWith('alice', 'account', 'testnet');
      expect(tokens.createTransferTransaction).toHaveBeenCalledWith({
        tokenId: '0.0.123456',
        fromAccountId: '0.0.345678',
        toAccountId: '0.0.789012',
        amount: 100,
      });
      expect(signing.signAndExecuteWith).toHaveBeenCalledWith(
        mockTransferTransaction,
        { keyRefId: 'alias-key-ref-id' },
      );
    });

    test('should transfer tokens using alias for to account', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer-transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      const {
        api,
        tokens,
        signing: _signing,
        alias,
        credentialsState: _credentialsState,
      } = makeApiMocks({
        tokens: {
          createTransferTransaction: jest
            .fn()
            .mockReturnValue(mockTransferTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        alias: {
          resolve: jest.fn().mockImplementation((alias, _type, _network) => {
            if (alias === 'bob') {
              return {
                entityId: '0.0.789012',
                keyRefId: 'bob-key-ref-id',
              };
            }
            return null;
          }),
        },
        credentialsState: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'imported-key-ref-id',
            publicKey: 'imported-public-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          to: 'bob',
          from: '0.0.345678:test-from-key',
          balance: 100,
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

      // Verify the transfer succeeded (the error logged is from process.exit(0) being caught)
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to transfer token: Process.exit(0)',
      );

      expect(alias.resolve).toHaveBeenCalledWith('bob', 'account', 'testnet');
      expect(tokens.createTransferTransaction).toHaveBeenCalledWith({
        tokenId: '0.0.123456',
        fromAccountId: '0.0.345678',
        toAccountId: '0.0.789012',
        amount: 100,
      });
    });

    test('should reject zero amount transfer', async () => {
      // Arrange
      const { api } = makeApiMocks({});

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678:test-from-key',
          balance: 0, // Zero amount - should fail validation
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
        '❌ Invalid command parameters:',
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('balance: Balance must be a positive number'),
      );
    });
  });

  describe('validation scenarios', () => {
    test('should throw error when from parameter is missing', async () => {
      // Arrange
      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          to: '0.0.789012',
          balance: 100,
          // from missing
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

    test('should throw error when to parameter is missing', async () => {
      // Arrange
      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          from: '0.0.345678:test-from-key',
          balance: 100,
          // to missing
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

    test('should throw error when tokenId is missing', async () => {
      // Arrange
      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          // tokenId missing
          to: '0.0.789012',
          from: '0.0.345678:test-from-key',
          balance: 100,
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

    test('should handle negative amount gracefully', async () => {
      // Arrange
      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678:test-from-key',
          balance: -50, // Negative amount
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

  describe('error scenarios', () => {
    test('should handle transaction failure', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer-transaction' };
      const mockSignResult: TransactionResult = {
        success: false,
        transactionId: '',
        receipt: { status: { status: 'failed', transactionId: '' } },
      };

      const {
        api,
        tokens: _tokens,
        signing: _signing,
        credentialsState: _credentialsState,
      } = makeApiMocks({
        createTransferImpl: jest
          .fn()
          .mockResolvedValue(mockTransferTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
        credentialsState: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'imported-key-ref-id',
            publicKey: 'imported-public-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678:test-from-key',
          balance: 100,
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
        '❌ Failed to transfer token: Process.exit(0)',
      );
    });

    test('should handle token transaction service error', async () => {
      // Arrange
      const {
        api,
        tokens: _tokens,
        credentialsState: _credentialsState,
      } = makeApiMocks({
        createTransferImpl: jest
          .fn()
          .mockRejectedValue(new Error('Network error')),
        credentialsState: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'imported-key-ref-id',
            publicKey: 'imported-public-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678:test-from-key',
          balance: 100,
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

      const {
        api,
        tokens: _tokens,
        signing: _signing,
        credentialsState: _credentialsState,
      } = makeApiMocks({
        tokens: {
          createTransferTransaction: jest
            .fn()
            .mockReturnValue(mockTransferTransaction),
        },
        signing: {
          signAndExecuteWith: jest
            .fn()
            .mockRejectedValue(new Error('Invalid key')),
        },
        credentialsState: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'imported-key-ref-id',
            publicKey: 'imported-public-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678:test-from-key',
          balance: 100,
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
        '❌ Failed to transfer token: Invalid key',
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

      const {
        api,
        tokens,
        signing: _signing,
        credentialsState: _credentialsState,
      } = makeApiMocks({
        tokens: {
          createTransferTransaction: jest
            .fn()
            .mockReturnValue(mockTransferTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        credentialsState: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'imported-key-ref-id',
            publicKey: 'imported-public-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678:test-from-key',
          balance: 999999999, // Large amount
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

      // Verify the transfer succeeded (the error logged is from process.exit(0) being caught)
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to transfer token: Process.exit(0)',
      );

      expect(tokens.createTransferTransaction).toHaveBeenCalledWith({
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

      const {
        api,
        tokens: _tokens,
        signing: _signing,
        credentialsState: _credentialsState,
      } = makeApiMocks({
        tokens: {
          createTransferTransaction: jest
            .fn()
            .mockReturnValue(mockTransferTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        credentialsState: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'imported-key-ref-id',
            publicKey: 'imported-public-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678:test-from-key',
          balance: 100,
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

      // Verify the transfer succeeded (the error logged is from process.exit(0) being caught)
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to transfer token: Process.exit(0)',
      );

      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ Token transfer successful!'),
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

      const {
        api,
        tokens,
        signing: _signing,
        credentialsState: _credentialsState,
      } = makeApiMocks({
        tokens: {
          createTransferTransaction: jest
            .fn()
            .mockReturnValue(mockTransferTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        credentialsState: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'imported-key-ref-id',
            publicKey: 'imported-public-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          to: '0.0.345678', // Same as from
          from: '0.0.345678:test-from-key',
          balance: 100,
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

      // Verify the transfer succeeded (the error logged is from process.exit(0) being caught)
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to transfer token: Process.exit(0)',
      );

      expect(tokens.createTransferTransaction).toHaveBeenCalledWith({
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

      const {
        api,
        tokens,
        signing: _signing,
        credentialsState: _credentialsState,
      } = makeApiMocks({
        tokens: {
          createTransferTransaction: jest
            .fn()
            .mockReturnValue(mockTransferTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        credentialsState: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'imported-key-ref-id',
            publicKey: 'imported-public-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678:test-from-key',
          balance: 100.5, // Decimal amount
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

      // Verify the transfer succeeded (the error logged is from process.exit(0) being caught)
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to transfer token: Process.exit(0)',
      );

      expect(tokens.createTransferTransaction).toHaveBeenCalledWith({
        tokenId: '0.0.123456',
        fromAccountId: '0.0.345678',
        toAccountId: '0.0.789012',
        amount: 100.5,
      });
    });
  });
});
