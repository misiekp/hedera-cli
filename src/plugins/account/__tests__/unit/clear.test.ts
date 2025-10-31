import type { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import clearAccountsHandler from '../../commands/clear/handler';
import type { ClearAccountsOutput } from '../../commands/clear';
import { makeLogger } from '../../../../../__tests__/helpers/plugin';
import { Status } from '../../../../core/shared/constants';

jest.mock('../../zustand-state-helper', () => ({
  ZustandAccountStateHelper: jest.fn(),
}));

const MockedHelper = ZustandAccountStateHelper as jest.Mock;

describe('account plugin - clear command (ADR-003)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('clears all accounts successfully', () => {
    const logger = makeLogger();

    const listAccountsMock = jest
      .fn()
      .mockReturnValue([{ name: 'a' }, { name: 'b' }]);
    const clearAccountsMock = jest.fn().mockReturnValue(undefined);

    MockedHelper.mockImplementation(() => ({
      listAccounts: listAccountsMock,
      clearAccounts: clearAccountsMock,
    }));

    const args: Partial<CommandHandlerArgs> = {
      api: { state: {} } as any,
      logger,
      args: {},
    };

    const result = clearAccountsHandler(args as CommandHandlerArgs);

    expect(MockedHelper).toHaveBeenCalledWith(args.api!.state, logger);
    expect(listAccountsMock).toHaveBeenCalledTimes(1);
    expect(clearAccountsMock).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith('Clearing all accounts...');

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();

    const output: ClearAccountsOutput = JSON.parse(result.outputJson!);
    expect(output.clearedCount).toBe(2);
  });

  test('returns failure when clear fails', () => {
    const logger = makeLogger();

    MockedHelper.mockImplementation(() => ({
      listAccounts: jest.fn().mockReturnValue([{ name: 'a' }]),
      clearAccounts: jest.fn().mockImplementation(() => {
        throw new Error('db error');
      }),
    }));

    const args: Partial<CommandHandlerArgs> = {
      api: { state: {} } as any,
      logger,
      args: {},
    };

    const result = clearAccountsHandler(args as CommandHandlerArgs);

    expect(result.status).toBe(Status.Failure);
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).toContain('Failed to clear accounts');
    expect(result.errorMessage).toContain('db error');
  });
});
