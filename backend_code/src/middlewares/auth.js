const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwt");

const auth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: "未提供 token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "token 无效或已过期" });
  }
};

const ensureRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ success: false, message: "无访问权限" });
  }
  next();
};

module.exports = { auth, ensureRole };
