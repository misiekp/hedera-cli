import { listTokensHandler } from '../../commands/list';
import { ZustandTokenStateHelper } from '../../zustand-state-helper';
import type { CoreAPI } from '../../../../core/core-api/core-api.interface';
import type { TokenData } from '../../schema';
import {
  makeLogger,
  makeArgs,
  setupExitSpy,
} from '../../../../../__tests__/helpers/plugin';

let exitSpy: jest.SpyInstance;

jest.mock('../../zustand-state-helper', () => ({
  ZustandTokenStateHelper: jest.fn(),
}));

const MockedHelper = ZustandTokenStateHelper as jest.Mock;

const makeTokenData = (overrides: Partial<TokenData> = {}): TokenData => ({
  tokenId: '0.0.1234',
  name: 'Test Token',
  symbol: 'TST',
  treasuryId: '0.0.5678',
  decimals: 2,
  initialSupply: 1000000,
  supplyType: 'INFINITE',
  maxSupply: 0,
  keys: {
    adminKey: 'test-admin-key',
    supplyKey: '',
    wipeKey: '',
    kycKey: '',
    freezeKey: '',
    pauseKey: '',
    feeScheduleKey: '',
    treasuryKey: '',
  },
  network: 'testnet',
  associations: [],
  customFees: [],
  ...overrides,
});

beforeAll(() => {
  exitSpy = setupExitSpy();
});

afterAll(() => {
  exitSpy.mockRestore();
});

describe('token plugin - list command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('logs message when no tokens exist', () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      listTokens: jest.fn().mockReturnValue([]),
      getTokenStats: jest.fn().mockReturnValue({
        total: 0,
        byNetwork: {},
        bySupplyType: {},
        withAssociations: 0,
        totalAssociations: 0,
      }),
    }));

    const api: Partial<CoreAPI> = {
      state: {} as any,
      logger,
      network: {
        getCurrentNetwork: jest.fn().mockReturnValue('testnet'),
      } as any,
      alias: {
        list: jest.fn().mockReturnValue([]),
      } as any,
    };
    const args = makeArgs(api, logger, {});

    listTokensHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('No tokens found for current network: testnet'),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('lists tokens without keys', () => {
    const logger = makeLogger();
    const tokens = [
      makeTokenData({
        tokenId: '0.0.1111',
        name: 'Token 1',
        symbol: 'TK1',
        network: 'testnet',
      }),
      makeTokenData({
        tokenId: '0.0.2222',
        name: 'Token 2',
        symbol: 'TK2',
        network: 'testnet',
      }),
    ];

    MockedHelper.mockImplementation(() => ({
      listTokens: jest.fn().mockReturnValue(tokens),
      getTokenStats: jest.fn().mockReturnValue({
        total: 2,
        byNetwork: { testnet: 2 },
        bySupplyType: { INFINITE: 2 },
        withAssociations: 0,
        totalAssociations: 0,
      }),
    }));

    const api: Partial<CoreAPI> = {
      state: {} as any,
      logger,
      network: {
        getCurrentNetwork: jest.fn().mockReturnValue('testnet'),
      } as any,
      alias: {
        list: jest.fn().mockReturnValue([]),
      } as any,
    };
    const args = makeArgs(api, logger, {});

    listTokensHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Found 2 token(s) for network testnet'),
    );
    expect(logger.log).toHaveBeenCalledWith('1. Token 1 (TK1)');
    expect(logger.log).toHaveBeenCalledWith('   Token ID: 0.0.1111');
    expect(logger.log).toHaveBeenCalledWith('2. Token 2 (TK2)');
    expect(logger.log).toHaveBeenCalledWith('   Token ID: 0.0.2222');
    // Keys should not be shown in detail
    expect(logger.log).not.toHaveBeenCalledWith(
      expect.stringContaining('Admin Key: ✅'),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('lists tokens with keys when flag is set', () => {
    const logger = makeLogger();
    const tokens = [
      makeTokenData({
        tokenId: '0.0.3333',
        name: 'Token 3',
        symbol: 'TK3',
        network: 'testnet',
        keys: {
          adminKey: 'admin-key-123',
          supplyKey: 'supply-key-123',
          wipeKey: '',
          kycKey: '',
          freezeKey: '',
          pauseKey: '',
          feeScheduleKey: '',
          treasuryKey: '',
        },
      }),
    ];

    MockedHelper.mockImplementation(() => ({
      listTokens: jest.fn().mockReturnValue(tokens),
      getTokenStats: jest.fn().mockReturnValue({
        total: 1,
        byNetwork: { testnet: 1 },
        bySupplyType: { INFINITE: 1 },
        withAssociations: 0,
        totalAssociations: 0,
      }),
    }));

    const api: Partial<CoreAPI> = {
      state: {} as any,
      logger,
      network: {
        getCurrentNetwork: jest.fn().mockReturnValue('testnet'),
      } as any,
      alias: {
        list: jest.fn().mockReturnValue([]),
      } as any,
    };
    const args = makeArgs(api, logger, { keys: true });

    listTokensHandler(args);

    expect(logger.log).toHaveBeenCalledWith('1. Token 3 (TK3)');
    expect(logger.log).toHaveBeenCalledWith('   Admin Key: ✅ Present');
    expect(logger.log).toHaveBeenCalledWith('   Supply Key: ✅ Present');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('filters tokens by current network', () => {
    const logger = makeLogger();
    const tokens = [
      makeTokenData({
        tokenId: '0.0.4444',
        name: 'Testnet Token',
        symbol: 'TST',
        network: 'testnet',
      }),
    ];

    MockedHelper.mockImplementation(() => ({
      listTokens: jest.fn().mockReturnValue([
        ...tokens,
        makeTokenData({
          tokenId: '0.0.5555',
          name: 'Mainnet Token',
          symbol: 'MNT',
          network: 'mainnet',
        }),
      ]),
      getTokenStats: jest.fn().mockReturnValue({
        total: 2,
        byNetwork: { testnet: 1, mainnet: 1 },
        bySupplyType: { INFINITE: 2 },
        withAssociations: 0,
        totalAssociations: 0,
      }),
    }));

    const api: Partial<CoreAPI> = {
      state: {} as any,
      logger,
      network: {
        getCurrentNetwork: jest.fn().mockReturnValue('testnet'),
      } as any,
      alias: {
        list: jest.fn().mockReturnValue([]),
      } as any,
    };
    const args = makeArgs(api, logger, {});

    listTokensHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Found 1 token(s) for network testnet'),
    );
    expect(logger.log).toHaveBeenCalledWith('1. Testnet Token (TST)');
    expect(logger.log).toHaveBeenCalledWith('   Token ID: 0.0.4444');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('filters tokens by specified network', () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      listTokens: jest.fn().mockReturnValue([
        makeTokenData({
          tokenId: '0.0.4444',
          name: 'Testnet Token',
          symbol: 'TST',
          network: 'testnet',
        }),
        makeTokenData({
          tokenId: '0.0.5555',
          name: 'Mainnet Token',
          symbol: 'MNT',
          network: 'mainnet',
        }),
      ]),
      getTokenStats: jest.fn().mockReturnValue({
        total: 2,
        byNetwork: { testnet: 1, mainnet: 1 },
        bySupplyType: { INFINITE: 2 },
        withAssociations: 0,
        totalAssociations: 0,
      }),
    }));

    const api: Partial<CoreAPI> = {
      state: {} as any,
      logger,
      network: {
        getCurrentNetwork: jest.fn().mockReturnValue('testnet'),
      } as any,
      alias: {
        list: jest.fn().mockReturnValue([]),
      } as any,
    };
    const args = makeArgs(api, logger, { network: 'mainnet' });

    listTokensHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Found 1 token(s) for network mainnet'),
    );
    expect(logger.log).toHaveBeenCalledWith('1. Mainnet Token (MNT)');
    expect(logger.log).toHaveBeenCalledWith('   Token ID: 0.0.5555');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs message when no tokens match network filter', () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      listTokens: jest.fn().mockReturnValue([
        makeTokenData({
          tokenId: '0.0.5555',
          name: 'Testnet Token',
          symbol: 'TST',
          network: 'testnet',
        }),
      ]),
      getTokenStats: jest.fn().mockReturnValue({
        total: 1,
        byNetwork: { testnet: 1 },
        bySupplyType: { INFINITE: 1 },
        withAssociations: 0,
        totalAssociations: 0,
      }),
    }));

    const api: Partial<CoreAPI> = {
      state: {} as any,
      logger,
      network: {
        getCurrentNetwork: jest.fn().mockReturnValue('testnet'),
      } as any,
      alias: {
        list: jest.fn().mockReturnValue([]),
      } as any,
    };
    const args = makeArgs(api, logger, { network: 'mainnet' });

    listTokensHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('No tokens found for network: mainnet'),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('displays token aliases when available', () => {
    const logger = makeLogger();
    const tokens = [
      makeTokenData({
        tokenId: '0.0.1111',
        name: 'My Token',
        symbol: 'MTK',
        network: 'testnet',
      }),
    ];

    MockedHelper.mockImplementation(() => ({
      listTokens: jest.fn().mockReturnValue(tokens),
      getTokenStats: jest.fn().mockReturnValue({
        total: 1,
        byNetwork: { testnet: 1 },
        bySupplyType: { INFINITE: 1 },
        withAssociations: 0,
        totalAssociations: 0,
      }),
    }));

    const api: Partial<CoreAPI> = {
      state: {} as any,
      logger,
      network: {
        getCurrentNetwork: jest.fn().mockReturnValue('testnet'),
      } as any,
      alias: {
        list: jest.fn().mockReturnValue([
          {
            alias: 'my-token',
            type: 'token',
            network: 'testnet',
            entityId: '0.0.1111',
          },
        ]),
      } as any,
    };
    const args = makeArgs(api, logger, {});

    listTokensHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      '1. My Token (MTK) - alias: my-token',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('displays statistics correctly', () => {
    const logger = makeLogger();
    const tokens = [
      makeTokenData({
        tokenId: '0.0.1111',
        name: 'Token 1',
        symbol: 'TK1',
        network: 'testnet',
        supplyType: 'INFINITE',
        associations: [{ name: 'Account 1', accountId: '0.0.9999' }],
      }),
      makeTokenData({
        tokenId: '0.0.2222',
        name: 'Token 2',
        symbol: 'TK2',
        network: 'testnet',
        supplyType: 'FINITE',
        maxSupply: 1000000,
      }),
    ];

    MockedHelper.mockImplementation(() => ({
      listTokens: jest.fn().mockReturnValue(tokens),
      getTokenStats: jest.fn().mockReturnValue({
        total: 2,
        byNetwork: { testnet: 2 },
        bySupplyType: { INFINITE: 1, FINITE: 1 },
        withAssociations: 1,
        totalAssociations: 1,
      }),
    }));

    const api: Partial<CoreAPI> = {
      state: {} as any,
      logger,
      network: {
        getCurrentNetwork: jest.fn().mockReturnValue('testnet'),
      } as any,
      alias: {
        list: jest.fn().mockReturnValue([]),
      } as any,
    };
    const args = makeArgs(api, logger, {});

    listTokensHandler(args);

    expect(logger.log).toHaveBeenCalledWith('Total Tokens: 2');
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('INFINITE: 1'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('FINITE: 1'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('With Associations: 1'),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('displays max supply for FINITE tokens', () => {
    const logger = makeLogger();
    const tokens = [
      makeTokenData({
        tokenId: '0.0.1111',
        name: 'Finite Token',
        symbol: 'FNT',
        network: 'testnet',
        supplyType: 'FINITE',
        maxSupply: 500000,
      }),
    ];

    MockedHelper.mockImplementation(() => ({
      listTokens: jest.fn().mockReturnValue(tokens),
      getTokenStats: jest.fn().mockReturnValue({
        total: 1,
        byNetwork: { testnet: 1 },
        bySupplyType: { FINITE: 1 },
        withAssociations: 0,
        totalAssociations: 0,
      }),
    }));

    const api: Partial<CoreAPI> = {
      state: {} as any,
      logger,
      network: {
        getCurrentNetwork: jest.fn().mockReturnValue('testnet'),
      } as any,
      alias: {
        list: jest.fn().mockReturnValue([]),
      } as any,
    };
    const args = makeArgs(api, logger, {});

    listTokensHandler(args);

    expect(logger.log).toHaveBeenCalledWith('   Supply Type: FINITE');
    expect(logger.log).toHaveBeenCalledWith('   Max Supply: 500000');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error and exits when listTokens throws', () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      listTokens: jest.fn().mockImplementation(() => {
        throw new Error('database error');
      }),
    }));

    const api: Partial<CoreAPI> = {
      state: {} as any,
      logger,
      network: {
        getCurrentNetwork: jest.fn().mockReturnValue('testnet'),
      } as any,
      alias: {
        list: jest.fn().mockReturnValue([]),
      } as any,
    };
    const args = makeArgs(api, logger, {});

    listTokensHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to list tokens'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
