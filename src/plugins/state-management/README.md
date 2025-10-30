# State Management Plugin

A plugin for managing state data across all plugins in the Hedera CLI. This plugin provides commands for listing, clearing, backing up, and getting information about stored state data.

## ADR-003 Compliance

This plugin is fully compliant with [ADR-003: Result-Oriented Command Handler Contract](../docs/adr/ADR-003-command-handler-result-contract.md). All commands return structured `CommandExecutionResult` objects with:

- **Status**: `success`, `failure`, or `partial`
- **Output JSON**: Validated against Zod schemas
- **Human Templates**: Handlebars templates for user-friendly output
- **Error Messages**: Detailed error information when operations fail

## Commands

### `state list`

List all state data across plugins or filter by namespace.

**Options:**

- `--namespace, -n`: Filter by specific namespace (optional)

**Output Schema:**

```typescript
{
  namespaces: Array<{
    name: string;
    entryCount: number;
    size: number;
    lastModified: string;
  }>;
  totalNamespaces: number;
  totalEntries: number;
  totalSize: number;
  filteredNamespace?: string;
}
```

**Example:**

```bash
# List all state data
hedera state list

# List specific namespace
hedera state list --namespace accounts
```

### `state clear`

Clear state data for a specific namespace or all data.

**Options:**

- `--namespace, -n`: Clear specific namespace (optional)
- `--confirm, -c`: Confirm the operation (required)

**Output Schema:**

```typescript
{
  cleared: boolean;
  namespace?: string;
  entriesCleared: number;
  totalNamespaces?: number;
  message: string;
}
```

**Example:**

```bash
# Clear all state data
hedera state clear --confirm

# Clear specific namespace
hedera state clear --namespace accounts --confirm
```

### `state info`

Display information about stored state data.

**Output Schema:**

```typescript
{
  storageDirectory: string;
  isInitialized: boolean;
  totalEntries: number;
  totalSize: number;
  namespaces: Array<{
    name: string;
    entryCount: number;
    size: number;
    lastModified: string;
  }>;
}
```

**Example:**

```bash
hedera state info
```

### `state backup`

Create a backup of all state data.

**Options:**

- `--output, -o`: Custom output filename (optional)

**Output Schema:**

```typescript
{
  success: boolean;
  filePath: string;
  timestamp: string;
  totalNamespaces: number;
  totalSize: number;
  namespaces: string[];
}
```

**Example:**

```bash
# Create backup with auto-generated filename
hedera state backup

# Create backup with custom filename
hedera state backup --output my-backup.json
```

### `state stats`

Display detailed statistics about stored state data.

**Output Schema:**

```typescript
{
  totalNamespaces: number;
  totalEntries: number;
  totalSize: number;
  namespaces: Array<{
    name: string;
    entryCount: number;
    size: number;
    lastModified: string;
  }>;
}
```

**Example:**

```bash
hedera state stats
```

## Output Formats

All commands support multiple output formats:

```bash
# Human-readable output (default)
hedera state list

# JSON output
hedera state list --format json

# YAML output
hedera state list --format yaml

# Save to file
hedera state list --output state-data.json --format json
```

## Schema Validation

All command outputs are validated against Zod schemas defined in `schema.ts`. The schemas provide:

- **Runtime validation** with detailed error messages
- **TypeScript type inference** for type safety
- **JSON Schema generation** for manifest compatibility
- **Consistent data structures** across all commands

## Error Handling

The plugin follows ADR-003 error handling patterns:

- **Core exceptions** are caught and converted to user-friendly messages
- **Validation errors** provide detailed information about what went wrong
- **State service errors** are wrapped with context about the operation
- **File system errors** are handled gracefully with appropriate fallbacks

## Testing

The plugin includes comprehensive unit tests covering:

- **Command handlers** with various input scenarios
- **Error conditions** and edge cases
- **Output validation** and schema compliance
- **Mock services** for isolated testing
- **Fixtures** for consistent test data

Run tests with:

```bash
npm test -- --testPathPattern=state-management
```

## Architecture

### Directory Structure

```
src/plugins/state-management/
├── commands/
│   ├── list/
│   │   ├── handler.ts      # Command handler
│   │   ├── output.ts       # Output schema & template
│   │   └── index.ts        # Exports
│   ├── clear/
│   ├── info/
│   ├── backup/
│   └── stats/
├── __tests__/
│   └── unit/
│       ├── helpers/
│       │   ├── fixtures.ts # Test data
│       │   └── mocks.ts    # Mock factories
│       ├── list.test.ts
│       ├── clear.test.ts
│       ├── info.test.ts
│       ├── backup.test.ts
│       └── stats.test.ts
├── schema.ts               # Zod schemas
├── manifest.ts             # Plugin manifest
└── README.md               # This file
```

### Key Components

- **Schema Definitions**: Zod schemas for all data types
- **Command Handlers**: ADR-003 compliant handlers
- **Output Templates**: Handlebars templates for human-readable output
- **Test Utilities**: Comprehensive test helpers and mocks
- **Type Safety**: Full TypeScript support with inferred types

## Dependencies

- **Zod**: Schema validation and type inference
- **Handlebars**: Template rendering for human-readable output
- **Jest**: Testing framework
- **Core API**: State management services

## Future Enhancements

- **Restore functionality**: Restore from backup files
- **Selective backup**: Backup specific namespaces
- **Compression**: Compress backup files
- **Encryption**: Encrypt sensitive backup data
- **Migration tools**: Migrate between different state formats
