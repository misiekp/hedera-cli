import type { CommandHandlerArgs } from '../../../src/core/plugins/plugin.interface';
import clearAccountsHandler from '../../../src/plugins/account/commands/clear';
import { ZustandAccountStateHelper } from '../../../src/plugins/account/zustand-state-helper';

// jest.mock('../../src/plugins/account/zustand-state-helper', () => ({
//   ZustandAccountStateHelper: jest.fn(),
// }));

describe.skip('account plugin - clear command (unit)', () => {
  const makeLogger = () => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('clears all accounts (happy path)', async () => {
    const logger = makeLogger();

    let listAccountsMock!: jest.Mock;
    let clearAccountsMock!: jest.Mock;

    (ZustandAccountStateHelper as unknown as jest.Mock).mockImplementation(
      () => {
        listAccountsMock = jest
          .fn()
          .mockResolvedValue([{ name: 'a' }, { name: 'b' }]);
        clearAccountsMock = jest.fn().mockResolvedValue(undefined);
        return {
          listAccounts: listAccountsMock,
          clearAccounts: clearAccountsMock,
        };
      },
    );

    const args = {
      api: { state: {} },
      logger,
      args: {},
    } as unknown as CommandHandlerArgs;

    await clearAccountsHandler(args);

    expect(ZustandAccountStateHelper).toHaveBeenCalledWith(
      args.api.state,
      logger,
    );
    expect(listAccountsMock).toHaveBeenCalledTimes(1);
    expect(clearAccountsMock).toHaveBeenCalledTimes(1);
  });
});
