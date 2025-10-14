import { Command } from 'commander';
import { PluginManager } from '../../../src/core/plugins/plugin-manager';
import { createCoreAPI } from '../../../src/core';
import {
  get as storeGet,
  saveState as storeSaveState,
} from '../../../src/state/store';
import { alice, tokenState } from '../../helpers/state';
import { TransactionService } from '../../../src/core/services/signing/signing-service.interface';
import { setupExitSpy } from '../../helpers/plugin';

const tokenId = Object.keys(tokenState.tokens)[0];

// Mock signing service
const mockSigningService: jest.Mocked<TransactionService> = {
  signAndExecute: jest.fn().mockResolvedValue({
    transactionId: '0.0.123456@1234567890.123456789',
    success: true,
    receipt: {
      status: {
        status: 'success',
        transactionId: '0.0.123456@1234567890.123456789',
      },
    },
  }),
  signAndExecuteWith: jest.fn().mockResolvedValue({
    transactionId: '0.0.123456@1234567890.123456789',
    success: true,
    receipt: {
      status: {
        status: 'success',
        transactionId: '0.0.123456@1234567890.123456789',
      },
    },
  }),
};

jest.mock('@hashgraph/sdk', () => {
  const originalModule = jest.requireActual('@hashgraph/sdk');

  return {
    ...originalModule,
    TokenAssociateTransaction: jest.fn().mockImplementation(() => ({
      setAccountId: jest.fn().mockReturnThis(),
      setTokenIds: jest.fn().mockReturnThis(),
      sign: jest.fn().mockReturnThis(),
      freezeWith: jest.fn().mockReturnThis(),
      signWith: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn().mockResolvedValue({
        getReceipt: jest.fn().mockResolvedValue({}),
        transactionId: { toString: () => '0.0.123456@1234567890.123456789' },
      }),
    })),
  };
});

describe('token associate command', () => {
  let pluginManager: PluginManager;
  let program: Command;
  let exitSpy: jest.SpyInstance;

  beforeEach(async () => {
    exitSpy = setupExitSpy();

    // Set up basic state with accounts
    const tokenStateWithAlice = {
      ...tokenState,
      accounts: {
        [alice.name]: alice,
      },
    };
    storeSaveState(tokenStateWithAlice as any);

    // Set up plugin system
    const coreAPI = createCoreAPI();

    // Replace the signing service with our mock
    coreAPI.signing = mockSigningService;

    pluginManager = new PluginManager(coreAPI);

    // Set up token plugin
    pluginManager.setDefaultPlugins([
      './dist/plugins/token', // Token management plugin
    ]);

    await pluginManager.initialize();

    // Set the network to localnet to match our test data
    coreAPI.network.switchNetwork('localnet');

    // Now properly add the token to the state using the state service
    // This ensures it's stored in the correct namespace that the plugin expects
    const tokenData = tokenState.tokens[tokenId];
    coreAPI.state.set('token-tokens', tokenId, tokenData);

    // Import the account's private key into the credentials state
    const keyImport = coreAPI.credentialsState.importPrivateKey(
      alice.privateKey,
    );

    // Check if alias already exists, if not register it
    const existingAlias = coreAPI.alias.resolve(
      alice.name,
      'account',
      'localnet',
    );
    if (!existingAlias) {
      coreAPI.alias.register({
        alias: alice.name,
        network: 'localnet',
        type: 'account',
        entityId: alice.accountId,
        publicKey: alice.publicKey,
        keyRefId: keyImport.keyRefId,
        createdAt: new Date().toISOString(),
        metadata: {
          evmAddress: alice.evmAddress,
          solidityAddress: alice.solidityAddress,
          solidityAddressFull: alice.solidityAddressFull,
        },
      });
    } else {
      // Update the existing alias with the keyRefId if it doesn't have one
      if (!existingAlias.keyRefId) {
        // We can't update the alias directly, so we need to remove and re-register
        coreAPI.alias.remove(alice.name, 'localnet');
        coreAPI.alias.register({
          alias: alice.name,
          network: 'localnet',
          type: 'account',
          entityId: alice.accountId,
          publicKey: alice.publicKey,
          keyRefId: keyImport.keyRefId,
          createdAt: new Date().toISOString(),
          metadata: {
            evmAddress: alice.evmAddress,
            solidityAddress: alice.solidityAddress,
            solidityAddressFull: alice.solidityAddressFull,
          },
        });
      }
    }

    program = new Command();
    pluginManager.registerCommands(program);
  });

  describe('token associate - success path', () => {
    test('✅ should successfully associate token with account', async () => {
      // Act
      await program.parseAsync([
        'node',
        'hedera-cli.ts',
        'token',
        'associate',
        '--account',
        alice.name,
        '--token-id',
        tokenId,
      ]);

      // Assert
      // Verify that process.exit(0) was called (success)
      expect(exitSpy).toHaveBeenCalledWith(0);

      // Verify that the mock signing service was called (proving the command worked)
      expect(mockSigningService.signAndExecuteWith).toHaveBeenCalled();

      // Verify the signing service was called with correct parameters
      expect(mockSigningService.signAndExecuteWith).toHaveBeenCalledWith(
        expect.any(Object), // transaction object
        expect.objectContaining({
          keyRefId: expect.any(String),
        }),
      );
    });
  });
});
