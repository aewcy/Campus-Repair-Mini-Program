require("dotenv").config();
const app = require("./app");
const db = require("./config/db");
const { JWT_SECRET } = require("./config/jwt");

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";

// 环境变量验证
function validateEnvironment() {
  const errors = [];
  
  if (!JWT_SECRET || JWT_SECRET === "replace-with-strong-secret") {
    errors.push("JWT_SECRET 未设置或使用默认值，请设置强密码");
  }
  
  if (JWT_SECRET && JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET 长度至少需要32个字符");
  }
  
  if (!process.env.DB_HOST) {
    errors.push("DB_HOST 未设置");
  }
  
  if (!process.env.DB_USER) {
    errors.push("DB_USER 未设置");
  }
  
  if (!process.env.DB_PASSWORD) {
    errors.push("DB_PASSWORD 未设置");
  }
  
  if (!process.env.DB_NAME) {
    errors.push("DB_NAME 未设置");
  }
  
  if (errors.length > 0) {
    console.error("[ERROR] 环境变量验证失败:");
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }
  
  console.log("[INFO] 环境变量验证通过");
}

// 数据库连接测试
async function testDatabaseConnection() {
  try {
    await db.query("SELECT 1");
    console.log("[INFO] 数据库连接测试成功");
    return true;
  } catch (err) {
    console.error("[ERROR] 数据库连接测试失败:", err.message);
    console.error("[ERROR] 请检查数据库配置和连接");
    process.exit(1);
  }
}

// 启动服务器
async function startServer() {
  // 验证环境变量
  validateEnvironment();
  
  // 测试数据库连接
  await testDatabaseConnection();
  
  // 启动 HTTP 服务器
  app.listen(PORT, HOST, () => {
    console.log(`[INFO] 服务器运行在 http://${HOST}:${PORT} (PID: ${process.pid})`);
    console.log(`[INFO] 环境: ${NODE_ENV}`);
    console.log(`[INFO] JWT_SECRET 验证通过`);
  });
}

// 处理未捕获的异常
process.on("uncaughtException", (err) => {
  console.error("[FATAL] 未捕获的异常:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL] 未处理的 Promise 拒绝:", reason);
  process.exit(1);
});

// 启动服务器
startServer().catch((err) => {
  console.error("[FATAL] 启动失败:", err);
  process.exit(1);
});
