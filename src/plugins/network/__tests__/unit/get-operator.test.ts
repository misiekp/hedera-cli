import { getOperatorHandler } from '../../commands/get-operator';
import {
  makeLogger,
  makeArgs,
  setupExitSpy,
  makeNetworkMock,
  makeKmsMock,
} from '../../../../../__tests__/helpers/plugin';

let exitSpy: jest.SpyInstance;

beforeAll(() => {
  exitSpy = setupExitSpy();
});

afterAll(() => {
  exitSpy.mockRestore();
});

describe('network plugin - get-operator command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('gets operator for current network when no network specified', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();

    // Mock existing operator
    networkService.getOperator.mockReturnValue({
      accountId: '0.0.123456',
      keyRefId: 'kr_test123',
    });
    kmsService.getPublicKey.mockReturnValue('pub-key-test');

    const args = makeArgs(
      { network: networkService, kms: kmsService },
      logger,
      {},
    );

    getOperatorHandler(args);

    expect(networkService.getOperator).toHaveBeenCalledWith('testnet');
    expect(kmsService.getPublicKey).toHaveBeenCalledWith('kr_test123');
    expect(logger.log).toHaveBeenCalledWith(
      '🔍 Getting operator for network: testnet',
    );
    expect(logger.log).toHaveBeenCalledWith(
      '✅ Operator found for network: testnet',
    );
    expect(logger.log).toHaveBeenCalledWith('   Account ID: 0.0.123456');
    expect(logger.log).toHaveBeenCalledWith('   Key Reference ID: kr_test123');
    expect(logger.log).toHaveBeenCalledWith('   Public Key: pub-key-test');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('gets operator for specified network', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();

    // Mock existing operator
    networkService.getOperator.mockReturnValue({
      accountId: '0.0.789012',
      keyRefId: 'kr_mainnet',
    });
    kmsService.getPublicKey.mockReturnValue('pub-key-mainnet');

    const args = makeArgs(
      { network: networkService, kms: kmsService },
      logger,
      { network: 'mainnet' },
    );

    getOperatorHandler(args);

    expect(networkService.getOperator).toHaveBeenCalledWith('mainnet');
    expect(kmsService.getPublicKey).toHaveBeenCalledWith('kr_mainnet');
    expect(logger.log).toHaveBeenCalledWith(
      '🔍 Getting operator for network: mainnet',
    );
    expect(logger.log).toHaveBeenCalledWith(
      '✅ Operator found for network: mainnet',
    );
    expect(logger.log).toHaveBeenCalledWith('   Account ID: 0.0.789012');
    expect(logger.log).toHaveBeenCalledWith('   Key Reference ID: kr_mainnet');
    expect(logger.log).toHaveBeenCalledWith('   Public Key: pub-key-mainnet');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('shows warning when no operator is configured', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();

    // Mock no operator
    networkService.getOperator.mockReturnValue(null);

    const args = makeArgs(
      { network: networkService, kms: kmsService },
      logger,
      {},
    );

    getOperatorHandler(args);

    expect(networkService.getOperator).toHaveBeenCalledWith('testnet');
    expect(kmsService.getPublicKey).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(
      '🔍 Getting operator for network: testnet',
    );
    expect(logger.log).toHaveBeenCalledWith(
      '⚠️  No operator configured for network: testnet',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('shows error when public key not found', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();

    // Mock operator but no public key
    networkService.getOperator.mockReturnValue({
      accountId: '0.0.123456',
      keyRefId: 'kr_test123',
    });
    kmsService.getPublicKey.mockReturnValue(null);

    const args = makeArgs(
      { network: networkService, kms: kmsService },
      logger,
      {},
    );

    getOperatorHandler(args);

    expect(networkService.getOperator).toHaveBeenCalledWith('testnet');
    expect(kmsService.getPublicKey).toHaveBeenCalledWith('kr_test123');
    expect(logger.log).toHaveBeenCalledWith(
      '🔍 Getting operator for network: testnet',
    );
    expect(logger.log).toHaveBeenCalledWith(
      '❌ Public key not found for keyRefId: kr_test123',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('exits with error when network is not available', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();

    // Mock network not available
    networkService.isNetworkAvailable.mockReturnValue(false);
    networkService.getAvailableNetworks.mockReturnValue([
      'testnet',
      'mainnet',
      'previewnet',
    ]);

    const args = makeArgs(
      { network: networkService, kms: kmsService },
      logger,
      { network: 'invalid-network' },
    );

    getOperatorHandler(args);

    expect(networkService.isNetworkAvailable).toHaveBeenCalledWith(
      'invalid-network',
    );
    expect(logger.error).toHaveBeenCalledWith(
      "❌ Network 'invalid-network' is not available",
    );
    expect(logger.log).toHaveBeenCalledWith(
      '   Available networks: testnet, mainnet, previewnet',
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('handles network service errors', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();

    // Mock network service error
    networkService.getOperator.mockImplementation(() => {
      throw new Error('Network service error');
    });

    const args = makeArgs(
      { network: networkService, kms: kmsService },
      logger,
      {},
    );

    getOperatorHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to get operator:'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('handles KMS service errors', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();

    // Mock operator but KMS error
    networkService.getOperator.mockReturnValue({
      accountId: '0.0.123456',
      keyRefId: 'kr_test123',
    });
    kmsService.getPublicKey.mockImplementation(() => {
      throw new Error('KMS service error');
    });

    const args = makeArgs(
      { network: networkService, kms: kmsService },
      logger,
      {},
    );

    getOperatorHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to get operator:'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('validates network before getting operator', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();

    // Mock network validation
    networkService.isNetworkAvailable.mockReturnValue(true);
    networkService.getOperator.mockReturnValue({
      accountId: '0.0.123456',
      keyRefId: 'kr_test123',
    });
    kmsService.getPublicKey.mockReturnValue('pub-key-test');

    const args = makeArgs(
      { network: networkService, kms: kmsService },
      logger,
      { network: 'previewnet' },
    );

    getOperatorHandler(args);

    expect(networkService.isNetworkAvailable).toHaveBeenCalledWith(
      'previewnet',
    );
    expect(networkService.getOperator).toHaveBeenCalledWith('previewnet');
    expect(logger.log).toHaveBeenCalledWith(
      '🔍 Getting operator for network: previewnet',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('displays all operator information when found', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();

    // Mock operator with all info
    networkService.getOperator.mockReturnValue({
      accountId: '0.0.999999',
      keyRefId: 'kr_special',
    });
    kmsService.getPublicKey.mockReturnValue('pub-key-special');

    const args = makeArgs(
      { network: networkService, kms: kmsService },
      logger,
      {},
    );

    getOperatorHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      '✅ Operator found for network: testnet',
    );
    expect(logger.log).toHaveBeenCalledWith('   Account ID: 0.0.999999');
    expect(logger.log).toHaveBeenCalledWith('   Key Reference ID: kr_special');
    expect(logger.log).toHaveBeenCalledWith('   Public Key: pub-key-special');
  });
});
