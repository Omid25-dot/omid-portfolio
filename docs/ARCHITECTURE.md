# Architecture

Status: Phase 4 authenticated unpaid booking requests and customer management implemented over the Phase 2/3 engines. Phase 1 actual email/recovery acceptance remains outstanding. PRODUCT_SPEC.md remains authoritative. Payments, Identity, delivery quoting, inspections and payouts remain deferred. See IMPLEMENTATION_STATUS.md and SETUP.md for evidence/configuration.

## Phase 4 customer requests

Public browsing/quotes remain anonymous. A successful collection quote enables `/booking/[slug]?start=…&end=…&method=collection`. Entering the request review requires a verified Supabase session and current profile. `safeNext` accepts only explicit account/admin destinations or a validated local booking path with allowlisted dates/collection method; financial data and external URLs cannot become continuation targets. Login carries this URL in its form. Signup/recovery actions store a one-hour HttpOnly SameSite=Lax continuation cookie, revalidated and consumed after email confirmation/PKCE exchange or password recovery. Email must open in the same browser to reuse the cookie; a different browser safely lands in Account. No authorization comes from user metadata or continuation state.

The review fetches equipment, availability, collection information and authoritative pricing again. It issues a 15-minute HMAC-signed review binding the user, equipment, dates, safe quote and a random retry key. It is sent in the POST form, never in a URL. A user can edit contact name/phone and must acknowledge an unpaid, temporary request; this does not fabricate approved commercial rental terms. Delivery is disabled until genuine pricing exists. Verification requirements are displayed without collecting documents or pretending verification is complete.

`services/customer-booking-actions.ts` reauthenticates, checks origin and Redis limits, validates contact details and the signed review, then calls `request_customer_booking`. That authenticated SQL wrapper calls the existing `create_rental_booking` engine: pricing/ownership snapshots, equipment locking, exclusion constraints, status history, expiry and audit remain authoritative. After creation inside the same transaction, the wrapper compares the actual persisted safe pricing snapshot with the reviewed quote; mismatch raises `QUOTE_CHANGED` and rolls back the entire transaction, including history/audit. Client quote values are comparison data only, never used to calculate or store a price. New requests start REQUESTED; nothing advances to CONFIRMED or records payment.

`private.customer_booking_requests` records a per-customer unique request key, booking FK, minimal contact snapshot, safe equipment/collection snapshot and versioned request acknowledgement. It has deny-all RLS and no browser grants; restricted definer functions are its only application access. Profile-first locking serialises duplicate requests. A retry with the same key and selections returns the original reference; different overlapping requests still conflict. The existing Phase 2 direct rental RPC remains available with its original server-calculated financial and permission boundary; the signed review adds consent/retry protection to the customer-facing workflow.

Confirmation and account detail use a random public booking reference, but authorization always checks `customer_id = auth.uid()`. Dedicated read functions return explicit safe fields, pricing snapshots and history status/time only. No owner, commission, actor identity, internal reason, audit data or private contact snapshot reaches the browser. Collection/equipment display snapshots survive later catalogue changes for Phase 4 requests; older Phase 2 rows use the current equipment title and may have no collection snapshot. Lists are paginated at 20 records; account groups apply within each page. Booking/account/auth routes are dynamic and explicitly noindex.

Customer withdrawal extends the existing transition service only for an active customer's own REQUESTED booking. The confirmation form is explicit; the guarded RPC releases capacity and records history, cancellation metadata and audit atomically. Later statuses require the team; no refund rules or refund operations are invented. Expiry still follows Phase 2: availability ignores elapsed holds, acquisition/transition cleans them opportunistically, and the service-only sweeper needs deployment scheduling. UI labels elapsed holds as expired even before a sweep and never promises permanent reservation.

No card payments, deposit movements, Identity, inspection, payout or marketplace functionality is implemented. The current 30-minute demo hold and commercial policy settings require business approval before launch.

## Phase 3 public catalogue

`lib/catalogue/server.ts` uses only the anonymous key. PostgreSQL `catalogue_search`/`catalogue_detail` RPCs return explicit customer fields through `private.catalogue_item`: no raw equipment grants, ownership, contacts, commission, serials, internal references or private settings. Eligibility requires listed, non-archived equipment and active category/location/service area. Maintenance/unavailable assets are excluded; reserved/on-hire assets may appear with date-specific availability. Deliberate security-definer reads have fixed empty search paths and explicit grants; private helpers are not publicly executable.

Search is server-rendered and URL-driven, with SQL keyword/category/postcode-area/price/fulfilment/date filters and 12-item pagination. Zod validates input and results. Postcode-area matching is a catalogue coverage filter, not a delivery-price promise. Flexible specifications and allowlisted customer details render without equipment-specific columns. Reviews remain deferred; ratings are never invented.

Public availability calls the extracted Phase 2 private core; the original authenticated RPC retains its role gate. Public quotes reuse the Phase 2 SQL pricing engine with internal ownership/commission fields removed. Both wrappers require catalogue eligibility. The server action enforces validation, same origin and Redis rate limits. Read RPCs are deliberately directly callable; application Redis limits do not cover direct Data API requests, so production provider quotas/abuse monitoring remain necessary. Date selection never reserves an asset. End dates remain exclusive. Collection quotes use pennies; delivery returns quote-required without an invented fee.

`equipment-public` contains only customer-safe catalogue assets. Storage metadata listing requires an eligible image reference; client writes/deletes are not granted. Public bucket bytes remain retrievable by URL even after unlisting: unlisting is not media revocation. Private evidence must never enter this bucket. Next Image restricts remote sources to the configured Supabase public-bucket path and uses responsive optimisation plus a local fallback.

The development seed creates 12 marked demo assets, a demo location/service area and an internal owner. Original representative illustrations upload only to `catalogue/demo-phase3/`. They are deliberate placeholders, not photography. Ordered multi-image galleries are supported; current seeds have one image per asset. Production photos, commercial policies and rates are still required.

Shared catalogue components provide navigation, cards, search, gallery and quote panels. Branding, region, support and indexing are configurable; development defaults to noindex. Canonical/Open Graph metadata covers public pages. Informational/legal pages honestly state remaining setup. The Phase 3 catalogue is extended by the Phase 4 unpaid-request flow above. Payment checkout and marketplace UI remain deferred.

## Phase 4 presentation system

The October 2026 redesign retains the current Next.js application and provider boundaries. `app/globals.css` owns the shared configurable colour, surface, spacing and typography language for public, auth, account and unpaid-request pages. The homepage uses the existing catalogue queries and explicit demo artwork rather than a new frontend inventory provider. The search form appears before the illustration in mobile reading/focus order. `components/ui/icon.tsx` provides a small set of locally rendered Lucide SVGs with licence notices, without a new runtime dependency. `MobileNavigation` is a small client component around native details/summary for link-selection dismissal, Escape and focus restoration; signed-in/admin visibility is still decided in the server header. Native forms, date fields, galleries, server pricing, auth continuation and customer request services retain their existing contracts.

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

Phase 1 populates auth/security/UI modules and minimal account/admin routes. Phase 2 adds rental contracts/services and SQL domain functions. Phase 3 adds `components/catalogue`, `lib/catalogue`, public routes and anonymous quote actions. `supabase/migrations` is a symlink to canonical `database/migrations`. Checkout, payment and operational UI remain deferred.

## Runtime and dependencies

Exact versions are in package.json/package-lock.json: Next.js 16.3.5, React 19.3.0, TypeScript 6.0.3, Tailwind 4.3.3, Supabase SSR 0.12.7/JS 2.116.0 and Zod 4.6.5. Node 24 is the development target. TypeScript 6.0.3 and ESLint 9.39.5 were selected for compatible peer ranges: current TypeScript 7 exceeds the TypeScript-ESLint supported range, and the React lint plugin excludes ESLint 10. ESLint 9's upstream deprecation is a tracked tooling limitation; npm reports no known dependency vulnerabilities at verification time.

Next.js runs server services with the Node runtime. `proxy.ts` refreshes Supabase cookies; protected pages/actions independently verify identity with `getUser()` and load current profile permissions. The development launcher enables Watchpack polling after local EMFILE errors. `agentRules: false` prevents Next.js from modifying the project's authoritative AGENTS.md. TypeScript, lint, embedded PostgreSQL tests and HTTP route tests are configured; Installed Chrome now runs the Phase 3/4 desktop/mobile tests; actual Phase 1 email delivery/recovery acceptance remains outstanding.

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

Phase 2 uses the booking row itself as the reservation record, with a generated half-open `daterange` and `capacity_reserved` flag. A GiST exclusion constraint (`btree_gist`) rejects overlapping reserved bookings for one equipment UUID, including writes that bypass the RPC availability precheck. This replaces the planned separate ledger to avoid duplicate reservation state. Availability blocks are separate because maintenance must be recordable even over an existing reservation.

Every booking/block mutation takes the same equipment-row lock; operational equipment updates inherently lock that row. `create_rental_booking` verifies the current active profile, applies the database rate limit, locks equipment, expires old holds, validates dates/fulfilment, computes authoritative pricing/commission, checks bookings and blocks, and inserts the snapshot. Triggers append status history and audit in the same transaction. An audit failure rolls back the reservation. PostgreSQL/PostgREST uses READ COMMITTED; the hosted concurrency suite exercises independent simultaneous HTTP transactions. No external provider call occurs while locks are held.

REQUESTED, APPROVED and PAYMENT_PENDING reserve capacity until their original `hold_expires_at`; approval does not extend the hold. The required database `booking_hold_minutes` setting is demo-seeded to 30 and bounded to 1–1440. Production policy needs business approval. CONFIRMED/CHECKED_OUT have no timed hold. RETURNED, COMPLETED, CANCELLED and DECLINED release capacity; DISPUTED preserves the preceding capacity state. Holds are expired opportunistically under the equipment lock before creation/transitions; availability reads disregard expired holds. `expire_booking_holds()` is an idempotent service-role-only sweeper, capped at 100 assets per call. Scheduled invocation remains deployment configuration, so dormant expired rows can remain marked reserved until the next sweep or equipment acquisition.

Both dated maintenance blocks and equipment-wide MAINTENANCE/UNAVAILABLE/ARCHIVED statuses prevent new reservations. `booking_availability_conflicts` is a security-invoker staff projection showing affected booking IDs without changing customer reservations. Overlapping block entries are permitted. `rental_availability` returns generic unavailable ranges/reasons only, never customer IDs, booking IDs, owner data or block notes. Payment-confirmation races will be tested when the authoritative payment writer exists; Phase 2 cannot confirm payment.

## Implemented Phase 2 schema and interfaces

`202609180001_rental_domain.sql` adds `bookings`, `booking_status_history` and `availability_blocks`, all with RLS, explicit grants, foreign keys, checks and query/range indexes. `202609180002_operational_conflicts.sql` extends the invoker-security conflict report to equipment-wide unavailability. Phase 1 migrations are unchanged. No payment, verification or payout table is required by the current foreign keys, so these domains remain deferred.

Bookings contain random UUID primary keys and independent `RNT-` references with 128 random bits, equipment/customer references, exclusive hire dates, status, fulfilment/address fields, GBP penny amounts, deposit, total, ownership/commission snapshots, a versioned pricing JSON snapshot, hold/capacity fields, cancellation metadata and timestamps. Owner foreign keys restrict deletion to preserve history. A trigger rejects changes to identity, dates, fulfilment and financial/ownership snapshots, including from ordinary service-role UPDATEs. History contains previous/new state, actor, timestamp and optional operational reason; customer grants omit actor/reason. All transitions and creation write audit/history atomically.

The raw booking table deliberately has **column SELECT grants**, not table SELECT for authenticated users. Customers can select only their own permitted booking fields; staff/admin can read the same safe columns across bookings. Ownership type, owner ID, commission, owner net and full pricing JSON are not selectable by any browser role. Internal financial inspection requires a future explicitly authorised service projection; Phase 2 does not grant a broad finance API. There are no authenticated INSERT/UPDATE/DELETE grants on any new table. Privileged maintenance credentials remain trusted administrative capabilities.

Exposed SQL RPCs have fixed empty search paths, schema-qualified references, no anonymous EXECUTE, active-profile checks and no caller-supplied customer/actor/price/commission fields. Mutating RPCs also use the existing PostgreSQL actor limiter, so calling them directly cannot bypass database authorization or calculation. Next server actions in `services/rental-actions.ts` add verified Supabase identity, role checks for operations, strict Zod input parsing, same-origin checks and distributed Redis limiting. No service-role client is used for ordinary application requests. Read actions return explicit parsed projections; Supabase/SQL errors map to safe conflict/configuration/permission messages.

Pricing has **one authoritative implementation**, `private.rental_quote`, called by both the safe quote RPC and booking creation. The TypeScript pricing module is a validated adapter, not a second arithmetic engine. Dates are SQL dates in `[start,end)`, so 22–24 September is two days and adjacent hires do not overlap. Day subtraction never divides a timezone-dependent timestamp duration by 24 hours. Duration is 1–366 days further restricted by required min/max settings; past starts use the Europe/London calendar day. Operational buffers are deferred and would require a separate reserved range, leaving immutable billable dates intact.

Collection requires a listed usable asset, collection eligibility and an active collection location/service area. Delivery currently returns `DELIVERY_QUOTE_REQUIRED`; it is never priced as free delivery. Complete seven-day blocks use the configured weekly rate plus daily-rate remainder, capped at all-daily pricing; a partial week is not rounded up. Service fee comes from a required setting; discounts are not implemented and remain zero. Tax requires explicit `rental_tax_policy = no_tax_configured` and GBP configuration. This is an explicitly marked development policy, not a VAT exemption claim or approved live tax treatment. Missing/invalid settings fail closed. All arithmetic uses integer/bigint pennies, with a signed-32-bit total cap before persistence.

Third-party commission resolves equipment override → owner override → global default (zero is a valid override). Only rental subtotal is commissionable; refundable deposits, service fees and delivery are excluded. Fractional pennies round half-up once using bigint arithmetic. Company-owned bookings store null owner/rate and zero commission/net, creating no owner liability. Booking snapshots preserve the chosen rates, weekly rule, timezone, amounts, tax policy, commission basis/rate and owner identity internally.

The structural transition graph is:

| From | Permitted next state |
| --- | --- |
| REQUESTED | APPROVED, DECLINED, CANCELLED |
| APPROVED | PAYMENT_PENDING, CANCELLED |
| PAYMENT_PENDING | CONFIRMED, CANCELLED |
| CONFIRMED | CHECKED_OUT, CANCELLED, DISPUTED |
| CHECKED_OUT | RETURNED, DISPUTED |
| RETURNED | COMPLETED, DISPUTED |
| COMPLETED | DISPUTED |
| DISPUTED | Recorded preceding state only |
| DECLINED, CANCELLED | None |

Staff may perform ordinary operational transitions; cancellation, disputes and completion require admin/super-admin. Direct customer status writes remain unavailable; Phase 4 adds only the guarded withdrawal of an own REQUESTED booking described above. Decline/cancellation/dispute require a reason. Approval, payment-pending and checkout recheck operational availability. The Phase 2 RPC explicitly rejects CONFIRMED and COMPLETED with `INTEGRATION_REQUIRED`: real payment/verification and return-inspection prerequisites have not been implemented, and admins cannot fabricate them. The structural graph is ready for future trusted integration writers, which must add those authoritative gates and their race tests. There is no payment/Identity success simulation.

## Future payments, identity and deposits

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
- Phase 2 adds only the authorised rental backend. The legacy HTML and archive remain untouched and outside the App Router application.
- No brand, company identity, production rates, VAT/tax policy, cancellation policy, commission default or legal/insurance assurances are approved by demo examples.
- One asset per booking and exclusive return dates are implementation assumptions inferred from the examples; document any agreed change before building booking logic.
- Manual approval and a configurable expiring hold are the Phase 2 backend policy; demo settings require business approval before trading. Operational hours, buffers, tax, deposit strategy and refund/dispute settlement remain future decisions.
- Hosted development Supabase and Redis are configured and verified. Email/browser acceptance from Phase 1 remains outstanding; embedded PostgreSQL and synthetic-provider HTTP tests alone do not certify those flows.

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
