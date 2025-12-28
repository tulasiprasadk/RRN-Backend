
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
const router = express.Router();
// Ensure directory exists
const uploadDir = path.join(path.resolve(), "uploads", "payment");
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => 
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/* ============================================================
   PAYMENT SCREENSHOT UPLOAD
   POST /api/upload/payment
============================================================ */
router.post("/payment", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "file required" });

  res.json({
    ok: true,
    filename: req.file.filename,
    url: `/uploads/payment/${req.file.filename}`
  });
});

export default router;
