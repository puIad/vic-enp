// Every photo the page shows (docs/assets.md, Photos). scripts/photos.mjs reads this list and writes
// public/photos/<id>-<width>.{avif,webp}; the originals stay git-ignored in assets/pics/.
// w and h are the original's size after orientation (the script checks them). focal is the object-position in %,
// set by eye so phone crops keep the faces. Alt text describes only what the photo shows (no captions, #14).

export type Photo = {
  id: string
  src: string
  w: number
  h: number
  focal: [number, number]
  alt: string
  widths: number[]
}

const W = [640, 1280, 1920]

export const PHOTOS: Photo[] = [
  // the peak (#14), in sequence order
  { id: 'img-8658', src: 'IMG_8658.JPG', w: 5472, h: 3648, focal: [50, 62], widths: [...W, 2560], alt: 'A large group of VIC members in front of the arches of the ENP building.' },
  { id: 'img-0645', src: 'IMG_0645.jpg', w: 6000, h: 4000, focal: [52, 55], widths: W, alt: 'VIC members on an outing in a forest, standing and sitting together among the trees.' },
  { id: 'img-2757', src: 'IMG_2757.JPG', w: 3456, h: 2304, focal: [42, 50], widths: W, alt: 'A full hall seen from the back during a talk, with speakers on a small stage.' },
  { id: 'img-9072', src: 'IMG_9072.jpg', w: 4000, h: 6000, focal: [52, 62], widths: W, alt: 'Two long lit tables in a courtyard at night, seen from above, with people seated along them.' },
  { id: 'img-9159', src: 'IMG_9159.jpg', w: 6000, h: 4000, focal: [58, 50], widths: W, alt: 'A night selfie of a group of smiling friends.' },
  { id: 'img-8641', src: 'IMG_8641.JPG', w: 5472, h: 3648, focal: [43, 55], widths: W, alt: 'A student lifts a bottle rocket overhead in front of the ENP building while friends cheer.' },
  { id: 'img-7544', src: 'IMG_7544.jpg', w: 5472, h: 3072, focal: [48, 60], widths: W, alt: "A large group behind a long table, two of them holding a 'Congratulations, second winner' banner." },
  { id: 'img-8759', src: 'IMG_8759.JPG', w: 6000, h: 4000, focal: [42, 55], widths: W, alt: 'A large group of VIC members outdoors in front of a white building with arches.' },
  // events (#15)
  { id: 'dscf7405', src: 'DSCF7405.jpg', w: 6240, h: 4160, focal: [50, 60], widths: W, alt: 'A large group in suits and dresses posing together in a draped hall.' },
  { id: 't2a6297', src: '_T2A6297.jpg', w: 6160, h: 4640, focal: [50, 52], widths: W, alt: 'A large group on a stage in front of a red screen showing the Vision & Innovation Club logo.' },
  { id: 'img-8026', src: 'IMG_8026.JPG', w: 6000, h: 4000, focal: [50, 62], widths: W, alt: 'A crowd standing around a robot maze built on the floor of a hall.' },
]

export function photo(id: string): Photo {
  const p = PHOTOS.find((x) => x.id === id)
  if (!p) throw new Error(`Unknown photo ${id}`)
  return p
}
