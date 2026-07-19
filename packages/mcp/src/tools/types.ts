/**
 * Shared types for DFE MCP tool handlers.
 *
 * These types mirror the MCP SDK's `CallToolResult` shape so handlers can be
 * tested independently — without the SDK installed — by importing this module
 * and the relevant handler directly.
 */

// ─── MCP result shape ────────────────────────────────────────────────────────

/**
 * Return value from every tool handler.
 * Matches the `CallToolResult` shape from @modelcontextprotocol/sdk.
 */
export interface McpToolResult {
  content: Array<{ type: 'text'; text: string }>
  /** When true the content describes an error (shown as error in MCP clients). */
  isError?: boolean
}

// ─── Tool input types ────────────────────────────────────────────────────────

/** Input for the `prompt_to_form` tool. */
export interface PromptToFormInput {
  /** Natural-language description of the form. */
  prompt: string
  /** Maximum fields to generate. Default: 20. */
  maxFields?: number
  /** Produce a multi-step layout. Default: false. */
  multiStep?: boolean
  /** Extra constraints appended to the LLM system prompt. */
  extraInstructions?: string
}

/** Input for the `doc_to_form` tool. */
export interface DocToFormInput {
  /** Full text content of the document to extract from. */
  documentText: string
  /**
   * Format hint for the LLM.
   * @default 'plain-text'
   */
  documentType?: 'plain-text' | 'markdown' | 'html-stripped' | 'pdf-extracted'
  /** Title hint forwarded to the LLM. */
  title?: string
  /** Maximum fields to extract. Default: 30. */
  maxFields?: number
}

/** Input for the `transcript_to_form` tool. */
export interface TranscriptToFormInput {
  /** Full text of the speech transcript. */
  transcriptText: string
  /** Title hint forwarded to the LLM. */
  title?: string
  /** Maximum fields to extract. Default: 20. */
  maxFields?: number
}

/** Input for the `validate_form_schema` tool. */
export interface ValidateSchemaInput {
  /**
   * JSON string of the raw AI output to validate.
   * Must match the `RawAiOutput` shape: `{ fields: RawAiField[] }`.
   */
  rawAiOutput: string
  /**
   * When true, also normalize the output to proper DFE FormField objects
   * and include the normalized fields in the response.
   * @default false
   */
  normalize?: boolean
}
