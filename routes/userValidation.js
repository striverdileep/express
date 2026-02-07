import bcrypt from "bcrypt";
import pool from "../db.js";
import { Router } from "express";

const userRouter = Router();

userRouter.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Both username and password are required" });
  }
  if (typeof username !== "string" || typeof password !== "string") {
    return res
      .status(400)
      .json({ message: "Both username and password must be strings" });
  }
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (rows.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const okPacket = await pool.query(
        "INSERT INTO users(username,password_hash) VALUES(?,?)",
        [username, hashedPassword],
      );
      if (okPacket[0].affectedRows > 0) {
        return res.status(200).json({ message: "User created successfully" });
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Failed to create user" });
  }
});

userRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Both username and password are required" });
  }
  if (typeof username !== "string" || typeof password !== "string") {
    return res
      .status(400)
      .json({ message: "Both username and password must be strings" });
  }
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (passwordMatch) {
      return res.status(200).json({ message: "Login successful" });
    } else {
      return res.status(400).json({ message: "Invalid username or password" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to login" });
  }
});

export default userRouter;
