// Photo pipeline (docs/assets.md, Pipeline): originals in, AVIF + WebP per width out, EXIF dropped, sRGB.
// Usage: npm run photos [-- <originals dir>] [-- --only <id>]   (default assets/pics, git-ignored; the output is committed)
// Fails when a photo's size doesn't match src/content/photos.ts or an AVIF is over budget.
import { mkdir, stat } from 'node:fs/promises'
import sharp from 'sharp'
import { PHOTOS } from '../src/content/photos.ts'

// --only <id> bakes one photo and leaves the others' committed files as they are
const args = process.argv.slice(2)
const only = args.includes('--only') ? args.splice(args.indexOf('--only'), 2)[1] : undefined
const SRC = args[0] ?? 'assets/pics'
const OUT = 'public/photos'
const BUDGET = { 640: 70_000, 1280: 200_000 } // AVIF bytes (docs/assets.md targets)

/**
 * The footer's committee cutout (decision 103): high-contrast black and white, its transparency kept. Luminance is
 * stretched over the cutout's own range and pushed through an S-curve; the alpha channel passes through untouched.
 */
async function mono(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const s = (t) => 1 / (1 + Math.exp(-6 * (t - 0.5)))
  const lut = Array.from({ length: 256 }, (_, g) => {
    const t = Math.min(1, Math.max(0, (g - 4) / 246)) ** 0.85
    return Math.round(((s(t) - s(0)) / (s(1) - s(0))) * 255)
  })
  const n = info.width * info.height
  const out = Buffer.alloc(n * 2)
  for (let p = 0; p < n; p++) {
    const i = p * 4
    out[p * 2] = lut[Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2])]
    out[p * 2 + 1] = data[i + 3]
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 2 } })
}

await mkdir(OUT, { recursive: true })
const errors = []
let total = 0
let baked = 0

for (const p of PHOTOS.filter((x) => !only || x.id === only)) {
  // rotate() applies the EXIF orientation; sharp writes no metadata unless asked, so GPS and camera data are dropped
  const img = p.mono ? await mono(`${SRC}/${p.src}`) : sharp(`${SRC}/${p.src}`).rotate().toColourspace('srgb')
  const { width, height, orientation = 1 } = await sharp(`${SRC}/${p.src}`).metadata()
  const [w, h] = orientation >= 5 ? [height, width] : [width, height]
  if (w !== p.w || h !== p.h) errors.push(`${p.id}: original is ${w}x${h}, photos.ts says ${p.w}x${p.h}`)

  const line = [p.id.padEnd(10)]
  for (const width of p.widths) {
    const base = `${OUT}/${p.id}-${width}`
    const resized = img.clone().resize({ width, withoutEnlargement: true })
    await resized.clone().avif({ quality: 48, effort: 6 }).toFile(`${base}.avif`)
    await resized.clone().webp({ quality: 74, effort: 5 }).toFile(`${base}.webp`)
    const { size } = await stat(`${base}.avif`)
    total += size
    line.push(`${width}:${Math.round(size / 1000)}KB`)
    if (BUDGET[width] && size > BUDGET[width]) errors.push(`${p.id}-${width}.avif is ${size} bytes, budget ${BUDGET[width]}`)
  }
  console.log(line.join('  '))
  baked++
}

console.log(`AVIF total ${(total / 1e6).toFixed(2)} MB across ${baked} photos`)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
