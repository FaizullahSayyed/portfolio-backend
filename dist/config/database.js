"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
require("dotenv/config");
const node_fs_1 = require("node:fs");
const pg_1 = require("pg");
const node_path_1 = __importDefault(require("node:path"));
const caPath = node_path_1.default.resolve(process.cwd(), "certs", "ca.pem");
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL?.replace(/[?&]sslmode=[^&]*/i, ""),
    ssl: {
        ca: (0, node_fs_1.readFileSync)(caPath, "utf8"),
        rejectUnauthorized: true,
    },
});
