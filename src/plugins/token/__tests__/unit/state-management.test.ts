/**
 * Tests for Token State Management
 * Tests the ZustandTokenStateHelper functionality
 */

import { ZustandTokenStateHelper } from '../../zustand-state-helper';
import { StateService } from '../../../../core/services/state/state-service.interface';
import { Logger } from '../../../../core/services/logger/logger-service.interface';
import { TokenData } from '../../schema';

// Mock the dependencies
jest.mock('../../../../core/services/state/state-service.interface');
jest.mock('../../../../core/services/logger/logger-service.interface');

describe('Token State Management', () => {
  let stateHelper: ZustandTokenStateHelper;
  let mockStateService: jest.Mocked<StateService>;
  let mockLogger: jest.Mocked<Logger>;

  const makeStateService = (): jest.Mocked<StateService> => ({
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
  });

  beforeEach(() => {
    mockStateService = makeStateService();
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
      verbose: jest.fn(),
    } as jest.Mocked<Logger>;

    stateHelper = new ZustandTokenStateHelper(mockStateService, mockLogger);
  });

  describe('saveToken', () => {
    const mockTokenData: TokenData = {
      tokenId: '0.0.123456',
      name: 'TestToken',
      symbol: 'TEST',
      decimals: 2,
      initialSupply: 1000,
      supplyType: 'FINITE',
      maxSupply: 10000,
      treasuryId: '0.0.789012',
      keys: {
        adminKey: 'admin-key',
        supplyKey: '',
        wipeKey: '',
        kycKey: '',
        freezeKey: '',
        pauseKey: '',
        feeScheduleKey: '',
        treasuryKey: 'treasury-key',
      },
      network: 'testnet',
      associations: [],
      customFees: [],
    };

    test('should save token successfully', () => {
      mockStateService.set.mockReturnValue(undefined);

      stateHelper.saveToken('0.0.123456', mockTokenData);

      expect(mockStateService.set).toHaveBeenCalledWith(
        'token-tokens',
        '0.0.123456',
        mockTokenData,
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[TOKEN STATE] Saving token 0.0.123456 to state',
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[TOKEN STATE] Successfully saved token 0.0.123456',
      );
    });

    test('should handle save error', () => {
      const error = new Error('Save failed');
      mockStateService.set.mockImplementation(() => {
        throw error;
      });

      expect(() => stateHelper.saveToken('0.0.123456', mockTokenData)).toThrow(
        'Save failed',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[TOKEN STATE] Failed to save token 0.0.123456: Save failed',
      );
    });
  });

  describe('getToken', () => {
    const mockTokenData: TokenData = {
      tokenId: '0.0.123456',
      name: 'TestToken',
      symbol: 'TEST',
      decimals: 2,
      initialSupply: 1000,
      supplyType: 'FINITE',
      maxSupply: 10000,
      treasuryId: '0.0.789012',
      keys: {
        adminKey: 'admin-key',
        supplyKey: '',
        wipeKey: '',
        kycKey: '',
        freezeKey: '',
        pauseKey: '',
        feeScheduleKey: '',
        treasuryKey: 'treasury-key',
      },
      network: 'testnet',
      associations: [],
      customFees: [],
    };

    test('should get token successfully', () => {
      mockStateService.get.mockReturnValue(mockTokenData);

      const result = stateHelper.getToken('0.0.123456');

      expect(result).toEqual(mockTokenData);
      expect(mockStateService.get).toHaveBeenCalledWith(
        'token-tokens',
        '0.0.123456',
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[TOKEN STATE] Getting token 0.0.123456 from state',
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[TOKEN STATE] Found token 0.0.123456 in state',
      );
    });

    test('should return null when token not found', () => {
      mockStateService.get.mockReturnValue(null);

      const result = stateHelper.getToken('0.0.123456');

      expect(result).toBeNull();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[TOKEN STATE] Token 0.0.123456 not found in state',
      );
    });

    test('should handle get error', () => {
      const error = new Error('Get failed');
      mockStateService.get.mockImplementation(() => {
        throw error;
      });

      expect(() => stateHelper.getToken('0.0.123456')).toThrow('Get failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[TOKEN STATE] Failed to get token 0.0.123456: Get failed',
      );
    });
  });

  describe('getAllTokens', () => {
    const mockTokens: Record<string, TokenData> = {
      '0.0.123456': {
        tokenId: '0.0.123456',
        name: 'TestToken1',
        symbol: 'TEST1',
        decimals: 2,
        initialSupply: 1000,
        supplyType: 'FINITE',
        maxSupply: 10000,
        treasuryId: '0.0.789012',
        keys: {
          adminKey: 'admin-key',
          supplyKey: '',
          wipeKey: '',
          kycKey: '',
          freezeKey: '',
          pauseKey: '',
          feeScheduleKey: '',
          treasuryKey: 'treasury-key',
        },
        network: 'testnet',
        associations: [],
        customFees: [],
      },
      '0.0.789012': {
        tokenId: '0.0.789012',
        name: 'TestToken2',
        symbol: 'TEST2',
        decimals: 8,
        initialSupply: 5000,
        supplyType: 'INFINITE',
        maxSupply: 0,
        treasuryId: '0.0.111111',
        keys: {
          adminKey: 'admin-key2',
          supplyKey: '',
          wipeKey: '',
          kycKey: '',
          freezeKey: '',
          pauseKey: '',
          feeScheduleKey: '',
          treasuryKey: 'treasury-key2',
        },
        network: 'testnet',
        associations: [],
        customFees: [],
      },
    };

    test('should get all tokens successfully', () => {
      const tokenArray = [mockTokens['0.0.123456'], mockTokens['0.0.789012']];
      mockStateService.list.mockReturnValue(tokenArray);

      const result = stateHelper.getAllTokens();

      expect(result).toEqual(mockTokens);
      expect(mockStateService.list).toHaveBeenCalledWith('token-tokens');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[TOKEN STATE] Getting all tokens from state',
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[TOKEN STATE] Found 2 tokens in state',
      );
    });

    test('should return empty object when no tokens', () => {
      mockStateService.list.mockReturnValue([]);

      const result = stateHelper.getAllTokens();

      expect(result).toEqual({});
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[TOKEN STATE] Found 0 tokens in state',
      );
    });

    test('should handle errors', () => {
      const error = new Error('List failed');
      mockStateService.list.mockImplementation(() => {
        throw error;
      });

      expect(() => stateHelper.getAllTokens()).toThrow('List failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[TOKEN STATE] Failed to get all tokens: List failed',
      );
    });
  });

  describe('removeToken', () => {
    test('should remove token successfully', () => {
      mockStateService.delete.mockReturnValue(undefined);

      stateHelper.removeToken('0.0.123456');

      expect(mockStateService.delete).toHaveBeenCalledWith(
        'token-tokens',
        '0.0.123456',
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[TOKEN STATE] Removing token 0.0.123456 from state',
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[TOKEN STATE] Successfully removed token 0.0.123456',
      );
    });

    test('should handle remove error', () => {
      const error = new Error('Delete failed');
      mockStateService.delete.mockImplementation(() => {
        throw error;
      });

      expect(() => stateHelper.removeToken('0.0.123456')).toThrow(
        'Delete failed',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[TOKEN STATE] Failed to remove token 0.0.123456: Delete failed',
      );
    });
  });

  describe('addTokenAssociation', () => {
    const mockTokenData: TokenData = {
      tokenId: '0.0.123456',
      name: 'TestToken',
      symbol: 'TEST',
      decimals: 2,
      initialSupply: 1000,
      supplyType: 'FINITE',
      maxSupply: 10000,
      treasuryId: '0.0.789012',
      keys: {
        adminKey: 'admin-key',
        supplyKey: '',
        wipeKey: '',
        kycKey: '',
        freezeKey: '',
        pauseKey: '',
        feeScheduleKey: '',
        treasuryKey: 'treasury-key',
      },
      network: 'testnet',
      associations: [],
      customFees: [],
    };

    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();
      // Mock getToken to return the token data by default
      jest.spyOn(stateHelper, 'getToken').mockReturnValue(mockTokenData);
      jest.spyOn(stateHelper, 'saveToken').mockImplementation(() => {});
    });

    test('should add association successfully', () => {
      stateHelper.addTokenAssociation(
        '0.0.123456',
        '0.0.111111',
        'TestAccount',
      );

      expect(stateHelper.getToken).toHaveBeenCalledWith('0.0.123456');
      expect(stateHelper.saveToken).toHaveBeenCalledWith('0.0.123456', {
        ...mockTokenData,
        associations: [{ name: 'TestAccount', accountId: '0.0.111111' }],
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[TOKEN STATE] Added association 0.0.111111 to token 0.0.123456',
      );
    });

    test('should not add duplicate association', () => {
      const tokenWithAssociation = {
        ...mockTokenData,
        associations: [{ name: 'TestAccount', accountId: '0.0.111111' }],
      };
      jest.spyOn(stateHelper, 'getToken').mockReturnValue(tokenWithAssociation);

      stateHelper.addTokenAssociation(
        '0.0.123456',
        '0.0.111111',
        'TestAccount',
      );

      expect(stateHelper.saveToken).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[TOKEN STATE] Association 0.0.111111 already exists for token 0.0.123456',
      );
    });

    test('should handle token not found error', () => {
      jest.spyOn(stateHelper, 'getToken').mockReturnValue(null);

      expect(() =>
        stateHelper.addTokenAssociation(
          '0.0.123456',
          '0.0.111111',
          'TestAccount',
        ),
      ).toThrow('Token 0.0.123456 not found');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[TOKEN STATE] Failed to add association to token 0.0.123456: Token 0.0.123456 not found',
      );
    });
  });
});
