/**
 * @dmc--98/dfe-mcp — DFE MCP Server
 *
 * Exposes Dynamic Form Engine AI capabilities as MCP tools so any
 * MCP-compatible agent (Claude, Cursor, VS Code Copilot, etc.) can generate
 * and validate DFE form schemas without a UI.
 *
 * Tools registered:
 *   prompt_to_form         — generate a form schema from natural language
 *   doc_to_form            — extract a form schema from an existing document
 *   transcript_to_form     — extract a form schema from a speech transcript
 *   validate_form_schema   — validate (and optionally normalize) a raw AI schema
 *
 * Usage (programmatic — inject your own AiProvider):
 * ```ts
 * import { createDfeMcpServer } from '@dmc--98/dfe-mcp'
 * import { createOpenAiProvider } from '@dmc--98/dfe-ai'
 * import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
 *
 * const provider = createOpenAiProvider({ apiKey: process.env.OPENAI_API_KEY! })
 * const server = createDfeMcpServer(provider)
 * await server.connect(new StdioServerTransport())
 * ```
 *
 * For a ready-to-run stdio binary, see the `dfe-mcp` bin (src/bin/dfe-mcp.ts).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { AiProvider } from '@dmc--98/dfe-ai'

import { PROMPT_TO_FORM_TOOL, handlePromptToForm } from './tools/prompt-to-form.js'
import { DOC_TO_FORM_TOOL, handleDocToForm } from './tools/doc-to-form.js'
import { TRANSCRIPT_TO_FORM_TOOL, handleTranscriptToForm } from './tools/transcript-to-form.js'
import { VALIDATE_SCHEMA_TOOL, handleValidateSchema } from './tools/validate-schema.js'

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type { McpToolResult } from './tools/types.js'
export type {
  PromptToFormInput,
  DocToFormInput,
  TranscriptToFormInput,
  ValidateSchemaInput,
} from './tools/types.js'

export { PROMPT_TO_FORM_TOOL, handlePromptToForm } from './tools/prompt-to-form.js'
export { DOC_TO_FORM_TOOL, handleDocToForm } from './tools/doc-to-form.js'
export { TRANSCRIPT_TO_FORM_TOOL, handleTranscriptToForm } from './tools/transcript-to-form.js'
export { VALIDATE_SCHEMA_TOOL, handleValidateSchema } from './tools/validate-schema.js'

// ─── Server factory ───────────────────────────────────────────────────────────

const SERVER_NAME = 'dfe-mcp'
const SERVER_VERSION = '0.1.0'

/**
 * Create a pre-configured DFE MCP server instance.
 *
 * The `provider` is injected so callers control API-key management. If you
 * use the `dfe-mcp` binary, the provider is configured from env vars
 * (OPENAI_API_KEY or ANTHROPIC_API_KEY).
 *
 * @param provider - AiProvider for LLM-backed tools (prompt/doc/transcript).
 *   The `validate_form_schema` tool does not call an LLM and works regardless.
 * @returns Configured McpServer — call `.connect(transport)` to start.
 */
export function createDfeMcpServer(provider: AiProvider): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  })

  // ── prompt_to_form ──────────────────────────────────────────────────────────
  server.tool(
    PROMPT_TO_FORM_TOOL.name,
    PROMPT_TO_FORM_TOOL.description,
    PROMPT_TO_FORM_TOOL.inputSchema.properties,
    async (input) => {
      return handlePromptToForm(
        {
          prompt: input.prompt as string,
          maxFields: input.maxFields as number | undefined,
          multiStep: input.multiStep as boolean | undefined,
          extraInstructions: input.extraInstructions as string | undefined,
        },
        provider,
      )
    },
  )

  // ── doc_to_form ─────────────────────────────────────────────────────────────
  server.tool(
    DOC_TO_FORM_TOOL.name,
    DOC_TO_FORM_TOOL.description,
    DOC_TO_FORM_TOOL.inputSchema.properties,
    async (input) => {
      return handleDocToForm(
        {
          documentText: input.documentText as string,
          documentType: input.documentType as DocToFormInput['documentType'],
          title: input.title as string | undefined,
          maxFields: input.maxFields as number | undefined,
        },
        provider,
      )
    },
  )

  // ── transcript_to_form ──────────────────────────────────────────────────────
  server.tool(
    TRANSCRIPT_TO_FORM_TOOL.name,
    TRANSCRIPT_TO_FORM_TOOL.description,
    TRANSCRIPT_TO_FORM_TOOL.inputSchema.properties,
    async (input) => {
      return handleTranscriptToForm(
        {
          transcriptText: input.transcriptText as string,
          title: input.title as string | undefined,
          maxFields: input.maxFields as number | undefined,
        },
        provider,
      )
    },
  )

  // ── validate_form_schema ────────────────────────────────────────────────────
  server.tool(
    VALIDATE_SCHEMA_TOOL.name,
    VALIDATE_SCHEMA_TOOL.description,
    VALIDATE_SCHEMA_TOOL.inputSchema.properties,
    async (input) => {
      return handleValidateSchema({
        rawAiOutput: input.rawAiOutput as string,
        normalize: input.normalize as boolean | undefined,
      })
    },
  )

  return server
}

// ─── Inline type fix for DocToFormInput ──────────────────────────────────────
// (avoids a second import just for the union type)
type DocToFormInput = import('./tools/types.js').DocToFormInput
