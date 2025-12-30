
import express from "express";
import { models } from "../../config/database.js";
const { Notification } = models;
const router = express.Router();

/* Get all unread notifications */
router.get("/", async (req, res) => {
  const list = await Notification.findAll({
    where: { isRead: false },
    order: [["createdAt", "DESC"]]
  });
  res.json(list);
});

/* Mark all as read */
router.put("/mark-read", async (req, res) => {
  await Notification.update(
    { isRead: true },
    { where: {} }
  );

  res.json({ success: true });
});

export default router;
