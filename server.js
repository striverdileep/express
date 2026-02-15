import express from "express";
import { config } from "dotenv";
import pool from "./db.js";
import e from "express";
import categoryRouter from "./routers/categoryRouter.js";
import authRouter from "./routers/authRouter.js";
import logger from "./middleware/logger.js";
import cookieParser from "cookie-parser";
import authMiddleware from "./middleware/authMiddleware.js";

config();

const app = express();
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(logger);
app.use(express.json());

app.use(authRouter);
app.use(authMiddleware);
app.use("/categories", categoryRouter);

app.get("/", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    if (conn) {
      console.log("Connected to the Database");
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

app.listen(process.env.PORT, () => {
  console.log("Server is running on port " + process.env.PORT);
});
