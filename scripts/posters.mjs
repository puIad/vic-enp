// Bakes the tier 0 hero posters from the real scene (#11): public/posters/hero-poster-{d,m}.webp.
//
//   npm run build && npx vite preview --port 4173   (in another terminal)
//   npm i --no-save playwright-core
//   POSTER_CHROME=<chrome-headless-shell.exe> node scripts/posters.mjs [http://127.0.0.1:4173]
//
// Headless Chrome renders WebGL in software, which is fine for a still: `?still` freezes time with the field formed and
// your point lit, and everything but the canvas is hidden, so the poster carries no copy and no chrome. The grain and
// vignette stay live CSS over it, as they do over the canvas.
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'
import sharp from 'sharp'

const base = process.argv[2] ?? 'http://127.0.0.1:4173'
const executablePath = process.env.POSTER_CHROME ?? process.env.SCROLLCRAFT_CHROME
if (!executablePath) throw new Error('Set POSTER_CHROME to the Chrome for Testing headless shell')

const shots = [
  // desktop on tier 2's budget, phone on tier 1's, each at its tier's pixel-ratio cap or the poster's own
  { name: 'd', tier: 2, width: 1440, height: 900, scale: 4 / 3 },
  { name: 'm', tier: 1, width: 390, height: 844, scale: 1.5 },
]

await mkdir('public/posters', { recursive: true })
const browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: s.scale })
  await page.goto(`${base}/?tier=${s.tier}&still`)
  await page.waitForFunction(() => document.documentElement.classList.contains('w-ready'), null, { timeout: 30000 })
  await page.addStyleTag({ content: '*{visibility:hidden!important;transition:none!important}canvas{visibility:visible!important}' })
  await page.waitForTimeout(800)
  const png = await page.screenshot({ type: 'png' })
  const out = `public/posters/hero-poster-${s.name}.webp`
  const info = await sharp(png).webp({ quality: 74, effort: 6 }).toFile(out)
  console.log(`${out}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`)
  await page.close()
}
await browser.close()
