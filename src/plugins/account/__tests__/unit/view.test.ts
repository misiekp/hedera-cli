import { viewAccountHandler } from '../../commands/view';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import type { CoreAPI } from '../../../../core/core-api/core-api.interface';
import type { HederaMirrornodeService } from '../../../../core/services/mirrornode/hedera-mirrornode-service.interface';
import {
  makeLogger,
  makeAccountData,
  makeArgs,
  makeMirrorMock,
  setupExitSpy,
} from '../../../../../__tests__/helpers/plugin';

let exitSpy: jest.SpyInstance;

jest.mock('../../zustand-state-helper', () => ({
  ZustandAccountStateHelper: jest.fn(),
}));

const MockedHelper = ZustandAccountStateHelper as jest.Mock;

beforeAll(() => {
  exitSpy = setupExitSpy();
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

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn().mockReturnValue(account),
    }));

    const mirrorMock = makeMirrorMock();
    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
    };
    const args = makeArgs(api, logger, { accountIdOrNameOrAlias: 'acc1' });

    await viewAccountHandler(args);

    expect(logger.log).toHaveBeenCalledWith('Viewing account details: acc1');
    expect(logger.log).toHaveBeenCalledWith('Found account in state: acc1');
    expect(mirrorMock.getAccount).toHaveBeenCalledWith('0.0.1111');
    expect(logger.log).toHaveBeenCalledWith('📋 Account Details:');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('views account details when not found in state', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn().mockReturnValue(null),
    }));

    const mirrorMock = makeMirrorMock();
    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      logger,
    };
    const args = makeArgs(api, logger, { accountIdOrNameOrAlias: '0.0.2222' });

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

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn().mockResolvedValue(null),
    }));

    const mirrorMock = makeMirrorMock({
      getAccountImpl: jest.fn().mockRejectedValue(new Error('mirror down')),
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

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn().mockImplementation(() => {
        throw new Error('state error');
      }),
    }));

    const mirrorMock = makeMirrorMock();
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
