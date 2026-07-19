/**
 * `validate_form_schema` MCP tool handler.
 *
 * Wraps `validateAiOutput` (and optionally `normalizeAiOutput`) from
 * @dmc--98/dfe-ai. Lets an AI agent validate a raw schema before persisting,
 * surfacing structural problems and type-mapping issues with severity labels.
 */

import { validateAiOutput, normalizeAiOutput } from '@dmc--98/dfe-ai'
import type { ValidateSchemaInput, McpToolResult } from './types.js'

// ─── Tool metadata ────────────────────────────────────────────────────────────

export const VALIDATE_SCHEMA_TOOL = {
  name: 'validate_form_schema',
  description:
    'Validate a raw AI-generated DFE form schema. ' +
    'Returns `ok`, a list of typed issues (error | warning) with field paths, ' +
    'and (when normalize=true) the normalized FormField[] ready for DFE core. ' +
    'Errors block use; warnings are advisory.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      rawAiOutput: {
        type: 'string',
        description:
          'JSON string of the raw AI output. Must have shape: ' +
          '{ title?, description?, steps?, fields: RawAiField[] }.',
      },
      normalize: {
        type: 'boolean',
        description:
          'When true, also normalize the output to proper DFE FormField objects ' +
          'and include them in the response under normalizedFields. Default: false.',
      },
    },
    required: ['rawAiOutput'],
  },
} as const

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * Handle a `validate_form_schema` tool call.
 *
 * @param input - Validated tool input.
 * @returns MCP tool result (always filled; errors use isError:true).
 */
export async function handleValidateSchema(input: ValidateSchemaInput): Promise<McpToolResult> {
  // Parse the JSON string
  let raw: unknown
  try {
    raw = JSON.parse(input.rawAiOutput)
  } catch {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ok: false,
              issues: [
                {
                  path: '',
                  message: 'rawAiOutput is not valid JSON',
                  severity: 'error',
                },
              ],
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    }
  }

  try {
    // validateAiOutput accepts RawAiOutput (object with optional fields/title/etc.)
    const validationResult = validateAiOutput(raw as Parameters<typeof validateAiOutput>[0])

    const response: Record<string, unknown> = {
      ok: validationResult.ok,
      issues: validationResult.issues,
    }

    // Optionally normalize — only attempt when no blocking errors
    if (input.normalize && validationResult.ok) {
      try {
        const normalized = normalizeAiOutput(raw as Parameters<typeof normalizeAiOutput>[0])
        // Expose the fields array directly so callers can iterate without
        // unwrapping a { fields, steps } envelope.
        response.normalizedFields = normalized.fields
      } catch (normErr) {
        response.normalizeError =
          normErr instanceof Error ? normErr.message : String(normErr)
      }
    } else if (input.normalize && !validationResult.ok) {
      response.normalizeSkipped =
        'Normalization skipped: validation errors must be resolved first.'
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
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
