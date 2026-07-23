const fs = require("fs");
require("dotenv").config({ override: true });

const u = new URL(process.env.DATABASE_URL);
const pass = u.password;
const ref = "nxeitutucwpdksjyapjk";

// Session mode (5432) works with Prisma migrate/push on IPv4 networks
const session =
  `postgresql://postgres.${ref}:${pass}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres` +
  `?sslmode=require`;

const tx =
  `postgresql://postgres.${ref}:${pass}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres` +
  `?sslmode=require&pgbouncer=true`;

let env = fs.readFileSync(".env", "utf8");
env = env.replace(/DATABASE_URL="[^"]*"/, `DATABASE_URL="${session}"`);
if (!env.includes("DATABASE_POOL_URL")) {
  env = env.replace(
    /(DATABASE_URL="[^"]*")/,
    `$1\n# Optional transaction pooler for serverless\nDATABASE_POOL_URL="${tx}"`
  );
} else {
  env = env.replace(/DATABASE_POOL_URL="[^"]*"/, `DATABASE_POOL_URL="${tx}"`);
}
fs.writeFileSync(".env", env);
console.log("DATABASE_URL -> session pooler :5432");
