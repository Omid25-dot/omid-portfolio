# Phase 1 setup and verification

## Live verification prerequisites

Before asking an agent to run hosted Phase 1 verification, complete these local-only setup steps. Do not paste secrets into chat, documentation, source files, or shell output.

1. Create `.env.local` from `.env.example` and set:
   - `NEXT_PUBLIC_APP_URL` to the exact local or deployed application origin;
   - the development project's `NEXT_PUBLIC_SUPABASE_URL` and anon/publishable key;
   - `SUPABASE_SERVICE_ROLE_KEY` for deliberate server-only verification;
   - a random `SECURITY_HMAC_SECRET` of at least 32 characters;
   - the development Upstash Redis REST URL and token.
2. Authenticate and link the Supabase CLI to the intended **development** project:

   ```sh
   npx supabase@2.117.0 login
   npx supabase@2.117.0 link --project-ref YOUR_DEVELOPMENT_PROJECT_REF
   ```

   Linking does not authenticate the CLI. `db push --dry-run` requires the login session (or a temporary `SUPABASE_ACCESS_TOKEN`) and may request the development database password. The access token and database password are CLI/secret-manager credentials, not application runtime variables. Do not add them to `.env.example`, `.env.local`, or source control. Confirm that `supabase/.temp/project-ref` names the intended development project before any `db push` or seed operation.
3. In the Supabase dashboard, configure the exact Site URL/redirect allowlist, email confirmation, the repository's confirmation/recovery templates, SMTP where applicable, password policy, and provider-level Auth rate limits described below.
4. Create one ordinary customer through the real signup flow and confirm its email. For first-super-admin verification, create and confirm a separate administrator account normally. Keep its password outside the repository. The trusted bootstrap needs only that account's Auth UUID.

Once these are in place, a verification run can safely perform migration dry-run/push, development-only seeding, hosted RLS/Auth tests, Redis exhaustion/recovery checks, first-super-admin bootstrap, an audited role change, cleanup of disposable users, and the regression suite. The verifier must still inspect the target and migration dry run before making remote changes.

Live verification on 17 September 2026 completed the migration dry run and push, safe development seed, hosted schema/RLS/Auth/route tests, trusted super-admin bootstrap, audited role changes and distributed Redis checks. Actual confirmation/recovery email delivery remains manual because the hosted Auth provider returned `over_email_send_rate_limit`. See IMPLEMENTATION_STATUS.md for the evidence boundary.

## Run the application

Use Node.js 24 (see `.nvmrc`), then:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The development launcher enables Watchpack polling to avoid file-descriptor limits on this workspace. Override `WATCHPACK_POLLING` if your environment needs another interval. `npm run build` and `npm start` run the production application.

Without Supabase configuration, public pages remain available and auth pages show an explicit setup state. Protected pages redirect to `/setup`. With Supabase configured, anonymous protected requests redirect to `/login`. No mock provider is used by application code.

Set `NEXT_PUBLIC_APP_URL` to the exact browser origin (localhost and 127.0.0.1 are different origins). Rebuild when changing `NEXT_PUBLIC_*` values. Set an approved `NEXT_PUBLIC_BRAND_NAME`; the fallback is neutral. Business settings exist in the database but their management/public branding projection is deferred.

## Supabase database

Use separate development, preview and production projects. `database/migrations` is canonical; `supabase/migrations` is a relative symlink, not a second schema copy. Supabase CLI records applied migration versions. Do not rerun the raw SQL on an already migrated database.

For a machine with Docker and Supabase CLI access, the intended local workflow is:

```sh
npx supabase@2.117.0 start
npx supabase@2.117.0 db reset
```

`db reset` erases the **local** database; use only for disposable development data. The local configuration references development seed SQL and email templates. Docker was unavailable here, so the full local-provider workflow still needs verification on a Docker-capable machine; hosted CLI dry-run/push verification succeeded.

For a new hosted development project:

```sh
npx supabase@2.117.0 login
npx supabase@2.117.0 link --project-ref YOUR_DEVELOPMENT_PROJECT_REF
npx supabase@2.117.0 db push --dry-run
npx supabase@2.117.0 db push
```

Check the linked project before applying migrations. Do not seed production. Apply `database/seed/development.sql` only to a disposable development project through its SQL editor or an authorised database connection. It is idempotent and does not overwrite existing values. There are no Auth users, passwords or equipment inventory in the seed. Company assets use COMPANY/null owner; the third-party owner fixture is internal.

Expose only the `public` schema through the Data API. Do not expose `private`. Set the project URL and anon/publishable key in `.env.local`. A service-role key is server-only and optional for ordinary Phase 1 user flows; the dedicated helper is reserved for deliberate privileged maintenance. Never substitute it for the public key.

## Auth, email and recovery

Enable email/password signup, email confirmation and refresh-token rotation. Use at least a 12-character provider password minimum. Configure SMTP and sender identity for hosted email delivery, along with Supabase Auth rate limits and abuse controls. The local configuration sets 6 emails/hour, 30 sign-in/signup requests per 5 minutes, 30 token verifications per 5 minutes and 150 refreshes per 5 minutes; explicitly review and mirror suitable limits in hosted project settings. The public Auth API is reachable directly, so the application Redis limiter does not replace provider protections.

Set Supabase Site URL to `NEXT_PUBLIC_APP_URL`; allow exact `/auth/callback` and `/reset-password` redirect URLs for that environment. Avoid production wildcard redirect allowlists.

Install both templates from `supabase/templates/` in the hosted dashboard:

- Confirmation: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`
- Recovery: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`

These links open a confirmation page; only an explicit POST consumes the token, reducing accidental consumption by email scanners. The recovery POST creates a signed HttpOnly, SameSite=Lax, 15-minute grant tied to the verified user. The password update requires both that grant and a verified Supabase session. The grant is cleared after update; the flow signs out globally and returns to login. Existing issued access tokens are subject to Supabase token expiry/revocation behaviour, so this does not promise instantaneous invalidation of every access token.

The PKCE `/auth/callback` exchanges a code for a session and returns only to `/account`; recovery must use the configured recovery template. Default email templates are not a substitute for the required recovery configuration. Tokens and query strings must be redacted from any hosting/APM request logging you add. Referrer policy is `no-referrer`.

## Redis and request security

Create an Upstash Redis database with REST access. Set `UPSTASH_REDIS_REST_URL` (HTTPS) and `UPSTASH_REDIS_REST_TOKEN`. Set `SECURITY_HMAC_SECRET` to a random secret of at least 32 characters; for example, generate one with `openssl rand -hex 32`. Do not paste secrets into project documentation or commit them.

The app atomically increments Redis counters with a 15-minute expiry. Per operation: 20 attempts per source and 8 per identity. Identity keys use HMACs rather than raw emails/IPs. This applies to signup, login, reset requests/updates, verification/callback and profile/admin mutations. Missing credentials and provider failures fail closed. Exhausted limits return a clear wait message; logout remains available without Redis.

Vercel's platform-overwritten `x-vercel-forwarded-for` is used only when Vercel supplies `VERCEL=1`. Other hosts share a conservative source bucket. Never manually enable VERCEL on an untrusted proxy. Before deploying elsewhere, implement and test that host's trusted client-IP adapter; otherwise unrelated users share limits.

Privileged SQL RPCs also have a PostgreSQL-backed limit (8 per actor/operation per 15 minutes) so direct Data API calls cannot bypass application limiting. Its private table has at most one row per actor/operation, resets expired counters on use and cascades on user deletion. These two limiters are independent and intentionally conservative.

Next Server Actions provide origin protection; all exposed mutation actions additionally compare Origin with the configured application origin. Redirect destinations are allowlisted. Configure HTTPS at the hosting layer. The baseline CSP blocks framing, objects, external form actions and base-tag changes; it is not a full nonce-based script CSP. All customer data routes are dynamic; never add public caching to authenticated responses.

## Bootstrap the first super admin

Register and confirm an actual administrator account normally. Copy its Auth UUID from your development project's dashboard. There is no public bootstrap or self-promotion endpoint.

A database administrator may run the following once in the trusted SQL editor after substituting the UUID. It refuses to run if any super admin exists, verifies a confirmed account, and writes an audit event in the same transaction. No default administrative password is seeded.

```sql
begin;
lock table public.profiles in share row exclusive mode;
do $$
declare
  target uuid := 'REPLACE-WITH-CONFIRMED-AUTH-USER-UUID';
  previous_role text;
begin
  if exists(select 1 from public.profiles where role='super_admin') then
    raise exception 'Super admin already exists; use the authorised role-change action';
  end if;
  if not exists(select 1 from auth.users where id=target and email_confirmed_at is not null) then
    raise exception 'A confirmed Auth user is required';
  end if;
  select role into strict previous_role from public.profiles where id=target and account_status='active';
  update public.profiles set role='super_admin' where id=target;
  perform private.append_audit(null,'profile.bootstrap_super_admin','profile',target,
    jsonb_build_object('role',previous_role),jsonb_build_object('role','super_admin'),
    jsonb_build_object('source','trusted_database_bootstrap'));
end $$;
commit;
```

Later changes use `/admin` → Change a user role. The server requires an active super admin, confirms the target, throttles the request and calls the authenticated RPC. SQL rechecks role/status, locks actor and target, rejects self-modification and atomically records the before/after role. Database credentials and service-role access remain trusted administrative capabilities capable of bypassing RLS; never expose them to customers.

## Verification commands and limits

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright test tests/e2e/route-http.spec.ts
# On a supported system with Playwright browsers:
npx playwright install chromium
npm run test:e2e
# Alternatively, where a compatible installed Chrome can launch:
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

- Unit tests cover role/status policy, redirect allowlists, auth/profile validation and rate-limit provider failures.
- PGlite executes the actual migrations in embedded PostgreSQL and tests RLS/grants, profile isolation, role injection, private owner/settings/audit access, inactive staff/admin access, audit rollback, direct-RPC throttling and ownership/money constraints. The test supplies a minimal Auth schema and auth.uid function; it is not hosted Supabase.
- HTTP and browser suites use `tests/fixtures/auth-server.mjs`, an explicitly synthetic Auth/Data API fixture, to test real Next.js routing/actions without external credentials. It is never imported by the application. It does not validate Supabase credentials, JWT verification, email delivery or hosted policies.
- The browser suite is present but could not launch here: bundled Chromium does not support this macOS version and installed Chrome failed under the sandbox. HTTP tests do not validate visual layout or browser interaction.

Hosted verification has completed signup/default-profile, login/logout, token/session, programmatic recovery/password change, direct RLS role boundaries, real protected-route enforcement, audited mutations and distributed Redis exhaustion/isolation/failure checks. Before declaring full Phase 1 acceptance, manually validate Auth email delivery and confirmation/recovery links in both same-browser and cross-browser flows, plus browser refresh/reopen persistence. Do not replace those remaining checks with test-fixture or programmatic-token success.

## Manual browser checklist

Use disposable development accounts and the configured development origin. Record the account UUIDs and results without recording passwords, tokens, reset links, or secret keys.

- After the hosted email quota is available, sign up a new customer, follow the actual confirmation email, and confirm `/account` opens with role `customer` and status `active` in the database.
- Sign out, confirm `/account` and `/admin` return to sign-in, then sign in again and refresh/reopen the browser to verify session persistence.
- While signed in as the customer, open `/admin` directly and confirm the forbidden page appears and no admin content is returned.
- Edit permitted name/phone fields. Attempt no UI workaround for role changes; verify through an authenticated Data API request that `role` and `account_status` updates are rejected.
- Request password recovery, follow the actual email link, set a new password, confirm the old password fails and the new password succeeds. Reusing or waiting past the recovery grant must fail safely.
- Sign in as the provisioned super admin, confirm `/admin` opens, change a disposable customer's role through the guarded form, and verify the matching audit row in the database. Restore or delete the disposable account afterward.
- Sign in as customer, staff, admin, and super admin accounts in turn. Confirm customers cannot enter `/admin`; staff see no privileged audit/role controls; admins can record an access review but cannot change roles/settings; super admins can use the guarded role action.
- Optionally repeat the controlled rate-limit check through the browser form. The provider-level check already confirmed eight allowed attempts, ninth-attempt denial, isolation for another identity, HMAC key privacy and fail-closed invalid credentials.

Browser/email checks remain manual until a supported Playwright browser can launch. Do not mark them passed based only on HTTP fixtures or dashboard inspection.

Implementation references: [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [CLI configuration](https://supabase.com/docs/guides/local-development/cli/config), [Next.js installation](https://nextjs.org/docs/app/getting-started/installation).
