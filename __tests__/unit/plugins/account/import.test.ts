import type { CommandHandlerArgs } from '../../../../src/core/plugins/plugin.interface';
import { importAccountHandler } from '../../../../src/plugins/account/commands/import';
import { ZustandAccountStateHelper } from '../../../../src/plugins/account/zustand-state-helper';
import { Logger } from '../../../../src/core/services/logger/logger-service.interface';
import type { CoreAPI } from '../../../../src/core/core-api/core-api.interface';
import type { HederaMirrornodeService } from '../../../../src/core/services/mirrornode/hedera-mirrornode-service.interface';
import type { NetworkService } from '../../../../src/core/services/network/network-service.interface';

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

const makeMirrorMock = (overrides?: {
  getAccountImpl?: jest.Mock;
}): Partial<HederaMirrornodeService> => ({
  getAccount:
    overrides?.getAccountImpl ||
    jest.fn().mockResolvedValue({
      accountPublicKey: 'pubKey',
      evmAddress: '0xabc',
      balance: { balance: 100n },
    }),
});

const makeNetworkMock = (): Partial<NetworkService> => ({
  getCurrentNetwork: jest.fn().mockReturnValue('testnet'),
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

describe('account plugin - import command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('imports account successfully', async () => {
    const logger = makeLogger();
    const saveAccountMock = jest.fn().mockResolvedValue(undefined);

    MockedHelper.mockImplementation(() => ({
      hasAccount: jest.fn().mockResolvedValue(false),
      saveAccount: saveAccountMock,
    }));

    const mirrorMock = makeMirrorMock();
    const networkMock = makeNetworkMock();

    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      network: networkMock as NetworkService,
      logger,
    };

    const args = makeArgs(api, logger, {
      name: 'imported',
      id: '0.0.9999',
      key: 'privKey',
    });

    await importAccountHandler(args);

    expect(mirrorMock.getAccount).toHaveBeenCalledWith('0.0.9999');
    expect(saveAccountMock).toHaveBeenCalledWith(
      'imported',
      expect.objectContaining({
        name: 'imported',
        accountId: '0.0.9999',
        network: 'testnet',
      }),
    );
    expect(logger.log).toHaveBeenCalledWith(
      '✅ Account imported successfully: 0.0.9999',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('fails if account already exists', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      hasAccount: jest.fn().mockResolvedValue(true),
      saveAccount: jest.fn(),
    }));

    const mirrorMock = makeMirrorMock();
    const networkMock = makeNetworkMock();

    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      network: networkMock as NetworkService,
      logger,
    };

    const args = makeArgs(api, logger, {
      name: 'test',
      id: '0.0.1111',
      key: 'key',
    });

    await importAccountHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to import account'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('logs error and exits when mirror.getAccount throws', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      hasAccount: jest.fn().mockResolvedValue(false),
      saveAccount: jest.fn(),
    }));

    const mirrorMock = makeMirrorMock({
      getAccountImpl: jest.fn().mockRejectedValue(new Error('mirror down')),
    });
    const networkMock = makeNetworkMock();

    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      network: networkMock as NetworkService,
      logger,
    };

    const args = makeArgs(api, logger, {
      name: 'err',
      id: '0.0.2222',
      key: 'key',
    });

    await importAccountHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to import account'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
