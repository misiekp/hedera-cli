import type { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import { clearAccountsHandler } from '../../commands/clear';
import {
  makeLogger,
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

describe('account plugin - clear command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('clears all accounts (happy path)', async () => {
    const logger = makeLogger();

    const listAccountsMock = jest
      .fn()
      .mockResolvedValue([{ name: 'a' }, { name: 'b' }]);
    const clearAccountsMock = jest.fn().mockResolvedValue(undefined);

    MockedHelper.mockImplementation(() => ({
      listAccounts: listAccountsMock,
      clearAccounts: clearAccountsMock,
    }));

    const args: Partial<CommandHandlerArgs> = {
      api: { state: {} } as any,
      logger,
      args: {},
    };

    await clearAccountsHandler(args as CommandHandlerArgs);

    expect(MockedHelper).toHaveBeenCalledWith(args.api!.state, logger);
    expect(listAccountsMock).toHaveBeenCalledTimes(1);
    expect(clearAccountsMock).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('Clearing all accounts...');
    expect(logger.log).toHaveBeenCalledWith(
      '✅ Cleared 2 account(s) from the address book',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error and exits with code 1 when clear fails', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      listAccounts: jest.fn().mockResolvedValue([{ name: 'a' }]),
      clearAccounts: jest.fn().mockRejectedValue(new Error('db error')),
    }));

    const args: Partial<CommandHandlerArgs> = {
      api: { state: {} } as any,
      logger,
      args: {},
    };

    await clearAccountsHandler(args as CommandHandlerArgs);

    expect(logger.error).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
