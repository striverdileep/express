import { Router } from "express";
import { hash, compare } from "bcrypt";
import pool from "../db.js";
import session from "express-session";

const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and Password are required" });
  }
  const hashedPassword = await hash(password, 10);
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username, hashedPassword],
    );
    if (result[0].affectedRows === 1) {
      res.status(201).json({ message: "User registered successfully" });
    } else {
      res.status(500).json({ error: "Failed to register user" });
    }
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Username already exists" });
    }
    console.log(err);
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and Password are required" });
  }
  let conn;
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (rows[0].length === 0) {
      return res.status(400).json({ error: "Invalid Username" });
    }
    const user = rows[0][0];
    const isValid = await compare(password, user.password_hash);
    if (isValid) {
      req.session.userId = user.id;
      req.session.username = user.username;
      res.status(200).json({ message: "Login successful" });
    } else {
      res.status(400).json({ error: "Invalid Password" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

authRouter.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.status(200).json({ message: "Logout successful" });
  });
});

export default authRouter;
