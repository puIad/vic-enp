// PROTOTYPE switcher for the three direction comps (ticket #8). Hidden with ?shot so screenshots stay clean.
const pages = [['a.html', 'A · Constellation map'], ['b.html', 'B · Cutlist'], ['c.html', 'C · Thresholds']];
const here = pages.findIndex(([f]) => location.pathname.endsWith(f));
const go = (d) => { location.href = pages[(here + d + pages.length) % pages.length][0]; };
if (!new URLSearchParams(location.search).has('shot')) {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9999;display:flex;gap:6px;align-items:center;background:#fff;color:#000;font:600 13px/1 system-ui,sans-serif;padding:6px;border-radius:999px;box-shadow:0 6px 24px rgba(0,0,0,.5)';
  bar.innerHTML = `<button aria-label="Previous direction">‹</button><span style="padding:0 8px;white-space:nowrap">${pages[here][1]}</span><button aria-label="Next direction">›</button>`;
  bar.querySelectorAll('button').forEach((b, i) => { b.style.cssText = 'all:unset;cursor:pointer;width:28px;height:28px;text-align:center;line-height:28px;border-radius:999px;background:#eee'; b.onclick = () => go(i ? 1 : -1); });
  document.body.append(bar);
  addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); });
}
