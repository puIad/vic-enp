# The hero gathers into the VIC icon

Status: accepted, 2026-10-20

The signed hero ([#11](https://github.com/puIad/vic-enp/issues/11)) is a tilted, three-armed cloud, shaped so that
nothing in the world looks like the logo's bulb or iris, because the brief read the VIC IT Charter as "no 3D logo".
VIC's IT department, who wrote the charter, said on 2026-10-20 that its 3D rule covers post design, not websites.
The owner took that up: on this page every 3D logo rule in [brand.md](../brand.md#logo-in-a-3d-world) is lifted, the
600 gather into the VIC icon and hold it until the first scroll, with your point lit in its iris, and the close
rings the Apply slot with an iris of the 600. The flat logo files keep every charter rule.

## Considered options

- **Keep the signed cloud.** Merged and working, so it stays as the fallback in the cut line. The owner chose the
  icon for the hero at rest.
- **A short logo sting.** The points draw the icon and relax into the cloud on their own before any scroll. Easy to
  miss, so the icon holds until the visitor scrolls.
- **The full horizontal logo in points.** The words need many more points and turn to noise on a phone, and the
  corner logo already carries them. The points draw the icon only.
- **Bulb and iris echoes across the page.** Only the close's iris slot was kept, so the iris marks the start and the
  end, and every other act stays as signed.
- **A comp first.** Skipped for time. Slice 4 builds it directly and its PR is the owner's first look.

## Consequences

- Slice 4 builds the icon formation and the iris slot. The icon is second in the cut line, after bloom; its fallback
  is the signed hero and today's posters. The iris slot goes with the per-cut formations.
- The hero posters are rebaked from the icon formation. `og.png` keeps its frame.
- Comments in the slice 1 to 3 code that cite "the iris rule" (`cloud.ts`, `World.tsx`, `Poster.tsx`,
  `DeptIcon.tsx`) now describe a design choice, not a charter rule.
