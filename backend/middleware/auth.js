const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "geoserve_secret_2024";

function verifyToken(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ error: "No token provided" });
  const token = auth.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token missing" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { verifyToken, SECRET };
