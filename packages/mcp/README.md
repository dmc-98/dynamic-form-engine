# @dmc--98/dfe-mcp

MCP server for Dynamic Form Engine — expose DFE's AI form-generation capabilities as MCP tools so any MCP-compatible agent (Claude, Cursor, VS Code Copilot, etc.) can generate and validate DFE form schemas without a UI.

## Tools

| Tool | Description |
|------|-------------|
| `prompt_to_form` | Generate a DFE form schema from a natural-language description |
| `doc_to_form` | Extract a form schema from an existing document (intake form, PDF, markdown) |
| `transcript_to_form` | Extract a form schema from a speech transcript (Whisper, Otter.ai, etc.) |
| `validate_form_schema` | Validate (and optionally normalize) a raw AI-generated schema |

All AI-backed tools return `requiresUserReview: true` — callers must surface a review step before persisting the schema.

## Quick start

### Claude Desktop

```json
{
  "mcpServers": {
    "dfe": {
      "command": "npx",
      "args": ["-y", "@dmc--98/dfe-mcp"],
      "env": { "OPENAI_API_KEY": "sk-..." }
    }
  }
}
```

### Programmatic use

```ts
import { createDfeMcpServer } from '@dmc--98/dfe-mcp'
import { createOpenAiProvider } from '@dmc--98/dfe-ai'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const provider = createOpenAiProvider({ apiKey: process.env.OPENAI_API_KEY! })
const server = createDfeMcpServer(provider)
await server.connect(new StdioServerTransport())
```

## Peer dependencies

```
@modelcontextprotocol/sdk  ^1.0.0  (required)
@dmc--98/dfe-ai            workspace:*  (required)
```

Install them alongside this package:

```bash
npm install @dmc--98/dfe-mcp @dmc--98/dfe-ai @modelcontextprotocol/sdk
```

## Provider configuration

Set one of these env vars to activate an LLM provider:

| Env var | Provider |
|---------|---------|
| `OPENAI_API_KEY` | OpenAI (gpt-4o-mini default) |
| `ANTHROPIC_API_KEY` | Anthropic (claude-haiku-4-5 default) |

`validate_form_schema` works without any key (no LLM call).

## License

MIT
