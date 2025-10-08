import type { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { listAccountsHandler } from '../../commands/list';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import type { CoreAPI } from '../../../../core/core-api/core-api.interface';
import {
  makeLogger,
  makeAccountData,
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

describe('account plugin - list command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('logs message when no accounts exist', async () => {
    const logger = makeLogger();

    const helperMock = makeAccountStateHelperMock({
      listAccounts: jest.fn().mockReturnValue([]),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, {});

    listAccountsHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      '📝 No accounts found in the address book',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('lists accounts without private keys', async () => {
    const logger = makeLogger();
    const accounts = [
      makeAccountData({ name: 'acc1', accountId: '0.0.1111' }),
      makeAccountData({ name: 'acc2', accountId: '0.0.2222' }),
    ];

    const helperMock = makeAccountStateHelperMock({
      listAccounts: jest.fn().mockReturnValue(accounts),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, {});

    listAccountsHandler(args);

    expect(logger.log).toHaveBeenCalledWith('📝 Found 2 account(s):');
    expect(logger.log).toHaveBeenCalledWith('1. Name: acc1');
    expect(logger.log).toHaveBeenCalledWith('   Account ID: 0.0.1111');
    expect(logger.log).not.toHaveBeenCalledWith(
      expect.stringContaining('Private Key'),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('lists accounts with private keys when flag is set', async () => {
    const logger = makeLogger();
    const accounts = [makeAccountData({ name: 'acc3', accountId: '0.0.3333' })];

    const helperMock = makeAccountStateHelperMock({
      listAccounts: jest.fn().mockReturnValue(accounts),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, { private: true });

    listAccountsHandler(args);

    expect(logger.log).toHaveBeenCalledWith('1. Name: acc3');
    expect(logger.log).toHaveBeenCalledWith('   Private Key: priv');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error and exits when listAccounts throws', async () => {
    const logger = makeLogger();

    const helperMock = makeAccountStateHelperMock({
      listAccounts: jest.fn().mockImplementation(() => {
        throw new Error('db error');
      }),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, {});

    listAccountsHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to list accounts'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
