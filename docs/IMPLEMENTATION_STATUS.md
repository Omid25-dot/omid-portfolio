# Implementation status

Last updated: 17 September 2026.

## Current phase

**Phase 1 — runnable application foundation and security layer: code complete and verified against the configured hosted development services; final email/browser acceptance remains manual.** Phase 2 has not started. This is not a completed rental application, and PRODUCT_SPEC §§91–92 remain the full-build acceptance criteria.

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

## Completed functionality

- Runnable Next.js App Router application with exact dependency versions, a lockfile, Node 24 target, TypeScript, Tailwind, ESLint, development/production scripts and safe baseline headers.
- Separate Supabase browser, authenticated server and server-only service-role helpers. Routine actions retain user/RLS scope. No secrets are committed and missing configuration does not fabricate connectivity.
- Signup, email confirmation, login, local logout, forgot-password, signed recovery-grant flow and password update through Supabase Auth APIs. Supabase cookie refresh is implemented in `proxy.ts`; protected pages/actions independently call `getUser()` and read the current database profile.
- Minimal public home, auth pages, `/account`, `/admin`, `/setup`, `/forbidden`, loading/error/not-found states. Account profile edits and guarded admin actions are functional code paths. No fake operational metrics or dead rental CTAs.
- `requireAuthenticatedUser`, `requireRole`, `requireAdmin`, `requireSuperAdmin`; customer/staff/admin/super-admin role model; active/restricted/suspended status model. Suspended users cannot access account pages; restricted users can view/edit permitted account fields but cannot perform administrative actions.
- Schema validation for auth, confirmation/recovery, profile edits, role changes, pagination, UUIDs and basis points. UI controls and errors use reusable primitives/tokens.
- Upstash Redis REST limiter with atomic counters, HMAC identity keys and fail-closed configuration/provider handling. Privileged RPCs additionally use private PostgreSQL counters against direct Data API bypass.
- Private transactional audit foundation, a working admin access-review action, and a super-admin role-change action with confirmation, server/SQL permission checks, actor/target locks, self-change prohibition and atomic before/after audit records.
- Clearly marked development categories, Glasgow service area/depot, an internal demo third-party owner and settings. No large equipment inventory or Auth users/passwords seeded.

## Files and modules added or changed

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

## Database migrations and permissions

1. `202609170001_foundation.sql`: creates 10 public tables: profiles, categories, service_areas, locations, owners, equipment, equipment_images, equipment_specifications, platform_settings, audit_logs. Includes UUIDs, timestamps/triggers, Auth profile creation/backfill, ownership/money/status checks, foreign keys, uniqueness/indexes, RLS and explicit grants. Auth metadata cannot supply roles/status.
2. `202609170002_privileged_actions.sql`: private transactional audit helper, authenticated role-change/access-review functions, private distributed mutation counter table/function. RPCs check current active roles; callers cannot supply arbitrary actor IDs or audit payloads.

All public tables and the private counter table have RLS. Anonymous users can read active categories only. Customers read their own profile and update only first name, last name and phone. Column grants prevent role/status/ID changes. Staff have operational read scope; owners/audit are admin/super-admin only; settings are super-admin only. Direct domain writes are deliberately server/DB-admin-only until audited feature mutations are added. No public equipment projection or owner-facing routes exist. Equipment ownership data is not exposed to customers, including direct API reads. Exact matrix and reasoning are in ARCHITECTURE.md.

The Supabase CLI migration directory is a symlink to `database/migrations`; no duplicate migration source exists. Hosted migrations and policies are verified. Docker-based local Supabase remains unverified because Docker is unavailable on this host.

## Tests/checks and evidence

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

## Recommended Phase 2

After the remaining email/browser checklist is accepted, implement **Phase 2: database/domain model completion** in PRODUCT_SPEC §90 order: reservation/availability and booking models, legal state-transition rules, immutable financial/ownership snapshots, remaining supporting constraints/RLS/indexes and concurrency tests. Establish the future safe public equipment projection without exposing owner fields. Finalise date/hold and pricing-policy assumptions before those domains are used.

The database model can prepare later payment/verification/delivery/inspection/payout records, but do not start their customer workflows or marketplace functionality automatically. Equipment catalogue, details and search follow the domain model as separate authorised phases.
