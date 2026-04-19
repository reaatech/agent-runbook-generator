# CONTRIBUTING.md — Contribution Guidelines

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/reaatech/agent-runbook-generator.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature`

## Development

```bash
# Start development mode
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Lint and type check
npm run lint
npm run typecheck

# Format code
npm run format
```

## Pull Request Process

1. Ensure all tests pass: `npm run test:ci`
2. Ensure linting passes: `npm run lint`
3. Ensure type checking passes: `npm run typecheck`
4. Update documentation if needed
5. Add tests for new functionality
6. Update the CHANGELOG.md with your changes

## Code Style

- Use TypeScript strict mode
- Follow ESLint rules (flat config)
- Use Prettier for formatting
- Write meaningful commit messages

## Testing

- Unit tests go in `tests/unit/`
- Integration tests go in `tests/integration/`
- Test files should end with `.test.ts`
- Aim for 80%+ code coverage

## Adding New Features

### New Runbook Section

1. Create generator in `src/<section>/`
2. Add section type to `src/types/domain.ts`
3. Register in `src/runbook/runbook-builder.ts`
4. Add tests

### New MCP Tool

1. Add tool definition in `src/mcp-server/tools/`
2. Implement handler in `src/mcp-server/mcp-server.ts`
3. Add tests

### New LLM Provider

1. Add provider adapter in `src/agent/provider-adapter.ts`
2. Add configuration options
3. Add tests

## Commit Messages

Follow conventional commits:

- `feat: add new feature`
- `fix: fix bug in module`
- `docs: update documentation`
- `test: add tests for feature`
- `refactor: refactor code`
- `chore: update dependencies`

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Accept constructive criticism
- Focus on what's best for the community

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
