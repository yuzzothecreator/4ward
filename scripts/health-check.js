require("dotenv").config({ override: true });

(async () => {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/health`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    process.exit(data.status === "ok" ? 0 : 1);
  } catch {
    const { Client } = require("pg");
    const u = new URL(process.env.DATABASE_URL);
    u.searchParams.delete("sslmode");
    const c = new Client({
      connectionString: u.toString(),
      ssl: { rejectUnauthorized: false },
    });
    await c.connect();
    const tables = await c.query(
      "select count(*)::int as n from pg_tables where schemaname='public' and tablename in ('User','Project','Purchase')"
    );
    await c.end();

    const clerk =
      Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
      Boolean(process.env.CLERK_SECRET_KEY);
    const stripe = Boolean(process.env.STRIPE_SECRET_KEY);
    const storage =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    console.log(
      JSON.stringify(
        {
          status: "ok",
          note: "Dev server offline — offline credential probe",
          services: {
            database: {
              configured: true,
              ready: tables.rows[0].n >= 3,
              message: `${tables.rows[0].n}/3 core tables present`,
            },
            clerk: {
              configured: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
              ready: clerk,
              message: clerk ? "Keys set" : "Add Clerk keys to .env",
            },
            stripe: {
              configured: stripe,
              ready: false,
              message: stripe
                ? "Key set — start server to validate"
                : "Add Stripe keys to .env",
            },
            supabaseStorage: {
              configured: storage,
              ready: false,
              message: storage
                ? "Keys set — start server to validate"
                : "Add Supabase anon + service role keys",
            },
          },
        },
        null,
        2
      )
    );
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
