import jwt from "jsonwebtoken";
import Notification from "../schema/notification.ts";
import UpdateSchema from "../schema/updates.ts";
import type {
  AppServer,
  AppSocket,
  Role,
  SocketTokenPayload,
} from "../types/socket.ts";

const JWT_SECRET = process.env.JWTSECRET;
if (!JWT_SECRET) {
  throw new Error("JWTSECRET is not set in environment variables");
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

export default async function socketHandler(_io: AppServer, socket: AppSocket) {
  const token: unknown = socket.handshake.auth?.token;
  const role = socket.handshake.auth?.role as Role | undefined;

  let user: SocketTokenPayload;
  try {
    if (typeof token !== "string") throw new Error("Missing token");

    const decoded = jwt.verify(token, JWT_SECRET!);
    if (typeof decoded === "string" || typeof decoded.Id !== "string") {
      throw new Error("Invalid token payload");
    }
    user = decoded as SocketTokenPayload;
    socket.data.user = user;
  } catch {
    console.log("Socket auth failed");
    socket.disconnect();
    return;
  }

  console.log("User connected via socket:", user.Id);

  if (role === "landlord") {
    socket.join(user.Id);
    try {
      const notifications = await Notification.find({ userId: user.Id }).sort({
        createdAt: -1,
      });
      socket.emit("notifications:init", notifications);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }

  if (role === "tenant") {
    if (!user.propertyId) {
      console.log("Tenant token has no propertyId");
      socket.disconnect();
      return;
    }

    socket.join(`_${user.propertyId}_`);
    try {
      const updates = await UpdateSchema.find({ propertyId: user.propertyId });
      socket.emit("landlord_update:init", updates);
    } catch (err) {
      console.error("Failed to fetch updates:", err);
    }
  }

  socket.on("notifications:read", async (ids) => {
    if (!isStringArray(ids)) return;
    try {
      await Notification.updateMany(
        { _id: { $in: ids }, userId: user.Id },
        { $set: { read: true } },
      );
    } catch (err) {
      console.error("Error updating read notifications:", err);
    }
  });

  socket.on("notifications:delete", async (ids) => {
    if (!isStringArray(ids)) return;
    try {
      await Notification.deleteMany({ _id: { $in: ids }, userId: user.Id });
    } catch (err) {
      console.error("Error deleting notifications:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
}
