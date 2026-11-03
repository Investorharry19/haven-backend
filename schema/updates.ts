import mongoose, { Schema } from "mongoose";

const fileSchema = new Schema({
  id: String,
  url: String,
  type: {
    type: String,
    enum: ["image", "video", "document"], // ✅ valid enum
    required: true,
  },

  name: String,
  size: Number,
});
const schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    files: [fileSchema],
    propertyId: {
      type: String,
      required: true,
    },
    timeStamp: { type: Date, default: Date.now() },
  },
  { timestamps: true }
);

const UpdateSchema = mongoose.model("landlord-updates", schema);

export default UpdateSchema;
