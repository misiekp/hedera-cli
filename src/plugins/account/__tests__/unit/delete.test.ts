import type { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { deleteAccountHandler } from '../../commands/delete';
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

describe('account plugin - delete command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deletes account successfully by name', async () => {
    const logger = makeLogger();
    const account = makeAccountData({ name: 'acc1', accountId: '0.0.1111' });

    const helperMock = makeAccountStateHelperMock({
      loadAccount: jest.fn().mockReturnValue(account),
      deleteAccount: jest.fn().mockReturnValue(undefined),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, { name: 'acc1' });

    deleteAccountHandler(args);

    expect(helperMock.deleteAccount).toHaveBeenCalledWith('acc1');
    expect(logger.log).toHaveBeenCalledWith(
      '✅ Account deleted successfully: acc1 (0.0.1111)',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('deletes account successfully by id', async () => {
    const logger = makeLogger();
    const account = makeAccountData({ name: 'acc2', accountId: '0.0.2222' });

    const helperMock = makeAccountStateHelperMock({
      listAccounts: jest.fn().mockReturnValue([account]),
      deleteAccount: jest.fn().mockReturnValue(undefined),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, { id: '0.0.2222' });

    deleteAccountHandler(args);

    expect(helperMock.deleteAccount).toHaveBeenCalledWith('acc2');
    expect(logger.log).toHaveBeenCalledWith(
      '✅ Account deleted successfully: acc2 (0.0.2222)',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error when no name or id provided', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => makeAccountStateHelperMock());

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, {});

    deleteAccountHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to delete account'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('logs error when account with given name not found', async () => {
    const logger = makeLogger();

    const helperMock = makeAccountStateHelperMock({
      loadAccount: jest.fn().mockReturnValue(null),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, { name: 'missingAcc' });

    deleteAccountHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to delete account'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('logs error when account with given id not found', async () => {
    const logger = makeLogger();

    const helperMock = makeAccountStateHelperMock({
      listAccounts: jest
        .fn()
        .mockReturnValue([makeAccountData({ accountId: '0.0.3333' })]),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, { id: '0.0.4444' });

    deleteAccountHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to delete account'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('logs error when deleteAccount throws', async () => {
    const logger = makeLogger();
    const account = makeAccountData({ name: 'acc5', accountId: '0.0.5555' });

    const helperMock = makeAccountStateHelperMock({
      loadAccount: jest.fn().mockReturnValue(account),
      deleteAccount: jest.fn().mockImplementation(() => {
        throw new Error('db error');
      }),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, { name: 'acc5' });

    deleteAccountHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to delete account'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
