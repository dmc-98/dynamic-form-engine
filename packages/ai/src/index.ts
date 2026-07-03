/**
 * @dmc--98/dfe-ai — AI provider adapters for Dynamic Form Engine
 *
 * S1: Provider adapter interface + built-in OpenAI / Anthropic stubs
 * S2: Consent/governance — every AI-generated field is stamped with
 *     `metadata.aiGenerated: true` and the result carries `requiresUserReview: true`
 *
 * Usage:
 * ```ts
 * import { parsePromptToSchema, createOpenAiProvider } from '@dmc--98/dfe-ai'
 *
 * const provider = createOpenAiProvider({ apiKey: process.env.OPENAI_API_KEY! })
 * const schema = await parsePromptToSchema('A contact form with name, email, message', { provider })
 * // schema.requiresUserReview === true — always show review UI before persisting
 * ```
 */

export type { AiProvider, AiCompletionOptions, OpenAiProviderOptions, AnthropicProviderOptions } from './provider.js'
export { createOpenAiProvider, createAnthropicProvider } from './provider.js'

export type { ParsePromptOptions, ParsePromptResult } from './parse-prompt.js'
export { parsePromptToSchema } from './parse-prompt.js'

export type {
  ValidationIssue,
  AiOutputValidationResult,
  RawAiField,
  RawAiOutput,
  NormalizeOptions,
} from './validate.js'
export { AI_TYPE_TO_DFE_TYPE, validateAiOutput, normalizeAiOutput } from './validate.js'
