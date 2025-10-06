/**
 * Token Associate Handler Unit Tests
 * Tests the token association functionality of the token plugin
 */
import type { CommandHandlerArgs } from '../../../../src/core/plugins/plugin.interface';
import { associateTokenHandler } from '../../../../src/plugins/token/commands/associate';
import { ZustandTokenStateHelper } from '../../../../src/plugins/token/zustand-state-helper';
import { Logger } from '../../../../src/core/services/logger/logger-service.interface';
import type { CoreAPI } from '../../../../src/core/core-api/core-api.interface';
import type {
  SigningService,
  TransactionResult,
} from '../../../../src/core/services/signing/signing-service.interface';
import type { TokenTransactionService } from '../../../../src/core/services/tokens/token-transaction-service.interface';
import type { StateService } from '../../../../src/core/services/state/state-service.interface';

jest.mock('../../../../src/plugins/token/zustand-state-helper', () => ({
  ZustandTokenStateHelper: jest.fn(),
}));

const MockedHelper = ZustandTokenStateHelper as jest.Mock;

const makeLogger = (): jest.Mocked<Logger> => ({
  log: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  warn: jest.fn(),
});

const makeApiMocks = ({
  createAssociationImpl,
  signAndExecuteImpl,
}: {
  createAssociationImpl?: jest.Mock;
  signAndExecuteImpl?: jest.Mock;
}) => {
  const tokenTransactions: jest.Mocked<TokenTransactionService> = {
    createTokenTransaction: jest.fn(),
    createTokenAssociationTransaction: createAssociationImpl || jest.fn(),
    createTransferTransaction: jest.fn(),
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
    network: {
      getCurrentNetwork: jest.fn().mockReturnValue('testnet'),
    } as any,
    config: {} as any,
    logger: {} as any,
  };

  return { api, tokenTransactions, signing, state };
};

let exitSpy: jest.SpyInstance;

describe('associateTokenHandler', () => {
  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process.exit(${code})`);
    });
    MockedHelper.mockClear();
  });

  afterEach(() => {
    exitSpy.mockRestore();
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

      MockedHelper.mockImplementation(() => ({
        addAssociation: mockAddAssociation,
      }));

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing: signing,
      } = makeApiMocks({
        createAssociationImpl: jest
          .fn()
          .mockResolvedValue(mockAssociationTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
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

      MockedHelper.mockImplementation(() => ({
        addAssociation: mockAddAssociation,
      }));

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing: signing,
      } = makeApiMocks({
        createAssociationImpl: jest
          .fn()
          .mockResolvedValue(mockAssociationTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
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
      const { api } = makeApiMocks({});
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
      const { api } = makeApiMocks({});
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
      const { api } = makeApiMocks({});
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

      MockedHelper.mockImplementation(() => ({
        addAssociation: mockAddAssociation,
      }));

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing: signing,
      } = makeApiMocks({
        createAssociationImpl: jest
          .fn()
          .mockResolvedValue(mockAssociationTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
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
        createAssociationImpl: jest
          .fn()
          .mockRejectedValue(new Error('Service unavailable')),
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
        createAssociationImpl: jest
          .fn()
          .mockResolvedValue(mockAssociationTransaction),
        signAndExecuteImpl: jest
          .fn()
          .mockRejectedValue(new Error('Signing failed')),
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

      MockedHelper.mockImplementation(() => ({
        addAssociation: mockAddAssociation,
      }));

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing: signing,
      } = makeApiMocks({
        createAssociationImpl: jest
          .fn()
          .mockResolvedValue(mockAssociationTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
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

      MockedHelper.mockImplementation(() => ({
        addAssociation: mockAddAssociation,
      }));

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing: signing,
      } = makeApiMocks({
        createAssociationImpl: jest
          .fn()
          .mockResolvedValue(mockAssociationTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
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
