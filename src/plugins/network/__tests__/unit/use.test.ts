import { useHandler } from '../../commands/use';
import {
  makeLogger,
  makeArgs,
  setupExitSpy,
  makeNetworkMock,
} from '../../../../../__tests__/helpers/plugin';
import { isJsonOutput, printOutput } from '../../../../utils/output';

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
const mockedPrintOutput = printOutput as jest.Mock;

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
      _: ['mainnet'],
    });

    useHandler(args);

    expect(networkService.switchNetwork).toHaveBeenCalledWith('mainnet');
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Active network: mainnet'),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('throws error for invalid network', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    networkService.switchNetwork = jest.fn().mockImplementation(() => {
      throw new Error('Network not available: invalid');
    });

    const args = makeArgs({ network: networkService }, logger, {
      _: ['invalid'],
    });

    useHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to switch network'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('outputs JSON format when --json flag is set', () => {
    mockedIsJsonOutput.mockReturnValue(true);

    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    networkService.switchNetwork = jest.fn();

    const args = makeArgs({ network: networkService }, logger, {
      _: ['previewnet'],
      json: true,
    });

    useHandler(args);

    expect(networkService.switchNetwork).toHaveBeenCalledWith('previewnet');
    expect(mockedPrintOutput).toHaveBeenCalledWith('network', {
      activeNetwork: 'previewnet',
    });
  });

  test('logs verbose message', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    networkService.switchNetwork = jest.fn();

    const args = makeArgs({ network: networkService }, logger, {
      _: ['mainnet'],
    });

    useHandler(args);

    expect(logger.verbose).toHaveBeenCalledWith(
      'Switching to network: mainnet',
    );
  });

  test('handles missing network argument', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');

    const args = makeArgs({ network: networkService }, logger, { _: [] });

    useHandler(args);

    expect(logger.error).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('successfully switches between networks', () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    networkService.switchNetwork = jest.fn();

    const argsToMainnet = makeArgs({ network: networkService }, logger, {
      _: ['mainnet'],
    });

    useHandler(argsToMainnet);

    expect(networkService.switchNetwork).toHaveBeenCalledWith('mainnet');

    jest.clearAllMocks();

    const argsToPreviewnet = makeArgs({ network: networkService }, logger, {
      _: ['previewnet'],
    });

    useHandler(argsToPreviewnet);

    expect(networkService.switchNetwork).toHaveBeenCalledWith('previewnet');
  });
});
