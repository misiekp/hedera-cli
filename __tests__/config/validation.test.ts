import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getState, resetStore } from '../../src/state/store';

// Helper to write a temp config file
function writeTempConfig(obj: unknown): string {
  const p = path.join(
    os.tmpdir(),
    `hcli-config-${Date.now()}-${Math.random()}.json`,
  );
  fs.writeFileSync(p, JSON.stringify(obj), 'utf-8');
  return p;
}

describe('User config validation', () => {
  test('accepts valid partial overlay', () => {
    const cfg = writeTempConfig({
      network: 'testnet',
      networks: {
        testnet: { rpcUrl: 'https://testnet.hashio.io/api' },
      },
    });
    resetStore({ userConfigPath: cfg });
    const state = getState();
    expect(state.network).toBe('testnet');
    expect(state.networks.testnet.rpcUrl).toBe('https://testnet.hashio.io/api');
  });

  test('invalid fields are rejected and not applied', () => {
    const cfg = writeTempConfig({
      network: 'previewnet',
      extraKey: 'nope', // not in schema
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    resetStore({ userConfigPath: cfg });
    const state = getState();
    // network also ignored because entire overlay invalid
    expect(state.network).not.toBe('previewnet');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
