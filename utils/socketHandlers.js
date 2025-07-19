// utils/socket.js
import jwt from "jsonwebtoken";
import Notification from "../schema/notification.js"; // make sure this path is correct

export default async function socketHandler(io, socket) {
  const token = socket.handshake.auth?.token;

  try {
    const user = jwt.verify(token, process.env.JWTSECRET);
    socket.user = user;
  } catch (err) {
    console.log("Socket auth failed");
    socket.disconnect();
    return;
  }

  console.log(socket.user);
  console.log("User connected via socket:", socket.user.Id);

  socket.join(socket.user.Id);

  try {
    const notifications = await Notification.find({
      userId: socket.user.Id,
    }).sort({ createdAt: -1 });

    socket.emit("notifications:init", notifications);
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
  }

  socket.on("notifications:read", async (ids) => {
    console.log(ids);
    try {
      const no = await Notification.updateMany(
        { _id: { $in: ids }, userId: socket.user.Id },
        { $set: { read: true } }
      );
      console.log(no);
    } catch (err) {
      console.error("Error updating read notifications:", err);
    }
  });

  // ✅ DELETE EVENT
  socket.on("notifications:delete", async (ids) => {
    try {
      await Notification.deleteMany({
        _id: { $in: ids },
        userId: socket.user.Id,
      });
    } catch (err) {
      console.error("Error deleting notifications:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
}
