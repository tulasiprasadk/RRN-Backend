import { Notification } from "../config/database.js";

/**
 * Create a new notification for admin
 * @param {string} title
 * @param {string} message
 * @param {object} meta  (optional metadata)
 */
export async function notifyAdmin(title, message, meta = {}) {
  try {
    await Notification.create({
      title,
      message,
      meta: JSON.stringify(meta),
      isRead: false,
    });
  } catch (err) {
    console.error("Notification error:", err);
  }
}
