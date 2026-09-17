# Managed equipment rental

A UK managed equipment-hire application, initially serving Glasgow. Customers deal with one rental company; third-party ownership remains private.

Phase 1 implements the runnable application, Supabase auth flows, protected account/admin foundations, initial domain migrations, RLS, validation, distributed rate limiting and audited privileged actions. Hosted integration verification remains outstanding. No equipment catalogue, booking, payment or marketplace features are implemented.

## Start

Use Node 24, then:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without configuration, account services display a setup state. Supabase and Upstash Redis credentials are required to exercise real auth/mutations; there is no fake success mode. Follow [setup instructions](docs/SETUP.md) for migrations, email templates, rate limiting and initial super-admin provisioning.

## Verify

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright test tests/e2e/route-http.spec.ts
```

The SQL suite executes actual migrations in embedded PostgreSQL with minimal Supabase Auth fixtures. HTTP tests exercise the running Next.js application with a synthetic Auth provider. These do not replace hosted integration checks. Full browser tests require a supported Playwright browser: `npx playwright install chromium`, then `npm run test:e2e`.

## Project knowledge

- [Agent instructions](AGENTS.md)
- [Authoritative product specification](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Implementation status, evidence and limitations](docs/IMPLEMENTATION_STATUS.md)
- [Setup and security operations](docs/SETUP.md)

The approved stack is Next.js App Router, React, TypeScript, Tailwind, Supabase PostgreSQL/Auth/Storage, Stripe Payments/Identity and Vercel. Stripe and operational rental features belong to future phases. The legacy root HTML and archive are preserved but are not served by this application.
