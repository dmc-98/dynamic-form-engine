/**
 * `doc_to_form` MCP tool handler.
 *
 * Wraps `parseDocToSchema` from @dmc--98/dfe-ai.
 * Extracts form fields from an existing document (intake form, markdown
 * template, PDF-extracted text, etc.) rather than generating from scratch.
 */

import { parseDocToSchema } from '@dmc--98/dfe-ai'
import type { AiProvider } from '@dmc--98/dfe-ai'
import type { DocToFormInput, McpToolResult } from './types.js'

// ─── Tool metadata ────────────────────────────────────────────────────────────

export const DOC_TO_FORM_TOOL = {
  name: 'doc_to_form',
  description:
    'Extract a DFE form schema from an existing document — an intake form, ' +
    'markdown template, or PDF-extracted text. The LLM EXTRACTS existing fields ' +
    'rather than generating new ones. Sections with no extractable fields appear ' +
    'in `unmappedSections` for review. Always returns `requiresUserReview: true`.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      documentText: {
        type: 'string',
        description: 'Full text content of the document to extract fields from.',
      },
      documentType: {
        type: 'string',
        enum: ['plain-text', 'markdown', 'html-stripped', 'pdf-extracted'],
        description: 'Format hint for the LLM. Default: plain-text.',
      },
      title: {
        type: 'string',
        description: 'Optional title hint forwarded to the LLM for a better form title.',
      },
      maxFields: {
        type: 'number',
        description: 'Maximum fields to extract. Default: 30.',
      },
    },
    required: ['documentText'],
  },
} as const

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * Handle a `doc_to_form` tool call.
 *
 * @param input - Validated tool input.
 * @param provider - Injected AiProvider (caller configures credentials).
 * @returns MCP tool result (always filled; errors use isError:true).
 */
export async function handleDocToForm(
  input: DocToFormInput,
  provider: AiProvider,
): Promise<McpToolResult> {
  try {
    const result = await parseDocToSchema(input.documentText, {
      provider,
      documentType: input.documentType ?? 'plain-text',
      title: input.title,
      maxFields: input.maxFields ?? 30,
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
