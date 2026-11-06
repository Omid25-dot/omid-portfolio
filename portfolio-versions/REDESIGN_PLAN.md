# Portfolio redesign plan — "Chapters" (6 November 2026)

Scope: the personal portfolio at the repository root `index.html` (omidmerati.com). This is NOT the rental application — do not touch `app/`, `lib/`, `components/`, `supabase/` etc.

## Why the current site reads as "AI slop"
- Cream `#f4f1eb` background + near-black sections with one acid-lime accent (`#e8ff47`) — the two most common generated palettes.
- ALL-CAPS tracked mono labels everywhere, "01 — FEATURED" numbering on non-sequential content, middle-dot meta strings.
- A hover "pop" (translateY + scale 1.04) on almost every element; fade/slide reveals on every section.
- Scroll effect is a pastel hue-rotate + faint ribbons — motion with no idea behind it.

## Concept
The site is Omid's world: Glasgow, Python, Raspberry Pi. The page is a **circuit board you scroll down**. One memorable idea, everything else quiet.

### Signature scroll animation (the one bold thing)
1. A **circuit trace** (SVG path, PCB-style vertical line with 45° jogs between sections) runs down the left gutter of the entire page.
2. It **draws itself with scroll** (stroke-dashoffset); a glowing head sits at ~60% of viewport height.
3. Each section has a **node** on the trace next to a small filename label (`~/omid.py`, `about.py`, `projects/`, `skills.txt`, `contact.sh`).
4. When the head reaches a node, the node lights/pulses and the **new chapter colour floods out of that node** as an expanding circle (`clip-path: circle()` via Web Animations API, ~950ms, `cubic-bezier(.65,0,.25,1)`). Works in reverse when scrolling up.

### Supporting motion
- **Kinetic name** (variable font Anybody, `wdth` 50–150, `wght` 100–900), letters split into spans:
  - Page load: letters sweep from condensed/thin to final shape, staggered 70ms.
  - Scroll through hero: "Omid" goes wide/heavy → condensed/light, "Merati" the opposite (they swap).
  - Pointer proximity: letters within ~220px swell (wdth +22, wght +220).
- **Section headings stretch** from wdth ~52 to ~118 as they rise into view (scroll-linked).
- **Projects: sticky stacking cards** — each card sticks below the nav (offset by index × 22px); the card underneath scales to 0.94 and dims as the next slides over. Disabled ≤900px.
- Skill bars fill scroll-linked, ending in a "solder pad" dot.
- Contact: huge "Let's build something" background text slides horizontally with scroll.
- Keep: custom cursor (now uses `var(--fg)`), roaming hero chips, ElectricBorder terminal, button accent wipe from pointer entry point, project-card pointer glow.
- Remove: hover pop-scale on everything, ambient-gradient background, scroll-scene ribbons (asset files stay on disk, just not linked).

## Tokens

### Colour chapters (each section is its own world; one set of vars swapped on `<html data-theme>`)
| Chapter | Section | bg | fg | muted | accent | Why |
|---|---|---|---|---|---|---|
| chalk | Hero | `#eceefb` | `#17153b` | `#55537a` | `#4b45d6` | cool, clean start |
| sandstone | About | `#efc4b1` | `#2a1420` | `#6e4048` | `#a3263a` | Glasgow red sandstone tenements |
| clyde | Projects | `#17153b` | `#eceefb` | `#a3a6cf` | `#8f9bff` | the Clyde at night |
| leaf | Skills | `#cdebc4` | `#12301f` | `#3f6150` | `#c2185b` | Raspberry Pi board + raspberry |
| sodium | Contact/footer | `#ffb547` | `#241503` | `#6b4a12` | `#17153b` | Glasgow sodium streetlamps |

Also per theme: `--line` (fg at ~16–20% alpha) and `--card`. Terminal stays ink `#17153b` with cyan electric border `#7df9ff`.

### Type
- **Anybody** (variable wdth+wght) — name, headings, numbers. Width is the expressive axis.
- **Hanken Grotesk** 400/500/600 — body, nav, UI. Sentence case, no all-caps labels.
- **JetBrains Mono** — only real code: terminal, code snippet in featured card, filename labels.
- Google Fonts URL: `family=Anybody:wdth,wght@50..150,100..900&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500`

### Layout
```
| gutter 72px (34px mobile) | content, left-aligned, max ~1160px          |
|  ● ~/omid.py              | OMID (huge, wide)                             |
|  │                        | Merati (huge, condensed, accent) dev [v1.0]   |
|  │                        | description + CTAs      | terminal + chips    |
|  ╲ jog                    |                                               |
|  ● about.py               | H2 stretch / text + tags | facts + now-building|
|  ● projects/              | H2 / sticky stacked cards                     |
|  ● skills.txt             | H2 / 3 columns / proficiency bars             |
|  ● contact.sh             | H2 / copy / pill links  (marquee text behind) |
```

## Implementation notes (gotchas)
- No-JS fallback: `<script>` in `<head>` adds `.js` to `<html>`. Without it, each `[data-chapter]` section paints its own bg/fg; trace hidden.
- Theme vars selector: `:root[data-theme="x"], html:not(.js) [data-chapter="x"]` — never put vars on sections when JS runs, or section text won't follow the global theme.
- Sections must be transparent; `<html>` carries the background. `.flood` is `position:fixed; z-index:-1` and paints above the root background.
- Flood sequence: read current `<html>` computed bg → pin it inline with `transition:none` → set `data-theme` (fg colour transitions with 0.3s delay) → set flood bg to new colour (JS map `BG`) → animate clip-path → on finish clear inline styles. If a new chapter fires mid-flood, cancel and commit first.
- Trace geometry rebuilt on load, `document.fonts.ready`, resize and `ResizeObserver(document.body)`. Sample path every 4px into `[len,x,y]`; binary-search by y for drawn length.
- One rAF-throttled scroll handler drives trace, heading widths, card scale, bars, marquee. Name loop runs only while hero is intersecting — guard against starting two loops.
- ElectricBorder bundle mounts on `.hero .terminal` — keep that class/structure.
- `prefers-reduced-motion`: no load sweep, no flood animation (instant theme change with 0.5s colour transition), no pulses. Scroll-linked drawing is fine.
- Mobile ≤900px: hide hero-right and nav links, single columns, hide project code art, no card scaling.

## Status of the draft
A first pass of all of the above is already written in root `index.html` (by Opus, unverified in a browser beyond a static snapshot of the hero). Previous homepage saved at `portfolio-versions/before-chapters-2026-11-06/index.html`.

## Remaining steps for the executor
Decision (Omid, 6 Nov): **finish the existing draft in root `index.html`** — do not restart from the backup. Fix and tune what's there.

1. Start the local server: `preview_start` with name `portfolio` (`.claude/launch.json`, port 8765). Open `http://localhost:8765/`.
2. Desktop (1400×860): check console for errors; scroll through every chapter and confirm the trace draws, nodes pulse, flood expands from the node in both directions, text colours stay legible during floods.
3. Tune the hero name so neither line overflows at 1280–1440px (adjust `font-size` clamp or the `shape` wdth values in JS).
4. Check stacked cards: sticky offsets clear the nav, dimming looks right, last card isn't cut off.
5. Mobile (375×812): no horizontal scroll, trace in the narrow gutter, readable everything.
6. Emulate reduced motion and confirm content is fully visible and nothing animates on its own.
7. Add a line to `portfolio-versions/README.md` and a dated entry in `docs/IMPLEMENTATION_STATUS.md` (personal portfolio, rental app unchanged, not deployed).
8. Don't commit or deploy unless Omid asks.

## Design plugins found (Anthropic plugin directory)
- **frontend-design** (Anthropic) — already used for this plan; enable it in Sonnet's session too.
- **audit-suite** (community) — includes `web-animation-design`, `make-interfaces-feel-better`, `emil-design-engineering`; good for a polish pass on the animation timing.
- **Design** (Anthropic) — design critique, accessibility review, Figma connector.
- **Modern Web Guidance** (Google Chrome) — up-to-date CSS/scroll-driven-animation best practices.
