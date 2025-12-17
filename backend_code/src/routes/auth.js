const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const { JWT_SECRET, JWT_EXPIRES, BCRYPT_ROUNDS } = require("../config/jwt");
const jwt = require("jsonwebtoken");
const { handleError } = require("../utils/response");

const router = express.Router();

const safeUser = (userRow) => ({
  id: userRow.id,
  username: userRow.username,
  role: userRow.role,
  phone: userRow.phone,
  created_at: userRow.created_at,
});

// 注册
router.post(
  "/register",
  body("username").isLength({ min: 2 }).withMessage("用户名至少2位"),
  body("password").isLength({ min: 9 }).withMessage("密码至少9位"),
  body("phone").optional().isMobilePhone("any").withMessage("手机号格式不正确"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const { username, password, phone, role = "user" } = req.body;
      const [u] = await db.query("SELECT id FROM jdwx_users WHERE username = ?", [username]);
      if (u.length > 0) return res.status(400).json({ success: false, message: "用户名已存在" });

      if (phone) {
        const [p] = await db.query("SELECT id FROM jdwx_users WHERE phone = ?", [phone]);
        if (p.length > 0) return res.status(400).json({ success: false, message: "手机号已被注册" });
      }

      const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await db.query(
        "INSERT INTO jdwx_users (username, password, role, phone, created_at) VALUES (?, ?, ?, ?, NOW())",
        [username, hash, role, phone]
      );
      return res.json({ success: true, message: "注册成功" });
    } catch (err) {
      return handleError(res, err, 500, "注册失败");
    }
  }
);

// 登录
router.post(
  "/login",
  body("username").exists(),
  body("password").exists(),
  async (req, res) => {
    try {
      const { username, password } = req.body;
      const [rows] = await db.query("SELECT * FROM jdwx_users WHERE username = ?", [username]);
      if (rows.length === 0) return res.status(401).json({ success: false, message: "账号或密码错误" });

      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ success: false, message: "账号或密码错误" });

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
      return res.json({ success: true, message: "登录成功", token, user: safeUser(user) });
    } catch (err) {
      return handleError(res, err, 500, "登录失败");
    }
  }
);

module.exports = router;

