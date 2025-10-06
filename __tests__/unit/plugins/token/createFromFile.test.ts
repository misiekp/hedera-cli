/**
 * Token Create From File Handler Unit Tests
 * Tests the token creation from file functionality of the token plugin
 */
import type { CommandHandlerArgs } from '../../../../src/core/plugins/plugin.interface';
import { createTokenFromFileHandler } from '../../../../src/plugins/token/commands/createFromFile';
import { ZustandTokenStateHelper } from '../../../../src/plugins/token/zustand-state-helper';
import { Logger } from '../../../../src/core/services/logger/logger-service.interface';
import type { CoreAPI } from '../../../../src/core/core-api/core-api.interface';
import type {
  SigningService,
  TransactionResult,
} from '../../../../src/core/services/signing/signing-service.interface';
import type { TokenTransactionService } from '../../../../src/core/services/tokens/token-transaction-service.interface';
import type { StateService } from '../../../../src/core/services/state/state-service.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

let exitSpy: jest.SpyInstance;

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  access: jest.fn(),
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn(),
  resolve: jest.fn(),
}));

jest.mock('../../../../src/plugins/token/zustand-state-helper', () => ({
  ZustandTokenStateHelper: jest.fn(),
}));

const MockedHelper = ZustandTokenStateHelper as jest.Mock;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

const makeLogger = (): jest.Mocked<Logger> => ({
  log: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  warn: jest.fn(),
});

const makeApiMocks = ({
  createTokenImpl,
  signAndExecuteImpl,
  createAssociationImpl,
}: {
  createTokenImpl?: jest.Mock;
  signAndExecuteImpl?: jest.Mock;
  createAssociationImpl?: jest.Mock;
}) => {
  const tokenTransactions: jest.Mocked<TokenTransactionService> = {
    createTokenTransaction: createTokenImpl || jest.fn(),
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
    tokenTransactions: tokenTransactions,
    signing: signing,
    credentials: {} as any,
    state,
    mirror: {} as any,
    network: {
      getCurrentNetwork: jest.fn().mockReturnValue('testnet'),
    } as any,
    config: {} as any,
    logger: {} as any,
  };

  return { api, tokenTransactions: tokenTransactions, signing: signing, state };
};

const validTokenFile = {
  name: 'TestToken',
  symbol: 'TEST',
  decimals: 2,
  supplyType: 'finite' as const,
  initialSupply: 1000,
  maxSupply: 10000,
  treasury: {
    accountId: '0.0.123456',
    key: 'treasury-key',
  },
  keys: {
    adminKey: 'admin-key',
    supplyKey: 'supply-key',
    wipeKey: 'wipe-key',
    kycKey: 'kyc-key',
    freezeKey: 'freeze-key',
    pauseKey: 'pause-key',
    feeScheduleKey: 'fee-schedule-key',
  },
  associations: [
    {
      accountId: '0.0.789012',
      key: 'association-key',
    },
  ],
  customFees: [
    {
      type: 'fixed' as const,
      amount: 10,
      unitType: 'HBAR' as const,
      collectorId: '0.0.999999',
    },
  ],
  memo: 'Test token created from file',
};

describe('createTokenFromFileHandler', () => {
  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      return undefined as never;
    });
    MockedHelper.mockClear();
    MockedHelper.mockImplementation(() => ({
      saveToken: jest.fn().mockResolvedValue(undefined),
    }));
    mockFs.readFile.mockClear();
    mockFs.access.mockClear();
    mockPath.join.mockClear();
    mockPath.resolve.mockClear();
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  describe('success scenarios', () => {
    test('should create token from valid file', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockTokenTransaction = { test: 'token-transaction' };
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
        saveToken: mockAddToken,
      }));

      mockFs.readFile.mockResolvedValue(JSON.stringify(validTokenFile));
      mockFs.access.mockResolvedValue(undefined); // File exists
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const mockAssociationTransaction = { test: 'association-transaction' };
      const mockAssociationResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456790',
        receipt: {
          status: {
            status: 'success',
            transactionId: '0.0.123@1234567890.123456790',
          },
        },
      };

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing,
      } = makeApiMocks({
        createTokenImpl: jest.fn().mockResolvedValue(mockTokenTransaction),
        createAssociationImpl: jest
          .fn()
          .mockResolvedValue(mockAssociationTransaction),
        signAndExecuteImpl: jest.fn().mockImplementation((transaction) => {
          if (transaction === mockTokenTransaction) {
            return Promise.resolve(mockSignResult);
          }
          if (transaction === mockAssociationTransaction) {
            return Promise.resolve(mockAssociationResult);
          }
          return Promise.resolve({
            success: false,
            transactionId: '',
            receipt: { status: { status: 'failed', transactionId: '' } },
          });
        }),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenFromFileHandler(args);

      // Assert
      expect(mockFs.readFile).toHaveBeenCalledWith(
        '/path/to/token.test.json',
        'utf-8',
      );
      expect(tokenTransactions.createTokenTransaction).toHaveBeenCalledWith({
        name: 'TestToken',
        symbol: 'TEST',
        decimals: 2,
        initialSupply: 1000,
        supplyType: 'FINITE',
        maxSupply: 10000,
        treasuryId: '0.0.123456',
        treasuryKey: 'treasury-key',
        adminKey: 'admin-key',
        customFees: [
          {
            type: 'fixed',
            amount: 10,
            unitType: 'HBAR',
            collectorId: '0.0.999999',
            exempt: undefined,
          },
        ],
      });
      expect(signing.signAndExecuteWithKey).toHaveBeenCalledWith(
        mockTokenTransaction,
        'treasury-key',
      );
      expect(mockAddToken).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        '✅ Token created successfully from file!',
      );
      expect(exitSpy).toHaveBeenCalledWith(0);
    });

    test('should handle infinite supply type', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockTokenTransaction = { test: 'token-transaction' };
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
        saveToken: mockAddToken,
      }));

      const infiniteSupplyFile = {
        ...validTokenFile,
        supplyType: 'infinite' as const,
        maxSupply: 0,
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(infiniteSupplyFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing,
      } = makeApiMocks({
        createTokenImpl: jest.fn().mockResolvedValue(mockTokenTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenFromFileHandler(args);

      // Assert
      expect(tokenTransactions.createTokenTransaction).toHaveBeenCalledWith({
        name: 'TestToken',
        symbol: 'TEST',
        treasuryId: '0.0.123456',
        decimals: 2,
        initialSupply: 1000,
        supplyType: 'INFINITE',
        maxSupply: 0,
        adminKey: 'admin-key',
        treasuryKey: 'treasury-key',
        customFees: [
          {
            type: 'fixed',
            amount: 10,
            unitType: 'HBAR',
            collectorId: '0.0.999999',
            exempt: undefined,
          },
        ],
      });
      expect(exitSpy).toHaveBeenCalledWith(0);
    });

    test('should process associations after token creation', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockTokenTransaction = { test: 'token-transaction' };
      const _mockAssociationTransaction = { test: 'association-transaction' };
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
        saveToken: mockAddToken,
      }));

      mockFs.readFile.mockResolvedValue(JSON.stringify(validTokenFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing,
      } = makeApiMocks({
        createTokenImpl: jest.fn().mockResolvedValue(mockTokenTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
        createAssociationImpl: jest
          .fn()
          .mockResolvedValue(_mockAssociationTransaction),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenFromFileHandler(args);

      // Assert
      expect(
        tokenTransactions.createTokenAssociationTransaction,
      ).toHaveBeenCalledWith({
        tokenId: '0.0.123456', // This would be the actual token ID from the transaction result
        accountId: '0.0.789012',
      });
      expect(exitSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('file handling scenarios', () => {
    test('should handle file not found', async () => {
      // Arrange
      mockFs.access.mockRejectedValue(new Error('File not found'));
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'nonexistent',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to create token from file:'),
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle file read error', async () => {
      // Arrange
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockRejectedValue(new Error('Permission denied'));
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to create token from file:'),
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle invalid JSON', async () => {
      // Arrange
      mockFs.readFile.mockResolvedValue('invalid json content');
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to create token from file:'),
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('validation scenarios', () => {
    test('should handle missing required fields', async () => {
      // Arrange
      const invalidFile = {
        // name missing
        symbol: 'TEST',
        decimals: 2,
        supplyType: 'finite',
        initialSupply: 1000,
        treasury: {
          accountId: '0.0.123456',
          key: 'treasury-key',
        },
        keys: {
          adminKey: 'admin-key',
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith('Token file validation failed');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle invalid account ID format', async () => {
      // Arrange
      const invalidFile = {
        ...validTokenFile,
        treasury: {
          accountId: 'invalid-account-id',
          key: 'treasury-key',
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith('Token file validation failed');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle invalid supply type', async () => {
      // Arrange
      const invalidFile = {
        ...validTokenFile,
        supplyType: 'invalid-type',
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith('Token file validation failed');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle negative initial supply', async () => {
      // Arrange
      const invalidFile = {
        ...validTokenFile,
        initialSupply: -100,
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith('Token file validation failed');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('error scenarios', () => {
    test('should handle token creation failure', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockTokenTransaction = { test: 'token-transaction' };
      const mockSignResult: TransactionResult = {
        success: false,
        transactionId: '',
        receipt: { status: { status: 'failed', transactionId: '' } },
      };

      MockedHelper.mockImplementation(() => ({
        saveToken: mockAddToken,
      }));

      mockFs.readFile.mockResolvedValue(JSON.stringify(validTokenFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing,
      } = makeApiMocks({
        createTokenImpl: jest.fn().mockResolvedValue(mockTokenTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to create token from file:'),
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle association failure gracefully', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockTokenTransaction = { test: 'token-transaction' };
      const _mockAssociationTransaction = { test: 'association-transaction' };
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
        saveToken: mockAddToken,
      }));

      mockFs.readFile.mockResolvedValue(JSON.stringify(validTokenFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing,
      } = makeApiMocks({
        createTokenImpl: jest.fn().mockResolvedValue(mockTokenTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
        createAssociationImpl: jest
          .fn()
          .mockRejectedValue(new Error('Association failed')),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenFromFileHandler(args);

      // Assert - Should continue despite association failure
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️  Failed to associate account 0.0.789012:'),
      );
      expect(logger.log).toHaveBeenCalledWith(
        '✅ Token created successfully from file!',
      );
      expect(exitSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('logging and debugging', () => {
    test('should log file processing details', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockTokenTransaction = { test: 'token-transaction' };
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
        saveToken: mockAddToken,
      }));

      mockFs.readFile.mockResolvedValue(JSON.stringify(validTokenFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const {
        api,
        tokenTransactions: tokenTransactions,
        signing,
      } = makeApiMocks({
        createTokenImpl: jest.fn().mockResolvedValue(mockTokenTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenFromFileHandler(args);

      // Assert
      expect(logger.log).toHaveBeenCalledWith('Creating token from file: test');
      expect(logger.log).toHaveBeenCalledWith(
        '🔑 Using treasury key for signing transaction',
      );
      expect(logger.log).toHaveBeenCalledWith(
        '✅ Token created successfully from file!',
      );
      expect(exitSpy).toHaveBeenCalledWith(0);
    });
  });
});
