import type { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { importAccountHandler } from '../../commands/import';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import type { CoreAPI } from '../../../../core/core-api/core-api.interface';
import type { HederaMirrornodeService } from '../../../../core/services/mirrornode/hedera-mirrornode-service.interface';
import type { NetworkService } from '../../../../core/services/network/network-service.interface';
import {
  makeLogger,
  makeMirrorNodeMock,
  makeNetworkServiceMock,
  makeAccountStateHelperMock,
  makeArgs,
} from './helpers/mocks';
import { mockMirrorAccountData } from './helpers/fixtures';

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

describe('account plugin - import command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('imports account successfully', async () => {
    const logger = makeLogger();

    const helperMock = makeAccountStateHelperMock({
      hasAccount: jest.fn().mockReturnValue(false),
      saveAccount: jest.fn().mockReturnValue(undefined),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const mirrorMock = makeMirrorNodeMock();
    const networkMock = makeNetworkServiceMock();

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
    expect(helperMock.saveAccount).toHaveBeenCalledWith(
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

    const helperMock = makeAccountStateHelperMock({
      hasAccount: jest.fn().mockReturnValue(true),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const mirrorMock = makeMirrorNodeMock();
    const networkMock = makeNetworkServiceMock();

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

    const helperMock = makeAccountStateHelperMock({
      hasAccount: jest.fn().mockReturnValue(false),
    });

    MockedHelper.mockImplementation(() => helperMock);

    const mirrorMock = makeMirrorNodeMock({
      getAccount: jest.fn().mockRejectedValue(new Error('mirror down')),
    });
    const networkMock = makeNetworkServiceMock();

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
