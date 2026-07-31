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

  for (const v of ["SUPPORT", "SUPER_ADMIN"]) {
    try {
      await c.query(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS '${v}'`);
      console.log("added", v);
    } catch (e) {
      console.log(v, e.message);
    }
  }

  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (email) {
    const r = await c.query(
      `UPDATE "User" SET role = 'SUPER_ADMIN' WHERE lower(email) = $1 RETURNING email, role`,
      [email]
    );
    console.log("promoted", r.rows);
  }

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
