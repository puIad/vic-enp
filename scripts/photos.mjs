// Photo pipeline (docs/assets.md, Pipeline): originals in, AVIF + WebP per width out, EXIF dropped, sRGB.
// Usage: npm run photos [-- <originals dir>]   (default assets/pics, git-ignored; the output is committed)
// Fails when a photo's size doesn't match src/content/photos.ts or an AVIF is over budget.
import { mkdir, stat } from 'node:fs/promises'
import sharp from 'sharp'
import { PHOTOS } from '../src/content/photos.ts'

const SRC = process.argv[2] ?? 'assets/pics'
const OUT = 'public/photos'
const BUDGET = { 640: 70_000, 1280: 200_000 } // AVIF bytes (docs/assets.md targets)

await mkdir(OUT, { recursive: true })
const errors = []
let total = 0

for (const p of PHOTOS) {
  // rotate() applies the EXIF orientation; sharp writes no metadata unless asked, so GPS and camera data are dropped
  const img = sharp(`${SRC}/${p.src}`).rotate().toColourspace('srgb')
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
}

console.log(`AVIF total ${(total / 1e6).toFixed(2)} MB across ${PHOTOS.length} photos`)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
