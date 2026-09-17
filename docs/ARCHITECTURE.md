# Architecture

Status: Phase 1 runnable application and security foundation implemented locally. Hosted Supabase/Redis and full browser verification are outstanding. PRODUCT_SPEC.md remains authoritative. Booking, pricing, payments, delivery, inspections and payouts below are architectural contracts for future phases, not implemented features. See IMPLEMENTATION_STATUS.md for verified evidence and SETUP.md for configuration.

## Application shape

One modular Next.js App Router application deployed to Vercel, backed by Supabase PostgreSQL, Auth and Storage. React with TypeScript and Tailwind provides the interface. Stripe handles payments and Identity. This is a single managed rental business with internal equipment owners, not a multi-tenant public marketplace. Future owner access can be added to the ownership domain without exposing it in V1.

Use React Server Components for server-rendered catalogue/account/admin reads and small client components for interaction. Route handlers and server actions are thin entry points: validate with Zod, authenticate, authorise, rate limit, invoke a service and return a safe result. Route groups organise layouts; they do not secure routes by themselves. Every read/mutation must enforce its own permission boundary.

```text
Browser → Next.js routes / server actions → server services
                                         → domain rules
                                         → Supabase PostgreSQL / Auth / Storage
                                         → Stripe Payments / Identity
Stripe → verified webhook handler → idempotent transactional database updates
```

## Directory responsibilities

| Directory | Responsibility |
| --- | --- |
| `app/(public)` | Anonymous catalogue, equipment, category and informational routes |
| `app/(auth)` | Login, signup, recovery and auth callbacks |
| `app/(account)/account` | Customer `/account` pages; own records only |
| `app/(admin)/admin` | Staff/admin `/admin` operations with capability checks |
| `app/(booking)/booking` | Four booking stages; authentication enforced when required |
| `app/api` | External callbacks/webhooks and endpoints needing HTTP contracts |
| `components/ui` | Accessible shared controls, feedback and design tokens usage |
| `components/{equipment,booking,checkout,admin}` | Reusable product presentation |
| `lib/{pricing,booking,availability,delivery}` | Focused domain rules; no React dependencies |
| `lib/{supabase,stripe}` | Infrastructure adapters; separate browser-safe and server-only clients |
| `lib/{auth,permissions,validation,audit}` | Shared security, schemas and audit contracts |
| `lib/{config,rate-limit,analytics}` | Validated configuration, distributed limiter adapter, analytics boundary |
| `services` | Server-only use-case orchestration, persistence and provider calls |
| `types` | Explicit public/internal contracts and generated database types later |
| `database/migrations` | Canonical ordered SQL migrations, including constraints, grants, RLS and functions |
| `database/seed` | Explicitly marked development/demo database data |
| `tests/{unit,integration,e2e}` | Domain rules, real database/security/concurrency tests, browser journeys |
| `public` | Static application assets; inventory photography belongs in Storage |
| `docs` | Permanent specification, architectural decisions and implementation status |

Phase 1 populates auth/security/UI modules and minimal public/account/admin routes. Deferred feature directories retain `.gitkeep` only. `supabase/migrations` is a symlink to canonical `database/migrations`; Supabase CLI configuration references development seeds and email templates. No booking/payment schema or equipment catalogue UI is implemented.

## Runtime and dependencies

Exact versions are in package.json/package-lock.json: Next.js 16.3.5, React 19.3.0, TypeScript 6.0.3, Tailwind 4.3.3, Supabase SSR 0.12.7/JS 2.116.0 and Zod 4.6.5. Node 24 is the development target. TypeScript 6.0.3 and ESLint 9.39.5 were selected for compatible peer ranges: current TypeScript 7 exceeds the TypeScript-ESLint supported range, and the React lint plugin excludes ESLint 10. ESLint 9's upstream deprecation is a tracked tooling limitation; npm reports no known dependency vulnerabilities at verification time.

Next.js runs server services with the Node runtime. `proxy.ts` refreshes Supabase cookies; protected pages/actions independently verify identity with `getUser()` and load current profile permissions. The development launcher enables Watchpack polling after local EMFILE errors. `agentRules: false` prevents Next.js from modifying the project's authoritative AGENTS.md. TypeScript, lint, embedded PostgreSQL tests and HTTP route tests are configured; Playwright browser tests are present but environment-blocked here.

## Identity and access

Supabase Auth supplies verified identity; `profiles.id` references the auth user. Initial roles are customer, staff, admin and super_admin. Role changes use a privileged, audited operation; customer profile edits allow only explicit fields. Do not derive trusted roles from editable user metadata or request bodies. Sensitive server operations re-check current account status and permissions.

Use cookie-based server authentication with verified sessions, safe redirect handling and secure recovery/email verification. Apply origin/CSRF protections appropriate to cookie-authenticated mutations. Browser-safe Supabase credentials confer only RLS-limited access. Service-role credentials are server-only, limited to justified operations after explicit authorisation; ordinary reads should retain user/RLS scope.

RLS protects rows, not confidential columns. Keep internal equipment/booking rows inaccessible through unrestricted public table grants. Expose explicit allowlisted projections through controlled reads/views/functions and safe response types. Public catalogue output excludes owner IDs, ownership type, commission, serial/private details and financial metadata. Customer booking output likewise excludes owner snapshots and payouts. Verify that HTML, React payloads, APIs and direct database endpoints cannot leak these fields. Any privileged SQL function needs a fixed safe search path, restricted execution grants and explicit caller checks.

Use layered UI visibility, server permission checks, RLS/grants and database constraints. Inspection evidence, owner records, payments, payouts, audit records and private settings remain protected. Public access is limited to active categories, eligible public catalogue data/images and published reviews (§49).

## Database and domain boundaries

Use relational PostgreSQL tables listed in §46, UUID primary keys, foreign keys, checks, unique constraints, timestamps and query-driven indexes. Model equipment as an individually reservable asset for V1; quantity-based pooled inventory is not assumed. Ownership has COMPANY/THIRD_PARTY integrity constraints and internal owner references. Archive assets where history must survive.

Use `equipment_specifications` for structured attribute records (key, label, typed value/unit and order), not many nullable equipment columns. Add independent service areas, locations, delivery zones and postcode rules. Keep branding, commission hierarchy and policy configuration database-backed with restricted settings access.

Bookings own immutable commercial snapshots and status history. Separate payments, deposit transactions, verification metadata, deliveries, inspections/evidence, payouts, reviews and audit records. Supporting reservation, dispute and webhook processing records belong to their respective domains. Financial snapshots include ownership, rates, applied rules, tax where configured and totals; later adjustments create auditable movements rather than rewriting historical prices.

## Pricing and time

Authoritative pricing runs server-side using validated equipment/date/fulfilment inputs and persisted settings. Store GBP pennies as integers and commission as basis points; validate ranges and safe arithmetic. Define deterministic rounding before shipping calculations. Commission precedence is equipment override, then owner override, then global default. The commission base is equipment rental income only, excluding deposits and, by default, delivery, service fees and tax. Discount allocation and tax treatment must be explicitly settled before those rules ship.

Use SQL `date` for hire-date intent and `timestamptz` for instants. Initial operating/display timezone is Europe/London; locale is en-GB. Chosen date-range convention is half-open `[start_date, end_date)`, matching §10's 22–24 September = two days. Convert operational handover/return times server-side with timezone-aware rules, never by assuming every local day is 24 hours. Store timezone/rule context in snapshots where needed. Exact handover hours, minimum hire and turnaround policy remain business configuration decisions.

## Availability and booking transactions

Use a shared reservation ledger for booking holds and availability blocks, linked to their source records. Active time ranges use a PostgreSQL exclusion constraint on equipment and overlapping ranges. Transactional database functions lock the equipment row, check operational status and active reservations, calculate/validate persisted pricing inputs, then write reservation, booking snapshot and history together. All paths that reserve equipment or change availability must use the same locking/integrity discipline. Sequential independent HTTP database calls do not constitute a transaction.

Validate booking transitions against the §16 state machine and capability rules. Approval/payment-pending/confirmed/checked-out periods reserve capacity; the precise REQUESTED hold duration and expiry policy must be defined before booking implementation. A dispute must not automatically free equipment that is still out. Keep operational asset status separate from future date availability. Buffers can expand reservation ranges without changing the customer's billable dates.

Expired holds must be released by an idempotent scheduled process and transactionally re-evaluated when acquiring capacity. Maintenance must prevent new hires and flag existing affected bookings without silently cancelling them. Conflicting maintenance records and existing reservations must remain visible even when the existing reservation prevents inserting a second blocking ledger entry. Concurrent booking, payment confirmation and maintenance tests are required before release.

## Payments, identity and deposits

Services create Stripe operations using server-side amounts and idempotency keys. Provider calls occur outside database transactions; persist operation intent and reconcile failures/retries. Never hold a database lock while waiting for Stripe. Signature-verified webhooks are authoritative for payment confirmation and provider verification updates; a success redirect only displays persisted status.

`webhook_events` has a unique `(provider, event_id)` identity and retryable processing states. Claim/process an event atomically with its database effects; duplicates must not repeat effects, while previously failed events must remain retryable. Verify booking/customer association, expected amount, currency and allowed transitions. Handle out-of-order events, late payment after hold expiry and reconciliation explicitly. A late successful payment must not overwrite another reservation: route it to a recorded refund/review path.

Deposits have a separate configurable strategy and ledger, independent from revenue. Authorisation eligibility/expiry must reflect actual Stripe capabilities when implemented; longer hires may need separate refundable payments. No indefinite hold assumption. Store Identity references/status only, not identity document images. Missing configuration blocks the affected operation with a clear integration state; there is no simulated success.

Owner payout eligibility requires return, completed return inspection and no unresolved dispute, plus an authorised release. V1 can record a real manual payment using reference/date/note and an audit entry (§65). Automated Stripe Connect transfers remain unconfigured future capability, not a pretend provider call.

## Storage, operations and observability

Use public `equipment-public` photography and private `inspection-private` evidence (plus `equipment-private` only if needed). Validate file type, size, resource permission and object paths. Private access uses short-lived signed URLs issued after authorisation. No provider secrets or identity documents in logs.

Sensitive admin mutations and status transitions write audit/history records with their database changes. Audit infrastructure must exist when the first sensitive mutation ships; its full operational UI can follow §90 priority. Map domain conflicts to safe messages and keep diagnostic details server-side with correlation identifiers and redaction.

The implemented rate-limit adapter uses Upstash Redis REST with atomic Lua INCR/expiry, HMAC identity keys and fail-closed errors. There is no in-memory fallback. Privileged SQL RPCs additionally enforce private PostgreSQL-backed actor counters, preventing direct API bypass. Limits and trusted-IP behaviour are documented in SETUP.md. Supabase Auth's directly reachable endpoints still need provider-level abuse controls. Analytics remains deferred.

## Deployment and verification

Separate local/development, preview and production environments and provider credentials. Preview environments must not modify production data. Use Vercel for application deployment, a compatible Supabase region/project and configured Stripe endpoints. Apply reviewed migrations through one deployment pipeline; document backup/recovery before production.

Test domain rules independently, database RLS/grants and concurrency against real PostgreSQL, and auth/booking/provider flows through integration and browser tests. Include price tampering, cross-customer access, role escalation, owner-field leakage, webhook retries and payout eligibility. Public/mobile accessibility and loading/empty/error states ship with each feature, not as an assumed final polish pass.

## Assumptions and unresolved decisions

- `/docs` means this repository's `docs/` directory, not the machine's filesystem root.
- Phase 1 adds only the authorised foundation and initial domain schema. The legacy HTML and archive remain untouched and outside the App Router application.
- No brand, company identity, production rates, VAT/tax policy, cancellation policy, commission default or legal/insurance assurances are approved by demo examples.
- One asset per booking and exclusive return dates are implementation assumptions inferred from the examples; document any agreed change before building booking logic.
- Booking approval mode, hold timeout, operational hours, deposit strategy and refund/dispute handling require explicit policy choices before their implementation.
- No hosted integration accounts, secrets or deployment were configured. Embedded PostgreSQL and synthetic-provider HTTP tests do not certify live Supabase or Redis integration.

## Implemented Phase 1 database boundaries

Two ordered SQL migrations create profiles, categories, service_areas, locations, owners, equipment, equipment_images, equipment_specifications, platform_settings and audit_logs, plus private mutation counters/functions. All tables have RLS. Explicit grants override inherited provider defaults, and future public table/function default privileges are restricted.

| Data | Anonymous | Customer | Active staff | Active admin | Active super admin |
| --- | --- | --- | --- | --- | --- |
| Profiles | None | Own row; update name/phone only | Own row | Read profiles | Read profiles; role changes through audited RPC |
| Categories | Active rows | Active rows | All rows | All rows | All rows |
| Locations/service areas/equipment/images/specifications | None | None | Read | Read | Read |
| Owners/audit logs | None | None | None | Read | Read |
| Platform settings | None | None | None | None | Read |

All domain writes other than allowed profile fields and the two explicit privileged RPCs are reserved for trusted server/administrative maintenance until their use cases are implemented. Even admins do not receive broad browser UPDATE/INSERT grants. No public equipment view exists yet; consequently no owner columns can leak from equipment records. A safe public projection belongs to the catalogue phase. Settings remain private until specific safe read projections and audited writes are implemented.

`private.append_audit` is the reusable transactional audit helper: actor, action, resource/type, before/after JSON, safe metadata and database timestamp. It is not executable by API users. `change_profile_role` writes role history through it in the same transaction, and `record_access_review` provides a concrete minimal admin action. The TypeScript audit adapter calls the latter with authenticated context. Self role changes are prohibited; first-super-admin provisioning is a trusted, documented one-time SQL operation.

Auth forms use Server Actions, Zod, explicit same-origin checks and safe error messages. Profile updates use allowlisted fields and ordinary RLS-scoped clients, not service-role access. Supabase cookie refresh, confirmation templates, PKCE callback and the signed recovery grant are implemented; provider setup and live lifecycle verification are still required. Missing public configuration renders setup state; missing rate-limit configuration denies sensitive operations. UI tokens/primitives and minimal forms are present, without catalogue/booking/financial interfaces.
