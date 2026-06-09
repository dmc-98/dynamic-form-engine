// Browser shim for node:crypto used when bundling @dmc--98/dfe-server for the
// in-browser server demo. The demo only exercises executeStepSubmit (pure
// validation + adapter calls); webhook HMAC signing is never invoked. If it
// ever is, fail loudly rather than silently producing a bogus signature.
export function createHmac(): never {
  throw new Error('createHmac is not available in the browser demo (webhooks are server-only).')
}
export default { createHmac }
