import viewAccountHandler from '../../commands/view/handler';
import type { ViewAccountOutput } from '../../commands/view';
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

describe('account plugin - view command (ADR-003)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns account details when found in state', async () => {
    const logger = makeLogger();
    const account = makeAccountData({ name: 'acc1', accountId: '0.0.1111' });

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn().mockReturnValue(account),
    }));

    const mirrorMock = makeMirrorMock({
      accountInfo: {
        accountId: '0.0.1111',
        balance: { balance: 1000n, timestamp: '1234567890' },
        evmAddress: '0xabc',
        accountPublicKey: 'pubKey',
      },
    });
    const api: Partial<CoreApi> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
      state: {} as any,
    };
    const args = makeArgs(api, logger, { accountIdOrNameOrAlias: 'acc1' });

    const result = await viewAccountHandler(args);

    expect(logger.log).toHaveBeenCalledWith('Viewing account details: acc1');
    expect(logger.log).toHaveBeenCalledWith('Found account in state: acc1');
    expect(mirrorMock.getAccount).toHaveBeenCalledWith('0.0.1111');

    expect(result.status).toBe('success');
    expect(result.outputJson).toBeDefined();

    const output: ViewAccountOutput = JSON.parse(result.outputJson!);
    expect(output.accountId).toBe('0.0.1111');
    expect(output.balance).toBe('1000');
  });

  test('returns account details when not found in state', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn().mockReturnValue(null),
    }));

    const mirrorMock = makeMirrorMock({
      accountInfo: {
        accountId: '0.0.2222',
        balance: { balance: 2000n, timestamp: '1234567890' },
        evmAddress: '0xdef',
        accountPublicKey: 'pubKey2',
      },
    });
    const api: Partial<CoreApi> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
      state: {} as any,
    };
    const args = makeArgs(api, logger, { accountIdOrNameOrAlias: '0.0.2222' });

    const result = await viewAccountHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      'Viewing account details: 0.0.2222',
    );
    expect(mirrorMock.getAccount).toHaveBeenCalledWith('0.0.2222');

    expect(result.status).toBe('success');
    expect(result.outputJson).toBeDefined();

    const output: ViewAccountOutput = JSON.parse(result.outputJson!);
    expect(output.accountId).toBe('0.0.2222');
  });

  test('returns failure when mirror.getAccount throws', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn().mockResolvedValue(null),
    }));

    const mirrorMock = makeMirrorMock({
      getAccountImpl: jest.fn().mockRejectedValue(new Error('mirror down')),
    });
    const api: Partial<CoreApi> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
      state: {} as any,
    };
    const args = makeArgs(api, logger, { accountIdOrNameOrAlias: '0.0.3333' });

    const result = await viewAccountHandler(args);

    expect(result.status).toBe('failure');
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).toContain('Failed to view account');
    expect(result.errorMessage).toContain('mirror down');
  });

  test('returns failure when loadAccount throws', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn().mockImplementation(() => {
        throw new Error('state error');
      }),
    }));

    const mirrorMock = makeMirrorMock();
    const api: Partial<CoreApi> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
      state: {} as any,
    };
    const args = makeArgs(api, logger, { accountIdOrNameOrAlias: 'broken' });

    const result = await viewAccountHandler(args);

    expect(result.status).toBe('failure');
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).toContain('Failed to view account');
    expect(result.errorMessage).toContain('state error');
  });
});
