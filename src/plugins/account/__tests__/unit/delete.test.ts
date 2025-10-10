import { deleteAccountHandler } from '../../commands/delete';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import type { CoreAPI } from '../../../../core/core-api/core-api.interface';
import {
  makeLogger,
  makeAccountData,
  makeArgs,
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

describe('account plugin - delete command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deletes account successfully by name', async () => {
    const logger = makeLogger();
    const account = makeAccountData({ name: 'acc1', accountId: '0.0.1111' });

    const deleteAccountMock = jest.fn().mockResolvedValue(undefined);
    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn().mockResolvedValue(account),
      listAccounts: jest.fn(),
      deleteAccount: deleteAccountMock,
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, { name: 'acc1' });

    await deleteAccountHandler(args);

    expect(deleteAccountMock).toHaveBeenCalledWith('acc1');
    expect(logger.log).toHaveBeenCalledWith(
      '✅ Account deleted successfully: acc1 (0.0.1111)',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('deletes account successfully by id', async () => {
    const logger = makeLogger();
    const account = makeAccountData({ name: 'acc2', accountId: '0.0.2222' });

    const deleteAccountMock = jest.fn().mockResolvedValue(undefined);
    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn(),
      listAccounts: jest.fn().mockResolvedValue([account]),
      deleteAccount: deleteAccountMock,
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, { id: '0.0.2222' });

    await deleteAccountHandler(args);

    expect(deleteAccountMock).toHaveBeenCalledWith('acc2');
    expect(logger.log).toHaveBeenCalledWith(
      '✅ Account deleted successfully: acc2 (0.0.2222)',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error when no name or id provided', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn(),
      listAccounts: jest.fn(),
      deleteAccount: jest.fn(),
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, {});

    await deleteAccountHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to delete account'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('logs error when account with given name not found', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn().mockResolvedValue(null),
      listAccounts: jest.fn(),
      deleteAccount: jest.fn(),
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, { name: 'missingAcc' });

    await deleteAccountHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to delete account'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('logs error when account with given id not found', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn(),
      listAccounts: jest
        .fn()
        .mockResolvedValue([makeAccountData({ accountId: '0.0.3333' })]),
      deleteAccount: jest.fn(),
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, { id: '0.0.4444' });

    await deleteAccountHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to delete account'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('logs error when deleteAccount throws', async () => {
    const logger = makeLogger();
    const account = makeAccountData({ name: 'acc5', accountId: '0.0.5555' });

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn().mockResolvedValue(account),
      listAccounts: jest.fn(),
      deleteAccount: jest.fn().mockRejectedValue(new Error('db error')),
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, { name: 'acc5' });

    await deleteAccountHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to delete account'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
