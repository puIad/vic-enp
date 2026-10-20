/** The symbols shown beside a name: public/logos/<id>.png (decision 60, scripts/logos.py) */
export type LogoId = 'cpsp' | 'vic-charity' | 'masterclass' | 'vicra' | 'vic-entertainment'

// A logo's symbol beside its name (decision 60): in full colour, unchanged. Decorative, since the name beside it is the
// text. Every symbol sits in the same square, about the name's height (.sym in index.css); the files are 512 px on
// their long side, so width and height only reserve that square and object-fit keeps each file's proportions.
export function LogoSymbol({ id }: { id: LogoId }) {
  return <img src={`/logos/${id}.png`} alt="" width={512} height={512} loading="lazy" decoding="async" className="sym" />
}
