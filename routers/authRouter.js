import { Router } from "express";
import { hash, compare } from "bcrypt";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { config } from "dotenv";

config();

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
      "INSERT INTO users (username, password_hash, is_active) VALUES (?, ?, 1)",
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
    conn = await pool.getConnection();
    // only pull active users
    const [rows] = await conn.query(
      "SELECT * FROM users WHERE username = ? AND is_active = 1",
      [username],
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid Username" });
    }
    const user = rows[0];
    const isValid = await compare(password, user.password_hash);
    if (isValid) {
      const accessToken = jwt.sign(
        {
          username: user.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { maxAge: 60 * 1000 },
      );
      const refreshToken = jwt.sign(
        {
          username: user.username,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { maxAge: 2 * 60 * 1000 },
      );

      await conn.query(
        "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 2 MINUTE))",
        [user.id, refreshToken],
      );

      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        maxAge: 2 * 60 * 1000,
        signed: true,
      });
      res.status(200).json({ accessToken });
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

authRouter.get("/handleRefreshToken", async (req, res) => {
  if (!req.signedCookies?.jwt) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const refreshToken = req.signedCookies.jwt;
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(
      "SELECT * FROM refresh_tokens WHERE token = ?",
      [refreshToken],
    );
    if (rows.length === 0) {
      return res.status(403).json({ error: "Forbidden" });
    }

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
          return res.status(403).json({ error: "Forbidden" });
        }

        const newRefreshToken = jwt.sign(
          { username: decoded.username },
          process.env.REFRESH_TOKEN_SECRET,
          { maxAge: 2 * 60 * 1000 },
        );

        await conn.query(
          "UPDATE refresh_tokens SET token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 2 MINUTE) WHERE token = ?",
          [newRefreshToken, refreshToken],
        );

        res.cookie("jwt", newRefreshToken, {
          httpOnly: true,
          maxAge: 2 * 60 * 1000,
          signed: true,
        });

        const accessToken = jwt.sign(
          {
            username: decoded.username,
          },
          process.env.ACCESS_TOKEN_SECRET,
          { maxAge: 60 * 1000 },
        );
        res.status(200).json({ accessToken });
      },
    );
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (conn) conn.release();
  }
});

authRouter.get("/logout", async (req, res) => {
  if (req.signedCookies?.jwt) {
    const refreshToken = req.signedCookies.jwt;
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query("DELETE FROM refresh_tokens WHERE token = ?", [
        refreshToken,
      ]);
    } catch (err) {
      console.log(err);
    } finally {
      if (conn) conn.release();
    }
  }

  res.clearCookie("jwt", { httpOnly: true, signed: true });
  res.status(200).json({ message: "Logged out successfully" });
});

export default authRouter;
