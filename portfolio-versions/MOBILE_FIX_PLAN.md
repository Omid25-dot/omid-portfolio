# Mobile fix plan — portfolio "Chapters" homepage (6 November 2026)

Scope: root `index.html` only (personal portfolio, not the rental app). Goal: on phones the page should load cleanly and animate as smoothly as on desktop, and the "Tilt for full view" banner should stay put.

## Reported problems
1. Scrolling fast on a phone makes the "Tilt for full view" banner jump from the bottom of the screen to the middle.
2. The page loads and animates noticeably worse on a phone than on desktop.

## Causes found in the code

### Banner jump
- `#tilt-banner` is `position: fixed; bottom: 1.25rem` with a `transform: translateX(-50%)` that is also animated by `banner-in` (`both` fill). On iOS Safari and Chrome Android, the browser toolbar collapses and expands during a fast scroll, which resizes the visual viewport. Fixed `bottom` elements are re-anchored late, so they visibly jump.
- Each toolbar change also fires `resize`, which runs the expensive `buildTrace()` (see below). The main thread is blocked mid-scroll, so the banner's repositioning paints late, and in the wrong place.
- The banner has no reason to stay on screen while scrolling: it's a one-time hint.

### Mobile jank and poor loading (most expensive first)
1. **Trace rebuild on every viewport change** (`index.html` ~lines 728–731): `resize` and `ResizeObserver(document.body)` both call `buildTrace()`. That re-measures the sections, rewrites the SVG and samples the path with `getPointAtLength` every 4px, which is about 1,500 calls on a 6,000px phone page. On phones `resize` fires constantly as the toolbar shows and hides, so this runs during scrolling.
2. **Per-frame font re-layout.** The name letters change `font-variation-settings` every frame while the hero is visible, even after the intro has finished and nothing is moving (`nameLoop`, ~line 540). Each change re-shapes text. On scroll, the `h2.stretch` headings change `wdth` too, so large text is relaid out on every scroll frame. `will-change: font-variation-settings` (line 109) doesn't help and wastes memory.
3. **Fonts not ready when the intro plays.** `introStart = performance.now() + 150` (line 534) starts the letter sweep before the large variable font *Anybody* arrives on a slow mobile connection. The sweep plays in a fallback font, then everything swaps. That font swap also triggers the `ResizeObserver` rebuild.
4. **Always-running loops on touch devices.** The custom cursor's rAF loop (line 491) runs forever although the cursor is hidden on touch. The chip loop also keeps scheduling frames while `.hero-right` is hidden in portrait.
5. **ElectricBorder bundle loads on phones** (line 761). React plus a canvas animation are downloaded and started for a terminal that is `display: none` in portrait.
6. **Expensive paint effects:** `backdrop-filter: blur(14px)` on the nav, which repaints over changing colours; the full-screen `clip-path` flood running at the same time as the nav blur; and `filter: brightness()` and large box-shadows on the sticky cards, still applied on mobile.

## Fix steps

### 1. Banner (problem 1)
- Show it only on the first screen: fade it out on the first scroll past ~80px or after 5 seconds, whichever comes first. Then remove it (`display:none`) and never show it again during that visit.
- Centre it without transforms: `left: 0; right: 0; margin-inline: auto; width: max-content;`. The animation should only touch `opacity` and `translate` (a separate property from `transform`).
- Use `bottom: calc(1rem + env(safe-area-inset-bottom))`, and add `viewport-fit=cover` to the viewport meta.
- Fixing step 2 below also removes the main-thread stalls that make it jump.

### 2. Stop rebuilding the trace on toolbar resizes
- Rebuild only when the **width** changes, or when the document **height** changes by more than ~40px. Debounce with a 150ms trailing timeout instead of calling synchronously.
- Replace `ResizeObserver(document.body)` with one rebuild after `document.fonts.ready` and one on `load`. If kept, observe only the content wrapper with the same width/height threshold.
- Sample the path every 8px on screens ≤900px wide (halves the cost; the line still looks identical).
- Use `innerHeight` captured at rebuild time (or `document.documentElement.clientHeight`) for the "head at 60%" maths, so the toolbar collapsing doesn't make the head jump.

### 3. Cut per-frame font work
- `nameLoop`: stop scheduling frames once the intro is done, unless the scroll position changed or the pointer moved (track a dirty flag; scroll and pointermove set it). On touch devices skip the proximity code entirely (`matchMedia('(hover: none)')`).
- Only write a letter's CSS variables when the value changed by more than 0.5 (wdth) or 5 (wght) since the last write.
- Remove `will-change: font-variation-settings`.
- Headings on phones: animate the stretch only once as they enter (IntersectionObserver plus a 600ms CSS `transition` on `font-variation-settings`), not on every scroll frame. Keep scroll-scrubbing on desktop.
- Hero name swap on phones: quantise `heroP` to ~20 steps and transition between them with `transition: font-variation-settings .15s linear`, so each frame does less layout.

### 4. Load sequence
- Add `<link rel="preload" as="font" crossorigin>` for the Anybody file if a stable URL is available. Otherwise, before starting the intro, keep `font-display: swap` and wait for `document.fonts.load('800 1em Anybody')` with a 1.2s timeout.
- Hide the name (`opacity:0`) until the font is ready or the timeout passes, then play the sweep. If the timeout wins, show the name statically with no sweep, to avoid a double animation.
- Run one `buildTrace()` after the font has loaded, not before and after.

### 5. Don't run what isn't visible
- Custom cursor loop: don't start it on `(hover: none), (pointer: coarse)`. On desktop, stop the loop when the ring has caught up with the pointer and restart it on `pointermove`.
- Chips: don't start the loop while `.hero-right` is hidden, and pause it while the hero is offscreen (cancel the rAF, don't just skip the work).
- ElectricBorder: load the script only if `.hero-right` is displayed (`matchMedia('(min-width: 901px), (orientation: landscape)')`), by injecting the `<script>` from JS. If it's already loaded, make sure the canvas pauses offscreen (`paused` prop or IntersectionObserver).

### 6. Lighter paint on phones (≤900px)
- Nav: drop `backdrop-filter` and use a solid `background: var(--bg)` with a 1px border.
- Cards: no `filter`, a smaller shadow (`0 -8px 20px rgba(0,0,0,.15)`), and no `transform: scale()`, which is already disabled in JS. Remove the property entirely on mobile.
- Flood: keep it, but run `clip-path` on a layer with `will-change: clip-path` only during the animation (add it before the animation starts, remove it on finish). 700ms duration on phones.
- Add `contain: paint` to `.chapter` sections and `content-visibility: auto` with `contain-intrinsic-size` to sections below the fold. Check that this doesn't break the trace node positions; if it does, skip `content-visibility`.

## Verification
1. Start the preview (`portfolio` in `.claude/launch.json`). In the browser pane, use the mobile preset (375×812), and **front the tab** before testing (background tabs pause rAF, which looks like a bug but isn't).
2. Check that after the intro and a 2-second idle, no rAF loop is running: wrap `requestAnimationFrame` with a counter, idle 2s, and the count should stay flat.
3. Simulate toolbar resizes by resizing the viewport height 812↔740 several times. `buildTrace` must not run (add a temporary counter), and the banner must stay at the bottom.
4. Scroll quickly top to bottom with scripted jumps. The theme must be correct at every chapter (reuse the earlier sweep script), with no console errors and no horizontal overflow.
5. **Real phone test (the important one):** the Node preview server listens on all interfaces, so on the same Wi-Fi open `http://<Mac's local IP>:8765` on the phone (find the IP with `ipconfig getifaddr en0`). Fling-scroll the page and confirm the banner stays put or fades out, and that scrolling feels smooth.
6. Desktop regression at 1400px: the name swap, heading stretch, flood and stacking cards still behave as before.
7. Update `docs/IMPLEMENTATION_STATUS.md` with a dated entry and add a line to `portfolio-versions/README.md`. Save the pre-fix `index.html` to `portfolio-versions/before-mobile-fix-2026-11-06/` first. Don't commit or deploy unless Omid asks.

## Execution notes (6 November 2026, Sonnet)
All steps 1-6 implemented in root `index.html`. Deviations from the plan: `content-visibility`/`contain: paint` were skipped on purpose (they would make section heights depend on rendering state and misplace trace nodes); heading heights are now reserved at their widest wrap (`reserveHeadingHeights`) because verification showed scroll-linked heading wrapping moved sections and misaligned the trace by 85-171px on desktop. Real-phone testing (step 5 of Verification) is still outstanding.
