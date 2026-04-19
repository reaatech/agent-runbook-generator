# Security Policy

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it privately.

**Do not open a public GitHub issue.**

Instead, please email security@reaatech.com with:

1. A description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Any suggested mitigation

We will acknowledge your report within 48 hours and aim to provide a fix within 7 days.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |

## Security Features

This tool is designed with security in mind:

- **Read-only access** — Never modifies source repositories
- **Path validation** — Prevents directory traversal attacks
- **Secret redaction** — Automatically detects and redacts secrets in output
- **No credential logging** — Never logs API keys or tokens
- **Sanitized output** — HTML output is sanitized to prevent XSS

## Known Considerations

- LLM API keys must be configured via environment variables, never committed to code
- The tool reads repository files but does not transmit their contents to external services (only to configured LLM providers)
- Generated runbooks may contain references to your infrastructure; review before publishing publicly
