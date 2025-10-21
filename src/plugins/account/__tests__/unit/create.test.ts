import createAccountHandler from '../../commands/create/handler';
import type { CreateAccountOutput } from '../../commands/create';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import type { CoreAPI } from '../../../../core/core-api/core-api.interface';
import type { AccountService } from '../../../../core/services/account/account-transaction-service.interface';
import type { TransactionResult } from '../../../../core/services/signing/signing-service.interface';
import {
  makeLogger,
  makeArgs,
  makeNetworkMock,
  makeCredentialsStateMock,
  makeAliasMock,
  makeSigningMock,
} from '../../../../../__tests__/helpers/plugin';

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
  const account: jest.Mocked<AccountService> = {
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

  return { account, signing, networkMock, credentialsState, alias };
};

describe('account plugin - create command (ADR-003)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates account successfully (happy path)', async () => {
    const logger = makeLogger();
    const saveAccountMock = jest.fn();
    MockedHelper.mockImplementation(() => ({ saveAccount: saveAccountMock }));

    const { account, signing, networkMock, credentialsState, alias } =
      makeApiMocks({
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
      account,
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

    const result = await createAccountHandler(args);

    expect(credentialsState.createLocalPrivateKey).toHaveBeenCalled();
    expect(account.createAccount).toHaveBeenCalledWith({
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

    // Verify ADR-003 result
    expect(result.status).toBe('success');
    expect(result.outputJson).toBeDefined();

    const output: CreateAccountOutput = JSON.parse(result.outputJson!);
    expect(output.accountId).toBe('0.0.9999');
    expect(output.name).toBe('myAccount');
    expect(output.type).toBe('ECDSA');
    expect(output.alias).toBe('myAccount');
    expect(output.network).toBe('testnet');
    expect(output.transactionId).toBe('tx-123');
    expect(output.evmAddress).toBe(
      '0x000000000000000000000000000000000000abcd',
    );
    expect(output.publicKey).toBe('pub-key-test');
  });

  test('returns failure when signAndExecute returns failure', async () => {
    const logger = makeLogger();
    MockedHelper.mockImplementation(() => ({ saveAccount: jest.fn() }));

    const { account, signing, networkMock, credentialsState, alias } =
      makeApiMocks({
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
      account,
      signing,
      network: networkMock,
      credentialsState,
      alias,
      logger,
    };

    const args = makeArgs(api, logger, { name: 'failAccount' });

    const result = await createAccountHandler(args);

    expect(result.status).toBe('failure');
    expect(result.errorMessage).toBe('Failed to create account');
  });

  test('returns failure when createAccount throws', async () => {
    const logger = makeLogger();
    MockedHelper.mockImplementation(() => ({ saveAccount: jest.fn() }));

    const { account, signing, networkMock, credentialsState, alias } =
      makeApiMocks({
        createAccountImpl: jest
          .fn()
          .mockRejectedValue(new Error('network error')),
      });

    const api: Partial<CoreAPI> = {
      account,
      signing,
      network: networkMock,
      credentialsState,
      alias,
      logger,
    };

    const args = makeArgs(api, logger, { name: 'errorAccount' });

    const result = await createAccountHandler(args);

    expect(result.status).toBe('failure');
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).toContain('Failed to create account');
    expect(result.errorMessage).toContain('network error');
  });
});
