# Account Plugin

Complete account management plugin for the Hedera CLI following the plugin architecture (ADR-001).

## 🏗️ Architecture

This plugin follows the plugin architecture principles:

- **Stateless**: Plugin is functionally stateless
- **Dependency Injection**: Services are injected into command handlers
- **Manifest-Driven**: Capabilities declared via manifest
- **Namespace Isolation**: Own state namespace (`account-accounts`)
- **Type Safety**: Full TypeScript support

## 📁 Structure

```
src/plugins/account/
├── manifest.ts              # Plugin manifest with command definitions
├── schema.ts                # Account data schema with Zod validation
├── commands/
│   ├── create.ts           # Account creation handler
│   ├── import.ts           # Account import handler
│   ├── balance.ts          # Balance retrieval handler
│   ├── list.ts             # List accounts handler
│   ├── view.ts             # View account details handler
│   ├── delete.ts           # Delete account handler
│   └── clear.ts            # Clear all accounts handler
├── zustand-state-helper.ts  # State management helper
├── __tests__/unit/          # Unit tests
└── index.ts                # Plugin exports
```

## 🚀 Commands

### Account Create

```bash
hcli account create \
  --balance 100000000 \
  --auto-associations 10 \
  --alias myaccount
```

### Account Import

```bash
hcli account import \
  --id 0.0.123456 \
  --key <private-key> \
  --alias imported-account
```

### Account Balance

```bash
hcli account balance --account-id-or-name-or-alias myaccount
hcli account balance --account-id-or-name-or-alias 0.0.123456 --only-hbar
```

### Account List

```bash
hcli account list
hcli account list --private  # Show key reference IDs
```

### Account View

```bash
hcli account view --account-id-or-name-or-alias myaccount
```

### Account Delete

```bash
hcli account delete --name myaccount
```

### Account Clear

```bash
hcli account clear
```

## 🔧 Core API Integration

The plugin uses the Core API services:

- `api.accountTransactions` - Account transaction creation
- `api.signing` - Transaction signing and execution
- `api.state` - Namespaced state management
- `api.network` - Network information
- `api.credentialsState` - Secure key management
- `api.alias` - Alias registration and resolution
- `api.mirror` - Mirror node queries
- `api.logger` - Logging

## 📊 State Management

Account data is stored in the `account-accounts` namespace with the following structure:

```typescript
interface AccountData {
  keyRefId: string; // Reference to private key in secure storage
  name: string; // Unique account name
  accountId: string; // Hedera account ID (0.0.xxxxx)
  type: 'ECDSA' | 'ED25519'; // Key algorithm
  publicKey: string; // Public key
  evmAddress: string; // EVM address
  solidityAddress: string; // Solidity address (short)
  solidityAddressFull: string; // Solidity address (full)
  network: 'mainnet' | 'testnet' | 'previewnet';
}
```

## 🔐 Security

- Private keys stored securely via `KeyManagementService` using `keyRefId` references
- No raw private keys in plugin state JSON
- Secure key retrieval through Core API
- Keys isolated in credentials storage namespace

## 🏷️ Alias Support

- Per-network aliases via `AliasManagementService`
- Aliases resolve to account IDs and key references
- Example: `myaccount` → `0.0.123456` on testnet
- Registered during `create` and `import` when `--alias` provided

## 🔄 Migration from Commands

This plugin migrates the following commands from the old architecture:

- `src/commands/account/create.ts` → `src/plugins/account/commands/create.ts`
- `src/commands/account/import.ts` → `src/plugins/account/commands/import.ts`
- `src/commands/account/balance.ts` → `src/plugins/account/commands/balance.ts`
- `src/commands/account/list.ts` → `src/plugins/account/commands/list.ts`
- `src/commands/account/view.ts` → `src/plugins/account/commands/view.ts`
- `src/commands/account/delete.ts` → `src/plugins/account/commands/delete.ts`
- `src/commands/account/clear.ts` → `src/plugins/account/commands/clear.ts`

## 🧪 Testing

Unit tests located in `__tests__/unit/`:

```bash
npm test -- src/plugins/account/__tests__/unit
```

Test coverage:

- Account creation (happy path, failures)
- Account import with aliases
- Balance retrieval (HBAR only, with tokens, errors)
- Account listing
- Account view and deletion
- Clear all accounts
