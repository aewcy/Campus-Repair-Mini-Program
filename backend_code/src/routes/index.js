const express = require("express");
const authRouter = require("./auth");
const ordersRouter = require("./orders");
const uploadRouter = require("./upload");
const db = require("../config/db");

const router = express.Router();

// 健康检查
router.get("/health", async (req, res) => {
  try {
    // 测试数据库连接
    await db.query("SELECT 1");
    res.json({
      success: true,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "connected"
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: err.message
    });
  }
});

// 认证
router.use("/", authRouter);

// 上传
router.use("/upload", uploadRouter);

// 工单
router.use("/orders", ordersRouter);

module.exports = router;
