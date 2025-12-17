const express = require("express");
const { body } = require("express-validator");
const db = require("../config/db");
const { auth, ensureRole } = require("../middlewares/auth");
const { handleError } = require("../utils/response");

const router = express.Router();

const generateOrderNo = () => (Date.now().toString().slice(-5) + Math.floor(Math.random() * 90 + 10)).slice(-6);

// 提交工单（用户）
router.post(
  "/",
  auth,
  ensureRole("user"),
  body("location").notEmpty(),
  body("description").notEmpty(),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { location, phone, description, image_url } = req.body;

      const order_no = generateOrderNo();
      const sql = `INSERT INTO jdwx_orders
        (order_no, user_id, location, phone, description, image_url, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`;

      const [result] = await db.query(sql, [order_no, userId, location, phone, description, image_url]);
      await db.query(
        "INSERT INTO jdwx_order_logs (order_id, staff_id, action, message, created_at) VALUES (?, NULL, 'create', ?, NOW())",
        [result.insertId, "用户提交工单"]
      );

      return res.json({ success: true, message: "提交成功", order_no });
    } catch (err) {
      return handleError(res, err, 500, "提交失败");
    }
  }
);

// 员工获取工单（支持 status 过滤、分页）
router.get("/", auth, ensureRole("staff"), async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(pageSize, 10));
    let sql = "SELECT * FROM jdwx_orders";
    const params = [];
    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(pageSize, 10), offset);

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    return handleError(res, err, 500, "获取失败");
  }
});

// 用户查看自己的工单
router.get("/my", auth, ensureRole("user"), async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(pageSize, 10));

    const [rows] = await db.query(
      "SELECT * FROM jdwx_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [userId, parseInt(pageSize, 10), offset]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    return handleError(res, err, 500, "获取失败");
  }
});

// 员工接单
router.post("/:id/take", auth, ensureRole("staff"), async (req, res) => {
  const orderId = req.params.id;
  const staffId = req.user.id;
  try {
    const [cur] = await db.query("SELECT status FROM jdwx_orders WHERE id = ? FOR UPDATE", [orderId]);
    if (cur.length === 0) return res.status(404).json({ success: false, message: "工单不存在" });
    if (cur[0].status !== "pending") return res.status(400).json({ success: false, message: "此工单不可接单" });

    await db.query("UPDATE jdwx_orders SET status = 'doing', staff_id = ?, updated_at = NOW() WHERE id = ?", [staffId, orderId]);
    await db.query(
      "INSERT INTO jdwx_order_logs (order_id, staff_id, action, message, created_at) VALUES (?, ?, 'take', '员工接单', NOW())",
      [orderId, staffId]
    );

    res.json({ success: true, message: "接单成功" });
  } catch (err) {
    return handleError(res, err, 500, "接单失败");
  }
});

// 员工完成工单
router.post("/:id/finish", auth, ensureRole("staff"), body("message").optional().isString(), async (req, res) => {
  const orderId = req.params.id;
  const staffId = req.user.id;
  const { message } = req.body;
  try {
    await db.query("UPDATE jdwx_orders SET status = 'done', updated_at = NOW() WHERE id = ?", [orderId]);
    await db.query(
      "INSERT INTO jdwx_order_logs (order_id, staff_id, action, message, created_at) VALUES (?, ?, 'finish', ?, NOW())",
      [orderId, staffId, message || "已完成"]
    );
    res.json({ success: true, message: "工单已完成" });
  } catch (err) {
    return handleError(res, err, 500, "标记失败");
  }
});

// 获取单个工单详情
router.get("/:id", auth, async (req, res) => {
  const orderId = req.params.id;
  try {
    const [rows] = await db.query("SELECT * FROM jdwx_orders WHERE id = ?", [orderId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "未找到工单" });
    const order = rows[0];
    if (req.user.role === "user" && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "无权限查看该工单" });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    return handleError(res, err, 500, "查询失败");
  }
});

// 日志查询（仅 staff）
router.get("/:id/logs", auth, ensureRole("staff"), async (req, res) => {
  try {
    const orderId = req.params.id;
    const [rows] = await db.query("SELECT * FROM jdwx_order_logs WHERE order_id = ? ORDER BY created_at ASC", [orderId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    return handleError(res, err, 500, "查询失败");
  }
});

module.exports = router;

