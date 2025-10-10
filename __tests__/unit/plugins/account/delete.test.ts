import type { CommandHandlerArgs } from '../../../../src/core/plugins/plugin.interface';
import { deleteAccountHandler } from '../../../../src/plugins/account/commands/delete';
import { ZustandAccountStateHelper } from '../../../../src/plugins/account/zustand-state-helper';
import { Logger } from '../../../../src/core/services/logger/logger-service.interface';
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
