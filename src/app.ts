import "dotenv/config";
import express from "express";
import { pool } from "./config/database.js";
import projectRoutes from "./routes/project.routes";

const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.get("Origin");
  res.vary("Origin");

  if (origin && allowedOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, X-Master-Password");
  }

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json());

app.get("/", async (_req, res) => {
  try {
    const result = await pool.query("SELECT title FROM projects LIMIT 1");
    console.log("Database connection successful:", result.rows);

    res.status(200).json({
      server: "Server is running on port 3002.",
      database: "Database is connected",
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      message: "Portfolio Backend is running ⚠️",
      database: "PostgreSQL disconnected ❌",
    });
  }
});

app.use("/api/projects", projectRoutes);

export default app;
