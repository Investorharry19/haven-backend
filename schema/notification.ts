import { Schema, model } from "mongoose";

export type NotificationType = "message" | "lease" | "maintenance" | "other";

export interface INotification {
  userId: string;
  type: NotificationType;
  payload?: Record<string, unknown>;
  data?: Record<string, unknown>;
  read?: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["message", "lease", "maintenance", "other"],
      required: true,
    },
    payload: { type: Schema.Types.Mixed },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default model<INotification>("Notification", notificationSchema);
