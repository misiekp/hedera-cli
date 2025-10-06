import type { CommandHandlerArgs } from '../../../../src/core/plugins/plugin.interface';
import listAccountsHandler from '../../../../src/plugins/account/commands/list';
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

describe('account plugin - list command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('logs message when no accounts exist', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      listAccounts: jest.fn().mockReturnValue([]),
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, {});

    await listAccountsHandler(args);

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

    MockedHelper.mockImplementation(() => ({
      listAccounts: jest.fn().mockReturnValue(accounts),
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, {});

    await listAccountsHandler(args);

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

    MockedHelper.mockImplementation(() => ({
      listAccounts: jest.fn().mockReturnValue(accounts),
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, { private: true });

    await listAccountsHandler(args);

    expect(logger.log).toHaveBeenCalledWith('1. Name: acc3');
    expect(logger.log).toHaveBeenCalledWith('   Private Key: priv');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error and exits when listAccounts throws', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      listAccounts: jest.fn().mockImplementation(() => {
        throw new Error('db error');
      }),
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, {});

    await listAccountsHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to list accounts'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
