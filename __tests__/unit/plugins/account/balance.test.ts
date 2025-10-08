import type { CommandHandlerArgs } from '../../../../src/core/plugins/plugin.interface';
import { getAccountBalanceHandler } from '../../../../src/plugins/account/commands/balance';
import { ZustandAccountStateHelper } from '../../../../src/plugins/account/zustand-state-helper';
import { Logger } from '../../../../src/core/services/logger/logger-service.interface';
import type { HederaMirrornodeService } from '../../../../src/core/services/mirrornode/hedera-mirrornode-service.interface';
import type { CoreAPI } from '../../../../src/core/core-api/core-api.interface';
import type { AccountData } from '../../../../src/plugins/account/schema';

let exitSpy: jest.SpyInstance;

jest.mock('../../../../src/plugins/account/zustand-state-helper', () => ({
  ZustandAccountStateHelper: jest.fn(),
}));

const MockedHelper = ZustandAccountStateHelper as jest.Mock;

const makeLogger = (): jest.Mocked<Logger> => ({
  log: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  warn: jest.fn(),
});

const makeAccountData = (
  overrides: Partial<AccountData> = {},
): AccountData => ({
  name: 'default',
  accountId: '0.0.1234',
  type: 'ECDSA',
  publicKey: 'pk',
  evmAddress: '0x0000000000000000000000000000000000000000',
  solidityAddress: 'sa',
  solidityAddressFull: 'safull',
  privateKey: 'priv',
  network: 'testnet',
  ...overrides,
});

const makeMirrorMocks = ({
  hbarBalance = 0n,
  tokenBalances,
  tokenError,
}: {
  hbarBalance?: bigint;
  tokenBalances?: { token_id: string; balance: number }[];
  tokenError?: Error;
}): Partial<HederaMirrornodeService> => {
  return {
    getAccountHBarBalance: jest.fn().mockResolvedValue(hbarBalance),
    getAccountTokenBalances: tokenError
      ? jest.fn().mockRejectedValue(tokenError)
      : jest.fn().mockResolvedValue({ tokens: tokenBalances ?? [] }),
  };
};

const makeArgs = (
  api: Partial<CoreAPI>,
  logger: jest.Mocked<Logger>,
  args: Record<string, unknown>,
): CommandHandlerArgs => ({
  api: api as CoreAPI,
  logger,
  state: {} as any,
  config: {} as any,
  args,
});

beforeAll(() => {
  exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
    return undefined as never;
  });
});

afterAll(() => {
  exitSpy.mockRestore();
});

describe('account plugin - balance command (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('prints only HBAR balance', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest
        .fn()
        .mockReturnValue(
          makeAccountData({ accountId: '0.0.1001', name: 'test-account' }),
        ),
    }));

    const mirrorMock = makeMirrorMocks({ hbarBalance: 123456n });

    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
    };
    const args = makeArgs(api, logger, {
      accountIdOrName: 'test-account',
      'only-hbar': true,
    });

    await getAccountBalanceHandler(args);

    expect(mirrorMock.getAccountHBarBalance).toHaveBeenCalledWith('0.0.1001');
    expect(logger.log).toHaveBeenCalledWith('💰 Hbar Balance: 123456 tinybars');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('prints HBAR and token balances', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest
        .fn()
        .mockReturnValue(
          makeAccountData({ accountId: '0.0.2002', name: 'acc2' }),
        ),
    }));

    const mirrorMock = makeMirrorMocks({
      hbarBalance: 5000n,
      tokenBalances: [
        { token_id: '0.0.3003', balance: 100 },
        { token_id: '0.0.4004', balance: 200 },
      ],
    });

    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
    };
    const args = makeArgs(api, logger, { accountIdOrName: 'acc2' });

    await getAccountBalanceHandler(args);

    expect(mirrorMock.getAccountHBarBalance).toHaveBeenCalledWith('0.0.2002');
    expect(mirrorMock.getAccountTokenBalances).toHaveBeenCalledWith('0.0.2002');
    expect(logger.log).toHaveBeenCalledWith(
      '💰 Account Balance: 5000 tinybars',
    );
    expect(logger.log).toHaveBeenCalledWith('🪙 Token Balances:');
    expect(logger.log).toHaveBeenCalledWith('   0.0.3003: 100');
    expect(logger.log).toHaveBeenCalledWith('   0.0.4004: 200');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('prints HBAR but no token balances found', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn().mockReturnValue(
        makeAccountData({
          accountId: '0.0.5005',
          name: 'acc3',
          type: 'ED25519',
        }),
      ),
    }));

    const mirrorMock = makeMirrorMocks({ hbarBalance: 42n, tokenBalances: [] });

    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
    };
    const args = makeArgs(api, logger, { accountIdOrName: 'acc3' });

    await getAccountBalanceHandler(args);

    expect(logger.log).toHaveBeenCalledWith('💰 Account Balance: 42 tinybars');
    expect(logger.log).toHaveBeenCalledWith('   No token balances found');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error and exits when token balances fetch fails', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest
        .fn()
        .mockReturnValue(
          makeAccountData({ accountId: '0.0.6006', name: 'acc4' }),
        ),
    }));

    const mirrorMock = makeMirrorMocks({
      hbarBalance: 77n,
      tokenError: new Error('mirror error'),
    });

    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
    };
    const args = makeArgs(api, logger, { accountIdOrName: 'acc4' });

    await getAccountBalanceHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      '   Could not fetch token balances: mirror error',
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('logs error and exits when main try-catch fails', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn().mockImplementation(() => {
        throw new Error('state failure');
      }),
    }));

    const mirrorMock: Pick<HederaMirrornodeService, 'getAccountHBarBalance'> = {
      getAccountHBarBalance: jest.fn(),
    };

    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
    };
    const args = makeArgs(api, logger, { accountIdOrName: 'broken' });

    await getAccountBalanceHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to get account balance'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
