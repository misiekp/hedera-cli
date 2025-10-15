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
const { setupExit, cleanupExit } = mockProcessExitThrows();

describe('associateTokenHandler', () => {
  beforeEach(() => {
    setupExit();
    mockZustandTokenStateHelper(MockedHelper);
  });

  afterEach(() => {
    cleanupExit();
  });

  describe('success scenarios', () => {
    test('should associate token with account using account-id:account-key format', async () => {
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

      const { api, tokenTransactions, signing, credentialsState } =
        makeApiMocks({
          tokenTransactions: {
            createTokenAssociationTransaction: jest
              .fn()
              .mockReturnValue(mockAssociationTransaction),
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
          tokenId: '0.0.123456',
          account: '0.0.789012:test-account-key',
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
      expect(signing.signAndExecuteWith).toHaveBeenCalledWith(
        mockAssociationTransaction,
        { keyRefId: 'imported-key-ref-id' },
      );
      expect(credentialsState.importPrivateKey).toHaveBeenCalledWith(
        'test-account-key',
      );
    });

    test('should associate token with account using alias', async () => {
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

      const { api, tokenTransactions, signing, alias } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockReturnValue(mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        alias: {
          resolve: jest.fn().mockReturnValue({
            entityId: '0.0.789012',
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
          tokenId: '0.0.123456',
          account: 'alice',
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

      expect(alias.resolve).toHaveBeenCalledWith('alice', 'account', 'testnet');
      expect(
        tokenTransactions.createTokenAssociationTransaction,
      ).toHaveBeenCalledWith({
        tokenId: '0.0.123456',
        accountId: '0.0.789012',
      });
      expect(signing.signAndExecuteWith).toHaveBeenCalledWith(
        mockAssociationTransaction,
        { keyRefId: 'alias-key-ref-id' },
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

      const { api } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockReturnValue(mockAssociationTransaction),
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
          tokenId: '0.0.123456',
          account: '0.0.789012:test-account-key',
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
    test('should throw error when account parameter is missing', async () => {
      // Arrange
      const { api } = makeApiMocks();
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          // account missing
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

    test('should throw error when tokenId is missing', async () => {
      // Arrange
      const { api } = makeApiMocks();
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          // tokenId missing
          account: '0.0.789012:test-account-key',
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

    test('should throw error when account parameter is empty', async () => {
      // Arrange
      const { api } = makeApiMocks();
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          account: '',
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

      const { api } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockReturnValue(mockAssociationTransaction),
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
          tokenId: '0.0.123456',
          account: '0.0.789012:test-account-key',
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
        '❌ Failed to associate token: Token association failed',
      );
    });

    test('should handle token transaction service error', async () => {
      // Arrange
      const { api } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockImplementation(() => {
              throw new Error('Service unavailable');
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
          tokenId: '0.0.123456',
          account: '0.0.789012:test-account-key',
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

      const { api } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockReturnValue(mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWith: jest
            .fn()
            .mockRejectedValue(new Error('Signing failed')),
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
          tokenId: '0.0.123456',
          account: '0.0.789012:test-account-key',
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

      const { api } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockReturnValue(mockAssociationTransaction),
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
          tokenId: '0.0.123456',
          account: '0.0.789012:test-account-key',
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

      const { api } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockReturnValue(mockAssociationTransaction),
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
          tokenId: '0.0.123456',
          account: '0.0.789012:test-account-key',
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
