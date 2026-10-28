import 'dotenv/config';
import { resolve } from "node:path";
import dotenv from "dotenv";
import express from "express";
import {pool} from "./config/database.js";
import projectRoutes from "./routes/project.routes";

dotenv.config({ path: resolve(__dirname, "../.env") });

const app = express();

app.get("/", async(req, res) => {
  try{
    // await pool.query("SELECT 1");
    const result = await pool.query("SELECT title FROM projects LIMIT 1");
    console.log('Database connection successful:', result.rows);

    res.status(200).json({
      server: "Server is running on port 3002.",
      database: "Database is connected",
    });

  }catch(error){
     console.error('Database connection failed:', error);

    res.status(500).json({
      message: 'Portfolio Backend is running ⚠️',
      database: 'PostgreSQL disconnected ❌',
    });
  }
});

app.use('/api/projects', projectRoutes);

app.listen(3002, () => {
  console.log("Server is running on port 3002");
}); 