/**
 * Bootstrap production admin credentials.
 *
 *   npm run admin:bootstrap
 *   npm run admin:bootstrap -- --email you@company.com
 *   npm run admin:bootstrap -- --email you@company.com --password "YourStrongPass!2026"
 */

require("dotenv").config({ override: true });
const fs = require("fs");
const path = require("path");
const { createHash, randomBytes, scryptSync } = require("crypto");
const { Client } = require("pg");

function generateAdminSessionSecret() {
  return randomBytes(48).toString("hex");
}

function generateTempAdminPassword() {
  return randomBytes(18).toString("base64url");
}

function hashAdminPassword(password) {
  const N = 16384;
  const r = 8;
  const p = 1;
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function parseArgs(argv) {
  const out = { email: "", password: "", writeEnv: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--email") out.email = String(argv[++i] || "");
    else if (a === "--password") out.password = String(argv[++i] || "");
    else if (a === "--no-env") out.writeEnv = false;
  }
  return out;
}

function upsertEnv(filePath, entries) {
  let text = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  if (text.length && !text.endsWith("\n")) text += "\n";

  for (const [key, value] of Object.entries(entries)) {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    if (re.test(text)) text = text.replace(re, line);
    else {
      if (!text.includes("# ─── Admin security")) {
        text += `\n# ─── Admin security (production) ─────────────────\n`;
      }
      text += `${line}\n`;
    }
  }
  fs.writeFileSync(filePath, text, "utf8");
}

async function upsertDbAdmin(email, name) {
  if (!process.env.DATABASE_URL) {
    console.log("DB: skipped (DATABASE_URL not set)");
    return;
  }
  const u = new URL(process.env.DATABASE_URL);
  u.searchParams.delete("sslmode");
  const c = new Client({
    connectionString: u.toString(),
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  const existing = await c.query(`SELECT id, username FROM "User" WHERE email = $1`, [
    email,
  ]);

  if (existing.rows.length) {
    await c.query(
      `UPDATE "User" SET role = 'ADMIN', "isApproved" = true, name = $2, "updatedAt" = NOW() WHERE email = $1`,
      [email, name]
    );
  } else {
    const usernameBase =
      email.split("@")[0].replace(/[^a-z0-9_-]/gi, "").slice(0, 18) || "admin";
    const username = `${usernameBase}_${randomBytes(2).toString("hex")}`;
    await c.query(
      `
      INSERT INTO "User" (
        id, "clerkId", name, email, username, role, "isApproved",
        "affiliateCode", "createdAt", "updatedAt", skills
      ) VALUES (
        $1, $2, $3, $4, $5, 'ADMIN', true, $6, NOW(), NOW(), ARRAY[]::text[]
      )
      `,
      [
        `usr_${randomBytes(8).toString("hex")}`,
        `admin_${email}`,
        name,
        email,
        username,
        `aff_${randomBytes(6).toString("hex")}`,
      ]
    );
  }

  await c.end();
  console.log(`DB: ensured ADMIN role for ${email}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = (
    args.email ||
    process.env.ADMIN_EMAIL ||
    "admin@4ward.com"
  )
    .trim()
    .toLowerCase();

  if (!email.includes("@")) {
    console.error("Provide a valid --email");
    process.exit(1);
  }

  const password = args.password || generateTempAdminPassword();
  if (password.length < 12) {
    console.error("Admin password must be at least 12 characters");
    process.exit(1);
  }

  const existingSecret = (process.env.ADMIN_SESSION_SECRET || "").trim();
  const sessionSecret =
    existingSecret.length >= 32 &&
    !/change-me|local-dev|insecure|4ward-local/i.test(existingSecret)
      ? existingSecret
      : generateAdminSessionSecret();

  const passwordHash = hashAdminPassword(password);

  if (args.writeEnv) {
    upsertEnv(path.join(process.cwd(), ".env"), {
      ADMIN_EMAIL: email,
      ADMIN_EMAILS: email,
      NEXT_PUBLIC_ADMIN_EMAIL: email,
      ADMIN_SESSION_SECRET: sessionSecret,
      ADMIN_PASSWORD_HASH: passwordHash,
    });
    console.log(
      "Updated .env → ADMIN_EMAIL, ADMIN_EMAILS, NEXT_PUBLIC_ADMIN_EMAIL, ADMIN_SESSION_SECRET, ADMIN_PASSWORD_HASH"
    );
  }

  try {
    await upsertDbAdmin(email, "4ward Admin");
  } catch (err) {
    console.warn("DB upsert warning:", err.message || err);
  }

  const secretFp = createHash("sha256").update(sessionSecret).digest("hex").slice(0, 12);

  console.log("\n=== Production admin credentials (save securely — shown once) ===");
  console.log(`Email:           ${email}`);
  console.log(`Password:        ${password}`);
  console.log(`Session secret:  ${sessionSecret.slice(0, 10)}… (fp ${secretFp})`);
  console.log("\nClerk (recommended in production):");
  console.log("  1. Sign up / sign in with this email in Clerk");
  console.log('  2. Clerk Dashboard → User → Public metadata: { "role": "ADMIN" }');
  console.log("  3. Restart the server / redeploy");
  console.log("================================================================\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
