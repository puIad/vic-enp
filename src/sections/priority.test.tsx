import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClubLife } from './ClubLife'
import ClubLifePeak from './ClubLifePeak'
import { Events } from './Events'
import EventsStage from './EventsStage'

// Decision 64: the first photo a visitor sees fetches first; every other photo waits its turn.

/** The page's photos in document order, each with its fetch priority. */
const photos = (html: string) =>
  [...html.matchAll(/<img\s([^>]*)>/g)]
    .map(([, a]) => ({ src: a.match(/src="([^"]*)"/)?.[1] ?? '', priority: a.match(/fetchpriority="([^"]*)"/i)?.[1] }))
    .filter((p) => p.src.startsWith('/photos/'))

afterEach(() => vi.unstubAllGlobals())

describe('photo priority', () => {
  it.each([
    ['with the world (the peak, the events stage)', () => renderToStaticMarkup(<><ClubLifePeak /><EventsStage /></>)],
    [
      'on tier 0 and under reduced motion (the still grid, the cards)',
      () => {
        vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} }))
        return renderToStaticMarkup(<><ClubLife /><Events staged={false} /></>)
      },
    ],
  ])('only the first photo on the page is high priority, %s', (_, render) => {
    const all = photos(render())
    expect(all.length).toBeGreaterThan(5)
    expect(all[0]).toEqual({ src: '/photos/img-8658-1280.webp', priority: 'high' })
    expect(all.slice(1).filter((p) => p.priority === 'high')).toEqual([])
  })
})
