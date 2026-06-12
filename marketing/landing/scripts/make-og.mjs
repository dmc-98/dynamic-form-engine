// Rasterize public/og.svg → public/og.png (1200×630).
// Social scrapers (Facebook, LinkedIn, Twitter/X, Slack) need a raster image;
// SVG is unreliable for og:image. Run once and commit the PNG:
//
//   npm install            # pulls @resvg/resvg-js (devDependency)
//   npm run og             # writes public/og.png
//
// Not wired into `npm run build`, so a missing dep never breaks a deploy.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const svgPath = resolve(here, '../public/og.svg')
const outPath = resolve(here, '../public/og.png')

if (!existsSync(svgPath)) {
  console.error('✗ public/og.svg not found.')
  process.exit(1)
}

let Resvg
try {
  ;({ Resvg } = await import('@resvg/resvg-js'))
} catch {
  console.error('✗ @resvg/resvg-js is not installed. Run `npm install` first, then `npm run og`.')
  process.exit(1)
}

const svg = readFileSync(svgPath, 'utf8')
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  // Use system fonts where available; falls back to a default sans otherwise.
  font: { loadSystemFonts: true, defaultFontFamily: 'IBM Plex Sans' },
})
const png = resvg.render().asPng()
writeFileSync(outPath, png)
console.log(`✓ Wrote ${outPath} (${png.length.toLocaleString()} bytes)`)
