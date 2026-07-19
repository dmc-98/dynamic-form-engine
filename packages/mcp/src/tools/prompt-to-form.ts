/**
 * `prompt_to_form` MCP tool handler.
 *
 * Wraps `parsePromptToSchema` from @dmc--98/dfe-ai.
 * The handler is a plain async function so it can be unit-tested without the
 * MCP SDK. The server wiring in ../server.ts registers it with McpServer.
 */

import { parsePromptToSchema } from '@dmc--98/dfe-ai'
import type { AiProvider } from '@dmc--98/dfe-ai'
import type { PromptToFormInput, McpToolResult } from './types.js'

// ─── Tool metadata ────────────────────────────────────────────────────────────

export const PROMPT_TO_FORM_TOOL = {
  name: 'prompt_to_form',
  description:
    'Generate a DFE form schema from a natural-language description. ' +
    'Returns field configs, step layout, and `requiresUserReview: true` which ' +
    'MUST be surfaced in the calling UI before persisting the schema.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      prompt: {
        type: 'string',
        description: 'Natural-language description of the form to generate.',
      },
      maxFields: {
        type: 'number',
        description: 'Maximum number of fields to generate. Default: 20.',
      },
      multiStep: {
        type: 'boolean',
        description: 'When true, the LLM produces a multi-step layout. Default: false.',
      },
      extraInstructions: {
        type: 'string',
        description: 'Extra constraints appended to the LLM system prompt.',
      },
    },
    required: ['prompt'],
  },
} as const

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * Handle a `prompt_to_form` tool call.
 *
 * @param input - Validated tool input.
 * @param provider - Injected AiProvider (caller configures credentials).
 * @returns MCP tool result (always filled; errors use isError:true).
 */
export async function handlePromptToForm(
  input: PromptToFormInput,
  provider: AiProvider,
): Promise<McpToolResult> {
  try {
    const result = await parsePromptToSchema(input.prompt, {
      provider,
      maxFields: input.maxFields ?? 20,
      multiStep: input.multiStep ?? false,
      extraInstructions: input.extraInstructions,
    })
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: err instanceof Error ? err.message : String(err),
        },
      ],
      isError: true,
    }
  }
}
