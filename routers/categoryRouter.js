import express from "express";
import pool from "../db.js";

const categoryRouter = express.Router();

categoryRouter.get("/", async (req, res) => {
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

categoryRouter.post("/", async (req, res) => {
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

categoryRouter.get("/:id", async (req, res) => {
  let { id } = req.params;

  id = Number(id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid Category ID" });
  }

  let conn;

  try {
    conn = await pool.getConnection();

    const [rows] = await conn.query("SELECT * FROM categories WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.status(200).json({ category: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error Fetching Category" });
  } finally {
    if (conn) conn.release();
  }
});

categoryRouter.patch("/:id", async (req, res) => {
  let { id } = req.params;
  id = Number(id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid Category ID" });
  }
  let { name, description } = req.body;
  if (!name && !description) {
    return res.status(400).json({
      error:
        "At least one of Name or Description is required to update a category",
    });
  }
  let setClause = "";
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);
  keys.forEach((key, index) => {
    setClause += `${key} = ?`;
    if (index < keys.length - 1) {
      setClause += ", ";
    }
  });
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      `UPDATE categories SET ${setClause} WHERE id = ?`,
      [...values, id],
    );
    const okPacket = result[0];
    if (okPacket?.affectedRows > 0) {
      console.log(okPacket);
      return res.status(200).json({
        message: "Category Updated Successfully",
        id: okPacket.insertId,
      });
    } else {
      return res.status(404).json({ error: "Category not found" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error Updating Category" });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

categoryRouter.delete("/:id", async (req, res) => {
  let { id } = req.params;
  id = Number(id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid Category ID" });
  }
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query("DELETE FROM categories WHERE id = ?", [
      id,
    ]);
    console.log(result);
    const okPacket = result[0];
    if (okPacket?.affectedRows > 0) {
      return res.status(200).json({ message: "Category Deleted Successfully" });
    } else {
      return res.status(404).json({ error: "Category not found" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error Deleting Category" });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

export default categoryRouter;
