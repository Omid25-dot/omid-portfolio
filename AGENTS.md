# Agent instructions

## Product and source of truth

Build a production-quality managed equipment-hire service, initially for Glasgow, UK. Customers deal with one rental company. **V1 is NOT a public marketplace.** Third-party ownership is internal: no public owner identities, owner login/onboarding, self-service listings or customer-to-owner messaging.

[`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) is the authoritative detailed specification. Before every substantial task, read this file and the relevant PRODUCT_SPEC sections, then inspect [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md). Never knowingly contradict the specification or silently substitute an easier requirement. Update affected documentation when decisions evolve, and update IMPLEMENTATION_STATUS at the end of every substantial task.

## Approved stack and structure

Next.js App Router, React, TypeScript, Tailwind CSS, Supabase PostgreSQL/Auth/Storage, Stripe Payments/Identity, Vercel. Use mutually compatible current stable versions, pinned with a lockfile when the runtime is initialised. Zod is the selected validation library. Keep routes, reusable components, domain logic and server services modular; follow ARCHITECTURE.md.

## Non-negotiable boundaries

- Enforce authentication and permissions server-side, with RLS, least-privilege grants and database constraints. UI visibility is not authorisation. Customers cannot change roles; staff cannot change critical financial/security settings.
- Never trust client prices, commission, status, payment/deposit/verification state or payout amounts. Use server-calculated integer pennies, basis points and immutable booking snapshots.
- Create/reserve bookings transactionally. Enforce non-overlap in PostgreSQL and coordinate bookings with maintenance blocks. Validate transitions and preserve status history.
- Stripe confirmation comes from signature-verified, idempotent webhooks, never redirects. Keep deposits separate from revenue. Never fake payments, verification, refunds, deposits or transfers; missing configuration must fail safely.
- Owners, financial records and inspection evidence are private. Explicit public/customer projections must omit ownership and internal financial fields, including API responses and server-rendered payloads. Private media needs authorised, expiring signed access.
- Never expose service-role or Stripe secret keys to browsers or commit secrets. Validate inputs/uploads; use distributed rate limits, safe errors and audit records for sensitive mutations.
- Use database records, not frontend arrays, for product data. Mark demo seeds. Keep brand, rates, policies and geography configurable; use GBP, UK English and Europe/London with DST-aware dates.
- Follow PRODUCT_SPEC §90 priority order. Implement only the authorised phase, with meaningful security/domain tests. Future marketplace functionality stays out of V1.

## Current scope

Phase 1 implements the runnable Next.js/auth/security foundation and initial domain migrations. Hosted Supabase/Redis setup and browser/live integration acceptance remain outstanding; see IMPLEMENTATION_STATUS.md and SETUP.md. Do not proceed to Phase 2 without authorisation. Legacy root HTML is not the rental application. Never use test fixtures as production providers. Read current Next.js package documentation when touching framework APIs.
