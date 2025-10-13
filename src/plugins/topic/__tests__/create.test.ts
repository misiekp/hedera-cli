import type { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { createTopicHandler } from '../commands/create';
import { ZustandTopicStateHelper } from '../zustand-state-helper';
import type { CoreAPI } from '../../../core/core-api/core-api.interface';
import type { TransactionResult } from '../../../core/services/signing/signing-service.interface';
import {
  makeLogger,
  makeArgs,
  makeNetworkMock,
  makeCredentialsStateMock,
  makeAliasMock,
  setupExitSpy,
} from '../../../../__tests__/helpers/plugin';

let exitSpy: jest.SpyInstance;

jest.mock('../zustand-state-helper', () => ({
  ZustandTopicStateHelper: jest.fn(),
}));

const MockedHelper = ZustandTopicStateHelper as jest.Mock;

const makeApiMocks = ({
  createTopicImpl,
  signAndExecuteImpl,
  signAndExecuteWithImpl,
  network = 'testnet',
}: {
  createTopicImpl?: jest.Mock;
  signAndExecuteImpl?: jest.Mock;
  signAndExecuteWithImpl?: jest.Mock;
  network?: 'testnet' | 'mainnet' | 'previewnet';
}) => {
  const topicTransactions = {
    createTopic: createTopicImpl || jest.fn(),
    submitMessage: jest.fn(),
  };

  const signing = {
    signAndExecute: signAndExecuteImpl || jest.fn(),
    signAndExecuteWith: signAndExecuteWithImpl || jest.fn(),
    sign: jest.fn(),
    execute: jest.fn(),
    getStatus: jest.fn(),
    freezeTransaction: jest.fn(),
  };

  const networkMock = makeNetworkMock(network);
  const credentialsState = makeCredentialsStateMock();
  credentialsState.importPrivateKey.mockImplementation((key: string) => ({
    keyRefId: `kr_${key.slice(-5)}`,
    publicKey: 'mock-public-key',
  }));
  const alias = makeAliasMock();

  return { topicTransactions, signing, networkMock, credentialsState, alias };
};

beforeAll(() => {
  exitSpy = setupExitSpy();
});

afterAll(() => {
  exitSpy.mockRestore();
});

describe('topic plugin - create command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates topic successfully with memo', async () => {
    const logger = makeLogger();
    const saveTopicMock = jest.fn();
    MockedHelper.mockImplementation(() => ({ saveTopic: saveTopicMock }));

    const { topicTransactions, signing, networkMock, credentialsState, alias } =
      makeApiMocks({
        createTopicImpl: jest.fn().mockReturnValue({
          transaction: {},
        }),
        signAndExecuteImpl: jest.fn().mockResolvedValue({
          transactionId: 'tx-123',
          success: true,
          topicId: '0.0.9999',
          receipt: {} as any,
        } as TransactionResult),
      });

    const api: Partial<CoreAPI> = {
      topicTransactions,
      signing,
      network: networkMock,
      credentialsState: credentialsState as any,
      alias: alias as any,
      state: {} as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      memo: 'Test topic memo',
    });

    await createTopicHandler(args);

    expect(topicTransactions.createTopic).toHaveBeenCalledWith({
      memo: 'Test topic memo',
      adminKey: undefined,
      submitKey: undefined,
    });
    expect(signing.signAndExecute).toHaveBeenCalled();
    expect(saveTopicMock).toHaveBeenCalledWith(
      '0.0.9999',
      expect.objectContaining({
        topicId: '0.0.9999',
        memo: 'Test topic memo',
        network: 'testnet',
      }),
    );
    expect(logger.log).toHaveBeenCalledWith(
      '✅ Topic created successfully: 0.0.9999',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('creates topic successfully with admin and submit keys', async () => {
    const logger = makeLogger();
    const saveTopicMock = jest.fn();
    MockedHelper.mockImplementation(() => ({ saveTopic: saveTopicMock }));

    const adminKey = '302e020100300506032b657004220420admin';
    const submitKey = '302e020100300506032b657004220420submit';

    const { topicTransactions, signing, networkMock, credentialsState, alias } =
      makeApiMocks({
        createTopicImpl: jest.fn().mockReturnValue({
          transaction: {},
        }),
        signAndExecuteWithImpl: jest.fn().mockResolvedValue({
          transactionId: 'tx-456',
          success: true,
          topicId: '0.0.8888',
          receipt: {} as any,
        } as TransactionResult),
      });

    const api: Partial<CoreAPI> = {
      topicTransactions,
      signing,
      network: networkMock,
      credentialsState: credentialsState as any,
      alias: alias as any,
      state: {} as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      memo: 'Test topic',
      adminKey,
      submitKey,
    });

    await createTopicHandler(args);

    expect(topicTransactions.createTopic).toHaveBeenCalledWith({
      memo: 'Test topic',
      adminKey,
      submitKey,
    });
    expect(credentialsState.importPrivateKey).toHaveBeenCalledWith(adminKey);
    expect(credentialsState.importPrivateKey).toHaveBeenCalledWith(submitKey);
    expect(signing.signAndExecuteWith).toHaveBeenCalledWith(
      {},
      {
        keyRefId: 'kr_admin',
      },
    );
    expect(saveTopicMock).toHaveBeenCalledWith(
      '0.0.8888',
      expect.objectContaining({
        topicId: '0.0.8888',
        memo: 'Test topic',
        adminKeyRefId: 'kr_admin',
        submitKeyRefId: 'kr_ubmit',
        network: 'testnet',
      }),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('creates topic successfully without memo', async () => {
    const logger = makeLogger();
    const saveTopicMock = jest.fn();
    MockedHelper.mockImplementation(() => ({ saveTopic: saveTopicMock }));

    const { topicTransactions, signing, networkMock, credentialsState, alias } =
      makeApiMocks({
        createTopicImpl: jest.fn().mockReturnValue({
          transaction: {},
        }),
        signAndExecuteImpl: jest.fn().mockResolvedValue({
          transactionId: 'tx-789',
          success: true,
          topicId: '0.0.7777',
          receipt: {} as any,
        } as TransactionResult),
      });

    const api: Partial<CoreAPI> = {
      topicTransactions,
      signing,
      network: networkMock,
      credentialsState: credentialsState as any,
      alias: alias as any,
      state: {} as any,
      logger,
    };

    const args = makeArgs(api, logger, {});

    await createTopicHandler(args);

    expect(topicTransactions.createTopic).toHaveBeenCalledWith({
      memo: undefined,
      adminKey: undefined,
      submitKey: undefined,
    });
    expect(saveTopicMock).toHaveBeenCalledWith(
      '0.0.7777',
      expect.objectContaining({
        topicId: '0.0.7777',
        memo: '(No memo)',
        network: 'testnet',
      }),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error and exits when signAndExecute returns failure', async () => {
    const logger = makeLogger();
    MockedHelper.mockImplementation(() => ({ saveTopic: jest.fn() }));

    const { topicTransactions, signing, networkMock, credentialsState, alias } =
      makeApiMocks({
        createTopicImpl: jest.fn().mockReturnValue({
          transaction: {},
        }),
        signAndExecuteImpl: jest.fn().mockResolvedValue({
          transactionId: 'tx-123',
          success: false,
          receipt: {} as any,
        } as TransactionResult),
      });

    const api: Partial<CoreAPI> = {
      topicTransactions,
      signing,
      network: networkMock,
      credentialsState: credentialsState as any,
      alias: alias as any,
      state: {} as any,
      logger,
    };

    const args = makeArgs(api, logger, { memo: 'Failed topic' });

    await createTopicHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to create topic'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('logs error and exits when createTopic throws', async () => {
    const logger = makeLogger();
    MockedHelper.mockImplementation(() => ({ saveTopic: jest.fn() }));

    const { topicTransactions, signing, networkMock, credentialsState, alias } =
      makeApiMocks({
        createTopicImpl: jest.fn().mockImplementation(() => {
          throw new Error('network error');
        }),
      });

    const api: Partial<CoreAPI> = {
      topicTransactions,
      signing,
      network: networkMock,
      credentialsState: credentialsState as any,
      alias: alias as any,
      state: {} as any,
      logger,
    };

    const args = makeArgs(api, logger, { memo: 'Error topic' });

    await createTopicHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to create topic'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
