require("dotenv").config({ override: true });
const { Client } = require("pg");

async function main() {
  const u = new URL(process.env.DATABASE_URL);
  u.searchParams.delete("sslmode");
  const c = new Client({
    connectionString: u.toString(),
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const tables = await c.query(
    "select tablename from pg_tables where schemaname='public' order by 1"
  );
  const enums = await c.query(
    "select typname from pg_type where typtype='e' order by 1"
  );
  console.log("tables", tables.rows.map((r) => r.tablename));
  console.log("enums", enums.rows.map((r) => r.typname));
  await c.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
