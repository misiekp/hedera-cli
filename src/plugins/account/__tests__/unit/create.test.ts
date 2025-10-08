import type { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { createAccountHandler } from '../../commands/create';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import type { CoreAPI } from '../../../../core/core-api/core-api.interface';
import type { TransactionResult } from '../../../../core/services/signing/signing-service.interface';
import {
  makeLogger,
  makeAccountTransactionServiceMock,
  makeSigningServiceMock,
  makeNetworkServiceMock,
  makeArgs,
} from './helpers/mocks';
import {
  mockAccountCreationData,
  mockTransactionResults,
} from './helpers/fixtures';

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

describe('account plugin - create command (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates account successfully (happy path)', async () => {
    const logger = makeLogger();
    const saveAccountMock = jest.fn();
    MockedHelper.mockImplementation(() => ({ saveAccount: saveAccountMock }));

    const accountTransactions = makeAccountTransactionServiceMock({
      createAccount: jest
        .fn()
        .mockResolvedValue(mockAccountCreationData.default),
    });
    const signing = makeSigningServiceMock({
      signAndExecute: jest.fn().mockResolvedValue({
        ...mockTransactionResults.success,
        accountId: '0.0.9999',
      } as TransactionResult),
    });
    const network = makeNetworkServiceMock();

    const api: Partial<CoreAPI> = {
      accountTransactions,
      signing,
      network,
      logger,
    };

    const args = makeArgs(api, logger, {
      name: 'myAccount',
      balance: 5000,
      'auto-associations': 3,
    });

    await createAccountHandler(args);

    expect(accountTransactions.createAccount).toHaveBeenCalledWith({
      balance: 5000,
      name: 'myAccount',
      maxAutoAssociations: 3,
    });
    expect(signing.signAndExecute).toHaveBeenCalled();
    expect(saveAccountMock).toHaveBeenCalledWith(
      'myAccount',
      expect.objectContaining({
        name: 'myAccount',
        accountId: '0.0.9999',
        type: 'ECDSA',
        network: 'testnet',
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

    const accountTransactions = makeAccountTransactionServiceMock({
      createAccount: jest
        .fn()
        .mockResolvedValue(mockAccountCreationData.default),
    });
    const signing = makeSigningServiceMock({
      signAndExecute: jest
        .fn()
        .mockResolvedValue(mockTransactionResults.failure as TransactionResult),
    });
    const network = makeNetworkServiceMock();

    const api: Partial<CoreAPI> = {
      accountTransactions,
      signing,
      network,
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

    const accountTransactions = makeAccountTransactionServiceMock({
      createAccount: jest.fn().mockRejectedValue(new Error('network error')),
    });
    const signing = makeSigningServiceMock();
    const network = makeNetworkServiceMock();

    const api: Partial<CoreAPI> = {
      accountTransactions,
      signing,
      network,
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
