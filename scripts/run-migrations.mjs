// One-off migration runner — applies supabase/migrations/*.sql directly via
// a Postgres connection (DATABASE_URL), for when the Supabase CLI's
// account-level auth (`supabase login` / a Personal Access Token) isn't
// available or wanted. Runs all files in one transaction: any failure
// rolls back the whole batch rather than leaving a half-built schema.
//
// Usage: node scripts/run-migrations.mjs

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");

// Next.js conventionally uses .env.local, not .env — load that explicitly.
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Add it to .env.local first.");
  process.exit(1);
}

const files = (await readdir(migrationsDir))
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error(`No .sql files found in ${migrationsDir}`);
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log(`Connected. Applying ${files.length} migrations in one transaction...\n`);

try {
  await client.query("begin");

  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), "utf-8");
    process.stdout.write(`  -> ${file} ... `);
    await client.query(sql);
    console.log("ok");
  }

  await client.query("commit");
  console.log("\nAll migrations applied successfully.");
} catch (err) {
  await client.query("rollback");
  console.error("\nFailed — rolled back the entire batch. No partial changes were made.");
  console.error(err.message);
  process.exit(1);
} finally {
  await client.end();
}
