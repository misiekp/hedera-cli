import { removeHandler } from '../../commands/remove';
import {
  makeLogger,
  makeArgs,
  setupExitSpy,
  makeKmsMock,
} from '../../../../../__tests__/helpers/plugin';

let exitSpy: jest.SpyInstance;

beforeAll(() => {
  exitSpy = setupExitSpy();
});

afterAll(() => {
  exitSpy.mockRestore();
});

describe('credentials plugin - remove command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('removes credentials successfully', () => {
    const logger = makeLogger();
    const kmsService = makeKmsMock();

    const args = makeArgs({ kms: kmsService }, logger, {
      keyRefId: 'kr_test123',
    });

    removeHandler(args);

    expect(kmsService.remove).toHaveBeenCalledWith('kr_test123');
    expect(logger.log).toHaveBeenCalledWith(
      '🗑️  Removing credentials for keyRefId: kr_test123',
    );
    expect(logger.log).toHaveBeenCalledWith(
      '✅ Credentials removed for keyRefId: kr_test123',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('exits with error when no keyRefId is provided', () => {
    const logger = makeLogger();
    const kmsService = makeKmsMock();

    const args = makeArgs({ kms: kmsService }, logger, {});

    removeHandler(args);

    expect(logger.error).toHaveBeenCalledWith('❌ Must specify --key-ref-id');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('exits with error when keyRefId is empty string', () => {
    const logger = makeLogger();
    const kmsService = makeKmsMock();

    const args = makeArgs({ kms: kmsService }, logger, { keyRefId: '' });

    removeHandler(args);

    expect(logger.error).toHaveBeenCalledWith('❌ Must specify --key-ref-id');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('handles KMS service errors', () => {
    const logger = makeLogger();
    const kmsService = makeKmsMock();

    kmsService.remove.mockImplementation(() => {
      throw new Error('KMS service error');
    });

    const args = makeArgs({ kms: kmsService }, logger, {
      keyRefId: 'kr_test123',
    });

    removeHandler(args);

    expect(kmsService.remove).toHaveBeenCalledWith('kr_test123');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to remove credentials:'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
