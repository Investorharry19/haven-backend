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
    // const notifications = await Notification.find({ userId: socket.user.id })
    //   .sort({ createdAt: -1 })
    //   .lean();
    const notificationsData = [
      {
        _id: "3",
        title: "Test Notification",
        message: "This Notification is to test if the sockets work alwight",
        date: "4 days ago",
        type: "lease",
        sub: "expiring",
        read: false,
      },
    ];

    socket.emit("notifications:init", notificationsData);
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
  }

  socket.on("notifications:read", async (ids) => {
    try {
      await Notification.updateMany(
        { _id: { $in: ids }, userId: socket.user.id },
        { $set: { read: true } }
      );
    } catch (err) {
      console.error("Error updating read notifications:", err);
    }
  });

  // ✅ DELETE EVENT
  socket.on("notifications:delete", async (ids) => {
    try {
      await Notification.deleteMany({
        _id: { $in: ids },
        userId: socket.user.id,
      });
    } catch (err) {
      console.error("Error deleting notifications:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
}
