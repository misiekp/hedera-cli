import { importAccountHandler } from '../../commands/import';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import type { CoreAPI } from '../../../../core/core-api/core-api.interface';
import type { HederaMirrornodeService } from '../../../../core/services/mirrornode/hedera-mirrornode-service.interface';
import {
  makeLogger,
  makeArgs,
  makeNetworkMock,
  makeCredentialsStateMock,
  makeAliasMock,
  makeMirrorMock,
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
    const credentialsState = makeCredentialsStateMock();
    const alias = makeAliasMock();

    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      network: networkMock as NetworkService,
      credentialsState,
      alias,
      logger,
    };

    const args = makeArgs(api, logger, {
      id: '0.0.9999',
      key: 'privKey',
      alias: 'imported',
    });

    await importAccountHandler(args);

    expect(credentialsState.importPrivateKey).toHaveBeenCalledWith('privKey', [
      'account:imported',
    ]);
    expect(mirrorMock.getAccount).toHaveBeenCalledWith('0.0.9999');
    expect(alias.register).toHaveBeenCalledWith(
      expect.objectContaining({
        alias: 'imported',
        type: 'account',
        network: 'testnet',
        entityId: '0.0.9999',
        publicKey: 'pub-key-test',
        keyRefId: 'kr_test123',
      }),
    );
    expect(saveAccountMock).toHaveBeenCalledWith(
      'imported',
      expect.objectContaining({
        name: 'imported',
        accountId: '0.0.9999',
        network: 'testnet',
        keyRefId: 'kr_test123',
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
