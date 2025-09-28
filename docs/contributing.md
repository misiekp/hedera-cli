# Contributing Guide

Guidelines for contributing to the Hedera CLI project, including development setup, code standards, and contribution process.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **Git**: For version control
- **TypeScript**: Version 5.0 or higher

### Development Setup

```bash
# Clone the repository
git clone https://github.com/hashgraph/hedera-cli-2.git
cd hedera-cli-2

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

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
│   └── hedera-cli.ts           # Main CLI entry point
├── docs/                       # Documentation
├── __tests__/                  # Test suite
└── dist/                       # Built files
```

## 📝 Code Standards

### TypeScript Guidelines

#### 1. Type Safety

- Use strict TypeScript configuration
- Avoid `any` types - use proper interfaces
- Define interfaces for all data structures
- Use generic types where appropriate

```typescript
// ✅ Good
interface UserData {
  id: string;
  name: string;
  email: string;
}

function processUser(user: UserData): void {
  // Implementation
}

// ❌ Bad
function processUser(user: any): void {
  // Implementation
}
```

#### 2. Interface Design

- Use descriptive interface names
- Group related properties
- Use optional properties appropriately
- Document complex interfaces

```typescript
// ✅ Good
interface CreateAccountParams {
  name: string;
  balance?: number;
  maxAutoAssociations?: number;
  memo?: string;
}

// ❌ Bad
interface Params {
  n: string;
  b?: number;
  m?: number;
  me?: string;
}
```

#### 3. Error Handling

- Use proper error types
- Provide meaningful error messages
- Handle errors gracefully
- Use try-catch blocks appropriately

```typescript
// ✅ Good
try {
  const result = await api.mirror.getAccount(accountId);
  return result;
} catch (error) {
  if (error.message.includes('not found')) {
    throw new Error(`Account ${accountId} not found`);
  }
  throw new Error(`Failed to fetch account: ${error.message}`);
}

// ❌ Bad
const result = await api.mirror.getAccount(accountId);
return result;
```

### Service Development

#### 1. Service Interface Design

- Define clear, focused interfaces
- Use dependency injection
- Implement proper error handling
- Document all public methods

```typescript
// ✅ Good
interface AccountTransactionService {
  /**
   * Creates a new Hedera account
   * @param params - Account creation parameters
   * @returns Promise resolving to account creation result
   * @throws Error if account creation fails
   */
  createAccount(params: CreateAccountParams): Promise<AccountCreationResult>;
}
```

#### 2. Service Implementation

- Implement interfaces completely
- Use proper logging
- Handle edge cases
- Write comprehensive tests

```typescript
// ✅ Good
export class AccountTransactionServiceImpl
  implements AccountTransactionService
{
  constructor(private logger: Logger) {}

  async createAccount(
    params: CreateAccountParams,
  ): Promise<AccountCreationResult> {
    this.logger.log(`Creating account: ${params.name}`);

    try {
      // Implementation
      const result = await this.performAccountCreation(params);
      this.logger.log(`✅ Account created: ${result.accountId}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to create account: ${error.message}`);
      throw error;
    }
  }
}
```

### Plugin Development

#### 1. Plugin Structure

- Follow the standard plugin structure
- Use proper manifest definitions
- Implement command handlers correctly
- Handle state management properly

```typescript
// ✅ Good plugin structure
my-plugin/
├── manifest.ts              # Plugin manifest
├── commands/                # Command handlers
│   ├── create.ts
│   └── list.ts
├── schema.ts                # State schema
└── types.ts                 # Plugin types
```

#### 2. Command Handlers

- Use proper TypeScript types
- Handle errors gracefully
- Use injected services
- Exit process appropriately

```typescript
// ✅ Good command handler
export async function createHandler(args: CommandHandlerArgs): Promise<void> {
  const { api, logger, state } = args;

  try {
    const name = args.args['name'] as string;
    logger.log(`Creating item: ${name}`);

    // Use services
    const result = await api.accountTransactions.createAccount({ name });

    // Store state
    state.set('my-plugin', name, result);

    logger.log(`✅ Item created: ${result.accountId}`);
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Failed to create item: ${error}`);
    process.exit(1);
  }
}
```

## 🧪 Testing Guidelines

### Unit Testing

#### 1. Test Structure

- Use descriptive test names
- Test one thing at a time
- Use proper mocking
- Test error cases

```typescript
// ✅ Good test
describe('AccountTransactionService', () => {
  describe('createAccount', () => {
    it('should create account with valid parameters', async () => {
      const mockLogger = createMockLogger();
      const service = new AccountTransactionServiceImpl(mockLogger);

      const result = await service.createAccount({
        name: 'test-account',
        balance: 1000,
      });

      expect(result.accountId).toBeDefined();
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Creating account: test-account',
      );
    });

    it('should throw error for invalid parameters', async () => {
      const mockLogger = createMockLogger();
      const service = new AccountTransactionServiceImpl(mockLogger);

      await expect(service.createAccount({ name: '' })).rejects.toThrow(
        'Invalid account name',
      );
    });
  });
});
```

#### 2. Mocking Guidelines

- Mock external dependencies
- Use proper mock types
- Reset mocks between tests
- Test mock interactions

```typescript
// ✅ Good mocking
const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

const mockMirrorService = {
  getAccount: jest.fn().mockResolvedValue({
    accountId: '0.0.123456',
    balance: { balance: 1000000, timestamp: '2023-01-01T00:00:00Z' },
  }),
};
```

### Integration Testing

#### 1. Plugin Integration Tests

- Test complete plugin workflows
- Test service interactions
- Test error scenarios
- Test state management

```typescript
// ✅ Good integration test
describe('Account Plugin Integration', () => {
  it('should create and list accounts', async () => {
    // Create account
    const createResult = await execAsync(
      'node dist/hedera-cli.js account create --name test-account',
    );
    expect(createResult.stdout).toContain('✅ Account created');

    // List accounts
    const listResult = await execAsync('node dist/hedera-cli.js account list');
    expect(listResult.stdout).toContain('test-account');
  });
});
```

## 📚 Documentation Standards

### Code Documentation

#### 1. JSDoc Comments

- Document all public methods
- Include parameter descriptions
- Include return value descriptions
- Include error conditions

```typescript
/**
 * Creates a new Hedera account with the specified parameters
 *
 * @param params - Account creation parameters
 * @param params.name - Name of the account
 * @param params.balance - Initial balance in tinybars
 * @param params.maxAutoAssociations - Maximum automatic token associations
 * @returns Promise resolving to account creation result
 * @throws Error if account creation fails
 * @throws Error if parameters are invalid
 */
async createAccount(params: CreateAccountParams): Promise<AccountCreationResult> {
  // Implementation
}
```

#### 2. README Files

- Include setup instructions
- Include usage examples
- Include API documentation
- Include contribution guidelines

### API Documentation

#### 1. Interface Documentation

- Document all interfaces
- Include usage examples
- Include error conditions
- Include related interfaces

````typescript
/**
 * Service for managing Hedera account transactions
 *
 * Provides functionality for creating and managing Hedera accounts
 * through the Hedera network.
 *
 * @example
 * ```typescript
 * const service = new AccountTransactionServiceImpl(logger);
 * const result = await service.createAccount({
 *   name: 'my-account',
 *   balance: 1000,
 * });
 * ```
 */
interface AccountTransactionService {
  // Interface definition
}
````

## 🔄 Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
# ... implement feature ...

# Run tests
npm test

# Build project
npm run build

# Test manually
node dist/hedera-cli.js my-command

# Commit changes
git add .
git commit -m "feat: add my feature"

# Push branch
git push origin feature/my-feature
```

### 2. Bug Fixes

```bash
# Create bugfix branch
git checkout -b bugfix/fix-issue-123

# Fix the issue
# ... implement fix ...

# Add tests for the fix
# ... add tests ...

# Run tests
npm test

# Commit fix
git add .
git commit -m "fix: resolve issue with account creation"

# Push branch
git push origin bugfix/fix-issue-123
```

### 3. Plugin Development

```bash
# Create plugin branch
git checkout -b plugin/my-plugin

# Create plugin structure
mkdir src/plugins/my-plugin
# ... create plugin files ...

# Test plugin
npm run build
node dist/hedera-cli.js my-plugin --help

# Add tests
# ... add plugin tests ...

# Commit plugin
git add .
git commit -m "feat: add my-plugin"

# Push branch
git push origin plugin/my-plugin
```

## 🚀 Pull Request Process

### 1. Before Submitting

- [ ] Code follows project standards
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No console.log statements
- [ ] No commented code
- [ ] Proper error handling
- [ ] TypeScript types are correct

### 2. Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] Code follows project standards
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### 3. Review Process

- Code review by maintainers
- Automated tests must pass
- Documentation review
- Security review (if applicable)

## 🐛 Bug Reports

### Bug Report Template

```markdown
## Bug Description

Clear description of the bug

## Steps to Reproduce

1. Step one
2. Step two
3. Step three

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- OS: [e.g., macOS, Windows, Linux]
- Node.js version: [e.g., 18.0.0]
- CLI version: [e.g., 1.0.0]

## Additional Context

Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template

```markdown
## Feature Description

Clear description of the feature

## Use Case

Why is this feature needed?

## Proposed Solution

How should this feature work?

## Alternatives Considered

Other approaches considered

## Additional Context

Any other relevant information
```

## 📞 Getting Help

- **Documentation**: Check this documentation
- **Issues**: [GitHub Issues](https://github.com/hashgraph/hedera-cli-2/issues)
- **Discussions**: [GitHub Discussions](https://github.com/hashgraph/hedera-cli-2/discussions)
- **Code Review**: Request review from maintainers

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the Apache License 2.0.
