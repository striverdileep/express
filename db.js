import mysql2 from "mysql2/promise";
import { config } from "dotenv";
import fs from "fs";

config();

const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    ca: fs.readFileSync("./ca.pem"),
    rejectUnauthorized: false,
  },
});

export default pool;
