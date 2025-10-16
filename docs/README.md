# Hedera CLI Technical Documentation

Technical documentation for developers and contributors working on the Hedera CLI project.

## 📚 Documentation Structure

- **[Architecture Overview](./architecture.md)** - System architecture and design principles
- **[Plugin Development Guide](./plugin-development.md)** - Complete guide to creating plugins
- **[Core API Reference](./core-api.md)** - Detailed API documentation
- **[Contributing Guide](./contributing.md)** - Development setup and contribution guidelines
- **[ADR-001 Plugin Architecture](./adr/ADR-001-plugin-architecture.md)** - Architecture Decision Record

## 🏗️ Project Structure

```
hedera-cli-2/
├── src/
│   ├── core/                    # Core API and services
│   │   ├── core-api/           # Main Core API
│   │   ├── services/           # Service implementations
│   │   ├── plugins/            # Plugin system
│   │   └── types/              # Shared types
│   ├── plugins/                # Built-in plugins
│   │   ├── account/            # Account management plugin
│   │   ├── credentials/        # Credentials plugin
│   │   ├── plugin-management/  # Plugin management plugin
│   │   └── state-management/   # State management plugin
│   └── hedera-cli.ts           # Main CLI entry point
├── docs/                       # Technical documentation
└── __tests__/                  # Test suite
```

## 🎯 Key Technical Features

- **🔌 Plugin Architecture**: Extensible plugin system based on ADR-001
- **🏦 Real Hedera Integration**: Direct integration with Hedera networks via Mirror Node API
- **💾 State Management**: Persistent state with Zustand and schema validation
- **🔐 Credentials Management**: Secure credential handling with environment fallback
- **📊 Comprehensive API**: Full Hedera Mirror Node API support with TypeScript types
- **🛡️ Type Safety**: Full TypeScript support throughout the codebase

## 🚀 Quick Start for Developers

```bash
# Clone and setup
git clone https://github.com/hashgraph/hedera-cli-2.git
cd hedera-cli-2
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development
npm run dev
```

## 📖 Documentation Index

### Architecture & Design

- [Architecture Overview](./architecture.md) - System design and service architecture
- [ADR-001 Plugin Architecture](./adr/ADR-001-plugin-architecture.md) - Architecture decision record

### Development

- [Plugin Development Guide](./plugin-development.md) - Creating and developing plugins
- [Core API Reference](./core-api.md) - API documentation and interfaces
- [Contributing Guide](./contributing.md) - Development setup and guidelines

## 🔧 Development Workflow

1. **Understanding the Architecture**: Start with [Architecture Overview](./architecture.md)
2. **Plugin Development**: Follow the [Plugin Development Guide](./plugin-development.md)
3. **API Reference**: Use [Core API Reference](./core-api.md) for implementation details
4. **Contributing**: Check [Contributing Guide](./contributing.md) for development standards

## 📄 License

This project is licensed under the Apache License 2.0. See the [LICENSE](../LICENSE) file for details.
