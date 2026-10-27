"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatabaseConnection = checkDatabaseConnection;
const pg_1 = require("pg");
async function checkDatabaseConnection() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("Database connection check failed: DATABASE_URL is not configured.");
        return;
    }
    const client = new pg_1.Client({
        connectionString,
        ssl: { rejectUnauthorized: true },
        connectionTimeoutMillis: 10_000,
    });
    let connected = false;
    try {
        await client.connect();
        connected = true;
        await client.query("SELECT 1");
        console.log("Database connection successful.");
    }
    catch (error) {
        const code = typeof error === "object" &&
            error !== null &&
            "code" in error &&
            typeof error.code === "string"
            ? error.code
            : undefined;
        console.error(code
            ? `Database connection failed (error code: ${code}).`
            : "Database connection failed. Check DATABASE_URL, network access, and TLS configuration.");
    }
    finally {
        if (connected) {
            try {
                await client.end();
            }
            catch {
                console.error("Database connection cleanup failed.");
            }
        }
    }
}
