# Output Schemas Guide

This document describes the output schema system implemented according to ADR-003: Result-Oriented Command Handler Contract and CLI Output Control.

## Overview

All plugin commands now define their output structure using JSON Schema and provide optional human-readable templates. This enables:

- **Consistent output formats** across all commands
- **Machine-readable outputs** (JSON, YAML, XML)
- **Human-readable outputs** with customizable templates
- **Type validation** of command outputs
- **Documentation generation** from schemas

## Architecture

### 1. Common Schemas

Location: `src/core/schemas/common-schemas.ts`

This file contains reusable JSON Schema definitions for common Hedera data types:

#### Entity ID

- **Pattern**: `0.0.{number}`
- **Example**: `0.0.12345`
- **Usage**: Account IDs, Token IDs, Topic IDs

#### Timestamp

- **Pattern**: `{seconds}.{nanoseconds}`
- **Example**: `1700000000.123456789`
- **Usage**: Hedera consensus timestamps

#### Transaction ID

- **Pattern**: `{accountId}@{timestamp}`
- **Example**: `0.0.123@1700000000.123456789`
- **Usage**: Transaction identifiers

#### Token Balance

- **Structure**:
  ```json
  {
    "baseUnitAmount": "105000",
    "name": "USDT",
    "decimals": 4
  }
  ```
- **Usage**: Token balance with denomination information

#### HBAR Balance

- **Pattern**: Integer string (tinybars)
- **Example**: `"10000000"` (0.1 HBAR)
- **Note**: 1 HBAR = 100,000,000 tinybars

#### EVM Address

- **Pattern**: `0x{40 hex chars}`
- **Example**: `0x1234567890123456789012345678901234567890`

#### Public Key

- **Pattern**: Hexadecimal string (64-132 chars)
- **Example**: ECDSA or ED25519 public key

#### Network

- **Enum**: `mainnet`, `testnet`, `previewnet`, `localnet`

#### Key Type

- **Enum**: `ECDSA`, `ED25519`

#### Supply Type

- **Enum**: `FINITE`, `INFINITE`

### 2. Plugin Manifest Updates

Each plugin manifest now includes `output` specifications for commands:

```typescript
{
  name: 'create',
  summary: 'Create a new account',
  // ... options ...
  handler: './index',
  output: {
    schema: {
      type: 'object',
      properties: {
        accountId: ENTITY_ID_SCHEMA,
        name: { type: 'string' },
        // ... more properties ...
      },
      required: ['accountId', 'name']
    },
    humanTemplate: {
      inline: '✅ Account created: {{accountId}}\n   Name: {{name}}'
    }
  }
}
```

### 3. Command Output Specification

The `CommandOutputSpec` interface:

```typescript
interface CommandOutputSpec {
  schema: unknown; // JSON Schema for validation
  humanTemplate?: {
    name?: string; // Template name (for external files)
    inline?: string; // Inline Handlebars template
  };
}
```

## Plugin Command Outputs

### Account Plugin

#### `account create`

**Output**:

```json
{
  "accountId": "0.0.12345",
  "name": "my-account",
  "type": "ECDSA",
  "alias": "test-account",
  "network": "testnet",
  "transactionId": "0.0.123@1700000000.123456789",
  "evmAddress": "0x...",
  "publicKey": "02a1b2..."
}
```

#### `account balance`

**Output**:

```json
{
  "accountId": "0.0.12345",
  "hbarBalance": "10000000",
  "tokenBalances": [
    {
      "tokenId": "0.0.67890",
      "balance": "1000",
      "decimals": 2
    }
  ]
}
```

#### `account list`

**Output**:

```json
{
  "accounts": [
    {
      "name": "account-1",
      "accountId": "0.0.12345",
      "type": "ECDSA",
      "network": "testnet",
      "evmAddress": "0x...",
      "keyRefId": "key-ref-123"
    }
  ],
  "count": 1
}
```

#### `account view`

**Output**:

```json
{
  "accountId": "0.0.12345",
  "balance": "10000000",
  "evmAddress": "0x...",
  "publicKey": "02a1b2...",
  "balanceTimestamp": "1700000000.123456789"
}
```

#### `account delete`

**Output**:

```json
{
  "name": "my-account",
  "accountId": "0.0.12345",
  "deleted": true
}
```

#### `account clear`

**Output**:

```json
{
  "cleared": true,
  "count": 5
}
```

#### `account import`

**Output**:

```json
{
  "accountId": "0.0.12345",
  "name": "imported-account",
  "alias": "test",
  "imported": true
}
```

### Token Plugin

#### `token create`

**Output**:

```json
{
  "tokenId": "0.0.67890",
  "name": "MyToken",
  "symbol": "MTK",
  "treasuryId": "0.0.12345",
  "decimals": 2,
  "initialSupply": "1000000",
  "supplyType": "INFINITE",
  "transactionId": "0.0.123@1700000000.123456789",
  "alias": "my-token"
}
```

#### `token transfer`

**Output**:

```json
{
  "transactionId": "0.0.123@1700000000.123456789",
  "tokenId": "0.0.67890",
  "from": "0.0.12345",
  "to": "0.0.54321",
  "amount": "100"
}
```

#### `token associate`

**Output**:

```json
{
  "transactionId": "0.0.123@1700000000.123456789",
  "accountId": "0.0.12345",
  "tokenId": "0.0.67890",
  "associated": true
}
```

#### `token list`

**Output**:

```json
{
  "tokens": [
    {
      "tokenId": "0.0.67890",
      "name": "MyToken",
      "symbol": "MTK",
      "decimals": 2,
      "supplyType": "INFINITE",
      "treasuryId": "0.0.12345",
      "network": "testnet",
      "keys": {
        "adminKey": "02a1b2...",
        "supplyKey": null
      }
    }
  ],
  "count": 1,
  "network": "testnet"
}
```

### Topic Plugin

#### `topic create`

**Output**:

```json
{
  "topicId": "0.0.13579",
  "name": "my-topic",
  "memo": "Test topic",
  "network": "testnet",
  "transactionId": "0.0.123@1700000000.123456789",
  "hasAdminKey": true,
  "hasSubmitKey": false
}
```

#### `topic list`

**Output**:

```json
{
  "topics": [
    {
      "topicId": "0.0.13579",
      "name": "my-topic",
      "memo": "Test topic",
      "network": "testnet",
      "createdAt": "2024-10-20T12:34:56.789Z",
      "hasAdminKey": true,
      "hasSubmitKey": false
    }
  ],
  "count": 1,
  "stats": {
    "total": 1,
    "withAdminKey": 1,
    "withSubmitKey": 0,
    "withMemo": 1,
    "byNetwork": {
      "testnet": 1
    }
  }
}
```

#### `topic submit-message`

**Output**:

```json
{
  "transactionId": "0.0.123@1700000000.123456789",
  "topicId": "0.0.13579",
  "sequenceNumber": "123",
  "message": "Hello, world!"
}
```

#### `topic find-message`

**Output**:

```json
{
  "topicId": "0.0.13579",
  "messages": [
    {
      "sequenceNumber": "123",
      "consensusTimestamp": "1700000000.123456789",
      "message": "Hello, world!",
      "payerAccountId": "0.0.12345"
    }
  ],
  "count": 1
}
```

### HBAR Plugin

#### `hbar transfer`

**Output**:

```json
{
  "transactionId": "0.0.123@1700000000.123456789",
  "from": "0.0.12345",
  "to": "0.0.54321",
  "amount": "10000000",
  "memo": "Payment for services"
}
```

### Network Plugin

#### `network list`

**Output**:

```json
{
  "networks": [
    {
      "name": "testnet",
      "active": true,
      "configured": true,
      "health": {
        "status": "healthy",
        "lastChecked": "2024-10-20T12:34:56.789Z"
      }
    },
    {
      "name": "mainnet",
      "active": false,
      "configured": true,
      "health": {
        "status": "healthy",
        "lastChecked": "2024-10-20T12:30:00.000Z"
      }
    }
  ],
  "currentNetwork": "testnet",
  "count": 2
}
```

#### `network use`

**Output**:

```json
{
  "previousNetwork": "testnet",
  "currentNetwork": "mainnet",
  "switched": true
}
```

## Human-Readable Templates

Templates use [Handlebars](https://handlebarsjs.com/) syntax:

### Basic Variable Interpolation

```handlebars
✅ Account created: {{accountId}}
```

### Conditional Rendering

```handlebars
{{#if alias}}
  Alias:
  {{alias}}
{{/if}}
```

### Array Iteration

```handlebars
{{#each accounts}}
  {{@index}}.
  {{name}}
  -
  {{accountId}}
{{/each}}
```

### Nested Properties

```handlebars
Balance: {{balance.amount}} {{balance.unit}}
```

## Usage in CLI (Future Implementation)

When the CLI implements ADR-003, commands will support:

```bash
# Human-readable output (default)
hedera account create --alias my-account

# JSON output
hedera account create --alias my-account --format json

# YAML output
hedera account create --alias my-account --format yaml

# Save to file
hedera account list --output accounts.json --format json

# Script mode (suppress handler logs)
hedera account create --alias my-account --script
```

## Adding New Output Schemas

### Step 1: Use Common Schemas

```typescript
import {
  ENTITY_ID_SCHEMA,
  TRANSACTION_ID_SCHEMA,
  // ... other schemas
} from '../../core/schemas/common-schemas';
```

### Step 2: Define Command Output

```typescript
{
  name: 'my-command',
  // ... options ...
  output: {
    schema: {
      type: 'object',
      properties: {
        entityId: ENTITY_ID_SCHEMA,
        customField: {
          type: 'string',
          description: 'My custom field'
        }
      },
      required: ['entityId']
    },
    humanTemplate: {
      inline: 'Result: {{entityId}}\nCustom: {{customField}}'
    }
  }
}
```

### Step 3: Update Handler (Future)

```typescript
export async function myCommandHandler(args: CommandHandlerArgs) {
  // ... command logic ...

  return {
    status: 'success',
    outputJson: JSON.stringify({
      entityId: '0.0.12345',
      customField: 'value',
    }),
  };
}
```

## Best Practices

1. **Reuse Common Schemas**: Use predefined schemas from `common-schemas.ts` whenever possible
2. **Keep Templates Simple**: Focus on essential information in human templates
3. **Include Descriptions**: Add meaningful descriptions to all schema properties
4. **Mark Optional Fields**: Use `nullable: true` for optional fields
5. **Validate Patterns**: Use regex patterns for structured data (IDs, timestamps, etc.)
6. **Document Examples**: Include examples in schema descriptions
7. **Consistent Formatting**: Follow established emoji and formatting conventions

## Schema Validation

The CLI (when implemented) will:

1. Parse `outputJson` from command handlers
2. Validate against the declared schema
3. Reject invalid outputs with a distinct exit code
4. Format valid outputs according to `--format` flag

## Migration Guide

### For Plugin Developers

1. Add `output` field to all command specifications in manifest
2. Define JSON schema for command outputs
3. Provide human-readable templates (optional but recommended)
4. Update command handlers to return `CommandExecutionResult` (future)
5. Test schemas with sample outputs

### For CLI Core

1. Implement `CommandExecutionResult` parsing
2. Add JSON Schema validation
3. Implement template rendering (Handlebars)
4. Add format serializers (JSON, YAML, XML)
5. Add output redirection (`--output`)
6. Add script mode (`--script`)

## References

- [ADR-003: Result-Oriented Command Handler Contract](./adr/ADR-003-command-handler-result-contract.md)
- [JSON Schema Documentation](https://json-schema.org/)
- [Handlebars Template Guide](https://handlebarsjs.com/guide/)
