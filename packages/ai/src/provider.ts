/**
 * AI provider adapter interface (S1).
 *
 * DFE does not bundle or depend on any LLM SDK. Callers inject a provider
 * that knows how to make completions. This keeps the package zero-dep at
 * runtime and lets consumers swap providers (OpenAI, Anthropic, Ollama, …)
 * without changing the form-generation code.
 */

export interface AiCompletionOptions {
  /** Max output tokens. Default: 2048. */
  maxTokens?: number
  /** Temperature 0–2. Default: 0 (deterministic for schema generation). */
  temperature?: number
  /** System prompt override. If omitted, the provider's default is used. */
  systemPrompt?: string
}

export interface AiProvider {
  /**
   * Send a prompt and return the completion text.
   * The provider is responsible for auth, retries, and rate limits.
   */
  complete(prompt: string, options?: AiCompletionOptions): Promise<string>
}

// ─── Built-in provider stubs ──────────────────────────────────────────────
// Real implementations require the consumer to install the relevant SDK and
// pass credentials. These stubs validate the shape and provide copy-paste
// starting points.

export interface OpenAiProviderOptions {
  /** OpenAI API key (or compatible endpoint key). */
  apiKey: string
  /** Model name. Default: "gpt-4o-mini". */
  model?: string
  /** Base URL for OpenAI-compatible endpoints (Ollama, Azure, Together, …). */
  baseUrl?: string
}

/**
 * Create an OpenAI (or OpenAI-compatible) provider.
 *
 * Requires the `openai` package: `npm i openai`
 *
 * @example
 * ```ts
 * import OpenAI from 'openai'
 * import { createOpenAiProvider } from '@dmc--98/dfe-ai'
 *
 * const provider = createOpenAiProvider({
 *   apiKey: process.env.OPENAI_API_KEY!,
 *   model: 'gpt-4o',
 * })
 * ```
 */
export function createOpenAiProvider(options: OpenAiProviderOptions): AiProvider {
  return {
    async complete(prompt, completionOptions = {}) {
      // Lazy-require to avoid a hard dep — consumer must install openai
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { default: OpenAI } = await import('openai' as string as never) as { default: unknown }
      const client = new (OpenAI as new (opts: Record<string, unknown>) => {
        chat: { completions: { create: (body: Record<string, unknown>) => Promise<{ choices: Array<{ message: { content: string | null } }> }> } }
      })({
        apiKey: options.apiKey,
        baseURL: options.baseUrl,
      })
      const response = await client.chat.completions.create({
        model: options.model ?? 'gpt-4o-mini',
        messages: [
          ...(completionOptions.systemPrompt
            ? [{ role: 'system', content: completionOptions.systemPrompt }]
            : []),
          { role: 'user', content: prompt },
        ],
        max_tokens: completionOptions.maxTokens ?? 2048,
        temperature: completionOptions.temperature ?? 0,
        response_format: { type: 'json_object' },
      })
      return response.choices[0]?.message?.content ?? ''
    },
  }
}

export interface AnthropicProviderOptions {
  /** Anthropic API key. */
  apiKey: string
  /** Model name. Default: "claude-haiku-4-5-20251001". */
  model?: string
}

/**
 * Create an Anthropic provider.
 *
 * Requires the `@anthropic-ai/sdk` package: `npm i @anthropic-ai/sdk`
 *
 * @example
 * ```ts
 * import Anthropic from '@anthropic-ai/sdk'
 * import { createAnthropicProvider } from '@dmc--98/dfe-ai'
 *
 * const provider = createAnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY! })
 * ```
 */
export function createAnthropicProvider(options: AnthropicProviderOptions): AiProvider {
  return {
    async complete(prompt, completionOptions = {}) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk' as string as never) as {
        default: new (opts: Record<string, unknown>) => {
          messages: { create: (body: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }> }> }
        }
      }
      const client = new Anthropic({ apiKey: options.apiKey })
      const response = await client.messages.create({
        model: options.model ?? 'claude-haiku-4-5-20251001',
        max_tokens: completionOptions.maxTokens ?? 2048,
        system: completionOptions.systemPrompt ?? 'You are a form schema generator. Always respond with valid JSON.',
        messages: [{ role: 'user', content: prompt }],
      })
      const block = response.content.find((b) => b.type === 'text')
      return block?.text ?? ''
    },
  }
}
