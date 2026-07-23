# Backend credentials checklist

4ward needs these services. Demo auth/checkout still works without Clerk/Stripe,
but production requires all keys below.

## Status endpoint

With the dev server running:

```bash
curl http://localhost:3000/api/health
```

Or: `npm run health`

## 1. Database (required) — DONE if health says ready

Your project uses **Supabase Postgres**.

- Direct host `db.<ref>.supabase.co` is often **IPv6-only** → fails on many networks.
- Use the **Session pooler** (port `5432`) in `DATABASE_URL` (IPv4).
- Region for this project: `ap-northeast-1`.

Schema tables (`User`, `Project`, `Purchase`, …) are applied on the linked DB.

## 2. Clerk (auth)

1. Create an app at [Clerk Dashboard](https://dashboard.clerk.com)
2. Copy **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Copy **Secret key** → `CLERK_SECRET_KEY`
4. In Clerk, set sign-in/up URLs to `/sign-in` and `/sign-up`
5. Restart `npm run dev`

## 3. Stripe (payments)

1. [Stripe test keys](https://dashboard.stripe.com/test/apikeys)
2. `STRIPE_SECRET_KEY=sk_test_...`
3. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
4. Optional webhook: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   → paste signing secret into `STRIPE_WEBHOOK_SECRET`
5. Currency is **TZS** (whole shillings)

## 4. Supabase Storage (file uploads)

1. [API settings](https://supabase.com/dashboard/project/_/settings/api)
2. `NEXT_PUBLIC_SUPABASE_URL` (already set from project ref)
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. `SUPABASE_SERVICE_ROLE_KEY`
5. Create a public/private bucket named **`project-files`**

## Verify

```bash
npm run health
```

Expect `database.ready: true`. Other services turn green once keys are pasted into `.env`.
