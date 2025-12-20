const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const { auth, ensureRole } = require("../middlewares/auth");
const { handleError } = require("../utils/response");

const router = express.Router();

const generateOrderNo = () => (Date.now().toString().slice(-5) + Math.floor(Math.random() * 90 + 10)).slice(-6);

// 计算分页参数
const getPaginationParams = (page, pageSize) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const size = Math.max(1, parseInt(pageSize, 10));
  return {
    offset: (pageNum - 1) * size,
    limit: size,
  };
};

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
    const { offset, limit } = getPaginationParams(page, pageSize);
    let sql = "SELECT * FROM jdwx_orders";
    const params = [];
    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

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
    const { offset, limit } = getPaginationParams(page, pageSize);

    const [rows] = await db.query(
      "SELECT * FROM jdwx_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [userId, limit, offset]
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

// 取消订单（仅创建者可取消）
router.post("/:id/cancel", auth, ensureRole("user"), async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;
  try {
    const [orderRows] = await db.query("SELECT * FROM jdwx_orders WHERE id = ?", [orderId]);
    if (orderRows.length === 0) return res.status(404).json({ success: false, message: "订单不存在" });
    
    const order = orderRows[0];
    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, message: "无权限取消该订单" });
    }
    
    if (order.status === "cancelled") {
      return res.status(400).json({ success: false, message: "订单已取消" });
    }
    
    if (order.status === "done") {
      return res.status(400).json({ success: false, message: "已完成订单不能取消" });
    }
    
    await db.query("UPDATE jdwx_orders SET status = 'cancelled', updated_at = NOW() WHERE id = ?", [orderId]);
    await db.query(
      "INSERT INTO jdwx_order_logs (order_id, staff_id, action, message, created_at) VALUES (?, NULL, 'cancel', '用户取消订单', NOW())",
      [orderId]
    );
    
    res.json({ success: true, message: "订单已取消" });
  } catch (err) {
    return handleError(res, err, 500, "取消订单失败");
  }
});

// 修改订单信息（仅创建者可修改）
router.patch("/:id", auth, ensureRole("user"), async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;
  const { location, phone, description } = req.body;
  
  try {
    const [orderRows] = await db.query("SELECT * FROM jdwx_orders WHERE id = ?", [orderId]);
    if (orderRows.length === 0) return res.status(404).json({ success: false, message: "订单不存在" });
    
    const order = orderRows[0];
    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, message: "无权限修改该订单" });
    }
    
    if (order.status === "cancelled" || order.status === "done") {
      return res.status(400).json({ success: false, message: "该状态订单不能修改" });
    }
    
    // 构建更新字段
    const updates = [];
    const params = [];
    if (location !== undefined) {
      updates.push("location = ?");
      params.push(location);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      params.push(phone);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "没有需要更新的字段" });
    }
    
    updates.push("updated_at = NOW()");
    params.push(orderId);
    
    await db.query(`UPDATE jdwx_orders SET ${updates.join(", ")} WHERE id = ?`, params);
    
    // 记录修改日志
    const changes = [];
    if (location !== undefined) changes.push(`地址: ${location}`);
    if (phone !== undefined) changes.push(`电话: ${phone}`);
    if (description !== undefined) changes.push(`描述: ${description}`);
    
    await db.query(
      "INSERT INTO jdwx_order_logs (order_id, staff_id, action, message, created_at) VALUES (?, NULL, 'update', ?, NOW())",
      [orderId, `用户修改订单信息: ${changes.join(", ")}`]
    );
    
    res.json({ success: true, message: "订单信息已更新" });
  } catch (err) {
    return handleError(res, err, 500, "修改订单失败");
  }
});

// 评价订单（仅创建者可评价，订单状态需为 done）
router.post("/:id/rate", auth, ensureRole("user"), body("rating").isInt({ min: 1, max: 5 }).withMessage("评分必须在1-5之间"), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    
    const orderId = req.params.id;
    const userId = req.user.id;
    const { rating, rating_comment } = req.body;
    const [orderRows] = await db.query("SELECT * FROM jdwx_orders WHERE id = ?", [orderId]);
    if (orderRows.length === 0) return res.status(404).json({ success: false, message: "订单不存在" });
    
    const order = orderRows[0];
    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, message: "无权限评价该订单" });
    }
    
    if (order.status !== "done") {
      return res.status(400).json({ success: false, message: "只能评价已完成的订单" });
    }
    
    // 检查是否已评价
    if (order.rating) {
      return res.status(400).json({ success: false, message: "订单已评价" });
    }
    
    // 更新订单评价信息（假设 jdwx_orders 表有 rating 和 rating_comment 字段）
    await db.query(
      "UPDATE jdwx_orders SET rating = ?, rating_comment = ?, updated_at = NOW() WHERE id = ?",
      [rating, rating_comment || null, orderId]
    );
    
    // 记录评价日志
    await db.query(
      "INSERT INTO jdwx_order_logs (order_id, staff_id, action, message, created_at) VALUES (?, NULL, 'rate', ?, NOW())",
      [orderId, `用户评价: ${rating}星${rating_comment ? ` - ${rating_comment}` : ""}`]
    );
    
    res.json({ success: true, message: "评价成功" });
  } catch (err) {
    return handleError(res, err, 500, "评价失败");
  }
});

// 获取单个工单详情 - 必须在 /:id/logs 之后定义
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

module.exports = router;

