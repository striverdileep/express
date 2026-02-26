import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

export default function authMiddleware(req, res, next) {
  const token = req.headers["authorization"].split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  } else {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Forbidden" });
      } else {
        console.log(decoded);
        req.user = decoded;
        next();
      }
    });
  }
}
