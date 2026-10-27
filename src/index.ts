import { resolve } from "node:path";
import dotenv from "dotenv";
import express from "express";
import { checkDatabaseConnection } from "./config/database";

dotenv.config({ path: resolve(__dirname, "../.env") });

const app = express();

void checkDatabaseConnection();

app.get("/", (req, res) => {
  res.send("Portfolio Backend is running ✅");
});

app.listen(3002, () => {
  console.log("Server is running on port 3002");
}); 