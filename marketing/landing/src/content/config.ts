import { defineCollection, z } from 'astro:content'

// ─── Content collections ──────────────────────────────────────────────────────
// All editable landing-page copy lives in `src/content/site/` as data files,
// edited either by hand or through the git-based CMS at /admin. Astro validates
// them against this schema at build time, so a bad edit fails the build instead
// of shipping broken content.

const site = defineCollection({
  type: 'data',
  schema: z.object({
    hero: z.object({
      eyebrow: z.string(),
      title: z.string(),
      subtitle: z.string(),
      primaryCta: z.object({ label: z.string(), href: z.string() }),
      secondaryCtas: z.array(z.object({ label: z.string(), href: z.string() })),
    }),
    features: z.array(z.object({ icon: z.string(), title: z.string(), body: z.string() })),
    comparison: z.array(z.object({ tool: z.string(), bestAt: z.string(), dfe: z.string() })),
    sponsorTiers: z.array(z.object({ name: z.string(), amount: z.string(), perk: z.string() })),
    demoEmbedUrl: z.string().optional(),
    githubUrl: z.string(),
    docsUrl: z.string(),
    playgroundUrl: z.string(),
    sponsorUrl: z.string(),
    claudeCode: z.object({
      heading: z.string(),
      body: z.string(),
      marketplaceCmd: z.string(),
      installCmd: z.string(),
      docsUrl: z.string(),
    }).optional(),
  }),
})

export const collections = { site }
