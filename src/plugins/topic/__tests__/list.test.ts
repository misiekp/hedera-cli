import type { CommandHandlerArgs } from '../../../core/plugins/plugin.interface';
import { listTopicsHandler } from '../commands/list';
import { ZustandTopicStateHelper } from '../zustand-state-helper';
import { Logger } from '../../../core/services/logger/logger-service.interface';
import type { CoreAPI } from '../../../core/core-api/core-api.interface';
import type { TopicData } from '../schema';

let exitSpy: jest.SpyInstance;

jest.mock('../zustand-state-helper', () => ({
  ZustandTopicStateHelper: jest.fn(),
}));

const MockedHelper = ZustandTopicStateHelper as jest.Mock;

const makeLogger = (): jest.Mocked<Logger> => ({
  log: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  warn: jest.fn(),
});

const makeTopicData = (overrides: Partial<TopicData> = {}): TopicData => ({
  name: 'test-topic',
  topicId: '0.0.1234',
  memo: 'Test topic',
  network: 'testnet',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const makeArgs = (
  api: Partial<CoreAPI>,
  logger: jest.Mocked<Logger>,
  args: Record<string, unknown>,
): CommandHandlerArgs => ({
  api: api as CoreAPI,
  logger,
  state: {} as any,
  config: {} as any,
  args,
});

beforeAll(() => {
  exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
    return undefined as never;
  });
});

afterAll(() => {
  exitSpy.mockRestore();
});

describe('topic plugin - list command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('logs message when no topics exist', () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      listTopics: jest.fn().mockReturnValue([]),
      getTopicStats: jest.fn().mockReturnValue({
        total: 0,
        byNetwork: {},
        withAdminKey: 0,
        withSubmitKey: 0,
        withMemo: 0,
      }),
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, {});

    listTopicsHandler(args);

    expect(logger.log).toHaveBeenCalledWith('No topics found');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('lists topics without keys', () => {
    const logger = makeLogger();
    const topics = [
      makeTopicData({ topicId: '0.0.1111', memo: 'Topic 1', name: 'Topic 1' }),
      makeTopicData({ topicId: '0.0.2222', memo: 'Topic 2', name: 'Topic 2' }),
    ];

    MockedHelper.mockImplementation(() => ({
      listTopics: jest.fn().mockReturnValue(topics),
      getTopicStats: jest.fn().mockReturnValue({
        total: 2,
        byNetwork: { testnet: 2 },
        withAdminKey: 0,
        withSubmitKey: 0,
        withMemo: 2,
      }),
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, {});

    listTopicsHandler(args);

    expect(logger.log).toHaveBeenCalledWith('\nFound 2 topic(s):');
    expect(logger.log).toHaveBeenCalledWith('1. Topic 1');
    expect(logger.log).toHaveBeenCalledWith('   Topic ID: 0.0.1111');
    expect(logger.log).toHaveBeenCalledWith('2. Topic 2');
    expect(logger.log).toHaveBeenCalledWith('   Topic ID: 0.0.2222');
    // Keys should not be shown in detail, but stats will show "With Admin Key: 0"
    expect(logger.log).not.toHaveBeenCalledWith(
      expect.stringContaining('Admin Key: ✅'),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('lists topics with keys when flag is set', () => {
    const logger = makeLogger();
    const topics = [
      makeTopicData({
        topicId: '0.0.3333',
        memo: 'Topic 3',
        name: 'Topic 3',
        adminKeyRefId: 'kr_admin123',
        submitKeyRefId: 'kr_submit123',
      }),
    ];

    MockedHelper.mockImplementation(() => ({
      listTopics: jest.fn().mockReturnValue(topics),
      getTopicStats: jest.fn().mockReturnValue({
        total: 1,
        byNetwork: { testnet: 1 },
        withAdminKey: 1,
        withSubmitKey: 1,
        withMemo: 1,
      }),
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, { keys: true });

    listTopicsHandler(args);

    expect(logger.log).toHaveBeenCalledWith('1. Topic 3');
    expect(logger.log).toHaveBeenCalledWith('   Admin Key: ✅ Present');
    expect(logger.log).toHaveBeenCalledWith('   Submit Key: ✅ Present');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('filters topics by network', () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      listTopics: jest.fn().mockReturnValue([
        makeTopicData({
          topicId: '0.0.4444',
          memo: 'Mainnet Topic',
          name: 'Mainnet Topic',
          network: 'mainnet',
        }),
        makeTopicData({
          topicId: '0.0.5555',
          memo: 'Testnet Topic',
          name: 'Testnet Topic',
          network: 'testnet',
        }),
      ]),
      getTopicStats: jest.fn().mockReturnValue({
        total: 2,
        byNetwork: { mainnet: 1, testnet: 1 },
        withAdminKey: 0,
        withSubmitKey: 0,
        withMemo: 2,
      }),
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, { network: 'mainnet' });

    listTopicsHandler(args);

    expect(logger.log).toHaveBeenCalledWith('\nFound 1 topic(s):');
    expect(logger.log).toHaveBeenCalledWith('1. Mainnet Topic');
    expect(logger.log).toHaveBeenCalledWith('   Topic ID: 0.0.4444');
    expect(logger.log).toHaveBeenCalledWith('   Network: mainnet');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs message when no topics match network filter', () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      listTopics: jest.fn().mockReturnValue([
        makeTopicData({
          topicId: '0.0.5555',
          memo: 'Testnet Topic',
          name: 'Testnet Topic',
          network: 'testnet',
        }),
      ]),
      getTopicStats: jest.fn().mockReturnValue({
        total: 1,
        byNetwork: { testnet: 1 },
        withAdminKey: 0,
        withSubmitKey: 0,
        withMemo: 1,
      }),
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, { network: 'mainnet' });

    listTopicsHandler(args);

    expect(logger.log).toHaveBeenCalledWith(
      'No topics found for network: mainnet',
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('displays statistics correctly', () => {
    const logger = makeLogger();
    const topics = [
      makeTopicData({
        topicId: '0.0.1111',
        memo: 'Topic 1',
        name: 'Topic 1',
        adminKeyRefId: 'kr_admin1',
      }),
      makeTopicData({
        topicId: '0.0.2222',
        memo: 'Topic 2',
        name: 'Topic 2',
        submitKeyRefId: 'kr_submit1',
      }),
    ];

    MockedHelper.mockImplementation(() => ({
      listTopics: jest.fn().mockReturnValue(topics),
      getTopicStats: jest.fn().mockReturnValue({
        total: 2,
        byNetwork: { testnet: 2 },
        withAdminKey: 1,
        withSubmitKey: 1,
        withMemo: 2,
      }),
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, {});

    listTopicsHandler(args);

    expect(logger.log).toHaveBeenCalledWith('Total Topics: 2');
    expect(logger.log).toHaveBeenCalledWith('With Admin Key: 1');
    expect(logger.log).toHaveBeenCalledWith('With Submit Key: 1');
    expect(logger.log).toHaveBeenCalledWith('With Memo: 2');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('logs error and exits when listTopics throws', () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      listTopics: jest.fn().mockImplementation(() => {
        throw new Error('db error');
      }),
    }));

    const api: Partial<CoreAPI> = { state: {} as any, logger };
    const args = makeArgs(api, logger, {});

    listTopicsHandler(args);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Failed to list topics'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
