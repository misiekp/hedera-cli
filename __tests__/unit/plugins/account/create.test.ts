import type { CommandHandlerArgs } from '../../../../src/core/plugins/plugin.interface';
import { createAccountHandler } from '../../../../src/plugins/account/commands/create';
import { ZustandAccountStateHelper } from '../../../../src/plugins/account/zustand-state-helper';
import { Logger } from '../../../../src/core/services/logger/logger-service.interface';
import type { CoreAPI } from '../../../../src/core/core-api/core-api.interface';
import type { AccountTransactionService } from '../../../../src/core/services/accounts/account-transaction-service.interface';
import type {
  SigningService,
  TransactionResult,
} from '../../../../src/core/services/signing/signing-service.interface';
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

const makeApiMocks = ({
  createAccountImpl,
  signAndExecuteImpl,
  network = 'testnet',
}: {
  createAccountImpl?: jest.Mock;
  signAndExecuteImpl?: jest.Mock;
  network?: 'testnet' | 'mainnet' | 'previewnet';
}) => {
  const accountTransactions: jest.Mocked<AccountTransactionService> = {
    createAccount: createAccountImpl || jest.fn(),
    getAccountInfo: jest.fn(),
    getAccountBalance: jest.fn(),
  };

  const signing: jest.Mocked<SigningService> = {
    signAndExecute: signAndExecuteImpl || jest.fn(),
    signAndExecuteWith: jest.fn(),
    sign: jest.fn(),
    signWith: jest.fn(),
    execute: jest.fn(),
    getStatus: jest.fn(),
    setDefaultSigner: jest.fn(),
  };

  const networkMock: jest.Mocked<NetworkService> = {
    getCurrentNetwork: jest.fn().mockReturnValue(network),
    getAvailableNetworks: jest.fn(),
    switchNetwork: jest.fn(),
    getNetworkConfig: jest.fn(),
    isNetworkAvailable: jest.fn(),
  };

  const credentialsState: jest.Mocked<CredentialsStateService> = {
    createLocalPrivateKey: jest.fn().mockReturnValue({
      keyRefId: 'kr_test123',
      publicKey: 'pub-key-test',
    }),
    importPrivateKey: jest.fn(),
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
  };

  const alias: jest.Mocked<AliasManagementService> = {
    register: jest.fn(),
    resolve: jest.fn(),
    list: jest.fn(),
    remove: jest.fn(),
    parseRef: jest.fn(),
  };

  return { accountTransactions, signing, networkMock, credentialsState, alias };
};

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

describe('account plugin - create command (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates account successfully (happy path)', async () => {
    const logger = makeLogger();
    const saveAccountMock = jest.fn();
    MockedHelper.mockImplementation(() => ({ saveAccount: saveAccountMock }));

    const {
      accountTransactions,
      signing,
      networkMock,
      credentialsState,
      alias,
    } = makeApiMocks({
      createAccountImpl: jest.fn().mockResolvedValue({
        transaction: {},
        publicKey: 'pub-key-test',
        evmAddress: '0x000000000000000000000000000000000000abcd',
      }),
      signAndExecuteImpl: jest.fn().mockResolvedValue({
        transactionId: 'tx-123',
        success: true,
        accountId: '0.0.9999',
        receipt: {} as any,
      } as TransactionResult),
    });

    const api: Partial<CoreAPI> = {
      accountTransactions,
      signing,
      network: networkMock,
      credentialsState,
      alias,
      logger,
    };

    const args = makeArgs(api, logger, {
      balance: 5000,
      'auto-associations': 3,
      alias: 'myAccount',
    });

    await createAccountHandler(args);

    expect(credentialsState.createLocalPrivateKey).toHaveBeenCalled();
    expect(accountTransactions.createAccount).toHaveBeenCalledWith({
      balance: 5000,
      maxAutoAssociations: 3,
      publicKey: 'pub-key-test',
      keyType: 'ECDSA',
    });
    expect(signing.signAndExecute).toHaveBeenCalled();
    expect(alias.register).toHaveBeenCalledWith(
      expect.objectContaining({
        alias: 'myAccount',
        type: 'account',
        network: 'testnet',
        entityId: '0.0.9999',
        publicKey: 'pub-key-test',
        keyRefId: 'kr_test123',
      }),
    );
    expect(saveAccountMock).toHaveBeenCalledWith(
      'myAccount',
      expect.objectContaining({
        name: 'myAccount',
        accountId: '0.0.9999',
        type: 'ECDSA',
        network: 'testnet',
        keyRefId: 'kr_test123',
      }),
    );
    expect(logger.log).toHaveBeenCalledWith(
      '✅ Account created successfully: 0.0.9999',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error and exits when signAndExecute returns failure', async () => {
    const logger = makeLogger();
    MockedHelper.mockImplementation(() => ({ saveAccount: jest.fn() }));

    const { accountTransactions, signing, networkMock } = makeApiMocks({
      createAccountImpl: jest.fn().mockResolvedValue({
        transaction: {},
        privateKey: 'priv',
        publicKey: 'pub',
        evmAddress: '0x000000000000000000000000000000000000abcd',
      }),
      signAndExecuteImpl: jest.fn().mockResolvedValue({
        transactionId: 'tx-123',
        success: false,
        receipt: {} as any,
      } as TransactionResult),
    });

    const api: Partial<CoreAPI> = {
      accountTransactions,
      signing,
      network: networkMock,
      logger,
    };

    const args = makeArgs(api, logger, { name: 'failAccount' });

    await createAccountHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to create account'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('logs error and exits when createAccount throws', async () => {
    const logger = makeLogger();
    MockedHelper.mockImplementation(() => ({ saveAccount: jest.fn() }));

    const { accountTransactions, signing, networkMock } = makeApiMocks({
      createAccountImpl: jest
        .fn()
        .mockRejectedValue(new Error('network error')),
    });

    const api: Partial<CoreAPI> = {
      accountTransactions,
      signing,
      network: networkMock,
      logger,
    };

    const args = makeArgs(api, logger, { name: 'errorAccount' });

    await createAccountHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to create account'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
