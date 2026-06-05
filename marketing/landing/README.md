# DFE Landing Site

The marketing landing page for Dynamic Form Engine. Built with **Astro** (zero JS shipped by default, React islands available for live demos), content-managed through a **git-based CMS** at `/admin`, and deployable to **Cloudflare Pages** or **Vercel**.

It is standalone — not part of the npm release, and not in the pnpm workspace's published packages.

## Why this stack

- **Astro** is purpose-built for fast content sites: it ships static HTML by default, so the page is quick and SEO-friendly, but you can drop in a React "island" (e.g. the live `dfe-react` demo) where you need interactivity.
- **Git-based CMS** (Decap/Sveltia) gives you an admin dashboard at `/admin` to edit the page without touching code — every change is just a commit to `src/content/site/home.json`. No separate backend or database to run.
- **Cloudflare/Vercel compatible** — both host Astro first-class (static out of the box; SSR via the respective adapter if you later need it).

## Local development

```bash
cd marketing/landing
npm install
npm run dev            # site at http://localhost:4321

# To use the admin dashboard locally:
npx decap-server       # in a second terminal (enables local_backend)
# then open http://localhost:4321/admin
```

## Editing content

All copy lives in `src/content/site/home.json`, validated by the schema in `src/content/config.ts`. Edit it directly, or visually at `/admin`. A bad edit fails the Astro build rather than shipping broken content.

## Deploy

### Cloudflare Pages
- Framework preset: **Astro**
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `marketing/landing`

### Vercel
- Framework preset: **Astro** (auto-detected)
- Root directory: `marketing/landing`

### Admin auth (production)
The `/admin` dashboard needs GitHub auth to commit. Either:
1. Stand up a small OAuth proxy (Cloudflare Worker or Vercel function) and set `base_url` in `public/admin/config.yml`, or
2. Use **Sveltia CMS** (drop-in replacement for the Decap script tag) with a GitHub personal access token — simplest for a solo maintainer.

See the comments in `public/admin/config.yml`.

## Before going live

- Replace the demo placeholder: `demoEmbedUrl` already points at the StackBlitz live demo; swap for a video poster if you prefer.
- Set the real GitHub Sponsors URL (`sponsorUrl`) and confirm all links resolve.
- Set the production domain in `astro.config.mjs` (`site`).
- Point `public/admin/config.yml` `repo:` at your actual org/repo.
