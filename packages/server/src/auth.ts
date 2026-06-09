// ─── Auth Gate (adapter, not an identity provider) ───────────────────────────
// DFE does not build authentication. It provides a GATE that defers to the host
// app's existing auth (NextAuth/Auth.js, Clerk, a session cookie, a JWT — your
// choice). You supply a resolver that turns a request into a principal (or
// null); the gate enforces presence and, optionally, a required role. This is
// an open, self-hosted alternative to bundled hosted login.

export interface AuthPrincipal {
  userId: string
  roles?: string[]
  [key: string]: unknown
}

/** Resolve a request into a principal, or null if unauthenticated. */
export type AuthResolver = (req: { headers: Record<string, unknown> }) => Promise<AuthPrincipal | null> | AuthPrincipal | null

export interface AuthGateOptions {
  resolve: AuthResolver
  /** If set, the principal must include this role (else 403). */
  requireRole?: string
}

export interface AuthDecision {
  ok: boolean
  /** HTTP-style status for the failure (401 unauthenticated, 403 unauthorized). */
  status?: 401 | 403
  principal?: AuthPrincipal
  reason?: string
}

export interface AuthGate {
  authorize(req: { headers: Record<string, unknown> }): Promise<AuthDecision>
}

/**
 * Create an auth gate over a host-provided resolver.
 *
 * @example
 * ```ts
 * const gate = createAuthGate({
 *   resolve: async (req) => {
 *     const session = await getServerSession(req)   // your auth lib
 *     return session ? { userId: session.user.id, roles: session.user.roles } : null
 *   },
 *   requireRole: 'member',
 * })
 * const decision = await gate.authorize(req)
 * if (!decision.ok) return res.status(decision.status!).end()
 * ```
 */
export function createAuthGate(options: AuthGateOptions): AuthGate {
  return {
    async authorize(req) {
      let principal: AuthPrincipal | null
      try {
        principal = await options.resolve(req)
      } catch {
        // Fail closed: a resolver error must never be treated as authenticated.
        return { ok: false, status: 401, reason: 'Authentication failed' }
      }
      if (!principal) {
        return { ok: false, status: 401, reason: 'Not authenticated' }
      }
      if (options.requireRole) {
        // Guard against a non-array `roles` shape (the index signature permits
        // it); an unexpected shape must fail closed (403), never throw a 500.
        const roles = Array.isArray(principal.roles) ? principal.roles : []
        if (!roles.includes(options.requireRole)) {
          return { ok: false, status: 403, reason: `Missing required role: ${options.requireRole}` }
        }
      }
      return { ok: true, principal }
    },
  }
}
