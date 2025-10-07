import type { CommandHandlerArgs } from '../../../../src/core/plugins/plugin.interface';
import { viewAccountHandler } from '../../../../src/plugins/account/commands/view';
import { ZustandAccountStateHelper } from '../../../../src/plugins/account/zustand-state-helper';
import { Logger } from '../../../../src/core/services/logger/logger-service.interface';
import type { CoreAPI } from '../../../../src/core/core-api/core-api.interface';
import type { HederaMirrornodeService } from '../../../../src/core/services/mirrornode/hedera-mirrornode-service.interface';
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

const makeMirrorMock = (overrides?: {
  getAccountImpl?: jest.Mock;
}): Partial<HederaMirrornodeService> => ({
  getAccount:
    overrides?.getAccountImpl ||
    jest.fn().mockResolvedValue({
      accountId: '0.0.1234',
      balance: { balance: 1000n, timestamp: '1234567890' },
      evmAddress: '0xabc',
      accountPublicKey: 'pubKey',
    }),
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

    MockedHelper.mockImplementation(() => ({
      loadAccount: jest.fn().mockReturnValue(null),
    }));

    const mirrorMock = makeMirrorMock();
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
