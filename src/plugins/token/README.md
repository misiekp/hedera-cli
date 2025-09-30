# Token Plugin

Complete token management plugin for the Hedera CLI following the plugin architecture (ADR-001).

## 🏗️ Architecture

This plugin follows the plugin architecture principles:

- **Stateless**: Plugin is functionally stateless
- **Dependency Injection**: Services are injected into command handlers
- **Manifest-Driven**: Capabilities declared via manifest
- **Namespace Isolation**: Own state namespace (`token-tokens`)
- **Type Safety**: Full TypeScript support

## 📁 Structure

```
src/plugins/token/
├── manifest.ts              # Plugin manifest with command definitions
├── schema.ts                # Token data schema with Zod validation
├── commands/
│   ├── create.ts           # Token creation handler
│   ├── associate.ts        # Token association handler
│   └── transfer.ts         # Token transfer handler
├── zustand-state-helper.ts  # State management helper
└── index.ts                # Plugin exports
```

## 🚀 Commands

### Token Create

```bash
hedera token create \
  --name "My Token" \
  --symbol "MTK" \
  --treasury-id 0.0.123456 \
  --treasury-key <private-key> \
  --decimals 2 \
  --initial-supply 1000 \
  --supply-type finite \
  --admin-key <private-key>
```

### Token Associate

```bash
hedera token associate \
  --token-id 0.0.123456 \
  --account-id 0.0.789012
```

### Token Transfer

```bash
hedera token transfer \
  --token-id 0.0.123456 \
  --from 0.0.111111 \
  --to 0.0.222222 \
  --balance 100
```

## 🔧 Core API Integration

The plugin uses the Core API services:

- `api.tokenTransactions` - Token transaction creation
- `api.signing` - Transaction signing and execution
- `api.state` - Namespaced state management
- `api.network` - Network information
- `api.logger` - Logging

## 📊 State Management

Token data is stored in the `token-tokens` namespace with the following structure:

```typescript
interface TokenData {
  tokenId: string;
  name: string;
  symbol: string;
  treasuryId: string;
  decimals: number;
  initialSupply: number;
  supplyType: 'FINITE' | 'INFINITE';
  maxSupply: number;
  keys: TokenKeys;
  network: 'mainnet' | 'testnet' | 'previewnet';
  associations: TokenAssociation[];
  customFees: CustomFee[];
}
```

## 🔄 Migration from Commands

This plugin migrates the following commands from the old architecture:

- `src/commands/token/create.ts` → `src/plugins/token/commands/create.ts`
- `src/commands/token/associate.ts` → `src/plugins/token/commands/associate.ts`
- `src/commands/token/transfer.ts` → `src/plugins/token/commands/transfer.ts`

## 🧪 Testing

The plugin can be tested using the existing test patterns:

```typescript
// Example test structure
describe('Token Plugin', () => {
  test('token create command', async () => {
    const handler = createTokenHandler;
    const mockArgs = {
      /* CommandHandlerArgs */
    };
    await handler(mockArgs);
    // Assertions
  });
});
```

## 🔮 Future Enhancements

- Add `createFromFile` command
- Implement token balance queries
- Add token update operations
- Support custom fees
- Add token deletion/wipe operations
