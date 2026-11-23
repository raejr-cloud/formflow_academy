const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    )
  `);
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
