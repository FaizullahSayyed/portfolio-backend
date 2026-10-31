import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import { pool } from "./config/database.js";
import projectRoutes from "./routes/project.routes";

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://portfolio-git-main-faizs7412-7149s-projects.vercel.app",
  ...(process.env.FRONTEND_ORIGINS ?? "").split(","),
]
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

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  console.error("API request failed:", {
    method: req.method,
    path: req.originalUrl,
    error,
  });

  const databaseErrorCode =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined;

  if (databaseErrorCode === "23503") {
    res.status(409).json({
      message: "Request conflicts with related records.",
    });
    return;
  }

  res.status(500).json({ message: "An unexpected server error occurred." });
};

app.use(errorHandler);

export default app;
