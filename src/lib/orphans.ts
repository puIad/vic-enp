// No lone word on a paragraph's last line (decision 64). CSS `text-wrap: pretty` (index.css) does most of it, but
// Chrome leaves short paragraphs alone and Firefox has none, so the last two words of every paragraph and list item
// also share a no-break space. Done on the DOM, after React renders, so the copy files stay as the owner wrote them.

const NB = ' '
/** Longer pairs could outgrow a phone's narrow column; those wrap as they would. */
const MAX_PAIR = 24

/** Joins the last two words of `text` with a no-break space. `before`: words sit in an earlier text node of the block. */
export function glue(text: string, before = false) {
  const m = text.match(/(\S*)[ \t\n\r]+(\S+)(\s*)$/)
  if (!m || m.index === undefined) return text
  const [all, prev, last, tail] = m
  const words = text.slice(0, m.index).match(/\S+/g)?.length ?? 0
  // two words alone, with nowhere else to break
  if (!before && (!prev || words === 0)) return text
  if (prev.length + last.length > MAX_PAIR) return text
  return text.slice(0, m.index) + prev + NB + last + tail + text.slice(m.index + all.length)
}

const BLOCKS = 'main p, main li, footer p'

/** The block's last text node with words in it, and whether any words come before it. */
function lastText(el: Element) {
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let last: Text | null = null
  let before = false
  for (let n = walk.nextNode() as Text | null; n; n = walk.nextNode() as Text | null) {
    if (!/\S/.test(n.data)) continue
    if (last) before = true
    last = n
  }
  return { last, before }
}

function fix(el: Element) {
  // a block with blocks inside (a list item holding a paragraph) is fixed through them
  if (el.querySelector('p, li')) return
  const { last, before } = lastText(el)
  if (!last) return
  const next = glue(last.data, before)
  if (next !== last.data) last.data = next
}

/** Keeps every paragraph's last two words together, now and as the staged acts swap in. */
export function keepOrphans(root: HTMLElement = document.body) {
  root.querySelectorAll(BLOCKS).forEach(fix)
  const mo = new MutationObserver((list) => {
    const seen = new Set<Element>()
    for (const r of list) {
      const el = r.target instanceof Element ? r.target : r.target.parentElement
      if (!el) continue
      const block = el.closest(BLOCKS)
      if (block) seen.add(block)
      if (r.type === 'childList') el.querySelectorAll(BLOCKS).forEach((b) => seen.add(b))
    }
    seen.forEach(fix)
  })
  mo.observe(root, { childList: true, subtree: true, characterData: true })
  return () => mo.disconnect()
}
