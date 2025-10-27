import { setOperatorHandler } from '../../commands/set-operator';
import {
  makeLogger,
  makeArgs,
  setupExitSpy,
  makeNetworkMock,
  makeKmsMock,
  makeAliasMock,
} from '../../../../../__tests__/helpers/plugin';

let exitSpy: jest.SpyInstance;

beforeAll(() => {
  exitSpy = setupExitSpy();
});

afterAll(() => {
  exitSpy.mockRestore();
});

describe('network plugin - set-operator command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sets operator using account-id:private-key format', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();
    const aliasService = makeAliasMock();

    const args = makeArgs(
      { network: networkService, kms: kmsService, alias: aliasService },
      logger,
      { operator: '0.0.123456:3030020100300706052b8104000a04220420...' },
    );

    setOperatorHandler(args);

    expect(kmsService.parseAccountIdKeyPair).toHaveBeenCalledWith(
      '0.0.123456:3030020100300706052b8104000a04220420...',
      'account',
    );
    expect(networkService.setOperator).toHaveBeenCalledWith('testnet', {
      accountId: '0.0.123456',
      keyRefId: 'kr_test123',
    });
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining(
        'Setting operator using account-id:private-key format: 0.0.123456',
      ),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining(
        'Operator set successfully for account: 0.0.123456',
      ),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('sets operator using alias', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();
    const aliasService = makeAliasMock();

    // Mock alias resolution
    aliasService.resolve.mockReturnValue({
      alias: 'testnet1',
      type: 'account',
      network: 'testnet',
      entityId: '0.0.789012',
      keyRefId: 'kr_alias123',
      publicKey: 'pub-key-alias',
      createdAt: '2024-01-01T00:00:00Z',
    });

    const args = makeArgs(
      { network: networkService, kms: kmsService, alias: aliasService },
      logger,
      { operator: 'testnet1' },
    );

    setOperatorHandler(args);

    expect(aliasService.resolve).toHaveBeenCalledWith(
      'testnet1',
      'account',
      'testnet',
    );
    expect(networkService.setOperator).toHaveBeenCalledWith('testnet', {
      accountId: '0.0.789012',
      keyRefId: 'kr_alias123',
    });
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining(
        'Setting operator using alias: testnet1 → 0.0.789012',
      ),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining(
        'Operator set successfully for account: 0.0.789012',
      ),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('sets operator for specific network when --network is provided', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();
    const aliasService = makeAliasMock();

    const args = makeArgs(
      { network: networkService, kms: kmsService, alias: aliasService },
      logger,
      { operator: '0.0.123456:key', network: 'mainnet' },
    );

    setOperatorHandler(args);

    expect(networkService.setOperator).toHaveBeenCalledWith('mainnet', {
      accountId: '0.0.123456',
      keyRefId: 'kr_test123',
    });
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Setting new operator for network mainnet'),
    );
  });

  test('shows overwrite message when operator already exists', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();
    const aliasService = makeAliasMock();

    // Mock existing operator
    networkService.getOperator.mockReturnValue({
      accountId: '0.0.999999',
      keyRefId: 'kr_old123',
    });

    const args = makeArgs(
      { network: networkService, kms: kmsService, alias: aliasService },
      logger,
      { operator: '0.0.123456:key' },
    );

    setOperatorHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Operator already exists for network testnet'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Previous: 0.0.999999 (kr_old123)'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('New: 0.0.123456 (kr_test123)'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Overwriting operator for network testnet'),
    );
  });

  test('shows new operator message when no existing operator', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();
    const aliasService = makeAliasMock();

    // Mock no existing operator
    networkService.getOperator.mockReturnValue(null);

    const args = makeArgs(
      { network: networkService, kms: kmsService, alias: aliasService },
      logger,
      { operator: '0.0.123456:key' },
    );

    setOperatorHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Setting new operator for network testnet'),
    );
  });

  test('exits with error when no operator is provided', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();
    const aliasService = makeAliasMock();

    const args = makeArgs(
      { network: networkService, kms: kmsService, alias: aliasService },
      logger,
      {},
    );

    setOperatorHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      '❌ Must specify --operator (alias or account-id:private-key format)',
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('exits with error when alias is not found', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();
    const aliasService = makeAliasMock();

    // Mock alias not found
    aliasService.resolve.mockReturnValue(null);

    const args = makeArgs(
      { network: networkService, kms: kmsService, alias: aliasService },
      logger,
      { operator: 'nonexistent' },
    );

    setOperatorHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      "❌ Alias 'nonexistent' not found for network testnet",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('exits with error when alias has no key', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();
    const aliasService = makeAliasMock();

    // Mock alias with no key
    aliasService.resolve.mockReturnValue({
      alias: 'testnet1',
      type: 'account',
      network: 'testnet',
      entityId: '0.0.789012',
      keyRefId: undefined,
      publicKey: undefined,
      createdAt: '2024-01-01T00:00:00Z',
    });

    const args = makeArgs(
      { network: networkService, kms: kmsService, alias: aliasService },
      logger,
      { operator: 'testnet1' },
    );

    setOperatorHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      '❌ No key found for account 0.0.789012',
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('handles KMS parseAccountIdKeyPair errors', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();
    const aliasService = makeAliasMock();

    // Mock KMS error
    kmsService.parseAccountIdKeyPair.mockImplementation(() => {
      throw new Error('Invalid account-id:private-key format');
    });

    const args = makeArgs(
      { network: networkService, kms: kmsService, alias: aliasService },
      logger,
      { operator: 'invalid:format' },
    );

    setOperatorHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to set operator:'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('handles network service errors', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();
    const aliasService = makeAliasMock();

    // Mock network service error
    networkService.setOperator.mockImplementation(() => {
      throw new Error('Network service error');
    });

    const args = makeArgs(
      { network: networkService, kms: kmsService, alias: aliasService },
      logger,
      { operator: '0.0.123456:key' },
    );

    setOperatorHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to set operator:'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('displays all operator information after successful set', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const kmsService = makeKmsMock();
    const aliasService = makeAliasMock();

    const args = makeArgs(
      { network: networkService, kms: kmsService, alias: aliasService },
      logger,
      { operator: '0.0.123456:key' },
    );

    setOperatorHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining(
        'Operator set successfully for account: 0.0.123456',
      ),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Network: testnet'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Key Reference ID: kr_test123'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Public Key: pub-key-test'),
    );
  });
});
