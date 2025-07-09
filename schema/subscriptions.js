import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    planId: {
      type: String,
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    planAmount: {
      type: Number,
      required: true,
    },
    planInterval: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Subscription = model("Subscription", schema);
export default Subscription;
