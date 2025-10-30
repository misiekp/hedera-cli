/**
 * Token Transfer Handler Unit Tests
 * Tests the token transfer functionality of the token plugin
 */
import type { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { transferToken } from '../../commands/transfer';
import type { TransferTokenOutput } from '../../commands/transfer';
import type { TransactionResult } from '../../../../core/services/tx-execution/tx-execution-service.interface';
import { makeLogger, makeApiMocks } from './helpers/mocks';

describe('transferTokenHandler', () => {
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
        kms,
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
        kms: {
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

      // Act
      const result = await transferToken(args);

      // Assert - ADR-003 compliance: check CommandExecutionResult
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.outputJson).toBeDefined();

      const output = JSON.parse(result.outputJson!) as TransferTokenOutput;
      expect(output.tokenId).toBe('0.0.123456');
      expect(output.from).toBe('0.0.345678');
      expect(output.to).toBe('0.0.789012');
      expect(output.amount).toBe('100');
      expect(output.transactionId).toBe('0.0.123@1234567890.123456789');

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
      expect(kms.importPrivateKey).toHaveBeenCalledWith('test-from-key');
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
        kms: _kms,
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
        kms: {
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

      // Act
      const result = await transferToken(args);

      // Assert - ADR-003 compliance: check CommandExecutionResult
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.outputJson).toBeDefined();

      const output = JSON.parse(result.outputJson!) as TransferTokenOutput;
      expect(output.tokenId).toBe('0.0.123456');
      expect(output.from).toBe('0.0.345678');
      expect(output.to).toBe('0.0.789012');
      expect(output.amount).toBe('100');
      expect(output.transactionId).toBe('0.0.123@1234567890.123456789');

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
        kms: _kms,
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
        kms: {
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

      // Act
      const result = await transferToken(args);

      // Assert - ADR-003 compliance: check CommandExecutionResult
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.outputJson).toBeDefined();
      expect(result.errorMessage).toBeUndefined();

      // Verify the transfer succeeded
      const output = JSON.parse(result.outputJson!);
      expect(output.tokenId).toBe('0.0.123456');
      expect(output.to).toBe('0.0.789012');

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
          token: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678:test-from-key',
          balance: 0, // Zero amount - should fail validation
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      const result = await transferToken(args);

      // Assert - ADR-003 compliance: check CommandExecutionResult
      expect(result).toBeDefined();
      expect(result.status).toBe('failure');
      expect(result.errorMessage).toBeDefined();
      expect(result.errorMessage).toContain('Invalid command parameters');
      expect(result.outputJson).toBeUndefined();
    });
  });

  describe('validation scenarios', () => {
    test('should handle missing from parameter (uses default operator)', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer-transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        kms: _kms,
      } = makeApiMocks({
        tokenTransactions: {
          createTransferTransaction: jest
            .fn()
            .mockReturnValue(mockTransferTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        kms: {
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
          balance: 100,
          // from missing - should use default operator
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      const result = await transferToken(args);

      // Assert - ADR-003 compliance: check CommandExecutionResult
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.outputJson).toBeDefined();
      expect(result.errorMessage).toBeUndefined();

      // Verify the transfer succeeded
      const output = JSON.parse(result.outputJson!);
      expect(output.tokenId).toBe('0.0.123456');
      expect(output.to).toBe('0.0.789012');
    });

    test('should throw error when to parameter is missing', async () => {
      // Arrange
      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          from: '0.0.345678:test-from-key',
          balance: 100,
          // to missing
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      const result = await transferToken(args);

      // Assert - ADR-003 compliance: check CommandExecutionResult
      expect(result).toBeDefined();
      expect(result.status).toBe('failure');
      expect(result.errorMessage).toBeDefined();
      expect(result.outputJson).toBeUndefined();
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

      // Act
      const result = await transferToken(args);

      // Assert - ADR-003 compliance: check CommandExecutionResult
      expect(result).toBeDefined();
      expect(result.status).toBe('failure');
      expect(result.errorMessage).toBeDefined();
      expect(result.outputJson).toBeUndefined();
    });

    test('should handle negative amount gracefully', async () => {
      // Arrange
      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678:test-from-key',
          balance: -50, // Negative amount
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      const result = await transferToken(args);

      // Assert - ADR-003 compliance: check CommandExecutionResult
      expect(result).toBeDefined();
      expect(result.status).toBe('failure');
      expect(result.errorMessage).toBeDefined();
      expect(result.outputJson).toBeUndefined();
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
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        kms: _kms,
      } = makeApiMocks({
        tokenTransactions: {
          createTransferTransaction: jest
            .fn()
            .mockResolvedValue(mockTransferTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        kms: {
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

      // Act
      const result = await transferToken(args);

      // Assert - ADR-003 compliance: check CommandExecutionResult
      expect(result).toBeDefined();
      expect(result.status).toBe('failure');
      expect(result.errorMessage).toBeDefined();
      expect(result.outputJson).toBeUndefined();
    });

    test('should handle token transaction service error', async () => {
      // Arrange
      const {
        api,
        tokens: _tokens,
        kms: _kms,
      } = makeApiMocks({
        tokens: {
          createTransferTransaction: jest.fn().mockImplementation(() => {
            throw new Error('Network error');
          }),
        },
        kms: {
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

      // Act
      const result = await transferToken(args);

      // Assert - ADR-003 compliance: check CommandExecutionResult
      expect(result).toBeDefined();
      expect(result.status).toBe('failure');
      expect(result.errorMessage).toBeDefined();
      expect(result.errorMessage).toContain('Network error');
      expect(result.outputJson).toBeUndefined();
    });

    test('should handle signing service error', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer-transaction' };

      const {
        api,
        tokens: _tokens,
        signing: _signing,
        kms: _kms,
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
        kms: {
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

      // Act
      const result = await transferToken(args);

      // Assert - ADR-003 compliance: check CommandExecutionResult
      expect(result).toBeDefined();
      expect(result.status).toBe('failure');
      expect(result.errorMessage).toBeDefined();
      expect(result.errorMessage).toContain('Invalid key');
      expect(result.outputJson).toBeUndefined();
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
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        kms: _kms,
      } = makeApiMocks({
        tokenTransactions: {
          createTransferTransaction: jest
            .fn()
            .mockReturnValue(mockTransferTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        kms: {
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

      // Act
      const result = await transferToken(args);

      // Assert - ADR-003 compliance: check CommandExecutionResult
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.outputJson).toBeDefined();
      expect(result.errorMessage).toBeUndefined();

      // Verify the transfer succeeded
      const output = JSON.parse(result.outputJson!);
      expect(output.tokenId).toBe('0.0.123456');
      expect(output.to).toBe('0.0.789012');

      expect(_tokenTransactions.createTransferTransaction).toHaveBeenCalledWith(
        {
          tokenId: '0.0.123456',
          fromAccountId: '0.0.345678',
          toAccountId: '0.0.789012',
          amount: 999999999,
        },
      );
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
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        kms: _kms,
      } = makeApiMocks({
        tokenTransactions: {
          createTransferTransaction: jest
            .fn()
            .mockReturnValue(mockTransferTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        kms: {
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

      // Act
      const result = await transferToken(args);

      // Assert - ADR-003 compliance: check CommandExecutionResult
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.outputJson).toBeDefined();
      expect(result.errorMessage).toBeUndefined();

      // Verify the transfer succeeded
      const output = JSON.parse(result.outputJson!);
      expect(output.tokenId).toBe('0.0.123456');
      expect(output.to).toBe('0.0.789012');
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
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        kms: _kms,
      } = makeApiMocks({
        tokenTransactions: {
          createTransferTransaction: jest
            .fn()
            .mockReturnValue(mockTransferTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        kms: {
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

      // Act
      const result = await transferToken(args);

      // Assert - ADR-003 compliance: check CommandExecutionResult
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.outputJson).toBeDefined();
      expect(result.errorMessage).toBeUndefined();

      // Verify the transfer succeeded
      const output = JSON.parse(result.outputJson!);
      expect(output.tokenId).toBe('0.0.123456');
      expect(output.to).toBe('0.0.345678');

      expect(_tokenTransactions.createTransferTransaction).toHaveBeenCalledWith(
        {
          tokenId: '0.0.123456',
          fromAccountId: '0.0.345678',
          toAccountId: '0.0.345678',
          amount: 100,
        },
      );
    });

    test('should handle decimal amounts', async () => {
      // Arrange
      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          to: '0.0.789012',
          from: '0.0.345678:test-from-key',
          balance: 100.5, // Decimal amount - should be rejected
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      const result = await transferToken(args);

      // Assert - ADR-003 compliance: check CommandExecutionResult
      expect(result).toBeDefined();
      expect(result.status).toBe('failure');
      expect(result.errorMessage).toBeDefined();
      expect(result.errorMessage).toContain('cannot be converted to a BigInt');
      expect(result.outputJson).toBeUndefined();
    });
  });
});
