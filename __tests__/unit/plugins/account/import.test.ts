import type { CommandHandlerArgs } from '../../../../src/core/plugins/plugin.interface';
import { importAccountHandler } from '../../../../src/plugins/account/commands/import';
import { ZustandAccountStateHelper } from '../../../../src/plugins/account/zustand-state-helper';
import { Logger } from '../../../../src/core/services/logger/logger-service.interface';
import type { CoreAPI } from '../../../../src/core/core-api/core-api.interface';
import type { HederaMirrornodeService } from '../../../../src/core/services/mirrornode/hedera-mirrornode-service.interface';
import type { NetworkService } from '../../../../src/core/services/network/network-service.interface';
import type { CredentialsStateService } from '../../../../src/core/services/credentials-state/credentials-state-service.interface';
import type { AliasManagementService } from '../../../../src/core/services/alias/alias-service.interface';

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

const makeCredentialsStateMock = (): jest.Mocked<CredentialsStateService> => ({
  createLocalPrivateKey: jest.fn(),
  importPrivateKey: jest.fn().mockReturnValue({
    keyRefId: 'kr_test123',
    publicKey: 'pub-key-test',
  }),
  getPublicKey: jest.fn(),
  getPrivateKeyString: jest.fn(),
  getSignerHandle: jest.fn(),
  findByPublicKey: jest.fn(),
  list: jest.fn(),
  remove: jest.fn(),
  setDefaultOperator: jest.fn(),
  getDefaultOperator: jest.fn(),
  ensureDefaultFromEnv: jest.fn(),
  createClient: jest.fn(),
  signTransaction: jest.fn(),
});

const makeAliasMock = (): jest.Mocked<AliasManagementService> => ({
  register: jest.fn(),
  resolve: jest.fn(),
  list: jest.fn(),
  remove: jest.fn(),
  parseRef: jest.fn(),
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
    const saveAccountMock = jest.fn().mockReturnValue(undefined);

    MockedHelper.mockImplementation(() => ({
      hasAccount: jest.fn().mockReturnValue(false),
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
      hasAccount: jest.fn().mockReturnValue(true),
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
      hasAccount: jest.fn().mockReturnValue(false),
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
