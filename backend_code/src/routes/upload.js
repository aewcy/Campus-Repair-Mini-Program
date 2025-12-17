const express = require("express");
const { upload } = require("../config/multer");
const { auth } = require("../middlewares/auth");

const router = express.Router();

const UPLOAD_WHITELIST = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/jpg"];

router.post("/", auth, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "未上传文件" });
  }
  const mimetype = req.file.mimetype;
  if (!UPLOAD_WHITELIST.includes(mimetype)) {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(req.file.destination, req.file.filename);
    fs.unlink(filePath, () => {});
    return res.status(400).json({ success: false, message: "不允许的文件类型" });
  }
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

module.exports = router;

