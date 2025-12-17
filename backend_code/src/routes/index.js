const express = require("express");
const authRouter = require("./auth");
const ordersRouter = require("./orders");
const uploadRouter = require("./upload");

const router = express.Router();

// 健康检查
router.get("/health", (req, res) => res.json({ success: true, uptime: process.uptime() }));

// 认证
router.use("/", authRouter);

// 上传
router.use("/upload", uploadRouter);

// 工单
router.use("/orders", ordersRouter);

module.exports = router;
