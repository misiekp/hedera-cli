import { listTokensHandler } from '../../commands/list';
import { ZustandTokenStateHelper } from '../../zustand-state-helper';
import {
  makeLogger,
  makeApiMocks,
  setupZustandHelperMock,
} from './helpers/mocks';
import {
  makeTokenData,
  makeTokenStats,
  mockListTokens,
  mockTokenStats,
} from './helpers/fixtures';
import {
  makeArgs,
  setupExitSpy,
} from '../../../../../__tests__/helpers/plugin';

let exitSpy: jest.SpyInstance;

jest.mock('../../zustand-state-helper', () => ({
  ZustandTokenStateHelper: jest.fn(),
}));

const MockedHelper = ZustandTokenStateHelper as jest.Mock;

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
    setupZustandHelperMock(MockedHelper, {
      tokens: mockListTokens.empty,
      stats: mockTokenStats.empty,
    });

    const { api } = makeApiMocks({
      network: 'testnet',
      alias: {
        list: jest.fn().mockReturnValue([]),
      },
    });
    const args = makeArgs(api, logger, {});

    listTokensHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('No tokens found for current network: testnet'),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('lists tokens without keys', () => {
    const logger = makeLogger();
    setupZustandHelperMock(MockedHelper, {
      tokens: mockListTokens.twoTokens,
      stats: mockTokenStats.twoTokens,
    });

    const { api } = makeApiMocks({
      network: 'testnet',
      alias: {
        list: jest.fn().mockReturnValue([]),
      },
    });
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
    setupZustandHelperMock(MockedHelper, {
      tokens: mockListTokens.withKeys,
      stats: mockTokenStats.withKeys,
    });

    const { api } = makeApiMocks({
      network: 'testnet',
      alias: {
        list: jest.fn().mockReturnValue([]),
      },
    });
    const args = makeArgs(api, logger, { keys: true });

    listTokensHandler(args);

    expect(logger.log).toHaveBeenCalledWith('1. Token 3 (TK3)');
    expect(logger.log).toHaveBeenCalledWith('   Admin Key: ✅ Present');
    expect(logger.log).toHaveBeenCalledWith('   Supply Key: ✅ Present');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('filters tokens by current network', () => {
    const logger = makeLogger();
    setupZustandHelperMock(MockedHelper, {
      tokens: mockListTokens.multiNetwork,
      stats: mockTokenStats.multiNetwork,
    });

    const { api } = makeApiMocks({
      network: 'testnet',
      alias: {
        list: jest.fn().mockReturnValue([]),
      },
    });
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
    setupZustandHelperMock(MockedHelper, {
      tokens: mockListTokens.multiNetwork,
      stats: mockTokenStats.multiNetwork,
    });

    const { api } = makeApiMocks({
      network: 'testnet',
      alias: {
        list: jest.fn().mockReturnValue([]),
      },
    });
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
    setupZustandHelperMock(MockedHelper, {
      tokens: [
        makeTokenData({
          tokenId: '0.0.5555',
          name: 'Testnet Token',
          symbol: 'TST',
          network: 'testnet',
        }),
      ],
      stats: makeTokenStats({
        total: 1,
        byNetwork: { testnet: 1 },
        bySupplyType: { INFINITE: 1 },
      }),
    });

    const { api } = makeApiMocks({
      network: 'testnet',
      alias: {
        list: jest.fn().mockReturnValue([]),
      },
    });
    const args = makeArgs(api, logger, { network: 'mainnet' });

    listTokensHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('No tokens found for network: mainnet'),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('displays token aliases when available', () => {
    const logger = makeLogger();
    setupZustandHelperMock(MockedHelper, {
      tokens: [
        makeTokenData({
          tokenId: '0.0.1111',
          name: 'My Token',
          symbol: 'MTK',
          network: 'testnet',
        }),
      ],
      stats: makeTokenStats({
        total: 1,
        byNetwork: { testnet: 1 },
        bySupplyType: { INFINITE: 1 },
      }),
    });

    const { api } = makeApiMocks({
      network: 'testnet',
      alias: {
        list: jest.fn().mockReturnValue([
          {
            alias: 'my-token',
            type: 'token',
            network: 'testnet',
            entityId: '0.0.1111',
          },
        ]),
      },
    });
    const args = makeArgs(api, logger, {});

    listTokensHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      '1. My Token (MTK) - alias: my-token',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('displays statistics correctly', () => {
    const logger = makeLogger();
    setupZustandHelperMock(MockedHelper, {
      tokens: mockListTokens.withAssociations,
      stats: mockTokenStats.withAssociations,
    });

    const { api } = makeApiMocks({
      network: 'testnet',
      alias: {
        list: jest.fn().mockReturnValue([]),
      },
    });
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
    setupZustandHelperMock(MockedHelper, {
      tokens: mockListTokens.finiteSupply,
      stats: mockTokenStats.finiteSupply,
    });

    const { api } = makeApiMocks({
      network: 'testnet',
      alias: {
        list: jest.fn().mockReturnValue([]),
      },
    });
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

    const { api } = makeApiMocks({
      network: 'testnet',
      alias: {
        list: jest.fn().mockReturnValue([]),
      },
    });
    const args = makeArgs(api, logger, {});

    listTokensHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to list tokens'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
