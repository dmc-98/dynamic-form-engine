# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in Dynamic Form Engine, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email **arjun.sn@antstack.io** with:

1. A description of the vulnerability
2. Steps to reproduce the issue
3. The potential impact
4. Any suggested fix (optional)

## Response Timeline

- **Acknowledgment**: Within 48 hours of your report
- **Initial assessment**: Within 1 week
- **Fix & disclosure**: We aim to release a patch within 2 weeks of confirming the vulnerability

## Disclosure Policy

We follow coordinated disclosure. We ask that you:

- Give us reasonable time to fix the issue before public disclosure
- Do not exploit the vulnerability beyond what is needed to demonstrate it
- Do not access or modify other users' data

## Security Best Practices for Users

When using DFE in production:

- Always enable authentication middleware in `@dmc-98/dfe-express` (never use `skipAuth: true` in production)
- Set `maxPageSize` to a reasonable limit (default is 100)
- Configure `allowedOptionFilterKeys` to whitelist filter parameters
- Use a body size limit on your Express app (e.g., `express.json({ limit: '1mb' })`)
- Implement rate limiting on form submission endpoints
- Use a custom `executeApiContract` handler with SSRF protections if using API contracts
- Keep all `@dmc-98/dfe-*` packages updated to the latest versions

## Known Security Considerations

- **ReDoS protection**: User-supplied regex patterns are validated and sandboxed in `@dmc-98/dfe-core`
- **Query injection**: Filter parameters are sanitized in `@dmc-98/dfe-express`
- **Ownership checks**: Submission endpoints verify user ownership before allowing access
- **UUIDv7**: All IDs use time-ordered UUIDv7 to prevent enumeration attacks
