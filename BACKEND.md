# Backend credentials checklist

4ward needs these services. Demo auth/checkout still works without Clerk/ClickPesa,
but production mobile money requires ClickPesa keys below.

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

## 3. ClickPesa (mobile money — primary)

1. Register / log in at [ClickPesa Merchant](https://merchant.clickpesa.com)
2. Complete company + KYC setup
3. **Settings → Developers → Applications** → create an **API** app
4. Enable **Collection** (USSD Push) for mobile money (M-Pesa, Mixx, Airtel, HaloPesa)
5. Copy credentials into `.env`:
   - `CLICKPESA_CLIENT_ID=`
   - `CLICKPESA_API_KEY=`
   - `CLICKPESA_CHECKSUM_KEY=` (only if checksum is enabled on the app)
6. Application webhooks (same screen):
   - `PAYMENT RECEIVED` → `{NEXT_PUBLIC_APP_URL}/api/webhooks/clickpesa`
   - `PAYMENT FAILED` → same URL
7. For local testing, expose the webhook with a tunnel (ngrok / Cloudflare) or rely on status polling
8. Restart `npm run dev` and confirm `clickpesa.ready: true` on `/api/health`

Checkout flow: buyer enters phone → USSD push → approve on phone → purchase unlocks.

## 3b. Admin user management (real data + security)

Sign in as `admin@4ward.com` (demo) or a DB user with role `ADMIN`.

On sign-in, the app requests a **signed admin session token** (`POST /api/admin/session`).
Admin APIs reject requests that only spoof `x-admin-email`.

Protections:

- Signed HMAC admin tokens (2h expiry)
- Same-origin check on mutating admin requests
- Rate limiting on admin endpoints
- Input sanitization on profile fields
- Cannot demote the last admin
- Client cannot escalate role via sync payload
- Security headers (`X-Frame-Options`, `nosniff`, …)
- `AuditLog` rows for admin actions

Set `ADMIN_SESSION_SECRET` in `.env` for production.

- `/dashboard/admin` — live counts, recent purchases/users, audit log
- `/dashboard/admin/users` — search/edit roles/approvals
- APIs: `/api/admin/session`, `/api/admin/users`, `/api/admin/stats`, `/api/admin/projects`

## 4. Stripe (optional card payments)

1. [Stripe test keys](https://dashboard.stripe.com/test/apikeys)
2. `STRIPE_SECRET_KEY=sk_test_...`
3. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
4. Optional webhook: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   → paste signing secret into `STRIPE_WEBHOOK_SECRET`
5. Currency is **TZS** (whole shillings)

## 5. Supabase Storage (file uploads)

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

## 6. Order fulfillment & secure downloads

After ClickPesa/Stripe payment succeeds, 4ward:

1. Writes `Purchase` + `Transaction` (+ buyer notification) via Prisma
2. Issues a unique `downloadToken`
3. Serves files only from `/api/downloads/[purchaseId]?token=...` (signed Supabase URL)

Sellers upload a **Source code ZIP** on `/sell` → `/api/uploads/project` → bucket `project-files`.

Required for real file delivery:

- `DATABASE_URL` (purchases)
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- Storage bucket named **`project-files`**
- ClickPesa (or Stripe) payment completing so fulfillment runs
