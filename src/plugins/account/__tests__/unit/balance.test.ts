import getAccountBalanceHandler from '../../commands/balance/handler';
import type { AccountBalanceOutput } from '../../commands/balance';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import type { CoreApi } from '../../../../core/core-api/core-api.interface';
import type { HederaMirrornodeService } from '../../../../core/services/mirrornode/hedera-mirrornode-service.interface';
import {
  makeLogger,
  makeAccountData,
  makeArgs,
  makeMirrorMock,
} from '../../../../../__tests__/helpers/plugin';

jest.mock('../../zustand-state-helper', () => ({
  ZustandAccountStateHelper: jest.fn(),
}));

const MockedHelper = ZustandAccountStateHelper as jest.Mock;

describe('account plugin - balance command (ADR-003)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns HBAR balance only when only-hbar flag is set', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest
        .fn()
        .mockReturnValue(
          makeAccountData({ accountId: '0.0.1001', name: 'test-account' }),
        ),
    }));

    const mirrorMock = makeMirrorMock({ hbarBalance: 123456n });

    const api: Partial<CoreApi> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
      state: {} as any,
    };
    const args = makeArgs(api, logger, {
      accountIdOrNameOrAlias: 'test-account',
      'only-hbar': true,
    });

    const result = await getAccountBalanceHandler(args);

    expect(mirrorMock.getAccountHBarBalance).toHaveBeenCalledWith('0.0.1001');
    expect(result.status).toBe('success');
    expect(result.outputJson).toBeDefined();

    const output: AccountBalanceOutput = JSON.parse(result.outputJson!);
    expect(output.accountId).toBe('0.0.1001');
    expect(output.hbarBalance).toBe('123456');
    expect(output.tokenBalances).toBeUndefined();
  });

  test('returns HBAR and token balances', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest
        .fn()
        .mockReturnValue(
          makeAccountData({ accountId: '0.0.2002', name: 'acc2' }),
        ),
    }));

    const mirrorMock = makeMirrorMock({
      hbarBalance: 5000n,
      tokenBalances: [
        { token_id: '0.0.3003', balance: 100 },
        { token_id: '0.0.4004', balance: 200 },
      ],
    });

    const api: Partial<CoreApi> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
      state: {} as any,
    };
    const args = makeArgs(api, logger, { accountIdOrNameOrAlias: 'acc2' });

    const result = await getAccountBalanceHandler(args);

    expect(mirrorMock.getAccountHBarBalance).toHaveBeenCalledWith('0.0.2002');
    expect(mirrorMock.getAccountTokenBalances).toHaveBeenCalledWith('0.0.2002');
    expect(result.status).toBe('success');
    expect(result.outputJson).toBeDefined();

    const output: AccountBalanceOutput = JSON.parse(result.outputJson!);
    expect(output.accountId).toBe('0.0.2002');
    expect(output.hbarBalance).toBe('5000');
    expect(output.tokenBalances).toHaveLength(2);
    expect(output.tokenBalances![0]).toEqual({
      tokenId: '0.0.3003',
      balance: '100',
    });
    expect(output.tokenBalances![1]).toEqual({
      tokenId: '0.0.4004',
      balance: '200',
    });
  });

  test('returns HBAR balance without token balances when none found', async () => {
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

    const mirrorMock = makeMirrorMock({ hbarBalance: 42n, tokenBalances: [] });

    const api: Partial<CoreApi> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
      state: {} as any,
    };
    const args = makeArgs(api, logger, { accountIdOrNameOrAlias: 'acc3' });

    const result = await getAccountBalanceHandler(args);

    expect(result.status).toBe('success');
    expect(result.outputJson).toBeDefined();

    const output: AccountBalanceOutput = JSON.parse(result.outputJson!);
    expect(output.accountId).toBe('0.0.5005');
    expect(output.hbarBalance).toBe('42');
    expect(output.tokenBalances).toBeUndefined();
  });

  test('returns failure when token balances fetch fails', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest
        .fn()
        .mockReturnValue(
          makeAccountData({ accountId: '0.0.6006', name: 'acc4' }),
        ),
    }));

    const mirrorMock = makeMirrorMock({
      hbarBalance: 77n,
      tokenError: new Error('mirror error'),
    });

    const api: Partial<CoreApi> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
      state: {} as any,
    };
    const args = makeArgs(api, logger, { accountIdOrNameOrAlias: 'acc4' });

    const result = await getAccountBalanceHandler(args);

    expect(result.status).toBe('failure');
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).toContain('Could not fetch token balances');
    expect(result.errorMessage).toContain('mirror error');
  });

  test('returns failure when main try-catch fails', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn().mockImplementation(() => {
        throw new Error('state failure');
      }),
    }));

    const mirrorMock: Pick<HederaMirrornodeService, 'getAccountHBarBalance'> = {
      getAccountHBarBalance: jest.fn(),
    };

    const api: Partial<CoreApi> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
      state: {} as any,
    };
    const args = makeArgs(api, logger, { accountIdOrNameOrAlias: 'broken' });

    const result = await getAccountBalanceHandler(args);

    expect(result.status).toBe('failure');
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).toContain('Failed to get account balance');
    expect(result.errorMessage).toContain('state failure');
  });
});
