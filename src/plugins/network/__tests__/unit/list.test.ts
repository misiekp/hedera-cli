import { listHandler } from '../../commands/list';
import {
  makeLogger,
  makeArgs,
  setupExitSpy,
  makeNetworkMock,
} from '../../../../../__tests__/helpers/plugin';
import { isJsonOutput, printOutput } from '../../../../utils/output';
import {
  checkMirrorNodeHealth,
  checkRpcHealth,
} from '../../utils/networkHealth';

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
    dim: (str: string) => str,
  },
  heading: (str: string) => str,
}));

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
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsJsonOutput.mockReturnValue(false);
    mockedCheckMirrorNodeHealth.mockResolvedValue({ status: '✅', code: 200 });
    mockedCheckRpcHealth.mockResolvedValue({ status: '✅', code: 200 });
  });

  test('lists all available networks', async () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const args = makeArgs({ network: networkService }, logger, {});

    await listHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Available networks:'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('● LOCALNET'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('● TESTNET (ACTIVE)'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('● PREVIEWNET'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('● MAINNET'),
    );
  });

  test('shows health checks for active network', async () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    networkService.getNetworkConfig = jest.fn().mockImplementation((name) => ({
      name,
      rpcUrl: `https://${name}.hashio.io/api`,
      mirrorNodeUrl: `https://${name}.mirrornode.hedera.com/api/v1`,
      chainId: '0x128',
      explorerUrl: `https://hashscan.io/${name}`,
      isTestnet: name !== 'mainnet',
    }));
    const args = makeArgs({ network: networkService }, logger, {});

    await listHandler(args);

    expect(mockedCheckMirrorNodeHealth).toHaveBeenCalledWith(
      'https://testnet.mirrornode.hedera.com/api/v1',
    );
    expect(mockedCheckRpcHealth).toHaveBeenCalledWith(
      'https://testnet.hashio.io/api',
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Mirror Node:'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('RPC URL:'),
    );
  });

  test('does not show health checks for inactive networks', async () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const args = makeArgs({ network: networkService }, logger, {});

    await listHandler(args);

    expect(mockedCheckMirrorNodeHealth).toHaveBeenCalledTimes(1);
    expect(mockedCheckRpcHealth).toHaveBeenCalledTimes(1);
  });

  test('outputs JSON format when --json flag is set', async () => {
    mockedIsJsonOutput.mockReturnValue(true);

    const logger = makeLogger();
    const networkService = makeNetworkMock('mainnet');
    networkService.getAvailableNetworks = jest
      .fn()
      .mockReturnValue(['localnet', 'testnet', 'previewnet', 'mainnet']);
    networkService.getNetworkConfig = jest.fn().mockImplementation((name) => ({
      name,
      rpcUrl: `https://${name}.hashio.io/api`,
      mirrorNodeUrl: `https://${name}.mirrornode.hedera.com/api/v1`,
      chainId: '0x127',
      explorerUrl: `https://hashscan.io/${name}`,
      isTestnet: name !== 'mainnet',
    }));
    networkService.getOperator = jest.fn().mockImplementation((name) => {
      if (name === 'mainnet') {
        return { accountId: '0.0.1001', keyRefId: 'kr_mainnet' };
      }
      return null;
    });
    const args = makeArgs({ network: networkService }, logger, { json: true });

    await listHandler(args);

    expect(mockedPrintOutput).toHaveBeenCalledWith('networks', {
      networks: expect.arrayContaining([
        expect.objectContaining({
          name: 'mainnet',
          isActive: true,
          mirrorNodeUrl: 'https://mainnet.mirrornode.hedera.com/api/v1',
          rpcUrl: 'https://mainnet.hashio.io/api',
          operatorId: '0.0.1001',
        }),
      ]),
      activeNetwork: 'mainnet',
    });
  });

  test('handles errors gracefully', async () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    networkService.getAvailableNetworks = jest.fn().mockImplementation(() => {
      throw new Error('Network service error');
    });
    const args = makeArgs({ network: networkService }, logger, {});

    await listHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to list networks'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('shows health check failures', async () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    networkService.getNetworkConfig = jest.fn().mockImplementation((name) => ({
      name,
      rpcUrl: `https://${name}.hashio.io/api`,
      mirrorNodeUrl: `https://${name}.mirrornode.hedera.com/api/v1`,
      chainId: '0x128',
      explorerUrl: `https://hashscan.io/${name}`,
      isTestnet: true,
    }));

    mockedCheckMirrorNodeHealth.mockResolvedValue({ status: '❌', code: 500 });
    mockedCheckRpcHealth.mockResolvedValue({ status: '❌' });

    const args = makeArgs({ network: networkService }, logger, {});

    await listHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Mirror Node:'),
    );
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('❌'));
  });

  test('exits with code 0 on success', async () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    const args = makeArgs({ network: networkService }, logger, {});

    await listHandler(args);

    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('shows operator information for each network', async () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    networkService.getOperator = jest.fn().mockImplementation((name) => {
      if (name === 'testnet') {
        return { accountId: '0.0.1001', keyRefId: 'kr_testnet' };
      }
      if (name === 'mainnet') {
        return { accountId: '0.0.2001', keyRefId: 'kr_mainnet' };
      }
      return null;
    });
    const args = makeArgs({ network: networkService }, logger, {});

    await listHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Operator: 0.0.1001'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Operator: Not configured'),
    );
  });

  test('shows "Not configured" when no operator is set', async () => {
    const logger = makeLogger();
    const networkService = makeNetworkMock('testnet');
    networkService.getOperator = jest.fn().mockReturnValue(null);
    const args = makeArgs({ network: networkService }, logger, {});

    await listHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Operator: Not configured'),
    );
  });
});
