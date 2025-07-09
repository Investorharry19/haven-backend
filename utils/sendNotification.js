import Notification from "../schema/notification.js";

/**
 *
 * @param {Object} options
 * @param {string} options.userId
 * @param {string} options.type
 * @param {Object} options.payload
 * @param {Object} io
 */
async function sendNotification({ userId, type, payload }, io) {
  if (!io) throw new Error("Socket.IO instance not found");

  const notification = await Notification.create({
    userId,
    type,
    payload,
  });

  io.to(userId).emit("notifications:new", payload);

  return notification;
}

export default sendNotification;
