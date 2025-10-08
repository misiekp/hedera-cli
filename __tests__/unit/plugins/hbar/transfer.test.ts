import type { CommandHandlerArgs } from '../../../../src/core/plugins/plugin.interface';
import transferHandler from '../../../../src/plugins/hbar/commands/transfer';
import { ZustandAccountStateHelper } from '../../../../src/plugins/account/zustand-state-helper';
import { Logger } from '../../../../src/core/services/logger/logger-service.interface';
import type { CoreAPI } from '../../../../src/core/core-api/core-api.interface';
import type { HbarService } from '../../../../src/core/services/hbar/hbar-service.interface';
import type { NetworkService } from '../../../../src/core/services/network/network-service.interface';
import type { CredentialsService } from '../../../../src/core/services/credentials/credentials-service.interface';
import type { AccountData } from '../../../../src/plugins/account/schema';
import { StateService } from '../../../../src/core/services/state/state-service.interface';
import { ConfigService } from '../../../../src/core/services/config/config-service.interface';

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

const makeAccountData = (
  overrides: Partial<AccountData> = {},
): AccountData => ({
  name: 'default',
  accountId: '0.0.1234',
  type: 'ECDSA',
  publicKey: 'pk',
  evmAddress: '0x0000000000000000000000000000000000000000',
  solidityAddress: 'sa',
  solidityAddressFull: 'safull',
  privateKey: 'priv',
  network: 'testnet',
  ...overrides,
});

const makeApiMocks = ({
  transferImpl,
  network = 'testnet',
  accounts = [],
}: {
  transferImpl?: jest.Mock;
  network?: 'testnet' | 'mainnet' | 'previewnet';
  accounts?: AccountData[];
}) => {
  const hbar: jest.Mocked<HbarService> = {
    transferTinybar: transferImpl || jest.fn(),
  };

  const networkMock: jest.Mocked<NetworkService> = {
    getCurrentNetwork: jest.fn().mockReturnValue(network),
    getAvailableNetworks: jest.fn(),
    switchNetwork: jest.fn(),
    getNetworkConfig: jest.fn(),
    isNetworkAvailable: jest.fn(),
  };

  const credentials: Partial<CredentialsService> = {
    getDefaultCredentials: jest.fn().mockResolvedValue(null),
  };

  MockedHelper.mockImplementation(() => ({
    getAccountsByNetwork: jest.fn().mockReturnValue(accounts),
  }));

  return { hbar, networkMock, credentials };
};

const makeArgs = (
  api: Partial<CoreAPI>,
  logger: jest.Mocked<Logger>,
  args: Record<string, unknown>,
): CommandHandlerArgs => ({
  api: api as CoreAPI,
  logger,
  state: {} as StateService,
  config: {} as ConfigService,
  args,
});

describe('hbar plugin - transfer command (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('transfers HBAR successfully when all params provided', async () => {
    const logger = makeLogger();

    const accountFrom = makeAccountData({
      name: 'sender',
      accountId: '0.0.1001',
      network: 'testnet',
    });
    const accountTo = makeAccountData({
      name: 'receiver',
      accountId: '0.0.2002',
      network: 'testnet',
    });

    const { hbar, networkMock, credentials } = makeApiMocks({
      transferImpl: jest.fn().mockResolvedValue({
        transactionId: '0.0.1001@1234567890.123456789',
      }),
      accounts: [accountFrom, accountTo],
    });

    const api: Partial<CoreAPI> = {
      hbar,
      network: networkMock,
      credentials: credentials as CredentialsService,
      logger,
      state: {} as StateService,
    };

    const args = makeArgs(api, logger, {
      balance: 100000000,
      from: 'sender',
      to: 'receiver',
      memo: 'test-transfer',
    });

    await transferHandler(args);

    expect(hbar.transferTinybar).toHaveBeenCalledWith({
      amount: 100000000,
      from: 'sender',
      to: 'receiver',
      memo: 'test-transfer',
    });
    expect(logger.log).toHaveBeenCalledWith('[HBAR] Transfer command invoked');
    expect(logger.log).toHaveBeenCalledWith(
      '[HBAR] Submitted transfer, txId=0.0.1001@1234567890.123456789',
    );
  });

  test('throws error when balance is invalid', async () => {
    const logger = makeLogger();

    const { hbar, networkMock, credentials } = makeApiMocks({
      accounts: [],
    });

    const api: Partial<CoreAPI> = {
      hbar,
      network: networkMock,
      credentials: credentials as CredentialsService,
      logger,
      state: {} as StateService,
    };

    const args = makeArgs(api, logger, {
      balance: NaN,
      from: '0.0.1001',
      to: '0.0.2002',
    });

    await expect(transferHandler(args)).rejects.toThrow(
      'Invalid balance: provide a positive number of tinybars',
    );
  });

  test('throws error when balance is negative', async () => {
    const logger = makeLogger();

    const { hbar, networkMock, credentials } = makeApiMocks({
      accounts: [],
    });

    const api: Partial<CoreAPI> = {
      hbar,
      network: networkMock,
      credentials: credentials as CredentialsService,
      logger,
      state: {} as StateService,
    };

    const args = makeArgs(api, logger, {
      balance: -100,
      from: '0.0.1001',
      to: '0.0.2002',
    });

    await expect(transferHandler(args)).rejects.toThrow(
      'Invalid balance: provide a positive number of tinybars',
    );
  });

  test('throws error when balance is zero', async () => {
    const logger = makeLogger();

    const { hbar, networkMock, credentials } = makeApiMocks({
      accounts: [],
    });

    const api: Partial<CoreAPI> = {
      hbar,
      network: networkMock,
      credentials: credentials as CredentialsService,
      logger,
      state: {} as StateService,
    };

    const args = makeArgs(api, logger, {
      balance: 0,
      from: '0.0.1001',
      to: '0.0.2002',
    });

    await expect(transferHandler(args)).rejects.toThrow(
      'Invalid balance: provide a positive number of tinybars',
    );
  });

  test('throws error when no accounts available and from/to missing', async () => {
    const logger = makeLogger();

    const { hbar, networkMock, credentials } = makeApiMocks({
      accounts: [],
    });

    const api: Partial<CoreAPI> = {
      hbar,
      network: networkMock,
      credentials: credentials as CredentialsService,
      logger,
      state: {} as StateService,
    };

    const args = makeArgs(api, logger, {
      balance: 100,
    });

    await expect(transferHandler(args)).rejects.toThrow(
      'No accounts found to transfer from. Provide --from or create/import an account.',
    );
  });

  test('throws error when from equals to', async () => {
    const logger = makeLogger();

    const account = makeAccountData({
      name: 'same-account',
      accountId: '0.0.1001',
      network: 'testnet',
    });

    const { hbar, networkMock, credentials } = makeApiMocks({
      accounts: [account],
    });

    const api: Partial<CoreAPI> = {
      hbar,
      network: networkMock,
      credentials: credentials as CredentialsService,
      logger,
      state: {} as StateService,
    };

    const args = makeArgs(api, logger, {
      balance: 100,
      from: 'same-account',
      to: 'same-account',
    });

    await expect(transferHandler(args)).rejects.toThrow(
      'Cannot transfer to the same account',
    );
  });

  test('throws error when transferTinybar fails', async () => {
    const logger = makeLogger();

    const accountFrom = makeAccountData({
      name: 'sender',
      accountId: '0.0.1001',
      network: 'testnet',
    });
    const accountTo = makeAccountData({
      name: 'receiver',
      accountId: '0.0.2002',
      network: 'testnet',
    });

    const { hbar, networkMock, credentials } = makeApiMocks({
      transferImpl: jest
        .fn()
        .mockRejectedValue(new Error('Network connection failed')),
      accounts: [accountFrom, accountTo],
    });

    const api: Partial<CoreAPI> = {
      hbar,
      network: networkMock,
      credentials: credentials as CredentialsService,
      logger,
      state: {} as StateService,
    };

    const args = makeArgs(api, logger, {
      balance: 100000000,
      from: 'sender',
      to: 'receiver',
      memo: 'test-transfer',
    });

    await expect(transferHandler(args)).rejects.toThrow(
      'Network connection failed',
    );
  });

  test('uses default credentials as from when not provided', async () => {
    const logger = makeLogger();

    const accountTo = makeAccountData({
      name: 'receiver',
      accountId: '0.0.2002',
      network: 'testnet',
    });

    const { hbar, networkMock, credentials } = makeApiMocks({
      transferImpl: jest.fn().mockResolvedValue({
        transactionId: '0.0.3000@1234567890.987654321',
      }),
      accounts: [accountTo],
    });

    // Mock default credentials
    (credentials.getDefaultCredentials as jest.Mock).mockResolvedValue({
      accountId: '0.0.3000',
      privateKey: 'default-key',
      network: 'testnet',
      isDefault: true,
    });

    const api: Partial<CoreAPI> = {
      hbar,
      network: networkMock,
      credentials: credentials as CredentialsService,
      logger,
      state: {} as StateService,
    };

    const args = makeArgs(api, logger, {
      balance: 50000000,
      // from not provided
      to: 'receiver',
    });

    await transferHandler(args);

    expect(credentials.getDefaultCredentials).toHaveBeenCalled();
    expect(hbar.transferTinybar).toHaveBeenCalledWith({
      amount: 50000000,
      from: '0.0.3000',
      to: 'receiver',
      memo: '',
    });
    expect(logger.log).toHaveBeenCalledWith(
      '[HBAR] Submitted transfer, txId=0.0.3000@1234567890.987654321',
    );
  });
});
