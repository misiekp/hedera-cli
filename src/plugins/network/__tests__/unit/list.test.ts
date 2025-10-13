import { listHandler } from '../../commands/list';
import {
  makeLogger,
  makeArgs,
  setupExitSpy,
} from '../../../../../__tests__/helpers/plugin';
import stateUtils from '../../../../utils/state';
import { selectNetworks } from '../../../../state/selectors';
import { isJsonOutput, printOutput } from '../../../../utils/output';
import {
  checkMirrorNodeHealth,
  checkRpcHealth,
} from '../../utils/networkHealth';

jest.mock('../../../../utils/state', () => ({
  default: {
    getAvailableNetworks: jest.fn(),
    getNetwork: jest.fn(),
  },
}));

jest.mock('../../../../state/selectors', () => ({
  selectNetworks: jest.fn(),
}));

jest.mock('../../../../utils/output', () => ({
  isJsonOutput: jest.fn(),
  printOutput: jest.fn(),
}));

jest.mock('../../utils/networkHealth', () => ({
  checkMirrorNodeHealth: jest.fn(),
  checkRpcHealth: jest.fn(),
}));

jest.mock('../../../../utils/color', () => ({
  color: {
    green: (str: string) => str,
    magenta: (str: string) => str,
    yellow: (str: string) => str,
    cyan: (str: string) => str,
  },
  heading: (str: string) => str,
}));

const mockedGetAvailableNetworks = stateUtils.getAvailableNetworks as jest.Mock;
const mockedGetNetwork = stateUtils.getNetwork as jest.Mock;
const mockedSelectNetworks = selectNetworks as jest.Mock;
const mockedIsJsonOutput = isJsonOutput as jest.Mock;
const mockedPrintOutput = printOutput as jest.Mock;
const mockedCheckMirrorNodeHealth = checkMirrorNodeHealth as jest.Mock;
const mockedCheckRpcHealth = checkRpcHealth as jest.Mock;

let exitSpy: jest.SpyInstance;

beforeAll(() => {
  exitSpy = setupExitSpy();
});

afterAll(() => {
  exitSpy.mockRestore();
});

describe('network plugin - list command', () => {
  const mockNetworks = {
    localnet: {
      mirrorNodeUrl: 'http://localhost:8081/api/v1',
      rpcUrl: 'http://localhost:7546',
      operatorId: '0.0.2',
      operatorKey: 'key123',
      hexKey: '',
    },
    testnet: {
      mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com/api/v1',
      rpcUrl: 'https://testnet.hashio.io/api',
      operatorId: '',
      operatorKey: '',
      hexKey: '',
    },
    previewnet: {
      mirrorNodeUrl: 'https://previewnet.mirrornode.hedera.com/api/v1',
      rpcUrl: 'https://previewnet.hashio.io/api',
      operatorId: '',
      operatorKey: '',
      hexKey: '',
    },
    mainnet: {
      mirrorNodeUrl: 'https://mainnet.mirrornode.hedera.com/api/v1',
      rpcUrl: 'https://mainnet.hashio.io/api',
      operatorId: '',
      operatorKey: '',
      hexKey: '',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsJsonOutput.mockReturnValue(false);
    mockedGetAvailableNetworks.mockReturnValue([
      'localnet',
      'testnet',
      'previewnet',
      'mainnet',
    ]);
    mockedGetNetwork.mockReturnValue('testnet');
    mockedSelectNetworks.mockReturnValue(mockNetworks);
    mockedCheckMirrorNodeHealth.mockResolvedValue({ status: '✅', code: 200 });
    mockedCheckRpcHealth.mockResolvedValue({ status: '✅', code: 200 });
  });

  test('lists all available networks', async () => {
    const logger = makeLogger();
    const args = makeArgs({}, logger, {});

    await listHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Available networks:'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('localnet'),
    );
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('testnet'));
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('previewnet'),
    );
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('mainnet'));
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('marks active network with indicator', async () => {
    const logger = makeLogger();
    const args = makeArgs({}, logger, {});

    await listHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('- testnet (active)'),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('performs health checks only for active network', async () => {
    const logger = makeLogger();
    const args = makeArgs({}, logger, {});

    await listHandler(args);

    expect(mockedCheckMirrorNodeHealth).toHaveBeenCalledTimes(1);
    expect(mockedCheckMirrorNodeHealth).toHaveBeenCalledWith(
      'https://testnet.mirrornode.hedera.com/api/v1',
    );
    expect(mockedCheckRpcHealth).toHaveBeenCalledTimes(1);
    expect(mockedCheckRpcHealth).toHaveBeenCalledWith(
      'https://testnet.hashio.io/api',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('displays health check results', async () => {
    const logger = makeLogger();
    mockedCheckMirrorNodeHealth.mockResolvedValue({ status: '✅', code: 200 });
    mockedCheckRpcHealth.mockResolvedValue({ status: '❌', code: 500 });

    const args = makeArgs({}, logger, {});

    await listHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Mirror Node:'),
    );
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('✅'));
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('(200)'));
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('RPC URL:'),
    );
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('❌'));
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('(500)'));
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('displays operator ID when present', async () => {
    const logger = makeLogger();
    mockedGetNetwork.mockReturnValue('localnet');
    const args = makeArgs({}, logger, {});

    await listHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Operator ID:'),
    );
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('0.0.2'));
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('does not display operator ID when empty', async () => {
    const logger = makeLogger();
    const args = makeArgs({}, logger, {});

    await listHandler(args);

    const operatorIdCalls = logger.log.mock.calls.filter((call) =>
      String(call[0]).includes('Operator ID:'),
    );
    expect(operatorIdCalls.length).toBe(0);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('returns JSON output with network configuration', async () => {
    const logger = makeLogger();
    mockedIsJsonOutput.mockReturnValue(true);
    const args = makeArgs({}, logger, {});

    await listHandler(args);

    expect(mockedPrintOutput).toHaveBeenCalledWith('networks', {
      networks: expect.arrayContaining([
        expect.objectContaining({
          name: 'localnet',
          isActive: false,
          mirrorNodeUrl: 'http://localhost:8081/api/v1',
          rpcUrl: 'http://localhost:7546',
          operatorId: '0.0.2',
        }),
        expect.objectContaining({
          name: 'testnet',
          isActive: true,
          mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com/api/v1',
          rpcUrl: 'https://testnet.hashio.io/api',
          operatorId: '',
        }),
      ]),
      activeNetwork: 'testnet',
    });
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('handles health check failures', async () => {
    const logger = makeLogger();
    mockedCheckMirrorNodeHealth.mockResolvedValue({ status: '❌' });
    mockedCheckRpcHealth.mockResolvedValue({ status: '❌' });

    const args = makeArgs({}, logger, {});

    await listHandler(args);

    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('❌'));
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error and exits on exception', async () => {
    const logger = makeLogger();
    mockedGetAvailableNetworks.mockImplementation(() => {
      throw new Error('State error');
    });

    const args = makeArgs({}, logger, {});

    await listHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to list networks'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
