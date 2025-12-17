function handleError(res, err, code = 500, msg = "服务器错误") {
  console.error(err);
  return res.status(code).json({ success: false, message: msg });
}

module.exports = { handleError };

