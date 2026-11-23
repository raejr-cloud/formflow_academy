const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.POSTGRES_HOST || "db",
      port: Number(process.env.POSTGRES_PORT || 5432),
      database: process.env.POSTGRES_DB || "formflow_data",
      user: process.env.POSTGRES_USER || "formflow_user",
      password: process.env.POSTGRES_PASSWORD || "formflow_password",
    });

async function initDb(retries = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS students (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL
        )
      `);
      return;
    } catch (error) {
      if (attempt === retries) throw error;
      console.warn(
        `Database unavailable (attempt ${attempt}/${retries}); retrying in ${delayMs / 1000}s: ${error.code || error.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "FormFlow Academy" });
});

app.get("/api/students", async (req, res) => {
  const result = await pool.query("SELECT * FROM students ORDER BY id DESC");
  res.json(result.rows);
});

app.post("/api/students", async (req, res) => {
  const { name, email } = req.body;
  const result = await pool.query(
    "INSERT INTO students (name, email) VALUES ($1, $2) RETURNING *",
    [name, email]
  );
  res.status(201).json(result.rows[0]);
});

const PORT = process.env.PORT || 5000;
initDb().then(() => {
  app.listen(PORT, () => console.log(`FormFlow Academy API listening on port ${PORT}`));
});
