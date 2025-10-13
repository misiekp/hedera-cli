import { useHandler } from '../../commands/use';
import {
  makeLogger,
  makeArgs,
  setupExitSpy,
} from '../../../../../__tests__/helpers/plugin';
import stateUtils from '../../../../utils/state';
import { saveState } from '../../../../state/store';
import { isJsonOutput, printOutput } from '../../../../utils/output';

jest.mock('../../../../utils/state', () => ({
  default: {
    getAvailableNetworks: jest.fn(),
  },
}));

jest.mock('../../../../state/store', () => ({
  saveState: jest.fn(),
}));

jest.mock('../../../../utils/output', () => ({
  isJsonOutput: jest.fn(),
  printOutput: jest.fn(),
}));

jest.mock('../../../../utils/color', () => ({
  heading: (str: string) => str,
  success: (str: string) => str,
}));

const mockedGetAvailableNetworks = stateUtils.getAvailableNetworks as jest.Mock;
const mockedSaveState = saveState as jest.Mock;
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
    mockedGetAvailableNetworks.mockReturnValue([
      'localnet',
      'testnet',
      'previewnet',
      'mainnet',
    ]);
  });

  test('switches to existing network', () => {
    const logger = makeLogger();
    const args = makeArgs({}, logger, { _: ['testnet'] });

    useHandler(args);

    expect(mockedGetAvailableNetworks).toHaveBeenCalled();
    expect(mockedSaveState).toHaveBeenCalledWith({ network: 'testnet' });
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Active network:'),
    );
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('testnet'));
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('switches to localnet', () => {
    const logger = makeLogger();
    const args = makeArgs({}, logger, { _: ['localnet'] });

    useHandler(args);

    expect(mockedSaveState).toHaveBeenCalledWith({ network: 'localnet' });
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('switches to custom network', () => {
    const logger = makeLogger();
    mockedGetAvailableNetworks.mockReturnValue([
      'localnet',
      'testnet',
      'custom-network',
    ]);

    const args = makeArgs({}, logger, { _: ['custom-network'] });

    useHandler(args);

    expect(mockedSaveState).toHaveBeenCalledWith({ network: 'custom-network' });
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('returns JSON when --json flag is set', () => {
    const logger = makeLogger();
    mockedIsJsonOutput.mockReturnValue(true);
    const args = makeArgs({}, logger, { _: ['testnet'] });

    useHandler(args);

    expect(mockedPrintOutput).toHaveBeenCalledWith('network', {
      activeNetwork: 'testnet',
    });
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('throws error when network does not exist', () => {
    const logger = makeLogger();
    const args = makeArgs({}, logger, { _: ['non-existent-network'] });

    useHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to switch network'),
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Invalid network name'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('displays available networks in error message', () => {
    const logger = makeLogger();
    const args = makeArgs({}, logger, { _: ['invalid'] });

    useHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('localnet, testnet, previewnet, mainnet'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('does not validate operator credentials', () => {
    const logger = makeLogger();
    const args = makeArgs({}, logger, { _: ['testnet'] });

    useHandler(args);

    expect(mockedSaveState).toHaveBeenCalledWith({ network: 'testnet' });
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs verbose message', () => {
    const logger = makeLogger();
    const args = makeArgs({}, logger, { _: ['testnet'] });

    useHandler(args);

    expect(logger.verbose).toHaveBeenCalledWith(
      'Switching to network: testnet',
    );
  });
});
