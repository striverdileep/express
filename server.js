import express from "express";
import { config } from "dotenv";
import pool from "./db.js";

config();

const app = express();

app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    if (conn) {
      console.log("Connected to the Database");
      console.log(conn);
      res.status(200).json({ message: "Connected to the Database" });
    } else {
      console.log("Failed to connect to the Database");
      res.status(500).json({ error: "Failed to connect to the Database" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error connecting to the Database" });
  }
});

app.get("/categories", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    if (conn) {
      const rows = await conn.query("SELECT * FROM categories");
      console.log(rows[0]);
      conn.release();
      return res.status(200).json(rows[0]);
    } else {
      console.log("Failed to connect to the Database");
      return res
        .status(500)
        .json({ error: "Failed to connect to the Database" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error Fetching Categories" });
  }
});

app.post("/categories", async (req, res) => {
  let { name, description } = req.body;
  if (!name || !description) {
    return res.status(400).json({
      error: "Both Name and Description are required to insert a category",
    });
  }
  name = name.trim();
  description = description.trim();
  try {
    const conn = await pool.getConnection();
    if (conn) {
      const result = await conn.query(
        "INSERT INTO categories (name, description) VALUES(?,?)",
        [name, description],
      );
      const okPacket = result[0];
      conn.release();
      if (okPacket?.affectedRows > 0) {
        return res.status(201).json({
          message: "Category Added Successfully",
          id: okPacket.insertId,
        });
      }
    } else {
      console.log("Failed to connect to the Database");
      return res
        .status(500)
        .json({ error: "Failed to connect to the Database" });
    }
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Category Name Already Exists" });
    }
    console.log(err);
    return res.status(500).json({ error: "Error Adding Category" });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

app.listen(process.env.PORT, () => {
  console.log("Server is running on port " + process.env.PORT);
});
