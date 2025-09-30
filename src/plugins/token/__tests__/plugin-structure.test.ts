/**
 * Token Plugin Structure Tests
 * Validates the plugin structure and exports
 */
import { tokenPluginManifest } from '../manifest';
import {
  transferTokenHandler,
  createTokenHandler,
  associateTokenHandler,
  createTokenFromFileHandler,
} from '../index';

describe('Token Plugin Structure', () => {
  test('manifest should be properly defined', () => {
    expect(tokenPluginManifest).toBeDefined();
    expect(tokenPluginManifest.name).toBe('token');
    expect(tokenPluginManifest.version).toBe('1.0.0');
    expect(tokenPluginManifest.displayName).toBe('Token Plugin');
  });

  test('manifest should declare all commands', () => {
    const commandNames = tokenPluginManifest.commands.map((cmd) => cmd.name);
    expect(commandNames).toContain('create');
    expect(commandNames).toContain('associate');
    expect(commandNames).toContain('transfer');
    expect(commandNames).toContain('create-from-file');
  });

  test('manifest should have proper capabilities', () => {
    expect(tokenPluginManifest.capabilities).toContain(
      'state:namespace:token-tokens',
    );
    expect(tokenPluginManifest.capabilities).toContain('network:read');
    expect(tokenPluginManifest.capabilities).toContain('network:write');
    expect(tokenPluginManifest.capabilities).toContain('signing:use');
  });

  test('manifest should have state schema', () => {
    expect(tokenPluginManifest.stateSchemas).toBeDefined();
    expect(tokenPluginManifest.stateSchemas).toHaveLength(1);
    expect(tokenPluginManifest.stateSchemas![0].namespace).toBe('token-tokens');
  });

  test('command handlers should be exported', () => {
    expect(transferTokenHandler).toBeDefined();
    expect(createTokenHandler).toBeDefined();
    expect(associateTokenHandler).toBeDefined();
    expect(createTokenFromFileHandler).toBeDefined();
  });

  test('command handlers should be functions', () => {
    expect(typeof transferTokenHandler).toBe('function');
    expect(typeof createTokenHandler).toBe('function');
    expect(typeof associateTokenHandler).toBe('function');
    expect(typeof createTokenFromFileHandler).toBe('function');
  });
});
