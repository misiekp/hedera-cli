# Setup Plugin Migration - Implementation Summary

## Overview

The `init` and `reload` commands have been migrated to a plugin-based architecture with automatic initialization. The system no longer requires users to run `hcli setup init` - credentials setup now happens automatically when needed.

## What Was Implemented

### 1. Setup Plugin Structure

Created a new plugin at `src/plugins/setup/` with the following structure:

```
src/plugins/setup/
├── manifest.ts                          # Plugin manifest with commands & hooks
├── index.ts                             # Plugin entry point
├── commands/
│   ├── reload.ts                        # Reload credentials from .env
│   └── configure.ts                     # Interactive credential configuration
└── services/
    ├── auto-setup-hook.ts              # Auto-initialization hook
    └── interactive-setup.ts            # Interactive setup flow
```

### 2. Key Features

#### Auto-Initialization Hook

- **Automatic Setup**: When credentials are missing, the CLI automatically prompts for setup
- **Smart Detection**: Checks if credentials exist before any command execution
- **Skip Logic**: Skips auto-setup for certain commands (setup, plugin, help, version)

#### Commands Available

- `hcli setup reload [--path <path>]` - Reload credentials from .env file
- `hcli setup configure [--network <network>]` - Interactive credential configuration

#### Removed Features

- ❌ Telemetry settings (removed as requested)
- ❌ Manual `init` command requirement (now automatic)

### 3. Plugin Manager Enhancements

Updated `src/core/plugins/plugin-manager.ts` to support:

- **Global Pre-Action Hooks**: Plugins can return hooks from `init()` that run before every command
- **Hook Registration**: Hooks are registered with Commander.js `preAction` API
- **Context Injection**: Hooks receive full `PluginContext` with API access

### 4. Type System Updates

Updated `src/core/plugins/plugin.types.ts`:

- Added `GlobalPreActionHook` type for pre-action hooks
- Extended `PluginManifest.init` to support returning hook functions
- Hooks must return `Promise<void>` for consistent async handling

### 5. User Experience

#### First-Time User Flow

```bash
$ hcli account create --name myaccount

👋 Welcome to Hedera CLI!
No operator credentials found. Let's set up your CLI...

📋 Available networks: testnet, mainnet, previewnet

? Which network would you like to use?
❯ testnet
  mainnet
  previewnet

🔍 Checking for credentials in .env file...

No .env file found or missing credentials for testnet.
Let's configure testnet manually.

? Operator Account ID for testnet (e.g., 0.0.123456): 0.0.123456
? Operator Private Key for testnet: **********************

🔍 Verifying operator balance...
✅ Operator balance verified (10.5 HBAR)

✅ Setup complete! Continuing with your command...

Creating account myaccount...
```

#### Existing User Flow

- Users with credentials: Commands run normally, no prompts
- Users can reload from .env: `hcli setup reload`
- Users can reconfigure: `hcli setup configure`

### 6. Integration

- **Registered** in `src/hedera-cli.ts` as first default plugin
- **Backward Compatible**: Old setup commands show deprecation warnings
- **Service Integration**: Uses existing Core API services:
  - `api.credentials` - credential storage
  - `api.config` - network configuration
  - `api.state` - CLI state management
  - `logger` - consistent logging

## How It Works

### 1. Plugin Loading

```typescript
// Plugin loads and registers hook
init: async (context) => {
  const { createAutoSetupHook } = await import('./services/auto-setup-hook');
  return createAutoSetupHook(context); // Returns hook function
};
```

### 2. Hook Registration

```typescript
// PluginManager registers hooks globally
program.hook('preAction', async (command) => {
  for (const hookFn of this.globalPreActionHooks) {
    await hookFn(command);
  }
});
```

### 3. Auto-Setup Execution

```typescript
// Hook checks for credentials before every command
if (!hasCredentials) {
  await runInteractiveSetup(api, logger);
}
```

## Configuration

### Environment Variables

Credentials can be loaded from `.env` file:

```bash
# .env
TESTNET_OPERATOR_ID=0.0.123456
TESTNET_OPERATOR_KEY=302e020100300506032b65700422042...

MAINNET_OPERATOR_ID=0.0.789012
MAINNET_OPERATOR_KEY=302e020100300506032b65700422042...
```

### Networks

The plugin automatically discovers networks from `hedera-cli.config.json`:

```json
{
  "networks": {
    "testnet": { ... },
    "mainnet": { ... },
    "previewnet": { ... }
  }
}
```

## Testing

### Manual Testing

1. **First-time setup**:

   ```bash
   # Remove existing credentials
   rm ~/.hedera-cli/state/*.json

   # Run any command
   hcli account list

   # Should trigger interactive setup
   ```

2. **Reload from .env**:

   ```bash
   # Create .env with credentials
   echo "TESTNET_OPERATOR_ID=0.0.123456" > .env
   echo "TESTNET_OPERATOR_KEY=your-key" >> .env

   # Reload
   hcli setup reload
   ```

3. **Interactive configure**:
   ```bash
   hcli setup configure
   ```

### Build & Run

```bash
# Build the project
npm run build

# Test CLI
node dist/hedera-cli.js --help
node dist/hedera-cli.js setup --help
```

## Migration Notes

### For Users

- ✅ **No action required** - setup happens automatically
- ✅ Existing `.env` files still work with `hcli setup reload`
- ✅ Old `hcli setup init` still works (shows deprecation notice)

### For Developers

- ✅ Plugin system now supports global hooks
- ✅ Plugins can intercept command execution flow
- ✅ Context injection provides full API access to hooks
- ✅ Type-safe hook system with `GlobalPreActionHook`

## Files Modified

### New Files

- `src/plugins/setup/manifest.ts`
- `src/plugins/setup/index.ts`
- `src/plugins/setup/commands/reload.ts`
- `src/plugins/setup/commands/configure.ts`
- `src/plugins/setup/services/auto-setup-hook.ts`
- `src/plugins/setup/services/interactive-setup.ts`

### Modified Files

- `src/core/plugins/plugin-manager.ts` - Added hook support
- `src/core/plugins/plugin.types.ts` - Added GlobalPreActionHook type
- `src/hedera-cli.ts` - Registered setup plugin
- `src/commands/setup.ts` - Added deprecation warnings

## Benefits

1. **Zero Friction**: No manual init required
2. **Smart Detection**: Only prompts when needed
3. **Environment Flexibility**: Supports .env or interactive setup
4. **Multi-Network**: Configure credentials for any network
5. **Plugin Architecture**: Clean separation of concerns
6. **Backward Compatible**: Existing workflows still work
7. **Service Integration**: Uses Core API properly

## Future Enhancements

- [ ] Credential encryption at rest
- [ ] Multiple operator profiles per network
- [ ] Cloud credential sync
- [ ] Interactive network addition during setup
- [ ] Credential validation before saving

---

**Status**: ✅ Implemented and tested
**Build**: ✅ Passing
**Lints**: ✅ Clean
