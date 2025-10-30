# Plugin Management Plugin

A plugin for managing other plugins in the Hedera CLI system.

## Overview

This plugin provides functionality to add, remove, list, and get information about plugins in the system. It follows the ADR-003 command handler contract and provides structured output with both JSON and human-readable formats.

## Commands

### `add`

Add a new plugin to the system from a file path.

**Options:**

- `--path, -p` (required): Path to the plugin file

**Example:**

```bash
hedera plugin-management add --path ./my-plugin.js
```

### `remove`

Remove a plugin from the system.

**Options:**

- `--name, -n` (required): Name of the plugin to remove

**Example:**

```bash
hedera plugin-management remove --name my-plugin
```

### `list`

List all available plugins in the system.

**Example:**

```bash
hedera plugin-management list
```

### `info`

Get detailed information about a specific plugin.

**Options:**

- `--name, -n` (required): Name of the plugin to get information about

**Example:**

```bash
hedera plugin-management info --name account
```

## Output Formats

All commands support both JSON and human-readable output formats:

- **JSON**: Structured data for programmatic use
- **Human-readable**: Formatted text for terminal display

## Architecture

This plugin follows the ADR-003 command handler contract:

- **Command Handlers**: Return `CommandExecutionResult` objects
- **Output Schemas**: Defined using Zod for validation and type safety
- **Templates**: Handlebars templates for human-readable output
- **Error Handling**: Consistent error handling across all commands

## Directory Structure

```
src/plugins/plugin-management/
├── commands/
│   ├── add/
│   │   ├── handler.ts      # Command handler
│   │   ├── output.ts       # Output schema and template
│   │   └── index.ts        # Export
│   ├── remove/
│   │   ├── handler.ts
│   │   ├── output.ts
│   │   └── index.ts
│   ├── list/
│   │   ├── handler.ts
│   │   ├── output.ts
│   │   └── index.ts
│   └── info/
│       ├── handler.ts
│       ├── output.ts
│       └── index.ts
├── schema.ts               # Shared data schemas
├── manifest.ts             # Plugin manifest
├── index.ts                # Main exports
└── README.md               # This file
```

## Implementation Notes

- All handlers return `CommandExecutionResult` objects
- Output schemas are defined using Zod for runtime validation
- Human-readable templates use Handlebars syntax
- Mock data is used for demonstration purposes
- Real implementation would integrate with the plugin manager service
