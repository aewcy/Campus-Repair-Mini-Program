const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const corsOptions = require("./config/cors");
const { UPLOAD_DIR } = require("./config/multer");
const routes = require("./routes");
const errorHandler = require("./middlewares/error");

const app = express();

// 基础中间件（必须在路由之前）
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("combined"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || "45"),
});
app.use(limiter);

// 静态文件（上传）
app.use("/uploads", express.static(path.resolve(UPLOAD_DIR)));

// 路由
app.use("/api", routes);

// 错误处理中间件
app.use(errorHandler);

module.exports = app;
