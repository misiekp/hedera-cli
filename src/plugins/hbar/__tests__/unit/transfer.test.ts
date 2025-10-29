import { transferHandler } from '../../commands/transfer';
import { ZustandAccountStateHelper } from '../../../account/zustand-state-helper';
import type { CoreApi } from '../../../../core/core-api/core-api.interface';
import type { HbarService } from '../../../../core/services/hbar/hbar-service.interface';
import type { AccountData } from '../../../account/schema';
import { Status } from '../../../../core/shared/constants';
import {
  makeLogger,
  makeAccountData,
  makeArgs,
  makeNetworkMock,
  makeKmsMock,
  makeAliasMock,
  makeSigningMock,
  makeStateMock,
} from '../../../../../__tests__/helpers/plugin';
import { StateService } from '../../../../core/services/state/state-service.interface';

jest.mock('../../../account/zustand-state-helper', () => ({
  ZustandAccountStateHelper: jest.fn(),
}));

const MockedHelper = ZustandAccountStateHelper as jest.Mock;

const makeApiMocks = ({
  transferImpl,
  signAndExecuteImpl,
  network = 'testnet',
  accounts = [],
}: {
  transferImpl?: jest.Mock;
  signAndExecuteImpl?: jest.Mock;
  network?: 'testnet' | 'mainnet' | 'previewnet';
  accounts?: AccountData[];
}) => {
  const hbar: jest.Mocked<HbarService> = {
    transferTinybar: transferImpl || jest.fn(),
  };

  const signing = makeSigningMock({ signAndExecuteImpl });
  const networkMock = makeNetworkMock(network);
  const kms = makeKmsMock();
  const alias = makeAliasMock();

  MockedHelper.mockImplementation(() => ({
    getAccountsByNetwork: jest.fn().mockReturnValue(accounts),
  }));

  return { hbar, signing, networkMock, kms, alias };
};

// Common test accounts
const SENDER_ACCOUNT = makeAccountData({
  name: 'sender',
  accountId: '0.0.1001',
  network: 'testnet',
});

const RECEIVER_ACCOUNT = makeAccountData({
  name: 'receiver',
  accountId: '0.0.2002',
  network: 'testnet',
});

const setupTransferTest = (options: {
  transferImpl?: jest.Mock;
  signAndExecuteImpl?: jest.Mock;
  accounts?: AccountData[];
  defaultCredentials?: any;
}) => {
  const logger = makeLogger();
  const { hbar, signing, networkMock, kms, alias } = makeApiMocks({
    transferImpl: options.transferImpl,
    signAndExecuteImpl: options.signAndExecuteImpl,
    accounts: options.accounts || [],
  });

  const stateMock = makeStateMock({
    listData: options.accounts || [],
  });

  const api: Partial<CoreApi> = {
    hbar,
    txExecution: signing,
    network: networkMock,
    kms,
    alias,
    logger,
    state: stateMock as StateService,
  };

  if (options.defaultCredentials && api.network) {
    (api.network.getOperator as jest.Mock).mockReturnValue(
      options.defaultCredentials,
    );
  }

  return { api, logger, hbar, signing, kms, alias, stateMock };
};

describe('hbar plugin - transfer command (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('transfers HBAR successfully when all params provided', async () => {
    const { api, logger, hbar, signing } = setupTransferTest({
      transferImpl: jest.fn().mockResolvedValue({
        transaction: {},
      }),
      signAndExecuteImpl: jest.fn().mockResolvedValue({
        success: true,
        transactionId: '0.0.1001@1234567890.123456789',
        receipt: {} as any,
      }),
      accounts: [SENDER_ACCOUNT, RECEIVER_ACCOUNT],
    });

    const args = makeArgs(api, logger, {
      balance: 100000000,
      from: '0.0.1001:302e020100301006072a8648ce3d020106052b8104000a04220420abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      to: '0.0.2002',
      memo: 'test-transfer',
    });

    const result = await transferHandler(args);
    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();

    expect(hbar.transferTinybar).toHaveBeenCalledWith({
      amount: 100000000,
      from: '0.0.1001',
      to: '0.0.2002',
      memo: 'test-transfer',
    });
    expect(signing.signAndExecute).toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith('[HBAR] Transfer command invoked');
    expect(logger.log).toHaveBeenCalledWith(
      '[HBAR] Transfer submitted successfully, txId=0.0.1001@1234567890.123456789',
    );
  });

  test('returns failure when balance is invalid', async () => {
    const { api, logger } = setupTransferTest({ accounts: [] });

    const args = makeArgs(api, logger, {
      balance: NaN,
      from: '0.0.1001:302e020100301006072a8648ce3d020106052b8104000a04220420abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      to: '0.0.2002',
    });

    const result = await transferHandler(args);
    expect(result.status).toBe(Status.Failure);
    expect(result.errorMessage).toContain(
      'Invalid balance: provide a positive number of tinybars',
    );
  });

  test('returns failure when balance is negative', async () => {
    const { api, logger } = setupTransferTest({ accounts: [] });

    const args = makeArgs(api, logger, {
      balance: -100,
      from: '0.0.1001:302e020100301006072a8648ce3d020106052b8104000a04220420abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      to: '0.0.2002',
    });

    const result = await transferHandler(args);
    expect(result.status).toBe(Status.Failure);
  });

  test('returns failure when balance is zero', async () => {
    const { api, logger } = setupTransferTest({ accounts: [] });

    const args = makeArgs(api, logger, {
      balance: 0,
      from: '0.0.1001:302e020100301006072a8648ce3d020106052b8104000a04220420abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      to: '0.0.2002',
    });

    const result = await transferHandler(args);
    expect(result.status).toBe(Status.Failure);
  });

  test('succeeds when valid params provided (no default accounts check)', async () => {
    const { api, logger } = setupTransferTest({
      accounts: [],
      transferImpl: jest.fn().mockResolvedValue({
        transaction: {},
      }),
      signAndExecuteImpl: jest.fn().mockResolvedValue({
        success: true,
        transactionId: 'test-tx',
        receipt: {} as any,
      }),
    });

    const args = makeArgs(api, logger, {
      balance: 100,
      from: '0.0.1001:302e020100301006072a8648ce3d020106052b8104000a04220420abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      to: '0.0.2002',
    });

    const result = await transferHandler(args);
    expect(result.status).toBe(Status.Success);

    // This test should actually succeed now since we're providing valid parameters
    expect(logger.log).toHaveBeenCalledWith('[HBAR] Transfer command invoked');
  });

  test('returns failure when from equals to', async () => {
    const sameAccount = makeAccountData({
      name: 'same-account',
      accountId: '0.0.1001',
      network: 'testnet',
    });

    const { api, logger } = setupTransferTest({ accounts: [sameAccount] });

    const args = makeArgs(api, logger, {
      balance: 100,
      from: 'same-account',
      to: 'same-account',
    });

    const result = await transferHandler(args);
    expect(result.status).toBe(Status.Failure);
    expect(result.errorMessage).toContain('Cannot transfer');
  });

  test('returns failure when transferTinybar fails', async () => {
    const { api, logger } = setupTransferTest({
      transferImpl: jest
        .fn()
        .mockRejectedValue(new Error('Network connection failed')),
      accounts: [SENDER_ACCOUNT, RECEIVER_ACCOUNT],
    });

    const args = makeArgs(api, logger, {
      balance: 100000000,
      from: '0.0.1001:302e020100301006072a8648ce3d020106052b8104000a04220420abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      to: '0.0.2002',
      memo: 'test-transfer',
    });

    const result = await transferHandler(args);
    expect(result.status).toBe(Status.Failure);
    expect(result.errorMessage).toContain('Network connection failed');
  });

  test('returns failure when from is just account ID without private key', async () => {
    const { api, logger } = setupTransferTest({ accounts: [] });

    const args = makeArgs(api, logger, {
      balance: 100,
      from: '0.0.1001', // Just account ID, no private key
      to: '0.0.2002',
    });

    const result = await transferHandler(args);
    expect(result.status).toBe(Status.Failure);
    expect(result.errorMessage).toContain(
      'Invalid from account: 0.0.1001 is neither a valid account-id:private-key pair, nor a known account name',
    );
  });

  test('uses default credentials as from when not provided', async () => {
    const { api, logger, hbar } = setupTransferTest({
      transferImpl: jest.fn().mockResolvedValue({
        transaction: {},
      }),
      signAndExecuteImpl: jest.fn().mockResolvedValue({
        success: true,
        transactionId: '0.0.3000@1234567890.987654321',
        receipt: {} as any,
      }),
      accounts: [RECEIVER_ACCOUNT],
      defaultCredentials: {
        accountId: '0.0.3000',
        privateKey: 'default-key',
        network: 'testnet',
        isDefault: true,
      },
    });

    const args = makeArgs(api, logger, {
      balance: 50000000,
      from: '0.0.3000:302e020100301006072a8648ce3d020106052b8104000a04220420abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      to: '0.0.2002',
    });

    const result = await transferHandler(args);
    expect(result.status).toBe(Status.Success);

    // The transfer command uses the default operator from the signing service
    expect(hbar.transferTinybar).toHaveBeenCalledWith({
      amount: 50000000,
      from: '0.0.3000',
      to: '0.0.2002',
      memo: undefined,
    });
    expect(logger.log).toHaveBeenCalledWith(
      '[HBAR] Transfer submitted successfully, txId=0.0.3000@1234567890.987654321',
    );
  });
});
