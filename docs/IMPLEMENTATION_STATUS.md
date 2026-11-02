# Implementation status

Last updated: 31 October 2026.

### Personal portfolio update — 2 November 2026

Explicitly requested work on the separate legacy personal portfolio (`index.html`, omidmerati.com), not the rental application. Added a midnight violet / coral / mint theme, native animated colour ribbons and grain inspired by React Bits Color Bends and Grainient, gradient typography and buttons, and cursor-following project highlights. No React Bits code or new dependencies were imported. Retained the original trailing cursor, hover pops and scroll reveals; cursor activation now follows actual mouse input instead of a viewport-width cutoff, with native pointer fallback for touch. Added click ripples, reduced-motion defaults and an explicit play/pause control; suspended decorative motion when the hero is offscreen. Updated the portfolio footer's language labels to match its HTML/CSS/JavaScript source. Mobile now shows the terminal and wraps contact links.

Validation: inline JavaScript passed `node --check`; browser checks found no page console errors, verified custom cursor visibility and running gradient state, and confirmed no horizontal document overflow at 1280px and 390px. Reviewed the theme in the browser, tested the motion control, and opened a standalone local copy for review. No GitHub push or production deployment was performed. Rental application implementation and phase boundaries were unchanged.

Follow-up colour/scroll refinement: replaced the warm coral palette with consistent midnight blue, periwinkle and ice-blue accents, following the user's MagicPattern, uiGradients, Gradient Hunt, CSS Gradient, Grabient and Realtime Colors references. The About phrase “actually work” now uses a legible ice-blue/lavender gradient instead of orange. Soft mesh washes extend through About, Skills, Projects and Contact. Added staggered blur/lift reveals, subtle hero parallax and a navigation reading-progress line. Reveals run once so previously read content stays visible. Scroll remains native; updates are scheduled once per animation frame. Pause/reduced-motion mode removes blur, movement and hidden content while retaining the progress indicator. Browser verification confirmed changing scroll progress/parallax, the exact new headline gradient, no console errors, no horizontal overflow at 390px/default width, and readable paused content. Inline JavaScript syntax and whitespace checks passed. The local preview was refreshed; no production deployment was performed.

### Personal portfolio glyph-rain experiment — 2 November 2026

Saved an exact copy of the current portfolio at `portfolio-versions/blue-violet-scroll-2026-11-02/index.html`, with restoration notes in `portfolio-versions/README.md`. The root personal `index.html` remains unchanged by this experiment. Reviewed the official React Bits Pro installation/Terminal Rain documentation; no licence key was configured. The user explicitly selected an independently authored falling-glyph alternative, so no Pro component, registry configuration, licence or dependency was installed.

Created a separate full-page portfolio experiment at `portfolio-versions/terminal-rain-preview/index.html` with `glyph-rain.js`. The original canvas effect includes two layers of blue/lavender glyph trails, pointer-local slowing and click cascades, while preserving the portfolio's cursor and scroll effects. Decorative drawing stops on pause, offscreen and hidden-tab states; resizing scales the canvas with a capped pixel ratio. Existing reduced-motion defaults remain effective. JavaScript syntax checks and browser visual checks passed; there were no page console errors and no horizontal overflow at default/390px widths. The original saved source was verified byte-for-byte against the current root source. A separate local browser preview was opened; no GitHub push or deployment was performed.

## Current phase

### Personal portfolio interactive background — 2 November 2026

Added the user-requested interactive background to the restored live-design personal homepage, retaining original content/typography, existing layout and ElectricBorder. `portfolio-assets/ambient-gradient/background.css` and `background.js` implement an original pastel aqua/lavender/lime mesh with five decorative code/geometric elements, damped cursor parallax and click colour ripples. Decorations ignore pointer hit testing and are hidden from assistive technology. Added a background-only play/pause control, respected reduced-motion defaults, suspended background animation in hidden tabs and stopped pointer updates once settled. A pre-change root snapshot is in `portfolio-versions/live-electric-before-gradient/index.html`; other saved versions remain intact.

Verification: JavaScript syntax and whitespace checks passed. Browser checks confirmed running background state, nonzero cursor parallax, pause resetting offset to zero, five background decorations, and no document overflow at default/390px widths. No page console errors were reported. Opened a local preview of the same root HTML/assets. No deployment, rental app, database or package/lockfile change was made.

### Personal portfolio live-design correction — 2 November 2026

The user clarified that “original website” means the design actually live at omidmerati.com, not the saved blue/violet redesign. Downloaded the public HTML and saved it verbatim at `portfolio-versions/live-original-2026-11-02/index.html`. Restored that cream/black/lime design and original page content in root `index.html`, adding only terminal-specific integration CSS and local bundle references. Used the user's supplied React Bits ElectricBorder source in `portfolio-versions/live-electric-terminal/` and the compiled assets in `portfolio-assets/electric-border/`. The existing terminal node is moved into the React wrapper to retain original content, observers and cursor event handlers. Added a terminal-local play/pause control and a static reduced-motion border. No glyph rain or ParticleText is included. Prior experimental versions and saved designs remain available.

Validation: component build and browser shader compilation passed, with no page console errors. Visually checked the cream live design with the animated border on desktop and exercised the border control and terminal click. The original live mobile behaviour (terminal hidden below the existing breakpoint) is preserved. The local page is ready for review; no GitHub push, Cloudflare deployment, rental application change or dependency/lockfile update was performed.

### Personal portfolio ParticleText preview — 2 November 2026

Integrated the user's pasted JavaScript/CSS React Bits `ParticleText` component into a separate `portfolio-versions/particle-text-preview/` version. Two React instances render Omid/Merati with Syne and existing blue/lavender colours, pointer repulsion, hover gathering and click bursts. Added local `paused` and `onReady` integration props plus left-aligned sampling; the portfolio retains a semantic text heading and visual fallback until canvas sampling finishes. The preview's existing play/pause button controls both particles and glyph rain, with reduced-motion defaults. Bundled the supplied JSX and existing installed React/React DOM through esbuild, preserving dependency licence comments; no package/lockfile or rental application code was changed. The original gradient backup, root portfolio and preceding rain experiment were preserved.

Verification: build completed; browser rendered both canvases and reported sampling-ready state, no page console errors, and no horizontal overflow at default/390px widths. Exercised the play control and canvas click interaction. The independent preview is open locally; no push or production deployment was performed.

Personal portfolio experiment follow-up (2 November): added scroll-linked, word-by-word heading emphasis and alternating lift/slide/rotation entrances for project cards in the separate glyph-rain preview. Existing progress/parallax remains native and motion can be paused. The saved gradient version and root personal HTML were preserved. Browser checks verified 13 heading word spans, the retained blue/lavender text gradient, changing reading progress, no horizontal overflow at the current browser width, and no console errors. Inline JavaScript syntax passed. The official free React Bits library and paid Pro installation options were checked; no paid dependency was installed.

**Phase 4 — authenticated unpaid booking requests and customer management implemented and verified.** Phase 5 has not started. Phase 1's actual confirmation/recovery email acceptance remains outstanding. This is not a completed rental application; PRODUCT_SPEC §§91–92 remain the full-build acceptance criteria.

### Phase 4 visual redesign — 31 October 2026

Applied the approved redesign brief to the existing Next.js rental application, retaining the configured Rentora brand and Phase 4 boundary. Existing in-progress Phase 4 work was preserved; legacy root HTML was not edited.

- Rebuilt the homepage composition with a deep-green equipment-led hero, warm neutral surfaces, stronger typography, functional search and numbered category rows. Search precedes the fleet illustration in the mobile reading/focus order. Categories and inventory still come exclusively from the existing public database projections; existing demo illustrations and labels remain honest placeholders.
- Refined shared catalogue cards, prices, forms, quote panels, account/request summaries, footer and responsive spacing through central CSS tokens. Updated authentication layouts with a browsing route and explicit unpaid-request context. Improved mobile input text sizes, date-field sizing and sticky-bar footer clearance. Fixed narrow-screen equipment-detail grid overflow discovered during browser QA.
- Added a small reusable SVG icon component with selected Lucide paths and retained licence notices in `docs/THIRD_PARTY_NOTICES.md`. Reviewed the brief's Lucide, React Bits, Aura and GetLayers references; no animation, gradient or component-library dependency was needed. No new runtime dependencies were added.
- Mobile navigation closes on selection and Escape, restores focus to the summary on Escape, and includes My bookings for signed-in users. Desktop gains a My bookings link where space permits. Existing server-verified admin visibility and all authorization boundaries remain unchanged.
- No database migration, service/provider change, payment, Identity, operational approval, owner-facing feature or Phase 5 work was introduced. Requests remain unpaid and subject to review. No deployment was performed.

Verification:

- All **45 unit/database tests** passed via `node --import tsx --test tests/unit/*.test.ts tests/integration/*.test.ts` (the npm/tsx launcher was blocked by local IPC permissions). All **10 HTTP security regressions** passed against the isolated, explicitly synthetic Auth fixture.
- TypeScript and the final production webpack build passed. The final build required outbound access to read the public catalogue during prerendering; an earlier restricted attempt failed that category fetch. Whitespace/diff checks passed. Lint was not run for this task.
- In-app browser QA at **1440px and 390px** covered the homepage, loaded demo images, keyword/postcode search, category navigation, empty results, equipment detail, sign-in layout, mobile menu selection/Escape and mobile date/quote controls. The detail-grid width issue was corrected and rechecked at 390px; checked public pages have no horizontal overflow. Authenticated booking mutations and actual recovery emails were not repeated in this visual task.
- Live quote submission displayed its fail-safe error and kept request continuation disabled. A read-only PING could not connect to the configured Upstash rate-limit endpoint, so no fresh live-quote or end-to-end booking success is claimed. The initial 127.0.0.1 preview also differed from the configured localhost origin; retrying at the configured origin did not resolve the provider failure. Provider credentials/configuration and domain services were not altered. Restore rate-limit service connectivity and rerun live quote/request acceptance before launch.
- Preview screenshots: `/tmp/rentora-redesign/home-desktop.png` and `/tmp/rentora-redesign/home-mobile.png`. Existing Phase 1 email acceptance, approved commercial policies and real equipment photography remain outstanding.

### Phase 4 completion and evidence — 19 September 2026

- A successful public collection quote now enables Request booking. `/booking/[slug]` requires authentication, preserves equipment/dates through a restricted local return URL, then rechecks equipment, availability and authoritative pricing. Delivery booking is disabled with explanation.
- Added review with contact name/phone editing, requirements, collection depot, exclusive-end dates/duration, amount/deposit breakdown and explicit unpaid-request acknowledgement. A 15-minute signed review binds the customer, selections, quote and random retry key. Request submission checks current identity/status, origin, Redis limits and signature before calling the guarded SQL wrapper around the Phase 2 engine.
- Creation remains atomic and REQUESTED. The actual persisted safe price snapshot is compared with the reviewed quote inside the transaction; stale prices roll back booking/history/audit and ask for refresh. Per-customer retry keys prevent duplicate-click/retry bookings. No payment, deposit authorisation or Identity success is recorded.
- Added private confirmation by random public reference, account overview, paginated/grouped My Bookings, own-booking detail/history and profile route. Explicit read projections omit owner/commission, internal notes, audit data and staff identity; knowing a reference never substitutes for ownership authorization. Equipment/collection/contact snapshots are recorded privately for new requests.
- Active customers may confirm withdrawal of their own REQUESTED booking only. It uses the extended existing transition service, releases the hold and writes history/audit. Approved/later requests require the team. No commercial refund rule was invented.
- Existing hold behaviour is unchanged: expired holds cease blocking availability; UI identifies expiry even before cleanup and states the hold deadline in UK time. Deployment scheduling of the service-only sweep remains outstanding.
- Signup/recovery preserve a safe one-hour same-browser continuation cookie; email confirmation/PKCE/password-reset handling revalidates it. Login/signup/recovery forms retain safe navigation. Actual email delivery/link acceptance remains manual. Private booking/account/auth pages are explicitly noindex; public SEO configuration is unchanged.

Routes: `/booking/[slug]`, `/booking/confirmation/[reference]`, `/account`, `/account/bookings`, `/account/bookings/[reference]`, `/account/profile`. Auth pages, public quote CTA, help/how-it-works copy and account/navigation layouts were updated. No admin operations, payment, Identity, inspection, payout, owner portal or P2P feature was built.

Modules: `lib/booking/{customer,customer-server,review-token}.ts`, `lib/auth/continuation.ts`, `services/customer-booking-actions.ts`, `components/booking/customer-view.tsx`; updated safe redirect policy, auth actions/callback, reusable forms/shell and responsive styles. Added unit/database tests, two HTTP route tests, and `scripts/verify-customer-booking-hosted.mjs`.

Migration: `20260919121806_customer_booking_flow.sql`, created with the pinned CLI, passed local migration tests and a clean hosted dry run, then applied to linked development. It adds deny-all-RLS `private.customer_booking_requests`; authenticated collection/request/list/detail/cancel functions; and a narrow REQUESTED-only customer branch in the existing transition service. No public table grants or owner access were expanded. No Phase 4 seed or external credentials were required.

Checks passed:

- TypeScript and ESLint.
- Production webpack build with all expected routes.
- **45 unit/database checks**, including all Phase 1–3 tests, signed review tamper/user/expiry checks, continuation allowlist, stale quote rollback, retry deduplication, snapshot/projection validation, role/reference/privacy boundaries and permitted/prohibited cancellation.
- **10 HTTP security checks** using the labelled synthetic Auth fixture, including two new booking continuation/private-reference cases. This fixture is not claimed as live Supabase.
- **Hosted Supabase verification**: real Auth sessions, stale-price rollback, simultaneous identical retries producing one booking, different-customer reservation race producing exactly one winner, anonymous/financial-write denial, owner-safe projection, cross-customer reference/cancellation denial, history and audit.
- **Real Chrome at 1440px and 390px**: login continuation, review, changed-price rejection, equipment becoming unavailable before submission, real collection request/confirmation, account lists, cross-customer confirmation 404 and confirmed withdrawal. No horizontal overflow. Screenshots inspected in `/tmp/booking-screenshots`. Disposable users were programmatically confirmed for these tests; real signup/recovery email delivery was not exercised.
- Test-created equipment, bookings/history, users and public test images were removed. Redacted audit records remain. No production project was modified.
- Supabase security advisors ran after the migration. Findings are the two deliberately deny-all private tables, intentionally callable guarded definer functions (five anonymous public-read and seventeen authenticated APIs), plus the existing disabled leaked-password protection. No permissions were weakened to remove advisory findings; enable the Auth protection before launch.

Known limitations / remaining acceptance: real email confirmation/recovery and cross-device behaviour still need manual verification. Same-browser continuation expires after one hour; another device safely returns to Account. Demo imagery, depot, commercial/tax/cancellation rules and support configuration are not launch-ready. Current demo holds last 30 minutes; review tokens last 15 minutes. The cleanup scheduler remains unconfigured, so database status can lag expiry while availability is already released. Older Phase 2 records have no collection snapshot. Account grouping is within each 20-row page. Payment/Identity and operational approval tooling remain deferred; REQUESTED must never be treated as a confirmed paid hire.

### Phase 3 completion and evidence — 18 September 2026 (historical)

- Built `/`, `/equipment`, `/categories`, `/category/[slug]`, `/equipment/[slug]`, `/how-it-works`, `/delivery`, `/help`, `/policies`. Added responsive navigation with server-verified account/admin visibility, public footer, metadata/canonicals, loading/error/empty/reset states and mobile booking CTA.
- Added reusable containers, sections, cards, category icons, gallery, image fallback, search/filter forms, price/availability/no-review displays and quote summary. Existing brand configuration is reused. Original demo illustrations are deliberately labelled; no borrowed photographs, fabricated reviews or insurance claims.
- Catalogue is backed by PostgreSQL, filtered/paginated on the server with shareable URL state. Public projections exclude owner identity, ownership, commissions, private references and settings. No customer account is required to browse/check quotes.
- Anonymous availability reuses Phase 2's core. Collection quotes reuse authoritative SQL pricing; selecting dates does not create bookings. Delivery returns a clear quote-required state. Checkout is visibly disabled with an explanation.
- Applied `202609180003_public_catalogue.sql` after a clean hosted dry run. Added customer detail JSON, service-area postcode arrays, a catalogue index, restricted read RPCs and public-image Storage policy/bucket. Existing raw-table/RLS protections remain intact.
- Applied the safe demo seed and uploaded 12 original images to the dedicated prefix. Browser verification caught nonstandard deterministic seed UUIDs; corrected the seed and its disposable hosted records after checking that all 12 had zero bookings/blocks. Added response-schema validation to the database regression test. Rental-history foreign keys protect the cleanup.

Modules/files: `components/catalogue/*`, `lib/catalogue/*`, `services/public-rental-actions.ts`, public route directories, shared layouts/styles, `next.config.ts`, `.env.example`, `database/seed/phase3-development.sql`, `scripts/{seed-catalogue-images,verify-catalogue-hosted,verify-catalogue-browser}.mjs`, `tests/integration/catalogue.test.ts`, `tests/unit/catalogue.test.ts`, `tests/fixtures/storage.sql`, original `public/demo-equipment` artwork and local fallback. Existing database tests load the Storage fixture. AGENTS, architecture and setup were updated; PRODUCT_SPEC is unchanged.

Verification:

- All **37 unit/database checks passed**, including actual migrations, anonymous projection boundaries, hidden/maintenance exclusion, date conflicts/adjacency, authoritative quote/tampering, Storage isolation and Phase 1/2 regressions.
- TypeScript and ESLint passed. `npx next build --webpack` passed with all expected routes. All **8 existing HTTP security regressions passed** using the explicitly synthetic Auth fixture (account/admin/roles/recovery and privileged-action denial); hosted checks are separate.
- Hosted anonymous checks passed for catalogue/slug/category/keyword/postcode, availability, price, rejected total injection, private-table denial and 12 real public image responses. These checks used the anonymous key, not service-role access.
- Real Chrome automation passed at **1440px and 390px**: homepage/catalogue/category/detail, loaded images, no horizontal overflow, shared search parameters, collection quote, honest delivery error/no incomplete total and empty results. Screenshots are in `/tmp/catalogue-screenshots`. This does not replace Phase 1 actual email/recovery tests. In-app browser startup failed; installed Chrome succeeded.
- Supabase security advisors ran. Findings were the intentionally executable security-definer APIs (five anonymous and twelve authenticated), the private deny-all rate-limit table (informational), and disabled leaked-password protection. RPC permissions/search paths and result boundaries are covered by the tests. No RLS/grants were weakened to silence advisors. Auth leaked-password protection remains a pre-launch configuration task.

Remaining limitations: one demo image per item although ordered multi-image galleries are supported; replace illustrations with licensed product photography before launch. Reviews, checkout, payments/Identity, real delivery quoting, operations, inspections and payouts remain deferred. Catalogue postcode matching is area-level, not a delivery guarantee. Public image URLs are not revoked by unlisting. Direct public RPC traffic needs provider quotas/abuse monitoring; Redis guards application quote requests only. Real commercial settings, policies, support contact, hold scheduling and Phase 1 email acceptance remain outstanding. Development pages default to noindex.

### Phase 2 completion and evidence — 18 September 2026 (historical)

- Added immutable bookings with random public references, exclusive hire dates, financial/ownership snapshots, cancellation/hold metadata, status history and availability blocks.
- Implemented server actions and reusable validated pricing/availability adapters. PostgreSQL is the single authoritative pricing implementation and calculates amounts inside the booking transaction. Only equipment/date/fulfilment input is accepted, never client totals or actor/owner fields.
- Implemented complete state graph, guarded operational transitions, atomic history/audit and payment/inspection integration gates. Collection pricing is available. Delivery requires a real rule/manual quote and cannot silently become free delivery.
- Added GiST exclusion protection plus common equipment-row locking for booking/block writers. Expiring request/approval/payment holds release capacity opportunistically; a service-role-only sweeper is available for scheduled cleanup.
- Added RLS and explicit safe-column grants, protecting owner/commission/pricing JSON even from direct authenticated Data API requests. Customers cannot access other bookings/history, change totals or set arbitrary states. Operational conflict reporting preserves bookings affected by maintenance.
- Added explicit demo-only min/max hire, hold, service-fee and tax-policy settings. These are not approved production commercial terms. No equipment inventory, payment, verification, inspection, delivery or payout feature was added.

New/changed modules: `lib/booking/contracts.ts`, `lib/pricing/server.ts`, `lib/availability/server.ts`, `services/rental-actions.ts`; migrations `202609180001_rental_domain.sql` and `202609180002_operational_conflicts.sql`; `database/seed/phase2-development.sql` and the local Supabase seed configuration; `tests/integration/rental.test.ts`, `tests/unit/rental.test.ts`, `tests/hosted/rental-catalog.sql`, `scripts/verify-rental-hosted.mjs`. Existing database tests now load `btree_gist` and assert RLS on all 13 public tables. Phase 1 migrations and PRODUCT_SPEC are unchanged. AGENTS, architecture and setup guidance were updated.

Hosted verification: both migrations applied to the existing linked development project after separate clean dry runs. Final catalogue checks passed for RLS, policies, safe column grants, indexes, exclusion constraint and restricted function execution/search paths. The hosted script passed safe pricing, four simultaneous overlapping bookings (exactly one winner), back-to-back dates, cross-customer/owner-field denial, immutable snapshots, valid/invalid transitions, history/audit, maintenance conflicts, booking-versus-block concurrency and equipment-wide maintenance conflict reporting. Isolated fixtures were removed; audit records remain (deleted fixture actors become null by the existing foreign-key policy). No production project was modified.

Validation: `npm run typecheck` and `npm run lint` passed; `npx next build --webpack` passed. All **29 unit/database tests** passed, including the full state graph, actual SQL calculations, commission precedence, immutable snapshots, raw exclusion constraint, audit rollback, expiry and security regressions. All **8 HTTP security tests** passed using the existing synthetic-provider fixture. Hosted catalogue and live concurrency/permission assertions passed separately against real Supabase; embedded PostgreSQL is not claimed as concurrency proof. No interactive browser test was performed for this backend-only phase.

Remaining configuration/risks:

- Schedule the service-role-only `expire_booking_holds()` sweep for prompt idle-hold status updates. Booking acquisition remains protected without a scheduler and availability ignores expired holds.
- Approve actual hold duration, service fees, hire limits and tax treatment before trading. Current values are clearly marked development settings.
- CONFIRMED and COMPLETED transitions intentionally fail until authoritative payment/verification/inspection integrations exist. No fake successes or owner payouts are created.
- At Phase 2 completion, catalogue/UI remained deferred; the Phase 3 entry above supersedes that scope. Delivery quotations, buffers, Stripe/Identity and inspection/payout workflows remain deferred.
- Phase 1 real email delivery and browser recovery/persistence checks remain manual; no new browser UI was added in Phase 2.

### Live integration verification attempt — 17 September 2026

The required application and test variables passed non-secret structural checks, and the configured Supabase project URL matched the linked hosted development project. The migration dry run completed cleanly and listed only the two expected migrations. Both migrations were then applied, followed by the idempotent development seed. Hosted catalogue queries confirmed the migration history, tables, indexes, constraints, functions, grants, RLS enablement and policies. The `private` schema remains outside public Data API exposure. The intentionally absent Stripe webhook secret remains outside Phase 1.5.

A disposable user was created through the real hosted signup API. The Auth trigger created an active customer profile and ignored hostile role/status metadata. Real password login, token validation, client session persistence, logout and the recovery-token/password-update mechanism passed. Automated email confirmation used the trusted test harness because the address was disposable. A real recovery-email request was attempted, but the hosted provider returned `over_email_send_rate_limit`; no email-delivery pass is claimed.

Hosted RLS tests passed for anonymous, customer, staff, admin and super-admin access. Customers could neither read another profile nor access owners, audit logs, privileged settings or operational records; role/status writes and privileged RPCs were rejected. Staff received operational read access without finance/audit powers. Admin could read owners/audit and record a constrained access review, but could not read super-admin settings or change roles. The configured confirmed account was provisioned by the documented one-time trusted bootstrap. It can access `/admin`, and the bootstrap plus subsequent privileged role changes produced complete audit records. Disposable test users were removed.

The configured Upstash Redis service passed a controlled distributed-limit test: eight attempts were allowed, the ninth was denied, another identity remained unaffected, invalid credentials failed closed, and raw identity data was absent from keys. Temporary Redis keys were removed. Real Next.js route checks using hosted sessions confirmed anonymous account/admin redirects, customer account access, customer admin denial and super-admin admin access.

Live verification status:

| Area | Status |
| --- | --- |
| Phase 1 code | Complete; lint, type-check, production build, 15 unit/database tests and 8 HTTP tests pass |
| Hosted Supabase migrations/schema | Complete: clean dry run, two migrations applied, safe development seed applied, hosted catalogue verified |
| Hosted RLS/Data API | Complete for the Phase 1 anonymous/customer/staff/admin/super-admin matrix |
| Hosted Auth | Signup, profile trigger, login, token/session, logout and programmatic recovery verified; actual confirmation/recovery email delivery remains manual |
| Redis rate limiting | Complete: configured distributed provider, exhaustion/isolation, privacy and fail-closed behaviour verified |
| First super-admin | Complete through the intended trusted bootstrap; admin route and bootstrap audit verified |
| Manual browser/email checks | Pending: actual email delivery/link handling and browser interaction/session refresh across a browser restart |

The Phase 1 request explicitly extended the original roadmap to include initial categories, location/service-area, owner and equipment schema. Those migrations are included; no catalogue, booking, payment, Identity, delivery, inspection, payout or marketplace feature was implemented.

## Phase 1 completed functionality (historical record)

- Runnable Next.js App Router application with exact dependency versions, a lockfile, Node 24 target, TypeScript, Tailwind, ESLint, development/production scripts and safe baseline headers.
- Separate Supabase browser, authenticated server and server-only service-role helpers. Routine actions retain user/RLS scope. No secrets are committed and missing configuration does not fabricate connectivity.
- Signup, email confirmation, login, local logout, forgot-password, signed recovery-grant flow and password update through Supabase Auth APIs. Supabase cookie refresh is implemented in `proxy.ts`; protected pages/actions independently call `getUser()` and read the current database profile.
- Minimal public home, auth pages, `/account`, `/admin`, `/setup`, `/forbidden`, loading/error/not-found states. Account profile edits and guarded admin actions are functional code paths. No fake operational metrics or dead rental CTAs.
- `requireAuthenticatedUser`, `requireRole`, `requireAdmin`, `requireSuperAdmin`; customer/staff/admin/super-admin role model; active/restricted/suspended status model. Suspended users cannot access account pages; restricted users can view/edit permitted account fields but cannot perform administrative actions.
- Schema validation for auth, confirmation/recovery, profile edits, role changes, pagination, UUIDs and basis points. UI controls and errors use reusable primitives/tokens.
- Upstash Redis REST limiter with atomic counters, HMAC identity keys and fail-closed configuration/provider handling. Privileged RPCs additionally use private PostgreSQL counters against direct Data API bypass.
- Private transactional audit foundation, a working admin access-review action, and a super-admin role-change action with confirmation, server/SQL permission checks, actor/target locks, self-change prohibition and atomic before/after audit records.
- Clearly marked development categories, Glasgow service area/depot, an internal demo third-party owner and settings. No large equipment inventory or Auth users/passwords seeded.

## Phase 1 files and modules (historical record)

| Area | Files/modules |
| --- | --- |
| Runtime | `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.npmrc`, `.nvmrc`, `scripts/dev.mjs` |
| Configuration | `.env.example`, `.gitignore`, `lib/config/public.ts`, `lib/config/server.ts` |
| Auth/infrastructure | `proxy.ts`, `lib/supabase/{client,server,admin}.ts`, `lib/auth/{recovery,recovery-token}.ts`, `services/auth-actions.ts` |
| Security | `lib/permissions/{policy,server}.ts`, `lib/validation/schemas.ts`, `lib/security/{origin,errors}.ts`, `lib/rate-limit/{core,server,errors}.ts` |
| Profile/audit | `services/profile-actions.ts`, `lib/audit/server.ts`, privileged SQL functions |
| UI | Root layout/styles/loading/error/not-found; public/auth/account/admin route groups; `components/ui/primitives.tsx`, `components/auth/{forms,shell}.tsx`, `types/forms.ts` |
| Database | Two timestamped migrations; `database/seed/development.sql`; `supabase/config.toml`, canonical migration symlink, confirmation/recovery email templates |
| Tests | `tests/unit/security.test.ts`, `tests/integration/database.test.ts`, `tests/e2e/{route-http,foundation}.spec.ts`, isolated Auth/session fixtures, `playwright.config.ts` |
| Knowledge | Updated AGENTS, README, ARCHITECTURE and this status file; added `docs/SETUP.md` |

The complete master PRODUCT_SPEC remains unchanged. Legacy tracked HTML/archive/editor files remain unchanged. No git commit was created.

## Phase 1 database migrations and permissions (historical record)

1. `202609170001_foundation.sql`: creates 10 public tables: profiles, categories, service_areas, locations, owners, equipment, equipment_images, equipment_specifications, platform_settings, audit_logs. Includes UUIDs, timestamps/triggers, Auth profile creation/backfill, ownership/money/status checks, foreign keys, uniqueness/indexes, RLS and explicit grants. Auth metadata cannot supply roles/status.
2. `202609170002_privileged_actions.sql`: private transactional audit helper, authenticated role-change/access-review functions, private distributed mutation counter table/function. RPCs check current active roles; callers cannot supply arbitrary actor IDs or audit payloads.

All public tables and the private counter table have RLS. Anonymous users can read active categories only. Customers read their own profile and update only first name, last name and phone. Column grants prevent role/status/ID changes. Staff have operational read scope; owners/audit are admin/super-admin only; settings are super-admin only. Direct domain writes are deliberately server/DB-admin-only until audited feature mutations are added. No public equipment projection or owner-facing routes exist. Equipment ownership data is not exposed to customers, including direct API reads. Exact matrix and reasoning are in ARCHITECTURE.md.

The Supabase CLI migration directory is a symlink to `database/migrations`; no duplicate migration source exists. Hosted migrations and policies are verified. Docker-based local Supabase remains unverified because Docker is unavailable on this host.

## Phase 1 tests/checks and evidence (historical record)

| Check | Result and scope |
| --- | --- |
| Exact dependency install and `npm ci` | Passed; lockfile reproduces installation; npm reported 0 known vulnerabilities |
| Dependency peer resolution | Passed after selecting TypeScript 6.0.3 rather than incompatible TypeScript 7 |
| Development server | Started and served HTTP 200; polling workaround resolves workspace watcher exhaustion |
| TypeScript | `npm run typecheck` passed |
| Lint | `npm run lint` passed with no source warnings/errors |
| Production build | `npm run build` passed and generated expected Phase 1 routes |
| Production startup smoke check | Passed: server started; public/auth pages returned 200; missing-config account/admin requests failed safely; security headers present |
| Client bundle boundary | Scanned generated client JavaScript: no service-role, Redis-token or HMAC-secret identifiers found |
| Repository/document checks | Required links resolve, exact versions pinned, canonical migration symlink resolves, all 92 specification sections retained, no tracked legacy-file changes |
| Unit + embedded PostgreSQL | 15 checks passed, including role/status matrix, tampering/redirect validation, recovery signatures/expiry, provider limiter failure, actual migrations/RLS/grants, ownership constraints, atomic audit rollback and direct-RPC throttling |
| HTTP application tests | 8 passed using the real Next.js server and explicitly synthetic Auth fixture; includes anonymous redirects, customer denial despite forged metadata, staff restrictions, super-admin UI, recovery grant gate, validation, fail-closed login and captured privileged-action rejection |
| Full browser suite | Present but blocked before test execution: bundled Chromium unsupported on this macOS; installed Chrome could not launch under the sandbox. No visual/mobile browser pass claimed |
| Hosted Supabase schema/RLS | Passed against the linked development project: migrations, seed, catalogue, grants, policies and role matrix verified |
| Hosted Supabase Auth | Passed for signup/default profile, password login, token validation, in-client session persistence, logout and programmatic recovery/password change; email delivery not passed because provider quota returned 429 |
| Hosted route enforcement | Passed with real hosted sessions for anonymous `/account`/`/admin`, customer account/admin denial and super-admin admin access |
| Hosted Redis | Passed controlled 8/9 exhaustion, identity isolation, HMAC-key privacy, provider failure and cleanup checks |
| Hosted audit | Passed bootstrap, three role transitions and access-review events; customer denial also verified |

Verification-task regression rerun on 17 September 2026: lint and type-check passed; all 15 unit/embedded-PostgreSQL checks passed through Node's test runner; all 8 HTTP route tests passed; and `npx next build --webpack` completed successfully with all expected routes. The default Turbopack build path was not needed for this verification because the production webpack build passed.

Embedded PostgreSQL tests execute the migration SQL against PGlite with a minimal `auth.users`/`auth.uid()` fixture. They do not test Supabase Auth, PostgREST deployment configuration, Docker or actual email delivery. HTTP fixtures deliberately simulate only test identity/profile responses and are isolated under `tests`; there is no application mock mode. Test limitations and the live acceptance checklist are in SETUP.md.

## External configuration still required

- Restore or raise the hosted Supabase Auth email-send quota, then manually verify delivery and actual confirmation/recovery links in same-browser and cross-browser flows. The API currently returns `over_email_send_rate_limit`.
- Run the concise browser checklist in SETUP.md, including refresh/reopen session persistence and visible customer/admin route behaviour. Automated HTTP route enforcement passed, but no interactive browser pass is claimed.
- Vercel project, domain/HTTPS, isolated production environment values and deployment workflow. Another host requires a reviewed trusted client-IP adapter; otherwise rate limits share one conservative source bucket.
- Storage buckets/policies, Stripe Payments/Identity, operational integrations and analytics remain future-phase work; no corresponding feature is advertised as functional.

## Known issues and security assumptions

- Hosted signup/login/logout, recovery mechanics, Redis behaviour and deployed database/API policies are verified. Actual email delivery and interactive browser recovery remain outstanding, so Phase 1 is not yet fully accepted for production use.
- Next.js uses streamed redirects on routes with loading boundaries; a response may initially be HTTP 200 with a redirect instruction, but protected content is never returned. Tests inspect the actual redirect/content, not only status codes.
- No real browser visual/accessibility/mobile interaction test completed in this host. The browser test suite should be run in supported CI.
- Full local Supabase startup could not be exercised because Docker is unavailable. The hosted CLI dry run/push and canonical SQL both passed.
- ESLint 9 is deprecated upstream but required by the current React lint-plugin peer range; tracked development-tooling upgrade remains. No known vulnerability was reported by npm in the checked dependency graph.
- Service-role/database-administrator credentials intentionally bypass RLS and must stay trusted/server-only. Ordinary app operations use user-scoped clients. Private RPC execution rights are explicitly restricted.
- Auth sessions use Supabase SSR cookie conventions; password recovery adds a short-lived signed HttpOnly cookie. Issued Supabase access tokens follow provider expiration behaviour after signout; no claim of instantaneous global access-token revocation.
- Baseline security headers are implemented; a full nonce-based script CSP and production logging/APM policy are not configured. Token/query redaction is required at the hosting/logging layer; Next request URL logging is disabled.
- Public brand uses a central environment configuration. Database platform settings and business-policy values are private; their future UI/read projections are not implemented.
- Demo rates/commissions/settings are not approved live commercial terms. Approval, hire-duration/buffer, cancellation, tax and deposit policies remain unresolved for later implementation.

## Recommended Phase 5

Follow PRODUCT_SPEC §90 with protected admin equipment management and booking-request review/approval workflows, including auditable operations and agreed hold handling. Approve commercial settings and schedule expiry cleanup. Payment/Identity should be a separately authorised integration phase after that foundation; never bypass the existing confirmation gates. Complete actual email/recovery acceptance before launch. Do not start Phase 5 automatically.
