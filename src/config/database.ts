import { Client } from "pg";

export async function checkDatabaseConnection(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error(
      "Database connection check failed: DATABASE_URL is missing. Set it in backend/.env (see backend/.env.example) or in the process environment.",
    );
    return;
  }

  const ca = process.env.DATABASE_SSL_CA?.trim();
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 10_000,
  });
  let connected = false;

  try {
    await client.connect();
    connected = true;
    await client.query("SELECT 1");
    console.log("Database connection successful.");
  } catch (error: unknown) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : undefined;

    if (code === "SELF_SIGNED_CERT_IN_CHAIN") {
      console.error(
        "Database connection failed: the TLS certificate chain is not trusted. Verify the Supabase host and configure DATABASE_SSL_CA with its trusted CA certificate.",
      );
    } else {
      console.error(
        code
          ? `Database connection failed (error code: ${code}).`
          : "Database connection failed. Check DATABASE_URL, network access, and TLS configuration.",
      );
    }
  } finally {
    if (connected) {
      try {
        
        await client.end();
      } catch {
        console.error("Database connection cleanup failed.");
      }
    }
  }
}
