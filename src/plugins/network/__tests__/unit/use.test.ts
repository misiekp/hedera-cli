import { useHandler } from '../../commands/use';
import {
  makeLogger,
  makeArgs,
  setupExitSpy,
  makeNetworkMock,
} from '../../../../../__tests__/helpers/plugin';
import { isJsonOutput } from '../../../../utils/output';
import { Status } from '../../../../core/shared/constants';

jest.mock('../../../../utils/output', () => ({
  isJsonOutput: jest.fn(),
  printOutput: jest.fn(),
}));

jest.mock('../../../../utils/color', () => ({
  color: {
    green: (str: string) => str,
  },
  heading: (str: string) => str,
  success: (str: string) => str,
}));

const mockedIsJsonOutput = isJsonOutput as jest.Mock;

let exitSpy: jest.SpyInstance;

beforeAll(() => {
  exitSpy = setupExitSpy();
});

afterAll(() => {
  exitSpy.mockRestore();
});

describe('network plugin - use command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsJsonOutput.mockReturnValue(false);
  });

  test('switches to a valid network', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    networkService.switchNetwork = jest.fn();
    networkService.isNetworkAvailable = jest.fn().mockReturnValue(true);

    const args = makeArgs({ network: networkService }, logger, {
      network: 'mainnet',
    });

    const result = useHandler(args);

    expect(networkService.switchNetwork).toHaveBeenCalledWith('mainnet');
    expect(result.status).toBe(Status.Success);
  });

  test('returns failure for invalid network', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    networkService.switchNetwork = jest.fn().mockImplementation(() => {
      throw new Error('Network not available: invalid');
    });

    const args = makeArgs({ network: networkService }, logger, {
      network: 'invalid',
    });

    const result = useHandler(args);

    expect(result.status).toBe(Status.Failure);
    expect(result.errorMessage).toContain('Failed to switch network');
  });

  test('returns JSON output when requested', () => {
    mockedIsJsonOutput.mockReturnValue(true);

    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    networkService.switchNetwork = jest.fn();

    const args = makeArgs({ network: networkService }, logger, {
      network: 'previewnet',
      json: true,
    });

    const result = useHandler(args);

    expect(networkService.switchNetwork).toHaveBeenCalledWith('previewnet');
    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();
  });

  test('logs verbose message', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    networkService.switchNetwork = jest.fn();

    const args = makeArgs({ network: networkService }, logger, {
      network: 'mainnet',
    });

    const result = useHandler(args);
    expect(result.status).toBe(Status.Success);

    expect(logger.verbose).toHaveBeenCalledWith(
      'Switching to network: mainnet',
    );
  });

  test('handles missing network argument', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');

    const args = makeArgs({ network: networkService }, logger, {});

    const result = useHandler(args);

    expect(result.status).toBe(Status.Failure);
    expect(result.errorMessage).toContain('Network name is required');
  });

  test('successfully switches between networks', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    networkService.switchNetwork = jest.fn();

    const argsToMainnet = makeArgs({ network: networkService }, logger, {
      network: 'mainnet',
    });

    const res1 = useHandler(argsToMainnet);
    expect(res1.status).toBe(Status.Success);

    expect(networkService.switchNetwork).toHaveBeenCalledWith('mainnet');

    jest.clearAllMocks();

    const argsToPreviewnet = makeArgs({ network: networkService }, logger, {
      network: 'previewnet',
    });

    const res2 = useHandler(argsToPreviewnet);
    expect(res2.status).toBe(Status.Success);

    expect(networkService.switchNetwork).toHaveBeenCalledWith('previewnet');
  });
});
