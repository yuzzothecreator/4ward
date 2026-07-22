# 4ward

**Turn your projects into digital products.**

4ward is a full-stack SaaS marketplace where university students, developers, and IT creators sell completed academic and personal projects — source code, documentation, demos, and digital products. Buyers discover ready-made solutions across web, mobile, AI, cybersecurity, IoT, blockchain, and more.

Inspired by GitHub Marketplace, Gumroad, Envato Market, Product Hunt, and campus innovation hubs.

---

## Stack

| Layer | Tech |
|--------|------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand, React Hook Form + Zod |
| UI | Custom Shadcn-style components, Lucide icons, Recharts |
| Backend | Next.js Route Handlers / Server Actions |
| Database | PostgreSQL + Prisma ORM |
| Auth | Clerk (email/password + Google OAuth) with RBAC |
| Storage | Supabase Storage (signed downloads) |
| Payments | Stripe + adapters for M-Pesa, AzamPay, Selcom |
| Deploy | Vercel |

---

## Features

- Premium dark landing page with glassmorphism, gradients, and motion
- Marketplace with category / price / tech / university / rating filters
- Project detail pages, demos, favorites, and checkout
- Sell flow: drafts → pending review → published, AI description generator
- Seller, buyer, and admin dashboards (analytics, orders, approvals, reports)
- Creator portfolio pages at `/username`
- Messaging UI, affiliate program, reputation badges
- Security: RBAC helpers, Zod validation, rate limiting, webhook verification, protected downloads, audit logs

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Fill in:

- `DATABASE_URL` — PostgreSQL connection string
- Clerk keys (optional for demo browsing)
- Stripe keys (optional — demo checkout works without them)
- Supabase keys (optional — uploads return placeholders)

### 3. Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The UI ships with rich **demo data** so you can explore marketplace, dashboards, and sell flow before wiring live services.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Prisma Studio |

---

## Roles

1. **Buyer** — browse, purchase, download, review, wishlist  
2. **Seller** — profile, listings, sales, analytics, payouts  
3. **Admin** — users, project approval, transactions, reports  

Set Clerk `publicMetadata.role` to `BUYER` | `SELLER` | `ADMIN`.

---

## Payments

- **Stripe** Checkout + webhook at `/api/webhooks/stripe`
- Platform fee: **15%** (see `src/lib/constants.ts`)
- Affiliate commission: **10%**
- African gateways stubbed in `src/lib/stripe.ts` for M-Pesa, AzamPay, Selcom

---

## Project structure

```
src/
  app/                 # Routes (landing, marketplace, sell, dashboards, API)
  components/          # UI, layout, projects, landing, dashboard
  lib/                 # prisma, auth, stripe, storage, validations, demo-data
  store/               # Zustand (favorites, cart)
prisma/
  schema.prisma        # Full data model
```

---

## Deploy on Vercel

1. Push to GitHub  
2. Import in Vercel  
3. Add env vars from `.env.example`  
4. Set `DATABASE_URL` to a managed Postgres (Neon, Supabase, Prisma Postgres, etc.)  
5. Run `prisma migrate deploy` / `db push` in build or a release step  

---

## License

Proprietary — built as a startup-ready SaaS foundation for 4ward.
