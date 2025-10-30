import { createAccountHandler } from '../../commands/create';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import type { CoreApi } from '../../../../core/core-api/core-api.interface';
import type { AccountService } from '../../../../core/services/account/account-transaction-service.interface';
import type { TransactionResult } from '../../../../core/services/tx-execution/tx-execution-service.interface';
import {
  makeLogger,
  makeArgs,
  makeNetworkMock,
  makeKmsMock,
  makeAliasMock,
  makeSigningMock,
  makeMirrorMock,
  setupExitSpy,
} from '../../../../../__tests__/helpers/plugin';
import BigNumber from 'bignumber.js';

let exitSpy: jest.SpyInstance;

jest.mock('../../zustand-state-helper', () => ({
  ZustandAccountStateHelper: jest.fn(),
}));

const MockedHelper = ZustandAccountStateHelper as jest.Mock;

/**
 * Balance constants for testing (in Tinybars)
 * These represent realistic Hbar amounts:
 * - OPERATOR_SUFFICIENT_BALANCE: 100000 Hbar (100000 * 10^8 tinybars)
 * - ACCOUNT_REQUEST_BALANCE: 10 Hbar (typical account creation)
 */
const OPERATOR_SUFFICIENT_BALANCE = 10_000_000_000_000n; // 100000 Hbar in tinybars
const OPERATOR_ACCOUNT_ID = '0.0.123';
const OPERATOR_KEY_REF_ID = 'kr_operator_test';

interface ApiMocksConfig {
  createAccountImpl?: jest.Mock;
  signAndExecuteImpl?: jest.Mock;
  network?: 'testnet' | 'mainnet' | 'previewnet';
  operatorBalance?: bigint;
}

/**
 * Factory function to create consistent API mocks for account creation tests
 * Follows Web3 testing best practices:
 * - Centralizes mock configuration
 * - Uses realistic balance values
 * - Provides sensible defaults
 * - Ensures all required dependencies are mocked
 */
const makeApiMocks = ({
  createAccountImpl,
  signAndExecuteImpl,
  network = 'testnet',
  operatorBalance = OPERATOR_SUFFICIENT_BALANCE,
}: ApiMocksConfig) => {
  const account: jest.Mocked<AccountService> = {
    createAccount: createAccountImpl || jest.fn(),
    getAccountInfo: jest.fn(),
    getAccountBalance: jest.fn(),
  };

  const signing = makeSigningMock({ signAndExecuteImpl });
  const networkMock = makeNetworkMock(network);

  // Configure network mock to return a valid operator for balance checks
  networkMock.getOperator = jest.fn().mockReturnValue({
    accountId: OPERATOR_ACCOUNT_ID,
    keyRefId: OPERATOR_KEY_REF_ID,
  });

  const kms = makeKmsMock();

  // Override createLocalPrivateKey for account creation tests
  kms.createLocalPrivateKey = jest.fn().mockReturnValue({
    keyRefId: 'kr_test123',
    publicKey: 'pub-key-test',
  });

  // Configure mirror node mock with sufficient operator balance
  const mirror = makeMirrorMock({
    hbarBalance: operatorBalance,
  });

  const alias = makeAliasMock();

  return { account, signing, networkMock, kms, alias, mirror };
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

    const { account, signing, networkMock, kms, alias, mirror } = makeApiMocks({
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

    const api: Partial<CoreApi> = {
      account,
      txExecution: signing,
      network: networkMock,
      kms,
      alias,
      mirror: mirror as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      balance: 5000,
      'auto-associations': 3,
      name: 'myAccount',
    });

    await createAccountHandler(args);

    expect(kms.createLocalPrivateKey).toHaveBeenCalled();
    expect(account.createAccount).toHaveBeenCalledWith({
      balanceRaw: new BigNumber(500000000000),
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

    const { account, signing, networkMock, kms, mirror } = makeApiMocks({
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

    const api: Partial<CoreApi> = {
      account,
      txExecution: signing,
      network: networkMock,
      kms,
      mirror: mirror as any,
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

    const { account, signing, networkMock, kms, mirror } = makeApiMocks({
      createAccountImpl: jest
        .fn()
        .mockRejectedValue(new Error('network error')),
    });

    const api: Partial<CoreApi> = {
      account,
      txExecution: signing,
      network: networkMock,
      kms,
      mirror: mirror as any,
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
