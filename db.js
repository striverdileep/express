const mysql2 = require("mysql2/promise");
const fs = require("fs");
require("dotenv").config({ path: ".env" });

const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,

  ssl: {
    ca: fs.readFileSync(process.env.DB_CA_CERT),
    rejectUnauthorized: true,
  },
});

module.exports = pool;
