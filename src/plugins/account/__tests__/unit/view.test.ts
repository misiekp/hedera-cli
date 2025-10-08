import type { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { viewAccountHandler } from '../../commands/view';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import type { CoreAPI } from '../../../../core/core-api/core-api.interface';
import type { HederaMirrornodeService } from '../../../../core/services/mirrornode/hedera-mirrornode-service.interface';
import {
  makeLogger,
  makeAccountData,
  makeMirrorNodeMock,
  makeAccountStateHelperMock,
  makeArgs,
} from './helpers/mocks';

let exitSpy: jest.SpyInstance;

jest.mock('../../zustand-state-helper', () => ({
  ZustandAccountStateHelper: jest.fn(),
}));

const MockedHelper = ZustandAccountStateHelper as jest.Mock;

beforeAll(() => {
  exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
    return undefined as never;
  });
});

afterAll(() => {
  exitSpy.mockRestore();
});

describe('account plugin - view command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('views account details when found in state', async () => {
    const logger = makeLogger();
    const account = makeAccountData({ name: 'acc1', accountId: '0.0.1111' });

    const helperMock = makeAccountStateHelperMock({
      loadAccount: jest.fn().mockReturnValue(account),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const mirrorMock = makeMirrorNodeMock();
    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
    };
    const args = makeArgs(api, logger, { accountIdOrName: 'acc1' });

    await viewAccountHandler(args);

    expect(logger.log).toHaveBeenCalledWith('Viewing account details: acc1');
    expect(logger.log).toHaveBeenCalledWith('Found account in state: acc1');
    expect(mirrorMock.getAccount).toHaveBeenCalledWith('0.0.1111');
    expect(logger.log).toHaveBeenCalledWith('📋 Account Details:');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('views account details when not found in state', async () => {
    const logger = makeLogger();

    const helperMock = makeAccountStateHelperMock({
      loadAccount: jest.fn().mockReturnValue(null),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const mirrorMock = makeMirrorNodeMock();
    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
    };
    const args = makeArgs(api, logger, { accountIdOrName: '0.0.2222' });

    await viewAccountHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      'Viewing account details: 0.0.2222',
    );
    expect(mirrorMock.getAccount).toHaveBeenCalledWith('0.0.2222');
    expect(logger.log).toHaveBeenCalledWith('📋 Account Details:');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error and exits when mirror.getAccount throws', async () => {
    const logger = makeLogger();

    const helperMock = makeAccountStateHelperMock({
      loadAccount: jest.fn().mockResolvedValue(null),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const mirrorMock = makeMirrorNodeMock({
      getAccount: jest.fn().mockRejectedValue(new Error('mirror down')),
    });
    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
    };
    const args = makeArgs(api, logger, { accountIdOrName: '0.0.3333' });

    await viewAccountHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to view account'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('logs error and exits when loadAccount throws', async () => {
    const logger = makeLogger();

    const helperMock = makeAccountStateHelperMock({
      loadAccount: jest.fn().mockImplementation(() => {
        throw new Error('state error');
      }),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const mirrorMock = makeMirrorNodeMock();
    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
    };
    const args = makeArgs(api, logger, { accountIdOrName: 'broken' });

    await viewAccountHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to view account'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
