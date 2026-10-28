import "dotenv/config";
import { readFileSync } from "node:fs";
import { Pool } from "pg";
import path from "node:path";

const caPath = path.resolve(process.cwd(), "certs", "ca.pem");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.replace(
    /[?&]sslmode=[^&]*/i,
    "",
  ),
  ssl: {
    ca: readFileSync(caPath, "utf8"),
    rejectUnauthorized: true,
  },
});