import { createAccountHandler } from '../../commands/create';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import type { CoreAPI } from '../../../../core/core-api/core-api.interface';
import type { AccountTransactionService } from '../../../../core/services/accounts/account-transaction-service.interface';
import type { TransactionResult } from '../../../../core/services/signing/signing-service.interface';
import {
  makeLogger,
  makeArgs,
  makeNetworkMock,
  makeCredentialsStateMock,
  makeAliasMock,
  makeSigningMock,
  setupExitSpy,
} from '../../../../../__tests__/helpers/plugin';

let exitSpy: jest.SpyInstance;

jest.mock('../../zustand-state-helper', () => ({
  ZustandAccountStateHelper: jest.fn(),
}));

const MockedHelper = ZustandAccountStateHelper as jest.Mock;

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

  const signing = makeSigningMock({ signAndExecuteImpl });
  const networkMock = makeNetworkMock(network);
  const credentialsState = makeCredentialsStateMock();

  // Override createLocalPrivateKey for create tests
  credentialsState.createLocalPrivateKey = jest.fn().mockReturnValue({
    keyRefId: 'kr_test123',
    publicKey: 'pub-key-test',
  });

  const alias = makeAliasMock();

  return { accountTransactions, signing, networkMock, credentialsState, alias };
};

beforeAll(() => {
  exitSpy = setupExitSpy();
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
