/**
 * Token Schema Validation Tests
 * Tests the token data validation and schema functionality
 */
import {
  TokenDataSchema,
  TokenKeysSchema,
  TokenAssociationSchema,
  CustomFeeSchema,
  safeValidateTokenCreateParams,
  validateTokenData,
} from '../../../../src/plugins/token/schema';

describe('Token Schema Validation', () => {
  describe('TokenDataSchema', () => {
    const validTokenData = {
      tokenId: '0.0.123456',
      name: 'TestToken',
      symbol: 'TEST',
      decimals: 2,
      initialSupply: 1000,
      supplyType: 'FINITE',
      maxSupply: 10000,
      treasuryId: '0.0.789012',
      associations: [
        {
          name: 'TestAccount',
          accountId: '0.0.345678',
        },
      ],
      keys: {
        adminKey: 'admin-key',
        supplyKey: 'supply-key',
        wipeKey: 'wipe-key',
        kycKey: 'kyc-key',
        freezeKey: 'freeze-key',
        pauseKey: 'pause-key',
        feeScheduleKey: 'fee-schedule-key',
        treasuryKey: 'treasury-key',
      },
      network: 'testnet',
      customFees: [
        {
          type: 'fixed',
          amount: 10,
          unitType: 'HBAR',
          collectorId: '0.0.999999',
        },
      ],
    };

    test('should validate valid token data', () => {
      const result = TokenDataSchema.safeParse(validTokenData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validTokenData);
      }
    });

    test('should reject invalid token ID format', () => {
      const invalidData = {
        ...validTokenData,
        tokenId: 'invalid-id',
      };

      const result = TokenDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Token ID must be in format 0.0.123456',
        );
      }
    });

    test('should reject empty token name', () => {
      const invalidData = {
        ...validTokenData,
        name: '',
      };

      const result = TokenDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Token name is required',
        );
      }
    });

    test('should reject empty token symbol', () => {
      const invalidData = {
        ...validTokenData,
        symbol: '',
      };

      const result = TokenDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Token symbol is required',
        );
      }
    });

    test('should reject negative decimals', () => {
      const invalidData = {
        ...validTokenData,
        decimals: -1,
      };

      const result = TokenDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Decimals must be non-negative',
        );
      }
    });

    test('should accept decimals up to 18', () => {
      const validData = {
        ...validTokenData,
        decimals: 18,
      };

      const result = TokenDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject negative initial supply', () => {
      const invalidData = {
        ...validTokenData,
        initialSupply: -100,
      };

      const result = TokenDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Initial supply must be non-negative',
        );
      }
    });

    test('should reject invalid supply type', () => {
      const invalidData = {
        ...validTokenData,
        supplyType: 'INVALID',
      };

      const result = TokenDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Supply type must be either FINITE or INFINITE',
        );
      }
    });

    test('should reject invalid treasury ID format', () => {
      const invalidData = {
        ...validTokenData,
        treasuryId: 'invalid-treasury-id',
      };

      const result = TokenDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Treasury ID must be in format 0.0.123456',
        );
      }
    });

    test('should reject invalid network', () => {
      const invalidData = {
        ...validTokenData,
        network: 'invalid-network',
      };

      const result = TokenDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Network must be mainnet, testnet, or previewnet',
        );
      }
    });
  });

  describe('TokenKeysSchema', () => {
    const validKeys = {
      adminKey: 'admin-key',
      supplyKey: 'supply-key',
      wipeKey: 'wipe-key',
      kycKey: 'kyc-key',
      freezeKey: 'freeze-key',
      pauseKey: 'pause-key',
      feeScheduleKey: 'fee-schedule-key',
      treasuryKey: 'treasury-key',
    };

    test('should validate valid token keys', () => {
      const result = TokenKeysSchema.safeParse(validKeys);
      expect(result.success).toBe(true);
    });

    test('should reject empty admin key', () => {
      const invalidKeys = {
        ...validKeys,
        adminKey: '',
      };

      const result = TokenKeysSchema.safeParse(invalidKeys);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Admin key is required',
        );
      }
    });

    test('should reject empty treasury key', () => {
      const invalidKeys = {
        ...validKeys,
        treasuryKey: '',
      };

      const result = TokenKeysSchema.safeParse(invalidKeys);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Treasury key is required',
        );
      }
    });

    test('should allow optional keys to be empty', () => {
      const keysWithEmptyOptional = {
        ...validKeys,
        supplyKey: '',
        wipeKey: '',
        kycKey: '',
        freezeKey: '',
        pauseKey: '',
        feeScheduleKey: '',
      };

      const result = TokenKeysSchema.safeParse(keysWithEmptyOptional);
      expect(result.success).toBe(true);
    });
  });

  describe('TokenAssociationSchema', () => {
    const validAssociation = {
      name: 'TestAccount',
      accountId: '0.0.345678',
    };

    test('should validate valid association', () => {
      const result = TokenAssociationSchema.safeParse(validAssociation);
      expect(result.success).toBe(true);
    });

    test('should reject empty association name', () => {
      const invalidAssociation = {
        ...validAssociation,
        name: '',
      };

      const result = TokenAssociationSchema.safeParse(invalidAssociation);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Association name is required',
        );
      }
    });

    test('should reject invalid account ID format', () => {
      const invalidAssociation = {
        ...validAssociation,
        accountId: 'invalid-account-id',
      };

      const result = TokenAssociationSchema.safeParse(invalidAssociation);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Account ID must be in format 0.0.123456',
        );
      }
    });
  });

  describe('CustomFeeSchema', () => {
    const validCustomFee = {
      type: 'fixed',
      amount: 10,
      unitType: 'HBAR',
      collectorId: '0.0.999999',
      exempt: false,
    };

    test('should validate valid custom fee', () => {
      const result = CustomFeeSchema.safeParse(validCustomFee);
      expect(result.success).toBe(true);
    });

    test('should accept any fee type (no validation)', () => {
      const invalidFee = {
        ...validCustomFee,
        type: 'invalid-type',
      };

      const result = CustomFeeSchema.safeParse(invalidFee);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('invalid-type');
      }
    });

    test('should accept negative amount (no validation)', () => {
      const invalidFee = {
        ...validCustomFee,
        amount: -10,
      };

      const result = CustomFeeSchema.safeParse(invalidFee);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(-10);
      }
    });

    test('should accept any collector ID format (no validation)', () => {
      const invalidFee = {
        ...validCustomFee,
        collectorId: 'invalid-collector-id',
      };

      const result = CustomFeeSchema.safeParse(invalidFee);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.collectorId).toBe('invalid-collector-id');
      }
    });
  });

  describe('safeValidateTokenCreateParams', () => {
    const validCreateParams = {
      name: 'TestToken',
      symbol: 'TEST',
      decimals: 2,
      initialSupply: 1000,
      supplyType: 'INFINITE',
      treasuryId: '0.0.123456',
      adminKey: 'admin-key',
    };

    test('should validate valid create parameters', () => {
      const result = safeValidateTokenCreateParams(validCreateParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validCreateParams);
      }
    });

    test('should handle missing optional parameters', () => {
      const minimalParams = {
        name: 'TestToken',
        symbol: 'TEST',
      };

      const result = safeValidateTokenCreateParams(minimalParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.decimals).toBeUndefined();
        expect(result.data.initialSupply).toBeUndefined();
        expect(result.data.supplyType).toBeUndefined();
      }
    });

    test('should reject invalid create parameters', () => {
      const invalidParams = {
        name: '', // Invalid: empty name
        symbol: 'TEST',
      };

      const result = safeValidateTokenCreateParams(invalidParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
        expect(result.error.errors[0].message).toContain(
          'Token name is required',
        );
      }
    });
  });

  describe('validateTokenData', () => {
    test('should validate and return true for valid token data', () => {
      const rawData = {
        tokenId: '0.0.123456',
        name: 'TestToken',
        symbol: 'TEST',
        decimals: 2,
        initialSupply: 1000,
        supplyType: 'FINITE',
        maxSupply: 10000,
        treasuryId: '0.0.789012',
        associations: [],
        keys: {
          adminKey: 'admin-key',
          treasuryKey: 'treasury-key',
        },
        network: 'testnet',
        customFees: [],
      };

      const result = validateTokenData(rawData);
      expect(result).toBe(true);
    });

    test('should return false for invalid token data', () => {
      const invalidData = {
        tokenId: 'invalid-id',
        name: 'TestToken',
        symbol: 'TEST',
      };

      const result = validateTokenData(invalidData);
      expect(result).toBe(false);
    });
  });

  describe('edge cases and boundary values', () => {
    test('should handle maximum valid decimals', () => {
      const validData = {
        tokenId: '0.0.123456',
        name: 'TestToken',
        symbol: 'TEST',
        decimals: 18, // Maximum allowed
        initialSupply: 1000,
        supplyType: 'FINITE',
        maxSupply: 10000,
        treasuryId: '0.0.789012',
        associations: [],
        keys: {
          adminKey: 'admin-key',
          treasuryKey: 'treasury-key',
        },
        network: 'testnet',
        customFees: [],
      };

      const result = TokenDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should handle zero initial supply', () => {
      const validData = {
        tokenId: '0.0.123456',
        name: 'TestToken',
        symbol: 'TEST',
        decimals: 0,
        initialSupply: 0, // Zero is valid
        supplyType: 'INFINITE',
        maxSupply: 0,
        treasuryId: '0.0.789012',
        associations: [],
        keys: {
          adminKey: 'admin-key',
          treasuryKey: 'treasury-key',
        },
        network: 'testnet',
        customFees: [],
      };

      const result = TokenDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should handle very long token names', () => {
      const longName = 'A'.repeat(100); // Maximum allowed length
      const validData = {
        tokenId: '0.0.123456',
        name: longName,
        symbol: 'TEST',
        decimals: 0,
        initialSupply: 1000,
        supplyType: 'FINITE',
        maxSupply: 10000,
        treasuryId: '0.0.789012',
        associations: [],
        keys: {
          adminKey: 'admin-key',
          treasuryKey: 'treasury-key',
        },
        network: 'testnet',
        customFees: [],
      };

      const result = TokenDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject token names longer than 100 characters', () => {
      const tooLongName = 'A'.repeat(101); // Over maximum allowed length
      const invalidData = {
        tokenId: '0.0.123456',
        name: tooLongName,
        symbol: 'TEST',
        decimals: 0,
        initialSupply: 1000,
        supplyType: 'FINITE',
        maxSupply: 10000,
        treasuryId: '0.0.789012',
        associations: [],
        keys: {
          adminKey: 'admin-key',
          treasuryKey: 'treasury-key',
        },
        network: 'testnet',
        customFees: [],
      };

      const result = TokenDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Token name must be 100 characters or less',
        );
      }
    });
  });
});
