import type { Server } from "socket.io";
import type { HydratedDocument } from "mongoose";
import Notification, {
  type INotification,
  type NotificationType,
} from "../schema/notification.ts";

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  payload?: Record<string, unknown> | any;
  data?: Record<string, unknown>;
}

async function sendNotification(
  { userId, type, payload, data }: SendNotificationParams,
  io: Server,
): Promise<HydratedDocument<INotification>> {
  if (!io) throw new Error("Socket.IO instance not found");

  const notification = await Notification.create({
    userId,
    type,
    payload,
    data,
  });

  io.to(userId).emit("notifications:new", notification);

  return notification;
}

export default sendNotification;
