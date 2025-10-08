import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import { clearAccountsHandler } from '../../commands/clear';
import { makeLogger, makeAccountStateHelperMock } from './helpers/mocks';

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

describe('account plugin - clear command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('clears all accounts (happy path)', async () => {
    const logger = makeLogger();

    const helperMock = makeAccountStateHelperMock({
      listAccounts: jest.fn().mockReturnValue([{ name: 'a' }, { name: 'b' }]),
      clearAccounts: jest.fn().mockReturnValue(undefined),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const args: Partial<CommandHandlerArgs> = {
      api: { state: {} } as any,
      logger,
      args: {},
    };

    clearAccountsHandler(args as CommandHandlerArgs);

    expect(MockedHelper).toHaveBeenCalledWith(args.api!.state, logger);
    expect(helperMock.listAccounts).toHaveBeenCalledTimes(1);
    expect(helperMock.clearAccounts).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('Clearing all accounts...');
    expect(logger.log).toHaveBeenCalledWith(
      '✅ Cleared 2 account(s) from the address book',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error and exits with code 1 when clear fails', async () => {
    const logger = makeLogger();

    const helperMock = makeAccountStateHelperMock({
      listAccounts: jest.fn().mockReturnValue([{ name: 'a' }]),
      clearAccounts: jest.fn().mockImplementation(() => {
        throw new Error('db error');
      }),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const args: Partial<CommandHandlerArgs> = {
      api: { state: {} } as any,
      logger,
      args: {},
    };

    clearAccountsHandler(args as CommandHandlerArgs);

    expect(logger.error).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
