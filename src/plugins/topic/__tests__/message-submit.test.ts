import type { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { submitMessageHandler } from '../commands/message-submit';
import { ZustandTopicStateHelper } from '../zustand-state-helper';
import type { CoreAPI } from '../../../core/core-api/core-api.interface';
import type { TransactionResult } from '../../../core/services/signing/signing-service.interface';
import type { TopicData } from '../schema';
import {
  makeLogger,
  makeArgs,
  makeNetworkMock,
  makeAliasMock,
  setupExitSpy,
} from '../../../../__tests__/helpers/plugin';

let exitSpy: jest.SpyInstance;

jest.mock('../zustand-state-helper', () => ({
  ZustandTopicStateHelper: jest.fn(),
}));

const MockedHelper = ZustandTopicStateHelper as jest.Mock;

const makeTopicData = (overrides: Partial<TopicData> = {}): TopicData => ({
  name: 'test-topic',
  topicId: '0.0.1234',
  memo: 'Test topic',
  network: 'testnet',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const makeApiMocks = ({
  submitMessageImpl,
  signAndExecuteImpl,
  signAndExecuteWithImpl,
  freezeTransactionImpl,
  network = 'testnet',
}: {
  submitMessageImpl?: jest.Mock;
  signAndExecuteImpl?: jest.Mock;
  signAndExecuteWithImpl?: jest.Mock;
  freezeTransactionImpl?: jest.Mock;
  network?: 'testnet' | 'mainnet' | 'previewnet';
}) => {
  const topicTransactions = {
    createTopic: jest.fn(),
    submitMessage: submitMessageImpl || jest.fn(),
  };

  const mockTransaction = {
    sign: jest.fn().mockResolvedValue({
      sign: jest.fn(),
    }),
  };

  const signing = {
    signAndExecute: signAndExecuteImpl || jest.fn(),
    signAndExecuteWith: signAndExecuteWithImpl || jest.fn(),
    sign: jest.fn(),
    execute: jest.fn(),
    getStatus: jest.fn(),
    freezeTransaction:
      freezeTransactionImpl || jest.fn().mockReturnValue(mockTransaction),
  };

  const networkMock = makeNetworkMock(network);
  const alias = makeAliasMock();

  return { topicTransactions, signing, networkMock, alias };
};

beforeAll(() => {
  exitSpy = setupExitSpy();
});

afterAll(() => {
  exitSpy.mockRestore();
});

describe('topic plugin - message-submit command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('submits message successfully without submit key', async () => {
    const logger = makeLogger();
    const topicData = makeTopicData({
      topicId: '0.0.1234',
      memo: 'Test topic',
    });
    const loadTopicMock = jest.fn().mockReturnValue(topicData);
    MockedHelper.mockImplementation(() => ({ loadTopic: loadTopicMock }));

    const { topicTransactions, signing, networkMock, alias } = makeApiMocks({
      submitMessageImpl: jest.fn().mockReturnValue({
        transaction: {},
      }),
      signAndExecuteImpl: jest.fn().mockResolvedValue({
        transactionId: 'tx-123',
        success: true,
        topicSequenceNumber: 5,
        receipt: {} as any,
      } as TransactionResult),
    });

    const api: Partial<CoreAPI> = {
      topicTransactions,
      signing,
      network: networkMock,
      alias: alias as any,
      state: {} as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.1234',
      message: 'Hello, World!',
    });

    await submitMessageHandler(args);

    expect(loadTopicMock).toHaveBeenCalledWith('0.0.1234');
    expect(topicTransactions.submitMessage).toHaveBeenCalledWith({
      topicId: '0.0.1234',
      message: 'Hello, World!',
    });
    expect(logger.log).toHaveBeenCalledWith(
      '✅ Message submitted successfully',
    );
    expect(logger.log).toHaveBeenCalledWith('   Topic ID: 0.0.1234');
    expect(logger.log).toHaveBeenCalledWith('   Message: "Hello, World!"');
    expect(logger.log).toHaveBeenCalledWith('   Sequence Number: 5');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('submits message successfully with submit key', async () => {
    const logger = makeLogger();
    const submitKeyRefId = 'kr_submit123';
    const topicData = makeTopicData({
      topicId: '0.0.5678',
      memo: 'Test topic with key',
      submitKeyRefId,
    });
    const loadTopicMock = jest.fn().mockReturnValue(topicData);
    MockedHelper.mockImplementation(() => ({ loadTopic: loadTopicMock }));

    const { topicTransactions, signing, networkMock, alias } = makeApiMocks({
      submitMessageImpl: jest.fn().mockReturnValue({
        transaction: {},
      }),
      signAndExecuteWithImpl: jest.fn().mockResolvedValue({
        transactionId: 'tx-456',
        success: true,
        topicSequenceNumber: 10,
        receipt: {} as any,
      } as TransactionResult),
    });

    const api: Partial<CoreAPI> = {
      topicTransactions,
      signing,
      network: networkMock,
      alias: alias as any,
      state: {} as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.5678',
      message: 'Signed message',
    });

    await submitMessageHandler(args);

    expect(signing.signAndExecuteWith).toHaveBeenCalledWith(
      {},
      { keyRefId: submitKeyRefId },
    );
    expect(logger.log).toHaveBeenCalledWith(
      '✅ Message submitted successfully',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('throws error when topic not found', async () => {
    const logger = makeLogger();
    const loadTopicMock = jest.fn().mockReturnValue(null);
    MockedHelper.mockImplementation(() => ({ loadTopic: loadTopicMock }));

    const { topicTransactions, signing, networkMock, alias } = makeApiMocks({});

    const api: Partial<CoreAPI> = {
      topicTransactions,
      signing,
      network: networkMock,
      alias: alias as any,
      state: {} as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.9999',
      message: 'Test message',
    });

    await submitMessageHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to submit message'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('logs error and exits when signAndExecute returns failure', async () => {
    const logger = makeLogger();
    const topicData = makeTopicData({
      topicId: '0.0.1234',
    });
    const loadTopicMock = jest.fn().mockReturnValue(topicData);
    MockedHelper.mockImplementation(() => ({ loadTopic: loadTopicMock }));

    const { topicTransactions, signing, networkMock, alias } = makeApiMocks({
      submitMessageImpl: jest.fn().mockReturnValue({
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
      alias: alias as any,
      state: {} as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.1234',
      message: 'Failed message',
    });

    await submitMessageHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to submit message'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('logs error and exits when submitMessage throws', async () => {
    const logger = makeLogger();
    const topicData = makeTopicData({
      topicId: '0.0.1234',
    });
    const loadTopicMock = jest.fn().mockReturnValue(topicData);
    MockedHelper.mockImplementation(() => ({ loadTopic: loadTopicMock }));

    const { topicTransactions, signing, networkMock, alias } = makeApiMocks({
      submitMessageImpl: jest.fn().mockImplementation(() => {
        throw new Error('network error');
      }),
    });

    const api: Partial<CoreAPI> = {
      topicTransactions,
      signing,
      network: networkMock,
      alias: alias as any,
      state: {} as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.1234',
      message: 'Error message',
    });

    await submitMessageHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to submit message'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
