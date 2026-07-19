#!/usr/bin/env node
/**
 * dfe-mcp — DFE MCP stdio server binary.
 *
 * Starts the Dynamic Form Engine MCP server over stdio, suitable for use in
 * Claude Desktop, VS Code Copilot, Cursor, and any other MCP host.
 *
 * Provider selection (env vars, first match wins):
 *   OPENAI_API_KEY      → OpenAI (gpt-4o-mini by default)
 *   ANTHROPIC_API_KEY   → Anthropic (claude-haiku-4-5 by default)
 *
 * Claude Desktop config example:
 * ```json
 * {
 *   "mcpServers": {
 *     "dfe": {
 *       "command": "npx",
 *       "args": ["-y", "@dmc--98/dfe-mcp"],
 *       "env": { "OPENAI_API_KEY": "sk-..." }
 *     }
 *   }
 * }
 * ```
 *
 * Or install globally: npm i -g @dmc--98/dfe-mcp && dfe-mcp
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createOpenAiProvider, createAnthropicProvider } from '@dmc--98/dfe-ai'
import type { AiProvider } from '@dmc--98/dfe-ai'
import { createDfeMcpServer } from '../index.js'

// ─── Provider resolution ──────────────────────────────────────────────────────

function resolveProvider(): AiProvider {
  if (process.env.OPENAI_API_KEY) {
    process.stderr.write('[dfe-mcp] Using OpenAI provider\n')
    return createOpenAiProvider({ apiKey: process.env.OPENAI_API_KEY })
  }
  if (process.env.ANTHROPIC_API_KEY) {
    process.stderr.write('[dfe-mcp] Using Anthropic provider\n')
    return createAnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  // No key configured: the server still starts but LLM-backed tools will
  // throw an error when called. validate_form_schema works without a key.
  process.stderr.write(
    '[dfe-mcp] Warning: no OPENAI_API_KEY or ANTHROPIC_API_KEY found in env.\n' +
      '  LLM-backed tools (prompt_to_form, doc_to_form, transcript_to_form) will fail.\n' +
      '  validate_form_schema works without a key.\n',
  )
  // Stub provider — errors clearly on first use
  return {
    complete: async () => {
      throw new Error(
        'No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in the MCP server env.',
      )
    },
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const provider = resolveProvider()
  const server = createDfeMcpServer(provider)
  const transport = new StdioServerTransport()

  process.stderr.write(`[dfe-mcp] DFE MCP server starting (stdio)\n`)
  await server.connect(transport)
  process.stderr.write(`[dfe-mcp] Ready\n`)
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  process.stderr.write(`[dfe-mcp] Fatal: ${message}\n`)
  process.exit(1)
})
