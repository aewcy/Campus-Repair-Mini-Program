module.exports = (err, req, res, next) => {
  console.error("Unhandled error:", err);
  return res.status(500).json({ success: false, message: "内部错误" });
};
