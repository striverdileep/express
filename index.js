import express from "express";
import pool from "./db.js";
import categoryRouter from "./routes/categoryRoutes.js";
import logger from "./middleware/logger.js";
import { config } from "dotenv";

config()

const app = express();

app.use(express.json());
app.use(logger);

app.use("/categories", categoryRouter);

app.get("/", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    console.log("Connected to DB");
    res.status(200).json({ message: "DB connected" });
    conn.release();
  } catch (err) {
    console.log("Failed to connect to DB");
    res.status(404).json({ message: "Couldn't connect to DB" });
    console.log(err);
  }
});

app.listen(process.env.PORT, () => {
  console.log("Listening on port 8000");
});
