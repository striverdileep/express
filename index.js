const express = require("express");
const pool = require("./db");

const app = express();

app.get("/", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    console.log("Connected to DB");
    res.json({ message: "DB connected" }).status(200);
  } catch (err) {
    console.log("Failed to connect to DB");
    res.json({ message: "Couldn't connect to DB" }).status(404);
    console.log(err);
  }
});

app.get("/categories", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM categories");
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Failed to fetch categories from DB" });
  }
});

app.get("/categories/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid category id" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM categories WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No category exists with the given id" });
    }

    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Failed to fetch category from DB" });
  }
});

app.listen(8000, () => {
  console.log("Listening on port 8000");
});
