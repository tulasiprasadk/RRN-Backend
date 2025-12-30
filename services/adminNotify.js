import { models } from "../config/database.js";
const { Notification } = models;

const adminNotify = async (type, title, message) => {
  try {
    await Notification.create({
      type,
      title,
      message
    });
    console.log("ADMIN NOTIFY:", title);
  } catch (err) {
    console.error("ADMIN NOTIFY ERROR:", err);
  }
};

export default adminNotify;
