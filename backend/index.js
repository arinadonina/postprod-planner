
import express from "express";
import cors from "cors";
import { db } from "./db.js";
import { telegramAuth } from "./middleware/telegramAuth.js";


const app = express();
app.use(cors());
app.use(express.json());


app.get("/db-check", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB connection failed" });
  }
});

app.get("/me", telegramAuth, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    first_name: req.user.first_name,
  });
});


app.listen(3000, () => {
  console.log("Backend запущен: http://localhost:3000");
});