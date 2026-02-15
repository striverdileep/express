import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function logger(req, res, next) {
  const logString = `${new Date().toISOString()} - ${req.method} - ${req.url}\n`;
  try {
    fs.appendFileSync(path.join(__dirname, "../logs.log"), logString);
  } catch (err) {
    console.error("Error writing to log File:", err);
  }
  next();
}

export default logger;
