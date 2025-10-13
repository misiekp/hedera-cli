import type { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { findMessageHandler } from '../commands/message-find';
import type { CoreAPI } from '../../../core/core-api/core-api.interface';
import type { HederaMirrornodeService } from '../../../core/services/mirrornode/hedera-mirrornode-service.interface';
import {
  makeLogger,
  makeArgs,
  makeNetworkMock,
  makeAliasMock,
  setupExitSpy,
} from '../../../../__tests__/helpers/plugin';

let exitSpy: jest.SpyInstance;

const makeTopicMessage = (sequenceNumber: number, message: string) => ({
  consensus_timestamp: '1234567890.123456789',
  message: Buffer.from(message).toString('base64'),
  sequence_number: sequenceNumber,
  payer_account_id: '0.0.1234',
  topic_id: '0.0.5678',
  running_hash: 'hash',
  running_hash_version: 3,
});

const makeApiMocks = ({
  getTopicMessageImpl,
  getTopicMessagesImpl,
  network = 'testnet',
}: {
  getTopicMessageImpl?: jest.Mock;
  getTopicMessagesImpl?: jest.Mock;
  network?: 'testnet' | 'mainnet' | 'previewnet';
}) => {
  const mirror: jest.Mocked<HederaMirrornodeService> = {
    getTopicMessage: getTopicMessageImpl || jest.fn(),
    getTopicMessages: getTopicMessagesImpl || jest.fn(),
    getAccount: jest.fn(),
    getAccountHBarBalance: jest.fn(),
    getAccountTokenBalances: jest.fn(),
    getTokenInfo: jest.fn(),
    getTopicInfo: jest.fn(),
    getTransactionRecord: jest.fn(),
    getContractInfo: jest.fn(),
    getPendingAirdrops: jest.fn(),
    getOutstandingAirdrops: jest.fn(),
    getExchangeRate: jest.fn(),
  };

  const networkMock = makeNetworkMock(network);
  const alias = makeAliasMock();

  return { mirror, networkMock, alias };
};

beforeAll(() => {
  exitSpy = setupExitSpy();
});

afterAll(() => {
  exitSpy.mockRestore();
});

describe('topic plugin - message-find command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('finds message by sequence number', async () => {
    const logger = makeLogger();
    const mockMessage = makeTopicMessage(5, 'Hello, World!');

    const { mirror, networkMock, alias } = makeApiMocks({
      getTopicMessageImpl: jest.fn().mockResolvedValue(mockMessage),
    });

    const api: Partial<CoreAPI> = {
      mirror,
      network: networkMock,
      alias: alias as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.5678',
      sequenceNumber: 5,
    });

    await findMessageHandler(args);

    expect(mirror.getTopicMessage).toHaveBeenCalledWith({
      topicId: '0.0.5678',
      sequenceNumber: 5,
    });
    expect(logger.log).toHaveBeenCalledWith('   Message: "Hello, World!"');
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Timestamp:'),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('finds messages with greater than filter', async () => {
    const logger = makeLogger();
    const mockMessages = [
      makeTopicMessage(6, 'Message 6'),
      makeTopicMessage(7, 'Message 7'),
      makeTopicMessage(8, 'Message 8'),
    ];

    const { mirror, networkMock, alias } = makeApiMocks({
      getTopicMessagesImpl: jest.fn().mockResolvedValue({
        messages: mockMessages,
        links: { next: null },
      }),
    });

    const api: Partial<CoreAPI> = {
      mirror,
      network: networkMock,
      alias: alias as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.5678',
      sequenceNumberGt: 5,
    });

    await findMessageHandler(args);

    expect(mirror.getTopicMessages).toHaveBeenCalledWith({
      topicId: '0.0.5678',
      filter: {
        field: 'sequenceNumber',
        operation: 'gt',
        value: 5,
      },
    });
    expect(logger.log).toHaveBeenCalledWith('1. Sequence #6');
    expect(logger.log).toHaveBeenCalledWith('   Message: "Message 6"');
    expect(logger.log).toHaveBeenCalledWith('2. Sequence #7');
    expect(logger.log).toHaveBeenCalledWith('   Message: "Message 7"');
    expect(logger.log).toHaveBeenCalledWith('3. Sequence #8');
    expect(logger.log).toHaveBeenCalledWith('   Message: "Message 8"');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('finds messages with greater than or equal filter', async () => {
    const logger = makeLogger();
    const mockMessages = [
      makeTopicMessage(5, 'Message 5'),
      makeTopicMessage(6, 'Message 6'),
    ];

    const { mirror, networkMock, alias } = makeApiMocks({
      getTopicMessagesImpl: jest.fn().mockResolvedValue({
        messages: mockMessages,
        links: { next: null },
      }),
    });

    const api: Partial<CoreAPI> = {
      mirror,
      network: networkMock,
      alias: alias as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.5678',
      sequenceNumberGte: 5,
    });

    await findMessageHandler(args);

    expect(mirror.getTopicMessages).toHaveBeenCalledWith({
      topicId: '0.0.5678',
      filter: {
        field: 'sequenceNumber',
        operation: 'gte',
        value: 5,
      },
    });
    expect(logger.log).toHaveBeenCalledWith('1. Sequence #5');
    expect(logger.log).toHaveBeenCalledWith('   Message: "Message 5"');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('finds messages with less than filter', async () => {
    const logger = makeLogger();
    const mockMessages = [
      makeTopicMessage(1, 'Message 1'),
      makeTopicMessage(2, 'Message 2'),
    ];

    const { mirror, networkMock, alias } = makeApiMocks({
      getTopicMessagesImpl: jest.fn().mockResolvedValue({
        messages: mockMessages,
        links: { next: null },
      }),
    });

    const api: Partial<CoreAPI> = {
      mirror,
      network: networkMock,
      alias: alias as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.5678',
      sequenceNumberLt: 3,
    });

    await findMessageHandler(args);

    expect(mirror.getTopicMessages).toHaveBeenCalledWith({
      topicId: '0.0.5678',
      filter: {
        field: 'sequenceNumber',
        operation: 'lt',
        value: 3,
      },
    });
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('finds messages with less than or equal filter', async () => {
    const logger = makeLogger();
    const mockMessages = [makeTopicMessage(3, 'Message 3')];

    const { mirror, networkMock, alias } = makeApiMocks({
      getTopicMessagesImpl: jest.fn().mockResolvedValue({
        messages: mockMessages,
        links: { next: null },
      }),
    });

    const api: Partial<CoreAPI> = {
      mirror,
      network: networkMock,
      alias: alias as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.5678',
      sequenceNumberLte: 3,
    });

    await findMessageHandler(args);

    expect(mirror.getTopicMessages).toHaveBeenCalledWith({
      topicId: '0.0.5678',
      filter: {
        field: 'sequenceNumber',
        operation: 'lte',
        value: 3,
      },
    });
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('finds messages with equal filter', async () => {
    const logger = makeLogger();
    const mockMessages = [makeTopicMessage(5, 'Message 5')];

    const { mirror, networkMock, alias } = makeApiMocks({
      getTopicMessagesImpl: jest.fn().mockResolvedValue({
        messages: mockMessages,
        links: { next: null },
      }),
    });

    const api: Partial<CoreAPI> = {
      mirror,
      network: networkMock,
      alias: alias as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.5678',
      sequenceNumberEq: 5,
    });

    await findMessageHandler(args);

    expect(mirror.getTopicMessages).toHaveBeenCalledWith({
      topicId: '0.0.5678',
      filter: {
        field: 'sequenceNumber',
        operation: 'eq',
        value: 5,
      },
    });
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('finds messages with not equal filter', async () => {
    const logger = makeLogger();
    const mockMessages = [
      makeTopicMessage(1, 'Message 1'),
      makeTopicMessage(3, 'Message 3'),
    ];

    const { mirror, networkMock, alias } = makeApiMocks({
      getTopicMessagesImpl: jest.fn().mockResolvedValue({
        messages: mockMessages,
        links: { next: null },
      }),
    });

    const api: Partial<CoreAPI> = {
      mirror,
      network: networkMock,
      alias: alias as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.5678',
      sequenceNumberNe: 2,
    });

    await findMessageHandler(args);

    expect(mirror.getTopicMessages).toHaveBeenCalledWith({
      topicId: '0.0.5678',
      filter: {
        field: 'sequenceNumber',
        operation: 'ne',
        value: 2,
      },
    });
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error when no sequence number or filter provided', async () => {
    const logger = makeLogger();

    const { mirror, networkMock, alias } = makeApiMocks({});

    const api: Partial<CoreAPI> = {
      mirror,
      network: networkMock,
      alias: alias as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.5678',
    });

    await findMessageHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      'No sequence number or filter provided.',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error and exits when getTopicMessage throws', async () => {
    const logger = makeLogger();

    const { mirror, networkMock, alias } = makeApiMocks({
      getTopicMessageImpl: jest
        .fn()
        .mockRejectedValue(new Error('network error')),
    });

    const api: Partial<CoreAPI> = {
      mirror,
      network: networkMock,
      alias: alias as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.5678',
      sequenceNumber: 5,
    });

    await findMessageHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to find messages'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('logs error and exits when getTopicMessages throws', async () => {
    const logger = makeLogger();

    const { mirror, networkMock, alias } = makeApiMocks({
      getTopicMessagesImpl: jest
        .fn()
        .mockRejectedValue(new Error('network error')),
    });

    const api: Partial<CoreAPI> = {
      mirror,
      network: networkMock,
      alias: alias as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.5678',
      sequenceNumberGte: 5,
    });

    await findMessageHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to find messages'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('handles empty message list', async () => {
    const logger = makeLogger();

    const { mirror, networkMock, alias } = makeApiMocks({
      getTopicMessagesImpl: jest.fn().mockResolvedValue({
        messages: [],
        links: { next: null },
      }),
    });

    const api: Partial<CoreAPI> = {
      mirror,
      network: networkMock,
      alias: alias as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.5678',
      sequenceNumberGte: 1000,
    });

    await findMessageHandler(args);

    // Should exit successfully even with empty messages since filter was provided
    expect(logger.error).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('uses first filter when multiple filters are provided', async () => {
    const logger = makeLogger();
    const mockMessages = [makeTopicMessage(6, 'Message 6')];

    const { mirror, networkMock, alias } = makeApiMocks({
      getTopicMessagesImpl: jest.fn().mockResolvedValue({
        messages: mockMessages,
        links: { next: null },
      }),
    });

    const api: Partial<CoreAPI> = {
      mirror,
      network: networkMock,
      alias: alias as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      topicId: '0.0.5678',
      sequenceNumberGt: 5,
      sequenceNumberLt: 10,
    });

    await findMessageHandler(args);

    // Should use the first non-empty filter (gt)
    expect(mirror.getTopicMessages).toHaveBeenCalledWith({
      topicId: '0.0.5678',
      filter: {
        field: 'sequenceNumber',
        operation: 'gt',
        value: 5,
      },
    });
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
