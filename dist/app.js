"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const database_js_1 = require("./config/database.js");
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const app = (0, express_1.default)();
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
app.use(express_1.default.json());
app.get("/", async (_req, res) => {
    try {
        const result = await database_js_1.pool.query("SELECT title FROM projects LIMIT 1");
        console.log("Database connection successful:", result.rows);
        res.status(200).json({
            server: "Server is running on port 3002.",
            database: "Database is connected",
        });
    }
    catch (error) {
        console.error("Database connection failed:", error);
        res.status(500).json({
            message: "Portfolio Backend is running ⚠️",
            database: "PostgreSQL disconnected ❌",
        });
    }
});
app.use("/api/projects", project_routes_1.default);
const errorHandler = (error, _req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }
    console.error("API request failed:", error);
    const databaseErrorCode = typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
        ? error.code
        : undefined;
    if (databaseErrorCode === "23503") {
        res.status(409).json({
            message: "Project cannot be deleted because it is referenced by other records.",
        });
        return;
    }
    res.status(500).json({ message: "An unexpected server error occurred." });
};
app.use(errorHandler);
exports.default = app;
