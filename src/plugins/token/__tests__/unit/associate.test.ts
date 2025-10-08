/**
 * Token Associate Handler Unit Tests
 * Tests the token association functionality of the token plugin
 */
import type { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { associateTokenHandler } from '../../commands/associate';
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

describe('associateTokenHandler', () => {
  beforeEach(() => {
    setupExit();
    mockZustandTokenStateHelper(MockedHelper);
  });

  afterEach(() => {
    cleanupExit();
  });

  describe('success scenarios', () => {
    test('should associate token with account using provided key', async () => {
      // Arrange
      const mockAddAssociation = jest.fn();
      const mockAssociationTransaction = { test: 'association-transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      mockZustandTokenStateHelper(MockedHelper, {
        addAssociation: mockAddAssociation,
      });

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing: signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockResolvedValue(mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWithKey: jest.fn().mockResolvedValue(mockSignResult),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          accountId: '0.0.789012',
          accountKey: 'test-account-key',
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

      expect(
        tokenTransactions.createTokenAssociationTransaction,
      ).toHaveBeenCalledWith({
        tokenId: '0.0.123456',
        accountId: '0.0.789012',
      });
      expect(signing.signAndExecuteWithKey).toHaveBeenCalledWith(
        mockAssociationTransaction,
        'test-account-key',
      );
    });

    test('should update token state with association', async () => {
      // Arrange
      const mockAddAssociation = jest.fn();
      const mockAssociationTransaction = { test: 'association-transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      mockZustandTokenStateHelper(MockedHelper, {
        addAssociation: mockAddAssociation,
      });

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing: signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockResolvedValue(mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWithKey: jest.fn().mockResolvedValue(mockSignResult),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          accountId: '0.0.789012',
          accountKey: 'test-account-key',
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
  });

  describe('validation scenarios', () => {
    test('should throw error when account key is missing', async () => {
      // Arrange
      const { api } = makeApiMocks();
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          accountId: '0.0.789012',
          // accountKey missing
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(associateTokenHandler(args)).rejects.toThrow(
        'Account key is required for token association',
      );
    });

    test('should throw error when tokenId is missing', async () => {
      // Arrange
      const { api } = makeApiMocks();
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          // tokenId missing
          accountId: '0.0.789012',
          accountKey: 'test-account-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(associateTokenHandler(args)).rejects.toThrow();
    });

    test('should throw error when accountId is missing', async () => {
      // Arrange
      const { api } = makeApiMocks();
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          // accountId missing
          accountKey: 'test-account-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(associateTokenHandler(args)).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle transaction failure', async () => {
      // Arrange
      const mockAddAssociation = jest.fn();
      const mockAssociationTransaction = { test: 'association-transaction' };
      const mockSignResult: TransactionResult = {
        success: false,
        transactionId: '',
        receipt: { status: { status: 'failed', transactionId: '' } },
      };

      mockZustandTokenStateHelper(MockedHelper, {
        addAssociation: mockAddAssociation,
      });

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing: signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockResolvedValue(mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWithKey: jest.fn().mockResolvedValue(mockSignResult),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          accountId: '0.0.789012',
          accountKey: 'test-account-key',
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

    test('should handle token transaction service error', async () => {
      // Arrange
      const { api, tokenTransactions: tokenTransactions } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockRejectedValue(new Error('Service unavailable')),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          accountId: '0.0.789012',
          accountKey: 'test-account-key',
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

    test('should handle signing service error', async () => {
      // Arrange
      const mockAssociationTransaction = { test: 'association-transaction' };

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing: signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockResolvedValue(mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWithKey: jest
            .fn()
            .mockRejectedValue(new Error('Signing failed')),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          accountId: '0.0.789012',
          accountKey: 'test-account-key',
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
  });

  describe('state management', () => {
    test('should initialize token state helper', async () => {
      // Arrange
      const mockAddAssociation = jest.fn();
      const mockAssociationTransaction = { test: 'association-transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      mockZustandTokenStateHelper(MockedHelper, {
        addAssociation: mockAddAssociation,
      });

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing: signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockResolvedValue(mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWithKey: jest.fn().mockResolvedValue(mockSignResult),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          accountId: '0.0.789012',
          accountKey: 'test-account-key',
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
  });

  describe('logging and debugging', () => {
    test('should log association details', async () => {
      // Arrange
      const mockAddAssociation = jest.fn();
      const mockAssociationTransaction = { test: 'association-transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      mockZustandTokenStateHelper(MockedHelper, {
        addAssociation: mockAddAssociation,
      });

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing: signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockResolvedValue(mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWithKey: jest.fn().mockResolvedValue(mockSignResult),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          accountId: '0.0.789012',
          accountKey: 'test-account-key',
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
  });
});
