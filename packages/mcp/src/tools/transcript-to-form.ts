/**
 * `transcript_to_form` MCP tool handler.
 *
 * Wraps `parseTranscriptToSchema` from @dmc--98/dfe-ai.
 * Designed for spoken-word input: Whisper output, Otter.ai exports, Rev
 * transcripts, or any text with filler words and speaker labels.
 */

import { parseTranscriptToSchema } from '@dmc--98/dfe-ai'
import type { AiProvider } from '@dmc--98/dfe-ai'
import type { TranscriptToFormInput, McpToolResult } from './types.js'

// ─── Tool metadata ────────────────────────────────────────────────────────────

export const TRANSCRIPT_TO_FORM_TOOL = {
  name: 'transcript_to_form',
  description:
    'Extract a DFE form schema from a speech transcript (Whisper, Otter.ai, Rev, etc.). ' +
    'Handles filler words, speaker labels, and conversational language. ' +
    'Speaker labels are extracted into `speakerSummary`. ' +
    'Always returns `requiresUserReview: true`.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      transcriptText: {
        type: 'string',
        description:
          'Full text of the speech transcript. Speaker labels like [Alice]: or ALICE: ' +
          'are automatically extracted into speakerSummary.',
      },
      title: {
        type: 'string',
        description: 'Optional title hint for the resulting form.',
      },
      maxFields: {
        type: 'number',
        description: 'Maximum fields to extract. Default: 20.',
      },
    },
    required: ['transcriptText'],
  },
} as const

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * Handle a `transcript_to_form` tool call.
 *
 * @param input - Validated tool input.
 * @param provider - Injected AiProvider (caller configures credentials).
 * @returns MCP tool result (always filled; errors use isError:true).
 */
export async function handleTranscriptToForm(
  input: TranscriptToFormInput,
  provider: AiProvider,
): Promise<McpToolResult> {
  try {
    const result = await parseTranscriptToSchema(input.transcriptText, {
      provider,
      title: input.title,
      maxFields: input.maxFields ?? 20,
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
