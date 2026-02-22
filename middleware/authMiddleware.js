function authMiddleware(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "unauthorized" });
  } else {
    next();
  }
}
export default authMiddleware;
