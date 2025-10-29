import { listHandler } from '../../commands/list';
import {
  makeLogger,
  makeArgs,
  setupExitSpy,
  makeKmsMock,
} from '../../../../../__tests__/helpers/plugin';
import { CredentialType } from '../../../../core/services/kms/kms-types.interface';

let exitSpy: jest.SpyInstance;

beforeAll(() => {
  exitSpy = setupExitSpy();
});

afterAll(() => {
  exitSpy.mockRestore();
});

describe('credentials plugin - list command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays message when no credentials are stored', () => {
    const logger = makeLogger();
    const kmsService = makeKmsMock();

    kmsService.list.mockReturnValue([]);

    const args = makeArgs({ kms: kmsService }, logger, {});

    listHandler(args);

    expect(logger.log).toHaveBeenCalledWith('🔐 Stored Credentials:');
    expect(logger.log).toHaveBeenCalledWith('   No credentials stored');
    expect(logger.log).toHaveBeenCalledWith(
      '   Use "credentials set" to add credentials',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('displays credentials when available', () => {
    const logger = makeLogger();
    const kmsService = makeKmsMock();

    const mockCredentials = [
      {
        keyRefId: 'kr_test123',
        type: 'localPrivateKey' as CredentialType,
        publicKey: 'pub-key-123',
        labels: ['test', 'dev'],
      },
      {
        keyRefId: 'kr_test456',
        type: 'kms' as CredentialType,
        publicKey: 'pub-key-456',
      },
    ];

    kmsService.list.mockReturnValue(mockCredentials);

    const args = makeArgs({ kms: kmsService }, logger, {});

    listHandler(args);

    expect(logger.log).toHaveBeenCalledWith('🔐 Stored Credentials:');
    expect(logger.log).toHaveBeenCalledWith(
      '   1. Key Reference ID: kr_test123',
    );
    expect(logger.log).toHaveBeenCalledWith('      Type: localPrivateKey');
    expect(logger.log).toHaveBeenCalledWith('      Public Key: pub-key-123');
    expect(logger.log).toHaveBeenCalledWith('      Labels: test, dev');
    expect(logger.log).toHaveBeenCalledWith('');
    expect(logger.log).toHaveBeenCalledWith(
      '   2. Key Reference ID: kr_test456',
    );
    expect(logger.log).toHaveBeenCalledWith('      Type: kms');
    expect(logger.log).toHaveBeenCalledWith('      Public Key: pub-key-456');
    expect(logger.log).toHaveBeenCalledWith('');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('handles KMS service errors', () => {
    const logger = makeLogger();
    const kmsService = makeKmsMock();

    kmsService.list.mockImplementation(() => {
      throw new Error('KMS service error');
    });

    const args = makeArgs({ kms: kmsService }, logger, {});

    expect(() => listHandler(args)).toThrow('KMS service error');

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to list credentials:'),
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
