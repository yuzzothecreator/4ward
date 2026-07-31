require("dotenv").config({ override: true });
const { Client } = require("pg");

async function main() {
  const raw = process.env.DATABASE_URL || "";
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  const c = new Client({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
  });
  await c.connect();
  const r = await c.query(`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'Role'
    ORDER BY e.enumsortorder
  `);
  console.log("Role values:", r.rows.map((x) => x.enumlabel).join(", "));
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
