const fs = require("fs");
require("dotenv").config();

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("No DATABASE_URL in existing .env");
  process.exit(1);
}

const u = new URL(raw);
const pass = u.password; // keep URL-encoded
const ref = "nxeitutucwpdksjyapjk";
const pooler =
  `postgresql://postgres.${ref}:${pass}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres` +
  `?sslmode=require&pgbouncer=true`;
const direct = raw.includes("?")
  ? `${raw}&sslmode=require`
  : `${raw}?sslmode=require`;

const content = `# 4ward — local credentials (do not commit)

# Runtime DB (IPv4 transaction pooler — ap-northeast-1)
# Direct db.*.supabase.co is IPv6-only and fails on many networks (ENOTFOUND).
DATABASE_URL="${pooler}"

# Optional direct URL (IPv6) for migrations when reachable
DIRECT_URL="${direct}"

# Supabase Storage / API — paste keys from Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL="https://${ref}.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk — paste from https://dashboard.clerk.com → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/sell
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/sell

# Stripe — paste from https://dashboard.stripe.com/apikeys (use test keys locally)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

fs.writeFileSync(".env", content);
console.log("Updated .env with IPv4 pooler DATABASE_URL + credential placeholders");
