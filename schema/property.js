import mongoose, { Schema, mongo } from "mongoose";

const schema = new Schema(
  {
    ownerUsername: {
      type: String,
      required: true,
      lowercase: true,
    },
    type: {
      type: String,
      required: true,
    },
    messageText: {
      type: String,
    },
    audioUrl: {
      type: String,
    },
    isOpened: {
      type: Boolean,
      default: false,
    },
    publicId: {
      type: String,
      default: "",
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const MessagesSchema = mongoose.model("properties", schema);

export default MessagesSchema;
