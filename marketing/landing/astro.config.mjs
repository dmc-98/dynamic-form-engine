import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

// Astro config for the DFE landing site.
//
// Deploy targets:
//   • Cloudflare Pages — build command `npm run build`, output dir `dist`.
//     For SSR add `@astrojs/cloudflare` and set `output: 'server'`.
//   • Vercel — zero-config for static; add `@astrojs/vercel` for SSR.
//
// This config is static-output (output: 'static'), which both hosts serve
// directly and which keeps the git-based CMS (/admin) simple.
export default defineConfig({
  site: 'https://dynamic-form-engine.dev',
  integrations: [react()],
  output: 'static',
})
