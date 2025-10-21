import importAccountHandler from '../../commands/import/handler';
import type { ImportAccountOutput } from '../../commands/import';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import type { CoreAPI } from '../../../../core/core-api/core-api.interface';
import type { HederaMirrornodeService } from '../../../../core/services/mirrornode/hedera-mirrornode-service.interface';
import {
  makeLogger,
  makeArgs,
  makeNetworkMock,
  makeCredentialsStateMock,
  makeAliasMock,
  makeMirrorMock,
} from '../../../../../__tests__/helpers/plugin';
import { NetworkService } from '../../../../core/services/network/network-service.interface';

jest.mock('../../zustand-state-helper', () => ({
  ZustandAccountStateHelper: jest.fn(),
}));

const MockedHelper = ZustandAccountStateHelper as jest.Mock;

describe('account plugin - import command (ADR-003)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('imports account successfully', async () => {
    const logger = makeLogger();
    const saveAccountMock = jest.fn().mockReturnValue(undefined);

    MockedHelper.mockImplementation(() => ({
      hasAccount: jest.fn().mockReturnValue(false),
      saveAccount: saveAccountMock,
    }));

    const mirrorMock = makeMirrorMock();
    const networkMock = makeNetworkMock();
    const credentialsState = makeCredentialsStateMock();
    const alias = makeAliasMock();

    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      network: networkMock as NetworkService,
      credentialsState,
      alias,
      logger,
    };

    const args = makeArgs(api, logger, {
      id: '0.0.9999',
      key: 'privKey',
      alias: 'imported',
    });

    const result = await importAccountHandler(args);

    expect(credentialsState.importPrivateKey).toHaveBeenCalledWith('privKey', [
      'account:imported',
    ]);
    expect(mirrorMock.getAccount).toHaveBeenCalledWith('0.0.9999');
    expect(alias.register).toHaveBeenCalledWith(
      expect.objectContaining({
        alias: 'imported',
        type: 'account',
        network: 'testnet',
        entityId: '0.0.9999',
        publicKey: 'pub-key-test',
        keyRefId: 'kr_test123',
      }),
    );
    expect(saveAccountMock).toHaveBeenCalledWith(
      'imported',
      expect.objectContaining({
        name: 'imported',
        accountId: '0.0.9999',
        network: 'testnet',
        keyRefId: 'kr_test123',
      }),
    );

    expect(result.status).toBe('success');
    expect(result.outputJson).toBeDefined();

    const output: ImportAccountOutput = JSON.parse(result.outputJson!);
    expect(output.accountId).toBe('0.0.9999');
    expect(output.name).toBe('imported');
    expect(output.type).toBe('ECDSA');
    expect(output.alias).toBe('imported');
    expect(output.network).toBe('testnet');
  });

  test('returns failure if account already exists', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      hasAccount: jest.fn().mockReturnValue(true),
      saveAccount: jest.fn(),
    }));

    const mirrorMock = makeMirrorMock();
    const networkMock = makeNetworkMock();
    const credentialsState = makeCredentialsStateMock();
    const alias = makeAliasMock();

    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      network: networkMock as NetworkService,
      credentialsState,
      alias,
      logger,
      state: {} as any,
    };

    const args = makeArgs(api, logger, {
      id: '0.0.1111',
      key: 'key',
      alias: 'test',
    });

    const result = await importAccountHandler(args);

    expect(result.status).toBe('failure');
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).toContain(
      "Account with name 'test' already exists",
    );
  });

  test('returns failure when mirror.getAccount throws', async () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      hasAccount: jest.fn().mockReturnValue(false),
      saveAccount: jest.fn(),
    }));

    const mirrorMock = makeMirrorMock({
      getAccountImpl: jest.fn().mockRejectedValue(new Error('mirror down')),
    });
    const networkMock = makeNetworkMock();
    const credentialsState = makeCredentialsStateMock();
    const alias = makeAliasMock();

    const api: Partial<CoreAPI> = {
      mirror: mirrorMock as HederaMirrornodeService,
      network: networkMock as NetworkService,
      credentialsState,
      alias,
      logger,
      state: {} as any,
    };

    const args = makeArgs(api, logger, {
      id: '0.0.2222',
      key: 'key',
    });

    const result = await importAccountHandler(args);

    expect(result.status).toBe('failure');
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).toContain('Failed to import account');
    expect(result.errorMessage).toContain('mirror down');
  });
});
