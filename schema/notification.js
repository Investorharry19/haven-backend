import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["message", "lease", "maintenance", "other"],
      required: true,
    },
    payload: { type: Object, required: true },
    data: { type: Object, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const NotificationSchema = mongoose.model(
  "HavenNotification",
  notificationSchema
);
export default NotificationSchema;
