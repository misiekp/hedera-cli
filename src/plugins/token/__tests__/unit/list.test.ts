import { listTokensHandler } from '../../commands/list';
import { ZustandTokenStateHelper } from '../../zustand-state-helper';
import { Status } from '../../../../core/shared/constants';
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
import { makeArgs } from '../../../../../__tests__/helpers/plugin';

jest.mock('../../zustand-state-helper', () => ({
  ZustandTokenStateHelper: jest.fn(),
}));

const MockedHelper = ZustandTokenStateHelper as jest.Mock;

describe('token plugin - list command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('logs message when no tokens exist', async () => {
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

    const result = await listTokensHandler(args);

    // ADR-003 compliance: check CommandExecutionResult
    expect(result).toBeDefined();
    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();
    expect(result.errorMessage).toBeUndefined();

    // Parse and verify output JSON
    const output = JSON.parse(result.outputJson!);
    expect(output.tokens).toHaveLength(0);
    expect(output.count).toBe(0);
    expect(output.network).toBe('testnet');
  });

  test('lists tokens without keys', async () => {
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

    const result = await listTokensHandler(args);

    // ADR-003 compliance: check CommandExecutionResult
    expect(result).toBeDefined();
    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();
    expect(result.errorMessage).toBeUndefined();

    // Parse and verify output JSON
    const output = JSON.parse(result.outputJson!);
    expect(output.tokens).toHaveLength(2);
    expect(output.count).toBe(2);
    expect(output.network).toBe('testnet');
    expect(output.tokens[0].name).toBe('Token 1');
    expect(output.tokens[0].symbol).toBe('TK1');
    expect(output.tokens[0].tokenId).toBe('0.0.1111');
  });

  test('lists tokens with keys when flag is set', async () => {
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
    // ADR-003 compliance: exitSpy no longer used
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
    // ADR-003 compliance: exitSpy no longer used
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
    // ADR-003 compliance: exitSpy no longer used
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
    // ADR-003 compliance: exitSpy no longer used
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
    // ADR-003 compliance: exitSpy no longer used
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
    // ADR-003 compliance: exitSpy no longer used
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
    // ADR-003 compliance: exitSpy no longer used
  });

  test('logs error and exits when listTokens throws', async () => {
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

    const result = await listTokensHandler(args);

    // ADR-003 compliance: check CommandExecutionResult
    expect(result).toBeDefined();
    expect(result.status).toBe(Status.Failure);
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).toContain('Failed to list tokens');
    expect(result.outputJson).toBeUndefined();
  });
});
