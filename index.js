const express = require("express");
const pool = require("./db");

const app = express();
app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    console.log("Connected to DB");
    res.json({ message: "DB connected" }).status(200);
    conn.release();
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

app.post("/categories", async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    return res
      .status(400)
      .json({ message: "Both name and Description are required" });
  }
  try {
    const okPacket = await pool.query(
      "INSERT INTO categories(name,description) VALUES(?,?)",
      [name, description],
    );
    console.log(okPacket[0]);
    if (okPacket[0].affectedRows > 0) {
      return res
        .status(200)
        .json({ message: `Inserted id ${okPacket[0].insertId}` });
    } else {
      return res.status(400).json({ message: "Nothing was inserted" });
    }
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Category with this name already exists",
      });
    }
    console.log(err);
    res.status(500).json({ message: "Failed to insert" });
  }
  return res.status(200).json({ message: "Success" });
});

app.listen(8000, () => {
  console.log("Listening on port 8000");
});
