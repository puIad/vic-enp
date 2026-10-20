// A logo's symbol beside its name (decision 60): public/logos/<id>.png in full colour, unchanged. Decorative, since the
// name beside it is the text. Every symbol sits in the same square, about the name's height (.sym in index.css).
export function LogoSymbol({ id }: { id: string }) {
  return <img src={`/logos/${id}.png`} alt="" width={512} height={512} loading="lazy" decoding="async" className="sym" />
}
