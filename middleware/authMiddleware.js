function authMiddleware(req, res, next) {
  console.log("Tokens: " + req.cookies?.token);
  if (req.cookies?.token) {
    next();
  } else {
    return res.status(401).json({ error: "Unauthorized" }).redirect("/login");
  }
}
export default authMiddleware;
