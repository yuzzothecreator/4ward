require("dotenv").config({ override: true });
const fs = require("fs");
const { Client } = require("pg");

async function main() {
  const sql = fs.readFileSync("prisma/init.sql", "utf8");
  const raw = process.env.DATABASE_URL || "";
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  const client = new Client({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
  });
  await client.connect();
  console.log("Connected — applying schema…");
  await client.query(sql);
  const tables = await client.query(
    `select tablename from pg_tables where schemaname='public' order by tablename`
  );
  console.log(
    "Tables:",
    tables.rows.map((r) => r.tablename).join(", ")
  );
  await client.end();
  console.log("Schema applied successfully");
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
