"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = require("node:path");
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const database_1 = require("./config/database");
dotenv_1.default.config({ path: (0, node_path_1.resolve)(__dirname, "../.env") });
const app = (0, express_1.default)();
void (0, database_1.checkDatabaseConnection)();
app.get("/", (req, res) => {
    res.send("Portfolio Backend is running ✅");
});
app.listen(3002, () => {
    console.log("Server is running on port 3002");
});
