console.log("DB PASSWORD", process.env.DB_PASSWORD);
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "jdwx_backend_user01",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "jdwx_db",
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONN_LIMIT || "10", 10),
  queueLimit: 0,
  port: parseInt(process.env.DB_PORT || "3306", 10),
});

module.exports = pool;
